import traceback

from django.shortcuts import get_object_or_404

from rest_framework import status
from rest_framework.authentication import SessionAuthentication
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.authentication import JWTAuthentication

from catalog.models import Course, Lesson
from .models import CourseEnrollment, LessonProgress, Certificate, AdaptProgress


@api_view(['GET'])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def my_library(request):
    user = request.user

    enrollments = CourseEnrollment.objects.filter(
        user=user,
        is_active=True
    ).select_related("course")

    data = [
        {
            "id": enrollment.course.id,
            "title": enrollment.course.title,
            "slug": enrollment.course.slug,
            "short_description": enrollment.course.short_description,
            "price_eur": str(enrollment.course.price_eur),
            "enrolled_at": enrollment.enrolled_at.isoformat(),
            "started_at": enrollment.started_at.isoformat() if enrollment.started_at else None,
            "last_opened_at": enrollment.last_opened_at.isoformat() if enrollment.last_opened_at else None,
            "completed_at": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
            "status": enrollment.status,
        }
        for enrollment in enrollments
    ]

    return Response(data, status=status.HTTP_200_OK)


@api_view(['GET'])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def enrolled_course_detail(request, slug):
    user = request.user

    course = get_object_or_404(Course, slug=slug, is_published=True)

    try:
        enrollment = CourseEnrollment.objects.get(
            user=user,
            course=course,
            is_active=True
        )
    except CourseEnrollment.DoesNotExist:
        return Response(
            {"error": "Accès non autorisé à cette formation"},
            status=status.HTTP_403_FORBIDDEN
        )

    enrollment.mark_started()

    lessons_progress = {
        lp.lesson_id: lp
        for lp in LessonProgress.objects.filter(
            user=user,
            lesson__module__course=course
        )
    }

    data = {
        "id": course.id,
        "title": course.title,
        "slug": course.slug,
        "short_description": course.short_description,
        "description": course.description,
        "price_eur": str(course.price_eur),
        "enrollment_status": enrollment.status,
        "started_at": enrollment.started_at.isoformat() if enrollment.started_at else None,
        "last_opened_at": enrollment.last_opened_at.isoformat() if enrollment.last_opened_at else None,
        "completed_at": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
        "last_lesson_id": enrollment.last_lesson_id,
        "modules": [
            {
                "id": module.id,
                "title": module.title,
                "order": module.order,
                "lessons": [
                    {
                        "id": lesson.id,
                        "title": lesson.title,
                        "order": lesson.order,
                        "lesson_type": lesson.lesson_type,
                        "text_content": lesson.text_content if lesson.lesson_type == "text" else "",
                        "video_url": lesson.video_url if lesson.lesson_type == "video" else "",
                        "adapt_url": lesson.adapt_url if lesson.lesson_type == "adapt" else "",
                        "estimated_duration_min": lesson.estimated_duration_min,
                        "is_free_preview": lesson.is_free_preview,
                        "is_completed": lessons_progress.get(lesson.id).is_completed if lesson.id in lessons_progress else False,
                    }
                    for lesson in module.lessons.all()
                ],
            }
            for module in course.modules.all()
        ],
    }

    return Response(data, status=status.HTTP_200_OK)


@api_view(['POST'])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def mark_lesson_complete(request, lesson_id):
    user = request.user

    try:
        lesson = Lesson.objects.select_related("module__course").get(id=lesson_id)

        has_access = CourseEnrollment.objects.filter(
            user=user,
            course=lesson.module.course,
            is_active=True
        ).exists()

        if not has_access:
            return Response(
                {"error": "Accès non autorisé"},
                status=status.HTTP_403_FORBIDDEN
            )

        progress, _ = LessonProgress.objects.get_or_create(
            user=user,
            lesson=lesson,
        )
        progress.mark_completed()

        return Response(
            {"success": True, "lesson_id": lesson.id},
            status=status.HTTP_200_OK
        )

    except Lesson.DoesNotExist:
        return Response(
            {"error": "Leçon introuvable"},
            status=status.HTTP_404_NOT_FOUND
        )
    except Exception as e:
        return Response(
            {"error": str(e)},
            status=status.HTTP_400_BAD_REQUEST
        )


