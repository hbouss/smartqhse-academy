from django.http import JsonResponse
from django.shortcuts import get_object_or_404

from .models import Course, ProductBundle


def course_list(request):
    courses = Course.objects.filter(is_published=True).order_by('-is_featured', 'title')

    data = [
        {
            "id": course.id,
            "title": course.title,
            "slug": course.slug,
            "short_description": course.short_description,
            "price_eur": str(course.price_eur),
            "is_published": course.is_published,
            "thumbnail_url": request.build_absolute_uri(course.thumbnail.url) if course.thumbnail else None,
            "level": course.level,
            "category": course.category,
            "instructor": course.instructor,
            "estimated_duration_hours": course.estimated_duration_hours,
            "is_featured": course.is_featured,
        }
        for course in courses
    ]

    return JsonResponse(data, safe=False)


def course_detail(request, slug):
    course = get_object_or_404(Course, slug=slug, is_published=True)

    data = {
        'id': course.id,
        'title': course.title,
        'slug': course.slug,
        'short_description': course.short_description,
        'description': course.description,
        'price_eur': str(course.price_eur),
        'thumbnail_url': request.build_absolute_uri(course.thumbnail.url) if course.thumbnail else None,
        'level': course.level,
        'category': course.category,
        'instructor': course.instructor,
        'estimated_duration_hours': course.estimated_duration_hours,
        'is_featured': course.is_featured,
        'modules': [
            {
                'id': module.id,
                'title': module.title,
                'order': module.order,
                'lessons': [
                    {
                        'id': lesson.id,
                        'title': lesson.title,
                        'order': lesson.order,
                        'lesson_type': lesson.lesson_type,
                        'estimated_duration_min': lesson.estimated_duration_min,
                        'is_free_preview': lesson.is_free_preview,
                    }
                    for lesson in module.lessons.all()
                ],
            }
            for module in course.modules.all()
        ],
    }

    return JsonResponse(data, safe=False)


def bundle_list(request):
    bundles = ProductBundle.objects.filter(is_published=True).order_by('-is_featured', 'title')

    data = [
        {
            "id": bundle.id,
            "title": bundle.title,
            "slug": bundle.slug,
            "short_description": bundle.short_description,
            "price_eur": str(bundle.price_eur),
            "thumbnail_url": request.build_absolute_uri(bundle.thumbnail.url) if bundle.thumbnail else None,
            "is_featured": bundle.is_featured,
            "is_published": bundle.is_published,
            "courses": [
                {
                    "id": course.id,
                    "title": course.title,
                    "slug": course.slug,
                }
                for course in bundle.courses.all()
            ],
        }
        for bundle in bundles
    ]

    return JsonResponse(data, safe=False)


def bundle_detail(request, slug):
    bundle = get_object_or_404(ProductBundle, slug=slug, is_published=True)

    data = {
        "id": bundle.id,
        "title": bundle.title,
        "slug": bundle.slug,
        "short_description": bundle.short_description,
        "description": bundle.description,
        "price_eur": str(bundle.price_eur),
        "thumbnail_url": request.build_absolute_uri(bundle.thumbnail.url) if bundle.thumbnail else None,
        "is_featured": bundle.is_featured,
        "is_published": bundle.is_published,
        "courses": [
            {
                "id": course.id,
                "title": course.title,
                "slug": course.slug,
                "short_description": course.short_description,
                "price_eur": str(course.price_eur),
                "thumbnail_url": request.build_absolute_uri(course.thumbnail.url) if course.thumbnail else None,
                "level": course.level,
                "category": course.category,
                "instructor": course.instructor,
                "estimated_duration_hours": course.estimated_duration_hours,
            }
            for course in bundle.courses.all()
        ],
    }

    return JsonResponse(data, safe=False)