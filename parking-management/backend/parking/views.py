"""
parking/views.py
All parking-related API views.

ENDPOINTS:
  GET  /api/v1/parking/slots/                    → SlotListView
  GET  /api/v1/parking/slots/stats/              → SlotStatsView
  POST /api/v1/parking/bookings/                 → BookingCreateView
  POST /api/v1/parking/bookings/<id>/exit/       → BookingExitView
  GET  /api/v1/parking/history/                  → BookingHistoryView
  GET  /api/v1/parking/history/csv/              → BookingHistoryCSVView
  POST /api/v1/parking/qr/validate/              → QRValidateView
  GET  /api/v1/parking/bookings/<id>/qr/         → QRGenerateView
"""
import csv
import math
from django.http import HttpResponse
from django.utils import timezone
from django.db import transaction
from django.db.models import Q, Sum
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import ParkingSlot, Booking, Fine
from .serializers import (
    ParkingSlotSerializer,
    BookingCreateSerializer,
    BookingSerializer,
)
from users.permissions import IsAdmin, IsAdminOrEmployee


# ─── Helper ────────────────────────────────────────────────────
def success(data=None, msg='', status_code=status.HTTP_200_OK):
    return Response({'success': True, 'message': msg, **(data or {})}, status=status_code)

def error(msg, status_code=status.HTTP_400_BAD_REQUEST):
    return Response({'success': False, 'message': msg}, status=status_code)


# ─── 1. Slot List ──────────────────────────────────────────────
class SlotListView(APIView):
    """
    GET /api/v1/parking/slots/
    Returns all slots, optionally filtered by type.

    Query params:
      ?type=car        → only car slots (A01-A30)
      ?type=bike       → only bike slots (B01-B20)
      ?occupied=true   → only occupied slots

    Response matches frontend carSlots/bikeSlots structure.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = ParkingSlot.objects.all()

        slot_type = request.query_params.get('type')
        if slot_type in ('car', 'bike'):
            qs = qs.filter(slot_type=slot_type)

        occupied = request.query_params.get('occupied')
        if occupied == 'true':
            qs = qs.filter(is_occupied=True)
        elif occupied == 'false':
            qs = qs.filter(is_occupied=False)

        serializer = ParkingSlotSerializer(qs, many=True)
        return success({'slots': serializer.data})


# ─── 2. Slot Stats ─────────────────────────────────────────────
class SlotStatsView(APIView):
    """
    GET /api/v1/parking/slots/stats/
    Returns summary counts used by Dashboard stat cards.

    Response matches frontend 'stats' object from AppContext:
      { totalCar, availableCar, occupiedCar,
        totalBike, availableBike, occupiedBike,
        totalPendingFines, totalCollectedFines }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        car_slots  = ParkingSlot.objects.filter(slot_type='car')
        bike_slots = ParkingSlot.objects.filter(slot_type='bike')

        # Calculate pending fines (active expired bookings)
        now = timezone.now()
        expired_bookings = Booking.objects.filter(
            status__in=['active', 'expired'],
            scheduled_exit_time__lt=now,
            exit_time__isnull=True
        )
        total_pending_fines = 0
        for b in expired_bookings:
            overtime_s = (now - b.scheduled_exit_time).total_seconds()
            total_pending_fines += math.ceil(overtime_s / 3600) * 10

        # Collected fines (from exited bookings with fine_amount > 0)
        collected = Booking.objects.filter(
            status='exited', fine_amount__gt=0
        ).aggregate(total=Sum('fine_amount'))['total'] or 0

        return success({
            'stats': {
                'totalCar':           car_slots.count(),
                'availableCar':       car_slots.filter(is_occupied=False).count(),
                'occupiedCar':        car_slots.filter(is_occupied=True).count(),
                'totalBike':          bike_slots.count(),
                'availableBike':      bike_slots.filter(is_occupied=False).count(),
                'occupiedBike':       bike_slots.filter(is_occupied=True).count(),
                'totalPendingFines':  round(total_pending_fines, 2),
                'totalCollectedFines': float(collected),
                'activeBookings':     Booking.objects.filter(
                                          status__in=['active','expired']
                                      ).count(),
            }
        })


