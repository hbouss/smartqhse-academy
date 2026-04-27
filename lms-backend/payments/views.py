import os

import stripe
from django.contrib.auth import get_user_model
from django.http import HttpResponse

from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authentication import SessionAuthentication
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework.response import Response
from rest_framework import status

from catalog.models import Course, ProductBundle
from learning.models import CourseEnrollment
from .models import Order
from core.emails import send_html_email

stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
User = get_user_model()


@api_view(['POST'])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def create_checkout_session(request, course_id):
    try:
        user = request.user
        course = Course.objects.get(id=course_id, is_published=True)

        existing_enrollment = CourseEnrollment.objects.filter(
            user=user,
            course=course,
            is_active=True
        ).exists()

        if existing_enrollment:
            return Response(
                {'error': 'Utilisateur déjà inscrit à cette formation.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        session = stripe.checkout.Session.create(
            mode='payment',
            payment_method_types=['card'],
            customer_email=user.email,
            line_items=[
                {
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': course.title,
                        },
                        'unit_amount': int(course.price_eur * 100),
                    },
                    'quantity': 1,
                }
            ],
            metadata={
                'user_id': str(user.id),
                'course_id': str(course.id),
                'order_type': 'course',
            },
            success_url=f"{os.getenv('FRONTEND_URL')}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/checkout/cancel",
        )

        Order.objects.create(
            user=user,
            course=course,
            stripe_session_id=session.id,
            amount_eur=course.price_eur,
            status='pending',
        )

        return Response({'checkout_url': session.url}, status=status.HTTP_200_OK)

    except Course.DoesNotExist:
        return Response(
            {'error': 'Formation introuvable.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def create_bundle_checkout_session(request, bundle_id):
    try:
        user = request.user
        bundle = ProductBundle.objects.prefetch_related("courses").get(
            id=bundle_id,
            is_published=True
        )

        included_courses = list(bundle.courses.all())

        if not included_courses:
            return Response(
                {'error': 'Ce pack ne contient aucune formation.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        owned_course_ids = set(
            CourseEnrollment.objects.filter(
                user=user,
                is_active=True,
                course__in=included_courses
            ).values_list("course_id", flat=True)
        )

        included_course_ids = {course.id for course in included_courses}

        if included_course_ids.issubset(owned_course_ids):
            return Response(
                {'error': 'Utilisateur déjà inscrit à toutes les formations de ce pack.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        session = stripe.checkout.Session.create(
            mode='payment',
            payment_method_types=['card'],
            customer_email=user.email,
            line_items=[
                {
                    'price_data': {
                        'currency': 'eur',
                        'product_data': {
                            'name': bundle.title,
                        },
                        'unit_amount': int(bundle.price_eur * 100),
                    },
                    'quantity': 1,
                }
            ],
            metadata={
                'user_id': str(user.id),
                'bundle_id': str(bundle.id),
                'order_type': 'bundle',
            },
            success_url=f"{os.getenv('FRONTEND_URL')}/checkout/success?session_id={{CHECKOUT_SESSION_ID}}",
            cancel_url=f"{os.getenv('FRONTEND_URL')}/checkout/cancel",
        )

        Order.objects.create(
            user=user,
            bundle=bundle,
            stripe_session_id=session.id,
            amount_eur=bundle.price_eur,
            status='pending',
        )

        return Response({'checkout_url': session.url}, status=status.HTTP_200_OK)

    except ProductBundle.DoesNotExist:
        return Response(
            {'error': 'Pack introuvable.'},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def stripe_webhook(request):
    payload = request.body
    sig_header = request.META.get('HTTP_STRIPE_SIGNATURE')
    endpoint_secret = os.getenv('STRIPE_WEBHOOK_SECRET')

    try:
        event = stripe.Webhook.construct_event(
            payload,
            sig_header,
            endpoint_secret,
        )
    except ValueError:
        return HttpResponse(status=400)
    except stripe.error.SignatureVerificationError:
        return HttpResponse(status=400)

    if event["type"] == "checkout.session.completed":
        session = event["data"]["object"]

        stripe_session_id = session["id"]
        metadata = session["metadata"] if session["metadata"] else {}

        def metadata_value(key, default=None):
            try:
                return metadata[key]
            except Exception:
                return default

        user_id = metadata_value("user_id")
        order_type = metadata_value("order_type", "course")
        course_id = metadata_value("course_id")
        bundle_id = metadata_value("bundle_id")

        try:
            order = Order.objects.get(stripe_session_id=stripe_session_id)
            was_already_paid = order.status == "paid"
            order.status = "paid"
            order.save(update_fields=["status"])

            user = User.objects.get(id=user_id)
            display_name = f"{user.first_name} {user.last_name}".strip() or user.username

            if order_type == "bundle" and bundle_id:
                bundle = ProductBundle.objects.prefetch_related("courses").get(id=bundle_id)

                for course in bundle.courses.all():
                    CourseEnrollment.objects.get_or_create(
                        user=user,
                        course=course,
                        defaults={"is_active": True},
                    )

                if not was_already_paid:
                    subject = f"Achat confirmé - {bundle.title}"
                    text_content = (
                        f"Bonjour {display_name},\n\n"
                        f"Votre achat du pack '{bundle.title}' sur SmartQHSE Academy a bien été confirmé.\n"
                        f"Les formations incluses sont maintenant disponibles dans votre bibliothèque."
                    )

                    html_content = f"""
                    <html>
                      <body style="font-family: Arial, sans-serif; background:#0f172a; color:#ffffff; padding:32px;">
                        <div style="max-width:600px; margin:0 auto; background:#111827; border:1px solid #1f2937; border-radius:20px; padding:32px;">
                          <p style="color:#22d3ee; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">
                            SmartQHSE Academy
                          </p>
                          <h1 style="font-size:28px; margin-bottom:16px;">Votre pack est disponible</h1>
                          <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                            Bonjour {display_name},
                          </p>
                          <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                            Votre achat pour le pack <strong>{bundle.title}</strong> a bien été confirmé.
                          </p>
                          <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                            Les formations incluses ont été ajoutées à votre bibliothèque sur SmartQHSE Academy.
                          </p>
                        </div>
                      </body>
                    </html>
                    """

                    send_html_email(
                        subject=subject,
                        to_email=user.email,
                        text_content=text_content,
                        html_content=html_content,
                    )

            elif course_id:
                course = Course.objects.get(id=course_id)

                CourseEnrollment.objects.get_or_create(
                    user=user,
                    course=course,
                    defaults={"is_active": True},
                )

                if not was_already_paid:
                    subject = f"Achat confirmé - {course.title}"
                    text_content = (
                        f"Bonjour {display_name},\n\n"
                        f"Votre achat de la formation '{course.title}' sur SmartQHSE Academy a bien été confirmé.\n"
                        f"Vous pouvez maintenant y accéder depuis votre bibliothèque."
                    )

                    html_content = f"""
                    <html>
                      <body style="font-family: Arial, sans-serif; background:#0f172a; color:#ffffff; padding:32px;">
                        <div style="max-width:600px; margin:0 auto; background:#111827; border:1px solid #1f2937; border-radius:20px; padding:32px;">
                          <p style="color:#22d3ee; font-size:12px; font-weight:700; letter-spacing:2px; text-transform:uppercase;">
                            SmartQHSE Academy
                          </p>
                          <h1 style="font-size:28px; margin-bottom:16px;">Votre formation est disponible</h1>
                          <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                            Bonjour {display_name},
                          </p>
                          <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                            Votre achat pour la formation <strong>{course.title}</strong> a bien été confirmé.
                          </p>
                          <p style="font-size:16px; line-height:1.7; color:#cbd5e1;">
                            Vous pouvez maintenant accéder à la formation depuis votre bibliothèque sur SmartQHSE Academy.
                          </p>
                        </div>
                      </body>
                    </html>
                    """

                    send_html_email(
                        subject=subject,
                        to_email=user.email,
                        text_content=text_content,
                        html_content=html_content,
                    )

        except Order.DoesNotExist:
            return HttpResponse(status=404)
        except User.DoesNotExist:
            return HttpResponse(status=404)
        except Course.DoesNotExist:
            return HttpResponse(status=404)
        except ProductBundle.DoesNotExist:
            return HttpResponse(status=404)

    return HttpResponse(status=200)


@api_view(['GET'])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def my_orders(request):
    user = request.user

    orders = (
        Order.objects.filter(user=user)
        .select_related('course', 'bundle')
        .order_by('-created_at')
    )

    data = [
        {
            "id": order.id,
            "course": {
                "id": order.course.id,
                "title": order.course.title,
                "slug": order.course.slug,
            } if order.course else None,
            "bundle": {
                "id": order.bundle.id,
                "title": order.bundle.title,
                "slug": order.bundle.slug,
            } if order.bundle else None,
            "amount_eur": str(order.amount_eur),
            "status": order.status,
            "stripe_session_id": order.stripe_session_id,
            "created_at": order.created_at.isoformat(),
        }
        for order in orders
    ]

    return Response(data, status=status.HTTP_200_OK)