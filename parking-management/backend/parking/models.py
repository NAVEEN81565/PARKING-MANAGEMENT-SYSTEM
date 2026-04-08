"""
parking/models.py
Core data models for the parking system.

TABLES:
  1. ParkingSlot  — 50 slots: A01–A30 (car), B01–B20 (bike)
  2. Booking      — each vehicle entry/exit record
  3. Fine         — overtime fine linked to a booking

BUSINESS RULES (mirrored from frontend AppContext.jsx):
  - A01–A30 → car slots  (type='car')
  - B01–B20 → bike slots (type='bike')
  - On booking: entry_time = now, scheduled_exit_time = fixed by user
  - On exit:    fine = ceil(overtime_hours) × ₹10
  - QR token:   64-char hex string stored in Booking, validated by admin
"""
from django.db import models
from django.conf import settings
import secrets
import math
from django.utils import timezone


# ─── 1. Parking Slot ───────────────────────────────────────────
class ParkingSlot(models.Model):
    """
    TABLE: parking_slot

    Seeded by: python manage.py seed_slots
      - A01–A30 → type='car'
      - B01–B20 → type='bike'

    FIELDS:
      slot_id     : Primary key e.g. 'A05', 'B12'
      slot_type   : 'car' or 'bike'
      is_occupied : True when a vehicle is currently parked
    """
    SLOT_TYPE_CHOICES = [
        ('car',  'Car'),
        ('bike', 'Bike'),
    ]

    slot_id     = models.CharField(max_length=5, primary_key=True)
    slot_type   = models.CharField(max_length=5, choices=SLOT_TYPE_CHOICES)
    is_occupied = models.BooleanField(default=False, db_index=True)
    created_at  = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'parking_slots'
        ordering = ['slot_id']

    def __str__(self):
        status = '🔴 Occupied' if self.is_occupied else '🟢 Free'
        return f"{self.slot_id} ({self.slot_type}) — {status}"


# ─── 2. Booking ────────────────────────────────────────────────
class Booking(models.Model):
    """
    TABLE: parking_bookings

    One row per parking session. Both entry AND exit are recorded here.

    FIELDS:
      slot            : FK to ParkingSlot
      employee        : FK to User (who created the booking)
      vehicle_no      : e.g. 'KA01AB1234'
      vehicle_type    : 'car' or 'bike'
      customer_phone  : optional contact
      entry_time      : set automatically at booking time
      scheduled_exit_time: FIXED at booking time (cannot change)
      exit_time       : set when vehicle exits (null = still parked)
      duration_minutes: calculated at exit
      fine_amount     : calculated at exit (overtime fine)
      status          : 'active' | 'expired' | 'exited'
      qr_token        : 64-char hex — unique secure token for QR code
    """
    STATUS_CHOICES = [
        ('active',  'Active'),
        ('expired', 'Expired'),   # still parked but past scheduled_exit_time
        ('exited',  'Exited'),    # vehicle has left
    ]

    slot            = models.ForeignKey(
        ParkingSlot, on_delete=models.PROTECT,
        related_name='bookings', db_column='slot_id'
    )
    employee        = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL,
        null=True, related_name='bookings'
    )
    vehicle_no      = models.CharField(max_length=20, db_index=True)
    vehicle_type    = models.CharField(max_length=5,
                                       choices=[('car','Car'),('bike','Bike')])
    customer_phone  = models.CharField(max_length=15, blank=True, default='')
    entry_time      = models.DateTimeField(default=timezone.now)
    scheduled_exit_time = models.DateTimeField(null=True, blank=True)
    exit_time       = models.DateTimeField(null=True, blank=True)
    duration_minutes = models.IntegerField(null=True, blank=True)
    fine_amount     = models.DecimalField(max_digits=8, decimal_places=2, default=0)
    status          = models.CharField(max_length=10, choices=STATUS_CHOICES,
                                       default='active', db_index=True)
    # Secure 64-char hex QR token — generated at booking time
    qr_token        = models.CharField(max_length=64, unique=True, db_index=True,
                                       default=secrets.token_hex)
    created_at      = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'parking_bookings'
        ordering = ['-entry_time']
        indexes  = [
            models.Index(fields=['vehicle_no', 'status']),
            models.Index(fields=['entry_time']),
        ]

    def __str__(self):
        return f"Booking #{self.pk} | {self.vehicle_no} → {self.slot_id}"

    # ── Business Logic Methods ──────────────────────────────────

    def calculate_fine(self):
        """
        Fine = ceil(overtime_hours) × ₹10

        Called at exit time to calculate the penalty.
        Matches frontend: Math.ceil(overtimeHours) * FINE_RATE_PER_HOUR
        """
        FINE_RATE = 10  # ₹10 per hour (matches frontend FINE_RATE_PER_HOUR)
        if not self.scheduled_exit_time or self.exit_time is None:
            return 0
        if self.exit_time <= self.scheduled_exit_time:
            return 0  # no overtime, no fine
        overtime_seconds = (self.exit_time - self.scheduled_exit_time).total_seconds()
        overtime_hours   = overtime_seconds / 3600
        return math.ceil(overtime_hours) * FINE_RATE

    def compute_status(self):
        """
        Determine current status from timestamps.
        Matches frontend getBookingStatus().
        """
        if self.exit_time:
            return 'exited'
        if self.scheduled_exit_time and timezone.now() > self.scheduled_exit_time:
            return 'expired'
        return 'active'

    def do_exit(self):
        """
        Mark vehicle as exited. Calculates duration and fine.
        Updates the slot's is_occupied flag atomically.
        """
        from django.db import transaction
        with transaction.atomic():
            self.exit_time       = timezone.now()
            self.duration_minutes = round(
                (self.exit_time - self.entry_time).total_seconds() / 60
            )
            self.fine_amount     = self.calculate_fine()
            self.status          = 'exited'
            self.save()

            # Free the slot
            self.slot.is_occupied = False
            self.slot.save()

        return {
            'duration_minutes': self.duration_minutes,
            'fine_amount': float(self.fine_amount),
        }


# ─── 3. Fine (separate table for fine management) ──────────────
class Fine(models.Model):
    """
    TABLE: parking_fines

    Detailed fine record. Created automatically when a booking is exited
    with a non-zero fine amount.

    Admins can mark fines as paid.
    """
    booking    = models.OneToOneField(
        Booking, on_delete=models.CASCADE, related_name='fine_record'
    )
    amount     = models.DecimalField(max_digits=8, decimal_places=2)
    is_paid    = models.BooleanField(default=False)
    paid_at    = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'parking_fines'

    def __str__(self):
        paid = 'PAID' if self.is_paid else 'UNPAID'
        return f"Fine #{self.pk} | ₹{self.amount} | {paid}"
