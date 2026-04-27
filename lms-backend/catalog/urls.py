from django.urls import path
from .views import course_list, course_detail, bundle_list, bundle_detail

urlpatterns = [
    path('courses/', course_list, name='course_list'),
    path('courses/<slug:slug>/', course_detail, name='course_detail'),
    path('bundles/', bundle_list, name='bundle_list'),
    path('bundles/<slug:slug>/', bundle_detail, name='bundle_detail'),
]