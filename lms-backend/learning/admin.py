from django.contrib import admin
from .models import CourseEnrollment, LessonProgress, Certificate, AdaptProgress


@admin.register(CourseEnrollment)
class CourseEnrollmentAdmin(admin.ModelAdmin):
    list_display = (
        'user',
        'course',
        'is_active',
        'status',
        'enrolled_at',
        'started_at',
        'completed_at',
    )
    list_filter = ('is_active', 'course')
    search_fields = ('user__email', 'course__title')


@admin.register(LessonProgress)
class LessonProgressAdmin(admin.ModelAdmin):
    list_display = ('user', 'lesson', 'is_completed', 'completed_at', 'last_viewed_at')
    list_filter = ('is_completed', 'lesson__module__course')
    search_fields = ('user__email', 'lesson__title')


@admin.register(Certificate)
class CertificateAdmin(admin.ModelAdmin):
    list_display = (
        'certificate_number',
        'full_name',
        'course',
        'issued_at',
    )
    list_filter = ('course', 'issued_at')
    search_fields = (
        'certificate_number',
        'full_name',
        'user__email',
        'course__title',
    )


@admin.register(AdaptProgress)
class AdaptProgressAdmin(admin.ModelAdmin):
    list_display = ("user", "lesson", "course_enrollment", "bookmark", "updated_at")
    search_fields = ("user__email", "user__username", "lesson__title", "bookmark")
    list_filter = ("updated_at",)