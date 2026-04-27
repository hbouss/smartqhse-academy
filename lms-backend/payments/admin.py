from django.contrib import admin
from .models import Order


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('user', 'course', 'bundle', 'amount_eur', 'status', 'stripe_session_id', 'created_at')
    list_filter = ('status', 'course')
    search_fields = ('user__email', 'course__title', 'bundle__title', 'stripe_session_id')