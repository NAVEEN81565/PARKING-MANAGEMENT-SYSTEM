"""
users/permissions.py
Custom DRF permission classes for role-based access control.

USAGE:
  class MyView(APIView):
      permission_classes = [IsAdmin]   # only admins
      permission_classes = [IsAdmin | IsEmployee]  # either role
"""
from rest_framework.permissions import BasePermission


class IsAdmin(BasePermission):
    """Allow access only to users with role='admin'."""
    message = 'Only administrators can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'admin'
        )


class IsEmployee(BasePermission):
    """Allow access only to users with role='employee'."""
    message = 'Only employees can perform this action.'

    def has_permission(self, request, view):
        return (
            request.user and
            request.user.is_authenticated and
            request.user.role == 'employee'
        )


class IsAdminOrEmployee(BasePermission):
    """Allow any authenticated user (admin or employee)."""
    message = 'Authentication required.'

    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated
