/* EmployeeDashboard – Replaces VehicleEntry + VehicleExit
 *
 * Sections:
 * 1. Real-time clock + available slot summary
 * 2. Expiry alerts (yellow/red banners for nearing/expired bookings)
 * 3. Pending fines panel (employee's own expired bookings with fine amounts)
 * 4. Recent bookings table with remaining time countdown
 * 5. Quick book button to navigate to /slots
 */
import { useNavigate } from 'react-router-dom';
import { useApp } from '../services/AppContext';
import ClockComponent from '../components/ClockComponent';
import AlertBanner from '../components/AlertBanner';
import BookingTable from '../components/BookingTable';
import StatCard from '../components/StatCard';
import styles from './EmployeeDashboard.module.css';
import sharedStyles from '../styles/shared.module.css';

export default function EmployeeDashboard() {
  const {
    user, stats, history, freeSlot,
    getBookingStatus, calculateFine, getRemainingTime,
    FINE_RATE_PER_HOUR,
  } = useApp();
  const navigate = useNavigate();

  // Filter bookings for this employee only
  const myBookings = history.filter(h => h.employeeId === user?.id);
  const myActive   = myBookings.filter(h => !h.exitTime);
  const myExpired  = myActive.filter(h => getBookingStatus(h) === 'expired');
  const myExpiring = myActive.filter(h => getBookingStatus(h) === 'expiring');

  // Pending fines for this employee
  const pendingFineTotal = myExpired.reduce((sum, h) => sum + calculateFine(h.scheduledExitTime), 0);
  // Past fines (already exited with fine)
  const paidFineTotal = myBookings
    .filter(h => h.exitTime && h.fineAmount > 0)
    .reduce((sum, h) => sum + h.fineAmount, 0);

  const handleRelease = (vehicleNo) => {
    if (!window.confirm(`Release vehicle ${vehicleNo}? Fine will be calculated if overdue.`)) return;
    const result = freeSlot(vehicleNo);
    if (result.success && result.fineAmount > 0) {
      alert(`Vehicle released from Slot ${result.slotId}.\nFine charged: ₹${result.fineAmount} (${Math.ceil(result.fineAmount / FINE_RATE_PER_HOUR)} hour(s) overtime)`);
    }
  };

  return (
    <div>
      {/* ── Header with clock ─────────────────────────────── */}
      <div className={sharedStyles.pageHeader}>
        <div>
          <h1 className={sharedStyles.pageTitle}>My Dashboard</h1>
          <p className={sharedStyles.pageSubtitle}>
            Welcome back, <strong>{user?.name}</strong> — here's your parking overview
          </p>
        </div>
        <ClockComponent />
      </div>

      {/* ── Expiry Alert Banners ──────────────────────────── */}
      {myExpired.length > 0 && (
        <AlertBanner type="danger" dismissible={false}>
          🚨 <strong>{myExpired.length} booking(s) have EXPIRED!</strong> Fines accruing
          at ₹{FINE_RATE_PER_HOUR}/hour. Release vehicles immediately to minimize fines.
        </AlertBanner>
      )}
      {myExpiring.length > 0 && (
        <AlertBanner type="warning">
          ⚠️ <strong>{myExpiring.length} booking(s) expiring within 30 minutes.</strong> Consider
          extending or releasing the vehicle soon.
        </AlertBanner>
      )}

      {/* ── Stat Cards ────────────────────────────────────── */}
      <div className={sharedStyles.statsGrid}>
        <StatCard icon="🚗" label="Free Car Slots"  value={stats.availableCar}  accent="success" subtitle={`of ${stats.totalCar}`} />
        <StatCard icon="🏍️" label="Free Bike Slots" value={stats.availableBike} accent="success" subtitle={`of ${stats.totalBike}`} />
        <StatCard icon="📋" label="My Active Bookings" value={myActive.length}  accent="primary" />
        <StatCard icon="💰" label="Pending Fines"  value={`₹${pendingFineTotal}`} accent={pendingFineTotal > 0 ? 'danger' : 'success'} />
      </div>

      {/* ── Quick Book Button ─────────────────────────────── */}
      <div className={styles.quickActions}>
        <button className={styles.quickBookBtn} onClick={() => navigate('/slots')}>
          <span className={styles.quickBookIcon}>🅿️</span>
          <span>Book a Parking Slot</span>
          <span className={styles.quickBookArrow}>→</span>
        </button>
      </div>

      {/* ── Pending Fines Section ─────────────────────────── */}
      {pendingFineTotal > 0 && (
        <div className={`${sharedStyles.card} ${styles.fineCard}`} style={{ marginBottom: 20 }}>
          <div className={styles.fineHeader}>
            <h3 style={{ fontWeight: 700 }}>💰 Pending Fines</h3>
            <span className={styles.fineTotalBadge}>Total: ₹{pendingFineTotal}</span>
          </div>
          <p className={styles.fineSubtext}>
            Fines accrue at ₹{FINE_RATE_PER_HOUR}/hour for each hour (or partial hour) past the scheduled exit time.
          </p>
          <div className={styles.fineList}>
            {myExpired.map((h, i) => {
              const fine = calculateFine(h.scheduledExitTime);
              const remaining = getRemainingTime(h.scheduledExitTime);
              return (
                <div key={i} className={styles.fineItem}>
                  <div className={styles.fineItemLeft}>
                    <span className={styles.fineVehicle}>{h.vehicleNo}</span>
                    <span className={styles.fineSlot}>Slot {h.slotId}</span>
                  </div>
                  <div className={styles.fineItemCenter}>
                    <span className={styles.fineOverdue}>{remaining?.text}</span>
                  </div>
                  <div className={styles.fineItemRight}>
                    <span className={styles.fineAmountLarge}>₹{fine}</span>
                    <button
                      className={sharedStyles.btnDanger}
                      onClick={() => handleRelease(h.vehicleNo)}
                      style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                    >
                      🏁 Release Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Active Bookings Table ─────────────────────────── */}
      <div className={sharedStyles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 700 }}>📋 My Active Bookings</h3>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
            {myActive.length} active
          </span>
        </div>
        <BookingTable
          bookings={myActive}
          showFine={true}
          showActions={true}
          onRelease={handleRelease}
          compact={true}
        />
      </div>

      {/* ── Recent History ────────────────────────────────── */}
      {myBookings.filter(h => h.exitTime).length > 0 && (
        <div className={sharedStyles.card} style={{ marginTop: 20 }}>
          <h3 style={{ fontWeight: 700, marginBottom: 14 }}>🕒 Recent History</h3>
          <BookingTable
            bookings={myBookings.filter(h => h.exitTime)}
            showFine={true}
            compact={true}
            maxRows={5}
          />
        </div>
      )}
    </div>
  );
}
