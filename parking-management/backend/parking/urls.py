"""
parking/urls.py
URL patterns for the parking app.
All paths are prefixed with /api/v1/parking/ from root urls.py
"""
from django.urls import path
from .views import (
    SlotListView,
    SlotStatsView,
    BookingCreateView,
    BookingExitView,
    BookingHistoryView,
    BookingHistoryCSVView,
    QRGenerateView,
    QRValidateView,
)

urlpatterns = [
    # ── Slots ──────────────────────────────────────────────────
    # GET  /api/v1/parking/slots/          → all slots (filterable)
    path('slots/',         SlotListView.as_view(),  name='slot-list'),
    # GET  /api/v1/parking/slots/stats/    → dashboard summary counts
    path('slots/stats/',   SlotStatsView.as_view(), name='slot-stats'),

    # ── Bookings ───────────────────────────────────────────────
    # POST /api/v1/parking/bookings/              → create booking
    path('bookings/',               BookingCreateView.as_view(), name='booking-create'),
    # POST /api/v1/parking/bookings/<id>/exit/    → exit vehicle
    path('bookings/<int:pk>/exit/', BookingExitView.as_view(),   name='booking-exit'),
    # GET  /api/v1/parking/bookings/<id>/qr/      → get QR data
    path('bookings/<int:pk>/qr/',   QRGenerateView.as_view(),    name='booking-qr'),

    # ── History ────────────────────────────────────────────────
    # GET  /api/v1/parking/history/       → filterable history list
    path('history/',       BookingHistoryView.as_view(),    name='booking-history'),
    # GET  /api/v1/parking/history/csv/   → download as CSV (admin only)
    path('history/csv/',   BookingHistoryCSVView.as_view(), name='booking-history-csv'),

    # ── QR ─────────────────────────────────────────────────────
    # POST /api/v1/parking/qr/validate/   → admin QR scanner validation
    path('qr/validate/',   QRValidateView.as_view(), name='qr-validate'),
]
