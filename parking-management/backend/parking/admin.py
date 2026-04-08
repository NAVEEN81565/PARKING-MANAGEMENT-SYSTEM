"""
parking/admin.py
Register parking models in Django Admin panel.
"""
from django.contrib import admin
from .models import ParkingSlot, Booking, Fine


@admin.register(ParkingSlot)
class ParkingSlotAdmin(admin.ModelAdmin):
    list_display  = ['slot_id', 'slot_type', 'is_occupied', 'created_at']
    list_filter   = ['slot_type', 'is_occupied']
    search_fields = ['slot_id']
    ordering      = ['slot_id']


@admin.register(Booking)
class BookingAdmin(admin.ModelAdmin):
    list_display  = ['id', 'vehicle_no', 'slot', 'employee', 'vehicle_type',
                     'entry_time', 'scheduled_exit_time', 'exit_time',
                     'fine_amount', 'status']
    list_filter   = ['status', 'vehicle_type']
    search_fields = ['vehicle_no', 'slot__slot_id', 'employee__name']
    readonly_fields = ['qr_token', 'entry_time', 'created_at']
    ordering = ['-entry_time']


@admin.register(Fine)
class FineAdmin(admin.ModelAdmin):
    list_display  = ['id', 'booking', 'amount', 'is_paid', 'paid_at', 'created_at']
    list_filter   = ['is_paid']
    search_fields = ['booking__vehicle_no']
