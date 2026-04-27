from django.contrib import admin
from .models import Course, Module, Lesson, ProductBundle


class ModuleInline(admin.TabularInline):
    model = Module
    extra = 0


@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = (
        'title',
        'slug',
        'category',
        'level',
        'instructor',
        'estimated_duration_hours',
        'price_eur',
        'is_featured',
        'is_published',
        'created_at',
    )
    list_filter = (
        'is_published',
        'is_featured',
        'level',
        'category',
    )
    search_fields = (
        'title',
        'slug',
        'category',
        'instructor',
    )
    prepopulated_fields = {'slug': ('title',)}
    inlines = [ModuleInline]

    fieldsets = (
        ('Informations principales', {
            'fields': (
                'title',
                'slug',
                'short_description',
                'description',
            )
        }),
        ('Métadonnées visuelles', {
            'fields': (
                'thumbnail',
                'category',
                'level',
                'instructor',
                'estimated_duration_hours',
            )
        }),
        ('Commercial', {
            'fields': (
                'price_eur',
                'is_featured',
                'is_published',
            )
        }),
    )


class LessonInline(admin.TabularInline):
    model = Lesson
    extra = 0


@admin.register(Module)
class ModuleAdmin(admin.ModelAdmin):
    list_display = ('title', 'course', 'order')
    list_filter = ('course',)
    search_fields = ('title', 'course__title')
    inlines = [LessonInline]


@admin.register(Lesson)
class LessonAdmin(admin.ModelAdmin):
    list_display = ('title', 'module', 'lesson_type', 'order', 'is_free_preview')
    list_filter = ('lesson_type', 'is_free_preview')
    search_fields = ('title', 'module__title', 'module__course__title')


@admin.register(ProductBundle)
class ProductBundleAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "price_eur",
        "is_featured",
        "is_published",
        "created_at",
    )
    list_filter = ("is_featured", "is_published")
    search_fields = ("title", "slug")
    prepopulated_fields = {"slug": ("title",)}
    filter_horizontal = ("courses",)