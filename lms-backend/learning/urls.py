from django.urls import path
from .views import my_library, enrolled_course_detail, mark_lesson_complete, mark_course_complete, \
    set_last_opened_lesson, my_certificates, get_adapt_progress, save_adapt_progress

urlpatterns = [
    path('my-library/', my_library, name='my_library'),
    path('my-library/<slug:slug>/', enrolled_course_detail, name='enrolled_course_detail'),
    path('lessons/<int:lesson_id>/complete/', mark_lesson_complete, name='mark_lesson_complete'),
    path('courses/<slug:slug>/complete/', mark_course_complete, name='mark_course_complete'),
    path('courses/<slug:slug>/last-lesson/<int:lesson_id>/', set_last_opened_lesson, name='set_last_opened_lesson'),
    path('my-certificates/', my_certificates, name='my_certificates'),
    path("adapt-progress/<int:lesson_id>/", get_adapt_progress, name="get_adapt_progress"),
    path("adapt-progress/save/", save_adapt_progress, name="save_adapt_progress"),
]