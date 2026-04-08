"""
users/urls.py
URL patterns for the users app.
All paths are prefixed with /api/v1/auth/ from root urls.py
"""
from django.urls import path
from .views import (
    RegisterView,
    LoginView,
    LogoutView,
    ProfileView,
    ChangePasswordView,
    EmployeeListCreateView,
    EmployeeDetailView,
)

urlpatterns = [
    # ── Public ─────────────────────────────────────────────────
    path('register/', RegisterView.as_view(), name='auth-register'),
    path('login/',    LoginView.as_view(),    name='auth-login'),

    # ── Authenticated ──────────────────────────────────────────
    path('logout/',                    LogoutView.as_view(),       name='auth-logout'),
    path('profile/',                   ProfileView.as_view(),      name='auth-profile'),
    path('profile/change-password/',   ChangePasswordView.as_view(), name='auth-change-password'),

    # ── Admin only: employee management ───────────────────────
    path('employees/',      EmployeeListCreateView.as_view(), name='employee-list-create'),
    path('employees/<int:pk>/', EmployeeDetailView.as_view(), name='employee-detail'),
]