# ─── 3. Create Booking ─────────────────────────────────────────
class BookingCreateView(APIView):
    """
    POST /api/v1/parking/bookings/
    Book a specific slot. Uses DB-level locking to prevent double booking.

    Request body:
    {
        "slot_id": "A05",
        "vehicle_no": "KA01AB1234",
        "vehicle_type": "car",
        "customer_phone": "9876543210",
        "scheduled_exit_time": "2026-04-09T16:00:00Z"
    }

    Response:
    {
        "success": true,
        "booking": { ...booking fields..., "qr_token": "..." }
    }
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = BookingCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response({'success': False, 'errors': serializer.errors},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            # Pass the logged-in user as the employee
            booking = serializer.save(employee=request.user)
            return success(
                {'booking': BookingSerializer(booking).data},
                msg=f"Slot {booking.slot_id} booked successfully.",
                status_code=status.HTTP_201_CREATED
            )
        except Exception as e:
            return error(str(e))


# ─── 4. Exit Booking ───────────────────────────────────────────
class BookingExitView(APIView):
    """
    POST /api/v1/parking/bookings/<id>/exit/
    Mark a vehicle as exited. Calculates duration + fine automatically.

    FINE LOGIC (mirrors frontend freeSlot()):
      - If exit_time > scheduled_exit_time:
          overtime_hours = (exit_time - scheduled_exit_time) / 3600
          fine = ceil(overtime_hours) × ₹10
      - Else: fine = 0

    A Fine record is created in parking_fines if fine > 0.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        try:
            booking = Booking.objects.get(pk=pk)
        except Booking.DoesNotExist:
            return error('Booking not found.', status.HTTP_404_NOT_FOUND)

        if booking.status == 'exited':
            return error('Vehicle has already exited.')

        # Perform exit: sets exit_time, calculates fine, frees slot
        result = booking.do_exit()

        # Create a Fine record if there is a penalty
        if result['fine_amount'] > 0:
            Fine.objects.create(
                booking=booking,
                amount=result['fine_amount']
            )

        return success({
            'booking':          BookingSerializer(booking).data,
            'duration_minutes': result['duration_minutes'],
            'fine_amount':      result['fine_amount'],
        }, msg=f"Vehicle exited. Fine: ₹{result['fine_amount']}")


# ─── 5. Booking History ────────────────────────────────────────
class BookingHistoryView(APIView):
    """
    GET /api/v1/parking/history/
    Returns booking history with filtering support.

    ROLE LOGIC (matches frontend ParkingHistory.jsx):
      - Admin → all bookings
      - Employee → only their own bookings

    Query params:
      ?type=car|bike
      ?status=active|expired|exited
      ?search=<vehicle_no or slot_id>
      ?start_date=YYYY-MM-DD
      ?end_date=YYYY-MM-DD
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # Employees see only their own bookings
        if request.user.role == 'admin':
            qs = Booking.objects.select_related('slot', 'employee').all()
        else:
            qs = Booking.objects.select_related('slot', 'employee').filter(
                employee=request.user
            )

        # ── Filters ──────────────────────────────────────────
        vehicle_type = request.query_params.get('type')
        if vehicle_type in ('car', 'bike'):
            qs = qs.filter(vehicle_type=vehicle_type)

        booking_status = request.query_params.get('status')
        if booking_status == 'active':
            qs = qs.filter(status__in=['active', 'expired'])
        elif booking_status in ('expired', 'exited'):
            qs = qs.filter(status=booking_status)

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(vehicle_no__icontains=search) |
                Q(slot__slot_id__icontains=search)
            )

        start_date = request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(entry_time__date__gte=start_date)

        end_date = request.query_params.get('end_date')
        if end_date:
            qs = qs.filter(entry_time__date__lte=end_date)

        serializer = BookingSerializer(qs, many=True)
        return success({
            'history': serializer.data,
            'count':   qs.count(),
        })


# ─── 6. History CSV Export ─────────────────────────────────────
class BookingHistoryCSVView(APIView):
    """
    GET /api/v1/parking/history/csv/
    Downloads booking history as CSV file.
    Admin only — matches "Export CSV" button in ParkingHistory.jsx.

    Accepts same query params as BookingHistoryView.
    """
    permission_classes = [IsAdmin]

    def get(self, request):
        qs = Booking.objects.select_related('slot', 'employee').all()

        # Apply same filters as history view
        vehicle_type = request.query_params.get('type')
        if vehicle_type in ('car', 'bike'):
            qs = qs.filter(vehicle_type=vehicle_type)

        booking_status = request.query_params.get('status')
        if booking_status == 'active':
            qs = qs.filter(status__in=['active', 'expired'])
        elif booking_status in ('expired', 'exited'):
            qs = qs.filter(status=booking_status)

        start_date = request.query_params.get('start_date')
        if start_date:
            qs = qs.filter(entry_time__date__gte=start_date)

        end_date = request.query_params.get('end_date')
        if end_date:
            qs = qs.filter(entry_time__date__lte=end_date)

        # Build CSV response
        response = HttpResponse(content_type='text/csv')
        filename  = f"parking_history_{timezone.now().strftime('%Y-%m-%d')}.csv"
        response['Content-Disposition'] = f'attachment; filename="{filename}"'

        writer = csv.writer(response)
        # Header row — matches frontend exportToCSV()
        writer.writerow([
            'Vehicle No', 'Type', 'Slot', 'Employee Name',
            'Date', 'Entry Time', 'Scheduled Exit', 'Actual Exit',
            'Duration (min)', 'Status', 'Fine (Rs)'
        ])

        now = timezone.now()
        for b in qs:
            # Calculate fine (live if not exited)
            if b.exit_time:
                fine = float(b.fine_amount)
            elif b.scheduled_exit_time and now > b.scheduled_exit_time:
                overtime_s = (now - b.scheduled_exit_time).total_seconds()
                fine = math.ceil(overtime_s / 3600) * 10
            else:
                fine = 0

            writer.writerow([
                b.vehicle_no,
                b.vehicle_type,
                b.slot.slot_id,
                b.employee.name if b.employee else '',
                b.entry_time.strftime('%d %b %Y'),
                b.entry_time.strftime('%I:%M %p'),
                b.scheduled_exit_time.strftime('%I:%M %p') if b.scheduled_exit_time else '',
                b.exit_time.strftime('%I:%M %p') if b.exit_time else '',
                b.duration_minutes if b.duration_minutes is not None else '',
                b.compute_status().capitalize(),
                fine if fine > 0 else 0,
            ])

        return response


# ─── 7. QR Generate ────────────────────────────────────────────
class QRGenerateView(APIView):
    """
    GET /api/v1/parking/bookings/<id>/qr/
    Returns QR token data for the booking.
    Frontend (QRCodeGenerator.jsx) embeds this in a QR code image.

    Response payload (what gets encoded in QR):
    {
        "qr_token": "...",
        "empId": 5,
        "empName": "Alice",
        "empPhone": "9876543210",
        "vehicleNo": "KA01AB1234",
        "vehicleType": "car",
        "slotId": "A05",
        "entryTime": "...",
        "scheduledExitTime": "..."
    }
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            booking = Booking.objects.select_related('slot', 'employee').get(pk=pk)
        except Booking.DoesNotExist:
            return error('Booking not found.', status.HTTP_404_NOT_FOUND)

        # Only the booking owner or admin can view the QR
        if request.user.role != 'admin' and booking.employee != request.user:
            return error('Access denied.', status.HTTP_403_FORBIDDEN)

        qr_data = {
            'qr_token':          booking.qr_token,
            'empId':             booking.employee.id if booking.employee else None,
            'empName':           booking.employee.name if booking.employee else '',
            'empPhone':          booking.employee.phone if booking.employee else '',
            'vehicleNo':         booking.vehicle_no,
            'vehicleType':       booking.vehicle_type,
            'slotId':            booking.slot.slot_id,
            'entryTime':         booking.entry_time.isoformat(),
            'scheduledExitTime': booking.scheduled_exit_time.isoformat()
                                 if booking.scheduled_exit_time else None,
            'exitTime':          booking.exit_time.isoformat()
                                 if booking.exit_time else None,
        }
        return success({'qr_data': qr_data})


