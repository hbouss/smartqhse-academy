import uuid

from django.conf import settings
from django.db import models
from django.utils import timezone

from catalog.models import Course, Lesson


class CourseEnrollment(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='enrollments'
    )
    is_active = models.BooleanField(default=True)
    enrolled_at = models.DateTimeField(auto_now_add=True)

    started_at = models.DateTimeField(null=True, blank=True)
    last_opened_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)
    last_lesson_id = models.IntegerField(null=True, blank=True)

    class Meta:
        unique_together = ('user', 'course')
        ordering = ['-enrolled_at']

    def __str__(self):
        return f'{self.user.email} - {self.course.title}'

    @property
    def status(self):
        if self.completed_at:
            return 'completed'
        if self.started_at:
            return 'in_progress'
        return 'not_started'

    def mark_started(self):
        now = timezone.now()
        if not self.started_at:
            self.started_at = now
        self.last_opened_at = now
        self.save(update_fields=['started_at', 'last_opened_at'])

    def mark_completed(self):
        now = timezone.now()
        if not self.started_at:
            self.started_at = now
        self.last_opened_at = now
        self.completed_at = now
        self.save(update_fields=['started_at', 'last_opened_at', 'completed_at'])

        from .models import Certificate
        if not Certificate.objects.filter(enrollment=self).exists():
            from .certificates import generate_certificate_for_enrollment
            generate_certificate_for_enrollment(self)

    def set_last_lesson(self, lesson_id):
        self.last_lesson_id = lesson_id
        self.last_opened_at = timezone.now()
        if not self.started_at:
            self.started_at = self.last_opened_at
            self.save(update_fields=['last_lesson_id', 'last_opened_at', 'started_at'])
        else:
            self.save(update_fields=['last_lesson_id', 'last_opened_at'])


class LessonProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='lesson_progress'
    )
    lesson = models.ForeignKey(
        Lesson,
        on_delete=models.CASCADE,
        related_name='progress_records'
    )
    is_completed = models.BooleanField(default=False)
    completed_at = models.DateTimeField(blank=True, null=True)
    last_viewed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('user', 'lesson')
        ordering = ['lesson__module__order', 'lesson__order']

    def mark_completed(self):
        self.is_completed = True
        self.completed_at = timezone.now()
        self.save(update_fields=['is_completed', 'completed_at', 'last_viewed_at'])

    def __str__(self):
        return f'{self.user.email} - {self.lesson.title}'


class Certificate(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    course = models.ForeignKey(
        Course,
        on_delete=models.CASCADE,
        related_name='certificates'
    )
    enrollment = models.OneToOneField(
        CourseEnrollment,
        on_delete=models.CASCADE,
        related_name='certificate'
    )

    certificate_number = models.CharField(max_length=50, unique=True, editable=False)
    full_name = models.CharField(max_length=255)
    issued_at = models.DateTimeField(auto_now_add=True)
    file = models.FileField(upload_to='certificates/', null=True, blank=True)

    class Meta:
        ordering = ['-issued_at']
        verbose_name = 'Certificat'
        verbose_name_plural = 'Certificats'

    def save(self, *args, **kwargs):
        if not self.certificate_number:
            self.certificate_number = f"CERT-{timezone.now().strftime('%Y')}-{uuid.uuid4().hex[:8].upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f'{self.full_name} - {self.course.title}'


class AdaptProgress(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="adapt_progress_entries",
    )
    course_enrollment = models.ForeignKey(
        "learning.CourseEnrollment",
        on_delete=models.CASCADE,
        related_name="adapt_progress_entries",
    )
    lesson = models.ForeignKey(
        "catalog.Lesson",
        on_delete=models.CASCADE,
        related_name="adapt_progress_entries",
    )
    bookmark = models.CharField(max_length=255, blank=True, default="")
    state_json = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("user", "course_enrollment", "lesson")
        ordering = ["-updated_at"]

    def __str__(self):
        return f"{self.user} - {self.lesson} - {self.bookmark}"