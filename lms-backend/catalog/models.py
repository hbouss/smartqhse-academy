from django.db import models
from django.utils.text import slugify

class Course(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    short_description = models.TextField(blank=True)
    description = models.TextField(blank=True)
    cover_image = models.ImageField(upload_to='courses/covers/', blank=True, null=True)
    is_published = models.BooleanField(default=False)
    price_eur = models.DecimalField(max_digits=8, decimal_places=2, default=0.00)
    created_at = models.DateTimeField(auto_now_add=True)
    thumbnail = models.ImageField(upload_to='course_thumbnails/', blank=True, null=True)
    level = models.CharField(max_length=30, blank=True, default='Débutant')
    category = models.CharField(max_length=100, blank=True, default='IA & QHSE')
    instructor = models.CharField(max_length=120, blank=True, default='QHSE Pilot AI')
    estimated_duration_hours = models.PositiveIntegerField(default=1)
    is_featured = models.BooleanField(default=False)

    class Meta:
        ordering = ['title']

    def __str__(self):
        return self.title


class Module(models.Model):
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='modules')
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=1)

    class Meta:
        ordering = ['order']
        unique_together = ('course', 'order')

    def __str__(self):
        return f'{self.course.title} - {self.title}'


class Lesson(models.Model):
    LESSON_TYPE_CHOICES = [
        ('video', 'Video'),
        ('text', 'Text'),
        ('adapt', 'Adapt Module'),
    ]

    module = models.ForeignKey(Module, on_delete=models.CASCADE, related_name='lessons')
    title = models.CharField(max_length=255)
    order = models.PositiveIntegerField(default=1)
    lesson_type = models.CharField(max_length=20, choices=LESSON_TYPE_CHOICES, default='text')

    text_content = models.TextField(blank=True)
    video_url = models.URLField(blank=True)
    adapt_url = models.URLField(blank=True)

    estimated_duration_min = models.PositiveIntegerField(default=5)
    is_free_preview = models.BooleanField(default=False)

    class Meta:
        ordering = ['order']
        unique_together = ('module', 'order')

    def __str__(self):
        return f'{self.module.title} - {self.title}'



class ProductBundle(models.Model):
    title = models.CharField(max_length=255)
    slug = models.SlugField(unique=True, max_length=255)
    short_description = models.TextField(blank=True)
    description = models.TextField(blank=True)

    courses = models.ManyToManyField(
        "Course",
        related_name="bundles",
        blank=True
    )

    price_eur = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    thumbnail = models.ImageField(upload_to="bundle_thumbnails/", blank=True, null=True)

    is_featured = models.BooleanField(default=False)
    is_published = models.BooleanField(default=False)

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["title"]
        verbose_name = "Pack"
        verbose_name_plural = "Packs"

    def save(self, *args, **kwargs):
        if not self.slug and self.title:
            self.slug = slugify(self.title)
        super().save(*args, **kwargs)

    def __str__(self):
        return self.title