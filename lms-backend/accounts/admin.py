from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import User


@admin.register(User)
class CustomUserAdmin(UserAdmin):
    model = User

    list_display = ('email', 'username', 'role', 'is_premium', 'is_staff', 'is_active')
    list_filter = ('role', 'is_premium', 'is_staff', 'is_active')

    fieldsets = UserAdmin.fieldsets + (
        ('LMS', {'fields': ('role', 'is_premium')}),
    )

    add_fieldsets = UserAdmin.add_fieldsets + (
        ('LMS', {'fields': ('email', 'role', 'is_premium')}),
    )

    search_fields = ('email', 'username')
    ordering = ('email',)