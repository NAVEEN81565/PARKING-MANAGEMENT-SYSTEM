"""
users/admin.py
Register models in Django Admin panel for easy management.
Access at: http://127.0.0.1:8000/admin/
"""
from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):
    """Custom admin view for our User model."""
    list_display  = ['name', 'email', 'role', 'phone', 'is_active', 'created_at']
    list_filter   = ['role', 'is_active']
    search_fields = ['name', 'email']
    ordering      = ['-created_at']

    fieldsets = (
        (None,          {'fields': ('email', 'password')}),
        ('Personal',    {'fields': ('name', 'phone', 'profile_photo')}),
        ('Role',        {'fields': ('role',)}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser',
                                   'groups', 'user_permissions')}),
        ('Timestamps',  {'fields': ('created_at', 'updated_at')}),
    )
    readonly_fields = ['created_at', 'updated_at']
    add_fieldsets   = (
        (None, {
            'classes': ('wide',),
            'fields':  ('name', 'email', 'role', 'phone', 'password1', 'password2'),
        }),
    )