# ─── 8. QR Validate ────────────────────────────────────────────
class QRValidateView(APIView):
    """
    POST /api/v1/parking/qr/validate/
    Admin scans a QR code → validates the token → returns booking info.

    Request body:
        { "qr_token": "<64-char hex string>" }

    Used by QRScanner.jsx admin page.
    """
    permission_classes = [IsAdmin]

    def post(self, request):
        qr_token = request.data.get('qr_token', '').strip()
        if not qr_token:
            return error('qr_token is required.')

        try:
            booking = Booking.objects.select_related('slot', 'employee').get(
                qr_token=qr_token
            )
        except Booking.DoesNotExist:
            return error('Invalid QR code. No booking found for this token.',
                         status.HTTP_404_NOT_FOUND)

        now = timezone.now()
        # Calculate live fine if active/expired
        if booking.exit_time:
            live_fine = float(booking.fine_amount)
        elif booking.scheduled_exit_time and now > booking.scheduled_exit_time:
            overtime_s = (now - booking.scheduled_exit_time).total_seconds()
            live_fine  = math.ceil(overtime_s / 3600) * 10
        else:
            live_fine = 0

        return success({
            'booking': BookingSerializer(booking).data,
            'qr_data': {
                'empId':             booking.employee.id if booking.employee else None,
                'empName':           booking.employee.name if booking.employee else '',
                'empPhone':          booking.employee.phone if booking.employee else '',
                'vehicleNo':         booking.vehicle_no,
                'vehicleType':       booking.vehicle_type,
                'slotId':            booking.slot.slot_id,
                'entryTime':         booking.entry_time.isoformat(),
                'scheduledExitTime': booking.scheduled_exit_time.isoformat()
                                     if booking.scheduled_exit_time else None,
                'exitTime':          booking.exit_time.isoformat()
                                     if booking.exit_time else None,
                'status':            booking.compute_status(),
                'liveFinAmount':     live_fine,
            }
        }, msg='QR code is valid.')
