"""
parking/management/commands/seed_slots.py
Custom Django management command to populate parking slots.

USAGE:
  python manage.py seed_slots

CREATES:
  A01 – A30  →  30 Car slots   (type='car')
  B01 – B20  →  20 Bike slots  (type='bike')

Run this ONCE after migrations. Safe to re-run (uses get_or_create).
"""
from django.core.management.base import BaseCommand
from parking.models import ParkingSlot


class Command(BaseCommand):
    help = 'Seed the database with 30 car slots (A01-A30) and 20 bike slots (B01-B20)'

    def handle(self, *args, **options):
        created_count = 0
        skipped_count = 0

        # ── Car slots: A01 – A30 ───────────────────────────────
        for i in range(1, 31):
            slot_id = f"A{str(i).zfill(2)}"   # A01, A02 ... A30
            obj, created = ParkingSlot.objects.get_or_create(
                slot_id=slot_id,
                defaults={'slot_type': 'car'}
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  ✅ Created car slot: {slot_id}"))
            else:
                skipped_count += 1

        # ── Bike slots: B01 – B20 ──────────────────────────────
        for i in range(1, 21):
            slot_id = f"B{str(i).zfill(2)}"   # B01, B02 ... B20
            obj, created = ParkingSlot.objects.get_or_create(
                slot_id=slot_id,
                defaults={'slot_type': 'bike'}
            )
            if created:
                created_count += 1
                self.stdout.write(self.style.SUCCESS(f"  ✅ Created bike slot: {slot_id}"))
            else:
                skipped_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"\n🎉 Done! Created: {created_count} slots | Skipped (already exist): {skipped_count}"
            )
        )
