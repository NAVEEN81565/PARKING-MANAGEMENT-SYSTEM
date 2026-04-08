"""
parking/serializers.py
Serializers for ParkingSlot, Booking, and Fine models.
"""
from rest_framework import serializers
from django.utils import timezone
from .models import ParkingSlot, Booking, Fine


# ─── Slot Serializer ───────────────────────────────────────────
class ParkingSlotSerializer(serializers.ModelSerializer):
    """
    Used by: GET /api/v1/parking/slots/
    Returns slot list with current booking info when occupied.
    """
    # Nested booking info (only shown if slot is occupied)
    current_booking = serializers.SerializerMethodField()

    class Meta:
        model  = ParkingSlot
        fields = ['slot_id', 'slot_type', 'is_occupied', 'current_booking']

    def get_current_booking(self, obj):
        """Return active booking details if slot is occupied."""
        if not obj.is_occupied:
            return None
        try:
            booking = obj.bookings.filter(status__in=['active', 'expired']).latest('entry_time')
            return {
                'booking_id':          booking.id,
                'vehicle_no':          booking.vehicle_no,
                'vehicle_type':        booking.vehicle_type,
                'entry_time':          booking.entry_time,
                'scheduled_exit_time': booking.scheduled_exit_time,
                'employee_name':       booking.employee.name if booking.employee else '',
                'qr_token':            booking.qr_token,
            }
        except Booking.DoesNotExist:
            return None


# ─── Booking Create Serializer ─────────────────────────────────
class BookingCreateSerializer(serializers.ModelSerializer):
    """
    Used by: POST /api/v1/parking/bookings/

    Request body (matches frontend BookingModal.jsx):
    {
        "slot_id": "A05",
        "vehicle_no": "KA01AB1234",
        "vehicle_type": "car",
        "customer_phone": "9876543210",
        "scheduled_exit_time": "2026-04-09T16:00:00Z"
    }
    """
    slot_id = serializers.CharField(write_only=True)

    class Meta:
        model  = Booking
        fields = ['slot_id', 'vehicle_no', 'vehicle_type',
                  'customer_phone', 'scheduled_exit_time']

    def validate_slot_id(self, value):
        """Ensure slot exists and is free."""
        try:
            slot = ParkingSlot.objects.get(slot_id=value)
        except ParkingSlot.DoesNotExist:
            raise serializers.ValidationError(f"Slot '{value}' does not exist.")
        if slot.is_occupied:
            raise serializers.ValidationError(f"Slot '{value}' is already occupied.")
        return value

    def validate_vehicle_no(self, value):
        """Prevent double-booking the same vehicle."""
        if Booking.objects.filter(vehicle_no=value, status__in=['active', 'expired']).exists():
            raise serializers.ValidationError(
                f"Vehicle '{value}' is already parked. Exit first."
            )
        return value.upper()

    def validate(self, data):
        """Ensure vehicle type matches slot type."""
        slot_id      = data.get('slot_id', '')
        vehicle_type = data.get('vehicle_type', '')
        if slot_id:
            prefix = slot_id[0].upper()
            # A prefix = car, B prefix = bike
            expected = 'car' if prefix == 'A' else 'bike'
            if vehicle_type != expected:
                raise serializers.ValidationError(
                    f"Slot '{slot_id}' is for {expected}s, not {vehicle_type}s."
                )
        return data

    def create(self, validated_data):
        from django.db import transaction
        slot_id = validated_data.pop('slot_id')

        with transaction.atomic():
            # Lock the slot row to prevent race conditions (double booking)
            slot = ParkingSlot.objects.select_for_update().get(slot_id=slot_id)
            if slot.is_occupied:
                raise serializers.ValidationError('Slot was just taken. Choose another.')

            booking = Booking.objects.create(
                slot=slot,
                **validated_data
            )
            slot.is_occupied = True
            slot.save()

        return booking


# ─── Booking Read Serializer ───────────────────────────────────
class BookingSerializer(serializers.ModelSerializer):
    """
    Used for GET responses — includes employee name, slot_id, status.
    Mirrors exact field names used in frontend history table.
    """
    slot_id       = serializers.CharField(source='slot.slot_id', read_only=True)
    employee_name = serializers.CharField(source='employee.name', read_only=True, default='')
    employee_id   = serializers.IntegerField(source='employee.id', read_only=True, default=None)
    # Dynamic status computed at read time
    computed_status = serializers.SerializerMethodField()
    current_fine    = serializers.SerializerMethodField()

    class Meta:
        model  = Booking
        fields = [
            'id', 'slot_id', 'vehicle_no', 'vehicle_type', 'customer_phone',
            'entry_time', 'scheduled_exit_time', 'exit_time',
            'duration_minutes', 'fine_amount', 'status', 'computed_status',
            'current_fine', 'qr_token',
            'employee_id', 'employee_name',
            'created_at',
        ]

    def get_computed_status(self, obj):
        """Live status: recalculates based on current time."""
        return obj.compute_status()

    def get_current_fine(self, obj):
        """
        Fine that would be charged right now.
        If already exited, returns the stored fine_amount.
        If still active/expired, calculates live fine.
        """
        if obj.exit_time:
            return float(obj.fine_amount)
        if obj.scheduled_exit_time and timezone.now() > obj.scheduled_exit_time:
            import math
            overtime_s = (timezone.now() - obj.scheduled_exit_time).total_seconds()
            return math.ceil(overtime_s / 3600) * 10
        return 0


# ─── Fine Serializer ───────────────────────────────────────────
class FineSerializer(serializers.ModelSerializer):
    booking_id  = serializers.IntegerField(source='booking.id', read_only=True)
    vehicle_no  = serializers.CharField(source='booking.vehicle_no', read_only=True)
    slot_id     = serializers.CharField(source='booking.slot.slot_id', read_only=True)

    class Meta:
        model  = Fine
        fields = ['id', 'booking_id', 'vehicle_no', 'slot_id',
                  'amount', 'is_paid', 'paid_at', 'created_at']
