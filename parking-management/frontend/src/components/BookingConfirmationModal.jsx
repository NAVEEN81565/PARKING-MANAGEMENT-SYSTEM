/* BookingConfirmationModal – shows booking success with QR code */
import { useEffect } from 'react';
import QRCodeGenerator from './QRCodeGenerator';
import styles from './BookingConfirmationModal.module.css';

/**
 * @param {{ bookingData: object, onClose: function }} props
 */
export default function BookingConfirmationModal({ bookingData, onClose }) {
  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!bookingData) return null;

  const vehicleIcon = bookingData.vehicleType === 'car' ? '🚗' : '🏍️';
  const vehicleLabel = bookingData.vehicleType === 'car' ? 'Car' : 'Bike';
  const entryFormatted = new Date(bookingData.entryTime).toLocaleString('en-IN', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* ── Success header ─────────────────────────────────────── */}
        <div className={styles.successHeader}>
          <div className={styles.checkCircle}>
            <svg width="32" height="32" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <h2 className={styles.successTitle}>Booking Confirmed!</h2>
          <p className={styles.successSub}>Your parking slot has been reserved successfully</p>
        </div>

        {/* ── QR Code ────────────────────────────────────────────── */}
        <div className={styles.qrSection}>
          <QRCodeGenerator bookingData={bookingData} />
        </div>

        {/* ── Booking details card ───────────────────────────────── */}
        <div className={styles.detailsCard}>
          <div className={styles.detailsTitle}>
            <span>📋</span> Booking Details
          </div>
          <div className={styles.detailsGrid}>
            <DetailRow icon="🎫" label="Slot" value={bookingData.slotId} highlight />
            <DetailRow icon={vehicleIcon} label="Vehicle" value={bookingData.vehicleNo} />
            <DetailRow icon="📂" label="Type" value={vehicleLabel} />
            <DetailRow icon="👤" label="Employee" value={bookingData.employeeName} />
            <DetailRow icon="🆔" label="Emp. ID" value={bookingData.employeeId} />
            <DetailRow icon="📞" label="Phone" value={bookingData.employeePhone || 'N/A'} />
            <DetailRow icon="🕐" label="Entry Time" value={entryFormatted} />
            <DetailRow icon="🕑" label="Exit Time" value={bookingData.exitTime ? new Date(bookingData.exitTime).toLocaleString() : '—'} />
          </div>
        </div>

        {/* ── Close button ───────────────────────────────────────── */}
        <button className={styles.btnDone} onClick={onClose}>
          Done
        </button>
      </div>
    </div>
  );
}

/** Small reusable detail row */
function DetailRow({ icon, label, value, highlight = false }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailIcon}>{icon}</span>
      <span className={styles.detailLabel}>{label}</span>
      <span className={`${styles.detailValue} ${highlight ? styles.detailHighlight : ''}`}>
        {value}
      </span>
    </div>
  );
}
