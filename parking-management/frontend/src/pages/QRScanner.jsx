/* QRScanner – Admin view to scan/decode QR code data */
import { useState } from 'react';
import QRScannerComponent from '../components/QRScannerComponent';
import ScanResultCard from '../components/ScanResultCard';
import styles from './QRScanner.module.css';

export default function QRScanner() {
  const [decoded, setDecoded]   = useState(null);
  const [error, setError]       = useState('');
  const [recentBookings, setRecentBookings] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('pms_bookings') || localStorage.getItem('pms_history') || '[]');
    } catch { return []; }
  });

  const handleScanSuccess = (decodedText) => {
    try {
      const data = JSON.parse(decodedText);
      if (data.empId && data.slotId) {
        setDecoded(data);
        setError('');
      } else {
        setError('QR Code does not contain valid parking data.');
      }
    } catch {
      setError('Invalid QR data format. Not a recognized parking pass.');
      setDecoded(null);
    }
  };

  const handleScanError = (err) => {
    // Ignore frequent scan errors when no QR is in view
    // Only set real errors if needed, but usually we just want to suppress them in UI
  };

  /* ── Load a booking from recent list ───────────────────────── */
  const handleSelectBooking = (booking) => {
    setDecoded({
      empId:       booking.employeeId,
      empName:     booking.employeeName,
      empPhone:    booking.phone || booking.employeePhone,
      vehicleNo:   booking.vehicleNo,
      vehicleType: booking.vehicleType,
      slotId:      booking.slotId,
      entryTime:   booking.entryTime,
      exitTime:    booking.exitTime || null,
      scheduledExitTime: booking.scheduledExitTime || null,
    });
    setError('');
  };

  const handleClear = () => {
    setDecoded(null);
    setError('');
  };

  return (
    <div className={styles.page}>
      {/* ── Header ─────────────────────────────────────────── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>🔍 QR Scanner</h1>
          <p className={styles.subtitle}>Scan using device camera or upload a QR image</p>
        </div>
      </div>

      <div className={styles.layout}>
        {/* ── Left: Input panel ────────────────────────────── */}
        <div className={styles.inputPanel}>
          <div className={styles.card}>
            <h3 className={styles.cardTitle}>
              <span className={styles.cardIcon}>📷</span>
              Scan QR Code
            </h3>
            
            <QRScannerComponent 
              onScanSuccess={handleScanSuccess} 
              onScanError={handleScanError} 
            />

            {error && (
              <div className={styles.errorBox}>
                <span>⚠️</span> {error}
              </div>
            )}

            {decoded && (
              <div className={styles.btnRow}>
                <button className={styles.btnClear} onClick={handleClear} style={{width: '100%'}}>
                  Clear Current Scan
                </button>
              </div>
            )}
          </div>

          {/* ── Recent bookings list (Fallback / Simulation) ── */}
          {recentBookings.length > 0 && (
            <div className={styles.card}>
              <h3 className={styles.cardTitle}>
                <span className={styles.cardIcon}>🕒</span>
                Recent Bookings (Select to preview)
              </h3>
              <div className={styles.bookingsList}>
                {recentBookings.slice().reverse().slice(0, 10).map((b, i) => (
                  <button
                    key={i}
                    className={styles.bookingItem}
                    onClick={() => handleSelectBooking(b)}
                  >
                    <span className={styles.bookingSlot}>{b.slotId}</span>
                    <span className={styles.bookingVehicle}>{b.vehicleNo}</span>
                    <span className={styles.bookingTime}>
                      {new Date(b.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Right: Decoded result ──────────────────────────── */}
        <div className={styles.resultPanel}>
          {decoded ? (
            <ScanResultCard decoded={decoded} />
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>
                <svg width="64" height="64" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24" opacity="0.3">
                  <rect x="3" y="3" width="7" height="7" rx="1" />
                  <rect x="14" y="3" width="7" height="7" rx="1" />
                  <rect x="3" y="14" width="7" height="7" rx="1" />
                  <rect x="14" y="14" width="3" height="3" rx="0.5" />
                  <rect x="18" y="18" width="3" height="3" rx="0.5" />
                  <rect x="14" y="18" width="3" height="3" rx="0.5" />
                  <rect x="18" y="14" width="3" height="3" rx="0.5" />
                </svg>
              </div>
              <h3 className={styles.emptyTitle}>Waiting for Scan...</h3>
              <p className={styles.emptyText}>
                Point your camera at a parking QR code or upload an image to view details
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
