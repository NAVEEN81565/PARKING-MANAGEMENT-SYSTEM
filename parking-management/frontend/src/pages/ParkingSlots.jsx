/* ParkingSlots – Visual grid with inline slot booking modal + QR confirmation
 * Updated to pass scheduledExitTime from BookingModal to assignSlotById */
import { useState, useCallback } from 'react';
import { useApp } from '../services/AppContext';
import SlotGrid   from '../components/SlotGrid';
import BookingModal from '../components/BookingModal';
import BookingConfirmationModal from '../components/BookingConfirmationModal';
import styles from '../styles/shared.module.css';
import psStyles from '../styles/ParkingSlots.module.css';

export default function ParkingSlots() {
  const { carSlots, bikeSlots, stats, assignSlotById, user } = useApp();

  const [filter, setFilter]           = useState('all');
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [toast, setToast]             = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSlotClick = useCallback((slot) => {
    if (slot.isOccupied) return;
    setSelectedSlot(slot);
  }, []);

  /**
   * handleConfirm – Called when user submits the booking modal
   * Now receives scheduledExitTime as the 4th parameter
   * (BookingModal calculates it from the duration the user selected)
   */
  const handleConfirm = (slotId, vehicleNo, vehicleType, scheduledExitTime, phone) => {
    const result = assignSlotById(slotId, vehicleNo, vehicleType, scheduledExitTime, phone);
    if (result.success) {
      setSelectedSlot(null);

      const bookingData = {
        employeeId:    user.id,
        employeeName:  user.name,
        employeePhone: phone || user.phone || 'N/A',
        vehicleNo:     vehicleNo,
        vehicleType:   vehicleType,
        slotId:        result.slotId,
        entryTime:     new Date().toISOString(),
        scheduledExitTime: scheduledExitTime,
        exitTime:      null,
      };

      // Store in localStorage for QR persistence
      const storedBookings = JSON.parse(localStorage.getItem('pms_bookings') || '[]');
      storedBookings.push(bookingData);
      localStorage.setItem('pms_bookings', JSON.stringify(storedBookings));

      setConfirmedBooking(bookingData);
      showToast(`✅ Slot ${result.slotId} booked for ${vehicleNo}!`, 'success');
    }
    return result;
  };

  const handleClose = () => setSelectedSlot(null);
  const handleCloseConfirmation = () => setConfirmedBooking(null);

  const totalFree = stats.availableCar + stats.availableBike;

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Parking Slots</h1>
          <p className={styles.pageSubtitle}>
            Live view — click any <span className={psStyles.highlight}>green free slot</span> to book instantly
          </p>
        </div>
        <div className={psStyles.availBadge}>
          <span className={psStyles.availNum}>{totalFree}</span>
          <span className={psStyles.availLabel}>slots free</span>
        </div>
      </div>

      {toast && (
        <div className={`${psStyles.toast} ${psStyles[toast.type]}`}>
          {toast.message}
        </div>
      )}

      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
        {[
          { label: `🚗 Car: ${stats.availableCar} free / ${stats.occupiedCar} occupied`, color: 'var(--primary)' },
          { label: `🏍️ Bike: ${stats.availableBike} free / ${stats.occupiedBike} occupied`, color: 'var(--success)' },
        ].map(b => (
          <span key={b.label} style={{
            padding: '6px 14px', borderRadius: '20px', background: 'var(--bg-card)',
            border: `1.5px solid ${b.color}`, color: b.color, fontSize: '0.8rem', fontWeight: 600
          }}>
            {b.label}
          </span>
        ))}
      </div>

      <div className={styles.filterBar} style={{ marginBottom: 20 }}>
        {['all', 'car', 'bike'].map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${filter === f ? styles.active : ''}`}
            onClick={() => setFilter(f)}
            style={{ textTransform: 'capitalize' }}
          >
            {f === 'all' ? '🅿️ All Slots' : f === 'car' ? '🚗 Car Slots' : '🏍️ Bike Slots'}
          </button>
        ))}
      </div>

      <div className={styles.card}>
        {(filter === 'all' || filter === 'car') && (
          <SlotGrid
            slots={carSlots}
            title="Car Parking Slots (A01–A30)"
            icon="🚗"
            onSlotClick={handleSlotClick}
            selectedSlotId={selectedSlot?.id}
          />
        )}
        {(filter === 'all' || filter === 'bike') && (
          <SlotGrid
            slots={bikeSlots}
            title="Bike Parking Slots (B01–B20)"
            icon="🏍️"
            onSlotClick={handleSlotClick}
            selectedSlotId={selectedSlot?.id}
          />
        )}
      </div>

      {selectedSlot && (
        <BookingModal
          slot={selectedSlot}
          onConfirm={handleConfirm}
          onClose={handleClose}
        />
      )}

      {confirmedBooking && (
        <BookingConfirmationModal
          bookingData={confirmedBooking}
          onClose={handleCloseConfirmation}
        />
      )}
    </div>
  );
}
