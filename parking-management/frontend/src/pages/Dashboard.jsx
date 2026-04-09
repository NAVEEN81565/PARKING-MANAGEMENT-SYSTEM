/* Admin Dashboard – Enhanced with expiry tracking, fines, and real-time clock
 *
 * Shows:
 * - Real-time clock
 * - Car/Bike parking stats
 * - Expired bookings count + total fines (pending + collected)
 * - Recent activity table with expiry status and fine amounts
 */
import { useApp } from '../services/AppContext';
import StatCard from '../components/StatCard';
import ClockComponent from '../components/ClockComponent';
import AlertBanner from '../components/AlertBanner';
import BookingTable from '../components/BookingTable';
import styles from '../styles/shared.module.css';

export default function Dashboard() {
  const {
    stats, history, employees, freeSlot,
    activeBookings, expiredBookings, expiringBookings,
    totalPendingFines, totalCollectedFines,
    FINE_RATE_PER_HOUR,
  } = useApp();

  const todayHistory = history.filter(h => {
    const d = new Date(h.entryTime);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  const handleRelease = async (vehicleNo) => {
    if (!window.confirm(`Release vehicle ${vehicleNo}?`)) return;
    const result = await freeSlot(vehicleNo);
    if (result.success && result.fineAmount > 0) {
      alert(`Vehicle released. Fine: ₹${result.fineAmount}`);
    }
  };

  return (
    <div>
      {/* ── Page Header with Clock ────────────────────────── */}
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Admin Dashboard</h1>
          <p className={styles.pageSubtitle}>Live overview of parking operations & financials</p>
        </div>
        <ClockComponent />
      </div>

      {/* ── Expiry Alerts ─────────────────────────────────── */}
      {expiredBookings.length > 0 && (
        <AlertBanner type="danger" dismissible={false}>
          🚨 <strong>{expiredBookings.length} vehicle(s) have exceeded their exit time!</strong>{' '}
          Total pending fines: ₹{totalPendingFines} (₹{FINE_RATE_PER_HOUR}/hr)
        </AlertBanner>
      )}
      {expiringBookings.length > 0 && (
        <AlertBanner type="warning">
          ⚠️ <strong>{expiringBookings.length} booking(s) expiring within 30 minutes.</strong>
        </AlertBanner>
      )}

      {/* ── Car Parking Stats ─────────────────────────────── */}
      <p style={{ fontWeight: 700, marginBottom: 10, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🚗 Car Parking</p>
      <div className={styles.statsGrid}>
        <StatCard icon="🅿️" label="Total Car Slots"     value={stats.totalCar}     accent="primary" />
        <StatCard icon="✅" label="Available"            value={stats.availableCar} accent="success" />
        <StatCard icon="🚗" label="Occupied"             value={stats.occupiedCar}  accent="danger"  />
      </div>

      {/* ── Bike Parking Stats ────────────────────────────── */}
      <p style={{ fontWeight: 700, marginBottom: 10, marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>🏍️ Bike Parking</p>
      <div className={styles.statsGrid}>
        <StatCard icon="🅿️" label="Total Bike Slots"    value={stats.totalBike}     accent="primary" />
        <StatCard icon="✅" label="Available"            value={stats.availableBike} accent="success" />
        <StatCard icon="🏍️" label="Occupied"            value={stats.occupiedBike}  accent="danger"  />
      </div>

      {/* ── Operations & Finance Stats ────────────────────── */}
      <p style={{ fontWeight: 700, marginBottom: 10, marginTop: 8, color: 'var(--text-secondary)', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>📊 Operations & Finance</p>
      <div className={styles.statsGrid}>
        <StatCard icon="👥" label="Employees"            value={employees.length}       accent="primary" />
        <StatCard icon="📋" label="Total Records"        value={history.length}         accent="primary" />
        <StatCard icon="📅" label="Today's Activity"     value={todayHistory.length}     accent="success" subtitle="vehicles today" />
        <StatCard icon="⏰" label="Expired Bookings"     value={expiredBookings.length}  accent="danger" />
        <StatCard icon="💰" label="Pending Fines"        value={`₹${totalPendingFines}`} accent={totalPendingFines > 0 ? 'danger' : 'success'} />
        <StatCard icon="✅" label="Collected Fines"      value={`₹${totalCollectedFines}`} accent="warning" />
      </div>

      {/* ── Active Bookings with Expiry Info ──────────────── */}
      {activeBookings.length > 0 && (
        <div className={styles.card} style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
            <h3 style={{ fontWeight: 700 }}>⏱ Active Bookings ({activeBookings.length})</h3>
          </div>
          <BookingTable
            bookings={activeBookings}
            showEmployee={true}
            showFine={true}
            showActions={true}
            onRelease={handleRelease}
          />
        </div>
      )}

      {/* ── Recent Activity ───────────────────────────────── */}
      <div className={styles.card}>
        <h3 style={{ fontWeight: 700, marginBottom: 14 }}>📋 Recent Parking Activity</h3>
        <BookingTable
          bookings={history}
          showEmployee={true}
          showFine={true}
          maxRows={10}
        />
      </div>
    </div>
  );
}
