"""
users/serializers.py
Converts User model instances to/from JSON.

SERIALIZERS DEFINED:
1. RegisterSerializer  — validates and creates new employee accounts
2. LoginSerializer     — validates email/password, returns user + JWT tokens
3. UserProfileSerializer — read/update profile (name, phone, photo)
4. EmployeeSerializer  — admin view: list/create/delete employees
5. ChangePasswordSerializer — validates old+new password for profile update
"""
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from .models import User


# ─── 1. Register ───────────────────────────────────────────────
class RegisterSerializer(serializers.ModelSerializer):
    """
    POST /api/v1/auth/register/
    Creates a new EMPLOYEE account.
    Admin accounts are created only via 'python manage.py createsuperuser'.
    """
    password = serializers.CharField(write_only=True, min_length=6)
    password2 = serializers.CharField(write_only=True, label='Confirm Password')

    class Meta:
        model  = User
        fields = ['name', 'email', 'phone', 'password', 'password2']

    def validate(self, data):
        """Cross-field validation: passwords must match."""
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        return data

    def validate_email(self, value):
        """Ensure email is not already taken."""
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('An account with this email already exists.')
        return value

    def create(self, validated_data):
        validated_data.pop('password2')
        password = validated_data.pop('password')
        # Always create employees via register — admins use createsuperuser
        user = User.objects.create_user(
            role='employee',
            **validated_data,
            password=password
        )
        return user


# ─── 2. Login ──────────────────────────────────────────────────
class LoginSerializer(serializers.Serializer):
    """
    POST /api/v1/auth/login/
    Returns JWT tokens + user info on success.

    RESPONSE FORMAT (matches frontend AppContext expectations):
    {
        "access": "...",
        "refresh": "...",
        "user": { "id", "name", "email", "role", "phone", "profile_photo" }
    }
    """
    email    = serializers.EmailField()
    password = serializers.CharField(write_only=True)

    def validate(self, data):
        # Django's authenticate works with USERNAME_FIELD (email here)
        user = authenticate(username=data['email'], password=data['password'])
        if not user:
            raise serializers.ValidationError('Invalid email or password.')
        if not user.is_active:
            raise serializers.ValidationError('This account has been deactivated.')

        # Generate JWT token pair
        refresh = RefreshToken.for_user(user)

        # Build the user payload that mirrors frontend's pms_user structure
        return {
            'access':  str(refresh.access_token),
            'refresh': str(refresh),
            'user': {
                'id':            user.id,
                'name':          user.name,
                'email':         user.email,
                'role':          user.role,
                'phone':         user.phone,
                'profile_photo': user.profile_photo.url if user.profile_photo else None,
            }
        }


# ─── 3. Profile ────────────────────────────────────────────────
class UserProfileSerializer(serializers.ModelSerializer):
    """
    GET  /api/v1/auth/profile/  → returns current user's data
    PUT  /api/v1/auth/profile/  → updates name, phone, profile_photo
    """
    profile_photo = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model  = User
        fields = ['id', 'name', 'email', 'role', 'phone', 'profile_photo', 'created_at']
        read_only_fields = ['id', 'email', 'role', 'created_at']


# ─── 4. Change Password ────────────────────────────────────────
class ChangePasswordSerializer(serializers.Serializer):
    """
    POST /api/v1/auth/profile/change-password/
    Validates old password before allowing a reset.
    """
    old_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, min_length=6)

    def validate_old_password(self, value):
        user = self.context['request'].user
        if not user.check_password(value):
            raise serializers.ValidationError('Old password is incorrect.')
        return value


# ─── 5. Employee (Admin management) ────────────────────────────
class EmployeeSerializer(serializers.ModelSerializer):
    """
    Admin endpoints: GET/POST /api/v1/auth/employees/
                     DELETE /api/v1/auth/employees/{id}/

    Admin can create employees with a temporary password.
    """
    password = serializers.CharField(write_only=True, required=False, min_length=6)

    class Meta:
        model  = User
        fields = ['id', 'name', 'email', 'phone', 'role', 'is_active',
                  'created_at', 'password']
        read_only_fields = ['id', 'role', 'created_at']

    def create(self, validated_data):
        password = validated_data.pop('password', 'emp123')  # default temp password
        return User.objects.create_user(
            role='employee',
            password=password,
            **validated_data
        )
