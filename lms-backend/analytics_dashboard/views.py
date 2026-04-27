from datetime import timedelta
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.db.models import Count, Sum
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAdminUser
from rest_framework.authentication import SessionAuthentication
from rest_framework.response import Response
from rest_framework import status
from rest_framework_simplejwt.authentication import JWTAuthentication

from learning.models import CourseEnrollment, Certificate
from payments.models import Order

User = get_user_model()


def _get_period_start(period: str):
    now = timezone.now()

    if period == "30d":
        return now - timedelta(days=30)
    if period == "90d":
        return now - timedelta(days=90)
    if period == "12m":
        return now - timedelta(days=365)

    return None


@api_view(["GET"])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    period = request.query_params.get("period", "all")
    period_start = _get_period_start(period)

    total_users = User.objects.count()
    total_students = User.objects.filter(role="student").count()

    paid_orders_qs = Order.objects.filter(status="paid")
    if period_start:
        paid_orders_qs = paid_orders_qs.filter(created_at__gte=period_start)

    total_paid_orders = paid_orders_qs.count()
    total_course_orders = paid_orders_qs.filter(course__isnull=False).count()
    total_bundle_orders = paid_orders_qs.filter(bundle__isnull=False).count()

    revenue_total = paid_orders_qs.aggregate(total=Sum("amount_eur"))["total"] or Decimal("0.00")
    revenue_course_total = (
        paid_orders_qs.filter(course__isnull=False).aggregate(total=Sum("amount_eur"))["total"]
        or Decimal("0.00")
    )
    revenue_bundle_total = (
        paid_orders_qs.filter(bundle__isnull=False).aggregate(total=Sum("amount_eur"))["total"]
        or Decimal("0.00")
    )

    average_order_value = Decimal("0.00")
    if total_paid_orders > 0:
        average_order_value = revenue_total / total_paid_orders

    certificates_qs = Certificate.objects.all()
    if period_start:
        certificates_qs = certificates_qs.filter(issued_at__gte=period_start)
    total_certificates = certificates_qs.count()

    enrollments_qs = CourseEnrollment.objects.all()
    if period_start:
        enrollments_qs = enrollments_qs.filter(enrolled_at__gte=period_start)

    total_enrollments = enrollments_qs.count()
    completed_enrollments = enrollments_qs.filter(completed_at__isnull=False).count()

    completion_rate = 0
    if total_enrollments > 0:
        completion_rate = round((completed_enrollments / total_enrollments) * 100, 2)

    conversion_rate = 0
    if total_users > 0:
        conversion_rate = round((total_paid_orders / total_users) * 100, 2)

    top_courses = (
        paid_orders_qs.filter(course__isnull=False)
        .values("course__id", "course__title", "course__slug")
        .annotate(total_sales=Count("id"))
        .order_by("-total_sales")[:5]
    )

    most_opened_courses = (
        enrollments_qs.filter(last_opened_at__isnull=False)
        .values("course__id", "course__title", "course__slug")
        .annotate(total_opens=Count("id"))
        .order_by("-total_opens")[:5]
    )

    most_completed_courses = (
        enrollments_qs.filter(completed_at__isnull=False)
        .values("course__id", "course__title", "course__slug")
        .annotate(total_completed=Count("id"))
        .order_by("-total_completed")[:5]
    )

    monthly_sales_qs = (
        paid_orders_qs.annotate(month=TruncMonth("created_at"))
        .values("month")
        .annotate(
            total_sales=Count("id"),
            revenue=Sum("amount_eur"),
        )
        .order_by("month")
    )

    monthly_sales = []
    for item in monthly_sales_qs:
        month_value = item["month"]
        monthly_sales.append(
            {
                "month": month_value.strftime("%Y-%m") if month_value else "",
                "total_sales": item["total_sales"],
                "revenue": float(item["revenue"] or 0),
            }
        )

    data = {
        "selected_period": period,
        "kpis": {
            "total_users": total_users,
            "total_students": total_students,
            "total_paid_orders": total_paid_orders,
            "total_course_orders": total_course_orders,
            "total_bundle_orders": total_bundle_orders,
            "total_certificates": total_certificates,
            "total_enrollments": total_enrollments,
            "completed_enrollments": completed_enrollments,
            "completion_rate": completion_rate,
            "conversion_rate": conversion_rate,
            "revenue_total": float(revenue_total),
            "average_order_value": float(round(average_order_value, 2)),
            "revenue_course_total": float(revenue_course_total),
            "revenue_bundle_total": float(revenue_bundle_total),
        },
        "top_courses": [
            {
                "id": item["course__id"],
                "title": item["course__title"],
                "slug": item["course__slug"],
                "total_sales": item["total_sales"],
            }
            for item in top_courses
        ],
        "most_opened_courses": [
            {
                "id": item["course__id"],
                "title": item["course__title"],
                "slug": item["course__slug"],
                "total_opens": item["total_opens"],
            }
            for item in most_opened_courses
        ],
        "most_completed_courses": [
            {
                "id": item["course__id"],
                "title": item["course__title"],
                "slug": item["course__slug"],
                "total_completed": item["total_completed"],
            }
            for item in most_completed_courses
        ],
        "monthly_sales": monthly_sales,
    }

    return Response(data, status=status.HTTP_200_OK)