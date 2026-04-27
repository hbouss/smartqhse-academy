from django.urls import path
from .views import admin_dashboard_stats

urlpatterns = [
    path("admin-dashboard/", admin_dashboard_stats, name="admin_dashboard_stats"),
]