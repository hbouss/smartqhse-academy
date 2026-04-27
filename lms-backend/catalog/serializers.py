from rest_framework import serializers
from .models import Course, Module, Lesson, ProductBundle


class BundleCourseSerializer(serializers.ModelSerializer):
    class Meta:
        model = Course
        fields = [
            "id",
            "title",
            "slug",
            "short_description",
            "price_eur",
            "category",
            "level",
            "instructor",
            "estimated_duration_hours",
        ]


class ProductBundleListSerializer(serializers.ModelSerializer):
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductBundle
        fields = [
            "id",
            "title",
            "slug",
            "short_description",
            "price_eur",
            "thumbnail_url",
            "is_featured",
        ]

    def get_thumbnail_url(self, obj):
        request = self.context.get("request")
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        if obj.thumbnail:
            return obj.thumbnail.url
        return None


class ProductBundleDetailSerializer(serializers.ModelSerializer):
    courses = BundleCourseSerializer(many=True, read_only=True)
    thumbnail_url = serializers.SerializerMethodField()

    class Meta:
        model = ProductBundle
        fields = [
            "id",
            "title",
            "slug",
            "short_description",
            "description",
            "price_eur",
            "thumbnail_url",
            "is_featured",
            "courses",
        ]

    def get_thumbnail_url(self, obj):
        request = self.context.get("request")
        if obj.thumbnail and request:
            return request.build_absolute_uri(obj.thumbnail.url)
        if obj.thumbnail:
            return obj.thumbnail.url
        return None