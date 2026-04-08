"""
parking_backend/urls.py
Root URL configuration — routes to users and parking apps.

All API routes are prefixed with /api/v1/ for versioning.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    # Django Admin panel
    path('admin/', admin.site.urls),

    # ── Auth & User APIs ──────────────────────────────────────
    # Handles: login, register, logout, profile, employee management
    path('api/v1/auth/', include('users.urls')),

    # ── Parking APIs ──────────────────────────────────────────
    # Handles: slots, bookings, history, QR, stats
    path('api/v1/parking/', include('parking.urls')),

    # ── JWT Token Refresh ──────────────────────────────────────
    # Frontend calls this to silently refresh access tokens
    path('api/v1/auth/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
]

# Serve media files in development (profile photos)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