@api_view(["POST"])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def mark_course_complete(request, slug):
    user = request.user
    course = get_object_or_404(Course, slug=slug, is_published=True)

    try:
        enrollment = CourseEnrollment.objects.get(
            user=user,
            course=course,
            is_active=True,
        )
    except CourseEnrollment.DoesNotExist:
        return Response(
            {"error": "Accès non autorisé à cette formation."},
            status=status.HTTP_403_FORBIDDEN,
        )

    try:
        enrollment.mark_completed()
        enrollment.refresh_from_db()

        certificate = getattr(enrollment, "certificate", None)

        return Response(
            {
                "success": True,
                "status": "completed",
                "completed_at": enrollment.completed_at.isoformat() if enrollment.completed_at else None,
                "certificate_file": certificate.file.url if certificate and certificate.file else None,
                "certificate_number": certificate.certificate_number if certificate else None,
            },
            status=status.HTTP_200_OK,
        )

    except Exception as e:
        traceback.print_exc()
        return Response(
            {
                "error": "Erreur lors de la finalisation de la formation.",
                "detail": str(e),
            },
            status=status.HTTP_500_INTERNAL_SERVER_ERROR,
        )


@api_view(['POST'])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def set_last_opened_lesson(request, slug, lesson_id):
    user = request.user
    course = get_object_or_404(Course, slug=slug, is_published=True)

    try:
        enrollment = CourseEnrollment.objects.get(
            user=user,
            course=course,
            is_active=True
        )
    except CourseEnrollment.DoesNotExist:
        return Response(
            {"error": "Accès non autorisé"},
            status=status.HTTP_403_FORBIDDEN
        )

    lesson = get_object_or_404(
        Lesson,
        id=lesson_id,
        module__course=course
    )

    enrollment.set_last_lesson(lesson.id)

    return Response(
        {
            "success": True,
            "last_lesson_id": enrollment.last_lesson_id,
        },
        status=status.HTTP_200_OK
    )


@api_view(['GET'])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def my_certificates(request):
    certificates = (
        Certificate.objects.filter(user=request.user)
        .select_related('course')
        .order_by('-issued_at')
    )

    data = [
        {
            "id": certificate.id,
            "certificate_number": certificate.certificate_number,
            "full_name": certificate.full_name,
            "course": {
                "id": certificate.course.id,
                "title": certificate.course.title,
                "slug": certificate.course.slug,
            },
            "issued_at": certificate.issued_at.isoformat(),
            "file_url": request.build_absolute_uri(certificate.file.url) if certificate.file else None,
        }
        for certificate in certificates
    ]

    return Response(data, status=status.HTTP_200_OK)


@api_view(["GET"])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def get_adapt_progress(request, lesson_id):
    lesson = get_object_or_404(Lesson, id=lesson_id)

    progress = (
        AdaptProgress.objects.filter(user=request.user, lesson=lesson)
        .select_related("course_enrollment", "lesson")
        .first()
    )

    if not progress:
        return Response(
            {
                "lesson_id": lesson.id,
                "bookmark": "",
                "state_json": {},
                "updated_at": None,
            },
            status=status.HTTP_200_OK,
        )

    return Response(
        {
            "lesson_id": lesson.id,
            "bookmark": progress.bookmark,
            "state_json": progress.state_json,
            "updated_at": progress.updated_at.isoformat() if progress.updated_at else None,
        },
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@authentication_classes([JWTAuthentication, SessionAuthentication])
@permission_classes([IsAuthenticated])
def save_adapt_progress(request):
    lesson_id = request.data.get("lesson_id")
    course_slug = request.data.get("course_slug")
    bookmark = request.data.get("bookmark", "") or ""
    state_json = request.data.get("state_json", {}) or {}

    if not lesson_id:
        return Response(
            {"error": "lesson_id est requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if not course_slug:
        return Response(
            {"error": "course_slug est requis."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    lesson = get_object_or_404(Lesson, id=lesson_id)

    enrollment = get_object_or_404(
        CourseEnrollment,
        user=request.user,
        course__slug=course_slug,
        is_active=True,
    )

    if lesson.module.course_id != enrollment.course_id:
        return Response(
            {"error": "Cette leçon ne correspond pas à la formation demandée."},
            status=status.HTTP_400_BAD_REQUEST,
        )

    progress, _created = AdaptProgress.objects.update_or_create(
        user=request.user,
        course_enrollment=enrollment,
        lesson=lesson,
        defaults={
            "bookmark": bookmark,
            "state_json": state_json,
        },
    )

    return Response(
        {
            "message": "Progression Adapt sauvegardée.",
            "lesson_id": lesson.id,
            "bookmark": progress.bookmark,
            "updated_at": progress.updated_at.isoformat() if progress.updated_at else None,
        },
        status=status.HTTP_200_OK,
    )