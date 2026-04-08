"""
users/views.py
All authentication and user management API views.

ENDPOINTS:
  POST   /api/v1/auth/register/                  → RegisterView
  POST   /api/v1/auth/login/                     → LoginView
  POST   /api/v1/auth/logout/                    → LogoutView
  GET    /api/v1/auth/profile/                   → ProfileView
  PUT    /api/v1/auth/profile/                   → ProfileView
  POST   /api/v1/auth/profile/change-password/   → ChangePasswordView
  GET    /api/v1/auth/employees/                 → EmployeeListCreateView  [admin]
  POST   /api/v1/auth/employees/                 → EmployeeListCreateView  [admin]
  DELETE /api/v1/auth/employees/<id>/            → EmployeeDetailView      [admin]
  PUT    /api/v1/auth/employees/<id>/            → EmployeeDetailView      [admin]
"""
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from django.db import IntegrityError

from .models import User
from .serializers import (
    RegisterSerializer,
    LoginSerializer,
    UserProfileSerializer,
    ChangePasswordSerializer,
    EmployeeSerializer,
)
from .permissions import IsAdmin


# ─── Helper ────────────────────────────────────────────────────
def success(data=None, msg='', status_code=status.HTTP_200_OK):
    """Standardised success response wrapper."""
    return Response({'success': True, 'message': msg, **(data or {})}, status=status_code)


def error(msg, status_code=status.HTTP_400_BAD_REQUEST):
    """Standardised error response wrapper."""
    return Response({'success': False, 'message': msg}, status=status_code)


# ─── 1. Register ───────────────────────────────────────────────
class RegisterView(APIView):
    """
    POST /api/v1/auth/register/
    Public endpoint — no token required.
    Creates an EMPLOYEE account and returns JWT tokens immediately.

    Request body:
        { "name": "Alice", "email": "alice@example.com",
          "phone": "9876543210", "password": "secret6",
          "password2": "secret6" }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)

        user = serializer.save()

        # Auto-login: generate tokens so frontend can redirect immediately
        refresh = RefreshToken.for_user(user)
        return success({
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id':    user.id,
                'name':  user.name,
                'email': user.email,
                'role':  user.role,
                'phone': user.phone,
                'profile_photo': None,
            }
        }, msg='Registration successful.', status_code=status.HTTP_201_CREATED)


# ─── 2. Login ──────────────────────────────────────────────────
class LoginView(APIView):
    """
    POST /api/v1/auth/login/
    Public endpoint. Validates credentials and returns JWT tokens.

    Request body:
        { "email": "admin@parksys.com", "password": "admin123" }

    Response:
        { "success": true, "access": "...", "refresh": "...",
          "user": { "id", "name", "email", "role", "phone", "profile_photo" } }
    """
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = LoginSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_401_UNAUTHORIZED)

        data = serializer.validated_data
        return success({
            'access':  data['access'],
            'refresh': data['refresh'],
            'user':    data['user'],
        }, msg='Login successful.')


# ─── 3. Logout ─────────────────────────────────────────────────
class LogoutView(APIView):
    """
    POST /api/v1/auth/logout/
    Blacklists the refresh token so it can't be reused.

    Request body:  { "refresh": "<refresh_token>" }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            refresh_token = request.data.get('refresh')
            if not refresh_token:
                return error('Refresh token is required.')
            token = RefreshToken(refresh_token)
            token.blacklist()
            return success(msg='Logged out successfully.')
        except Exception as e:
            return error(str(e))


# ─── 4. Profile ────────────────────────────────────────────────
class ProfileView(APIView):
    """
    GET /api/v1/auth/profile/   → Return current user's profile
    PUT /api/v1/auth/profile/   → Update name, phone, profile_photo

    Supports multipart/form-data for photo upload.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return success({'user': serializer.data})

    def put(self, request):
        # partial=True allows updating only some fields
        serializer = UserProfileSerializer(
            request.user, data=request.data, partial=True
        )
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)

        serializer.save()
        return success({'user': serializer.data}, msg='Profile updated successfully.')


# ─── 5. Change Password ────────────────────────────────────────
class ChangePasswordView(APIView):
    """
    POST /api/v1/auth/profile/change-password/

    Request body:
        { "old_password": "...", "new_password": "..." }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(
            data=request.data,
            context={'request': request}
        )
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)

        request.user.set_password(serializer.validated_data['new_password'])
        request.user.save()
        return success(msg='Password changed successfully.')


# ─── 6. Employee Management (Admin only) ───────────────────────
class EmployeeListCreateView(APIView):
    """
    GET  /api/v1/auth/employees/  → List all employees
    POST /api/v1/auth/employees/  → Create a new employee

    Admin only. Employees cannot access these endpoints.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        """Return all employees (not admins)."""
        employees = User.objects.filter(role='employee').order_by('-created_at')
        serializer = EmployeeSerializer(employees, many=True)
        return success({'employees': serializer.data})

    def post(self, request):
        """Admin creates a new employee account."""
        serializer = EmployeeSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)
        try:
            employee = serializer.save()
            return success(
                {'employee': EmployeeSerializer(employee).data},
                msg='Employee created successfully.',
                status_code=status.HTTP_201_CREATED
            )
        except IntegrityError:
            return error('An employee with this email already exists.')


class EmployeeDetailView(APIView):
    """
    GET    /api/v1/auth/employees/<id>/  → Get single employee
    PUT    /api/v1/auth/employees/<id>/  → Update employee
    DELETE /api/v1/auth/employees/<id>/  → Delete employee

    Admin only.
    """
    permission_classes = [IsAdmin]

    def get_employee(self, pk):
        return get_object_or_404(User, pk=pk, role='employee')

    def get(self, request, pk):
        employee = self.get_employee(pk)
        serializer = EmployeeSerializer(employee)
        return success({'employee': serializer.data})

    def put(self, request, pk):
        employee = self.get_employee(pk)
        serializer = EmployeeSerializer(employee, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)
        serializer.save()
        return success({'employee': serializer.data}, msg='Employee updated.')

    def delete(self, request, pk):
        employee = self.get_employee(pk)
        employee.delete()
        return success(msg='Employee deleted successfully.')
