"""
users/models.py
Custom User model replacing Django's default auth.User.

WHY CUSTOM MODEL:
- We use 'email' as the login field (not username)
- We add 'role' field (admin / employee)
- We add 'phone' and 'profile_photo' for profile management
"""
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


# ─── Custom Manager ────────────────────────────────────────────
class UserManager(BaseUserManager):
    """
    Custom manager so Django knows how to create users
    using email (not username).
    """

    def create_user(self, email, name, password=None, **extra_fields):
        """Create a regular employee user."""
        if not email:
            raise ValueError('Email is required')
        email = self.normalize_email(email)
        user  = self.model(email=email, name=name, **extra_fields)
        user.set_password(password)   # hashes the password
        user.save(using=self._db)
        return user

    def create_superuser(self, email, name, password=None, **extra_fields):
        """Create an admin/superuser via 'python manage.py createsuperuser'."""
        extra_fields.setdefault('role', 'admin')
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        return self.create_user(email, name, password, **extra_fields)


# ─── User Model ─────────────────────────────────────────────────
class User(AbstractBaseUser, PermissionsMixin):
    """
    DATABASE TABLE: users_user

    Stores both Admin and Employee accounts.
    Role-based access is enforced in views using custom permissions.

    FIELDS:
    - email        : unique login identifier (replaces username)
    - name         : full name displayed in UI
    - role         : 'admin' or 'employee'
    - phone        : optional contact number
    - profile_photo: uploaded via /api/v1/auth/profile/ (multipart)
    - is_active    : soft-delete employees by setting False
    - is_staff     : required for Django Admin panel access
    """

    ROLE_CHOICES = [
        ('admin',    'Admin'),
        ('employee', 'Employee'),
    ]

    email         = models.EmailField(unique=True, db_index=True)
    name          = models.CharField(max_length=150)
    role          = models.CharField(max_length=10, choices=ROLE_CHOICES, default='employee')
    phone         = models.CharField(max_length=15, blank=True, default='')
    profile_photo = models.ImageField(
        upload_to='profile_photos/',
        null=True, blank=True
    )
    is_active     = models.BooleanField(default=True)
    is_staff      = models.BooleanField(default=False)   # Django admin access
    created_at    = models.DateTimeField(auto_now_add=True)
    updated_at    = models.DateTimeField(auto_now=True)

    # Tell Django to use our custom manager
    objects = UserManager()

    # Use email as login field instead of username
    USERNAME_FIELD  = 'email'
    REQUIRED_FIELDS = ['name']  # asked by createsuperuser (besides email/password)

    class Meta:
        db_table = 'users'
        verbose_name = 'User'
        verbose_name_plural = 'Users'

    def __str__(self):
        return f"{self.name} ({self.email}) [{self.role}]"

    @property
    def is_admin(self):
        """Helper used in permission checks."""
        return self.role == 'admin'
