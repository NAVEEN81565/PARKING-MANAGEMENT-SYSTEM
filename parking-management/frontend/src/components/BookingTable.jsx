/* BookingTable – Reusable table for displaying bookings
 * Color-coded rows:
 *   Green  = active (within time window)
 *   Yellow = expiring (within 30 minutes of exit)
 *   Red    = expired (past scheduled exit time)
 * Shows: Vehicle No, Slot, Entry/Exit Time, Remaining/Overage, Status, Fine */
import { useApp } from '../services/AppContext';
import styles from './BookingTable.module.css';
import sharedStyles from '../styles/shared.module.css';

const fmt = (date) => date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (date) => date ? new Date(date).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '—';

export default function BookingTable({
  bookings = [],
  showEmployee = false,
  showFine = true,
  showActions = false,
  onRelease,
  compact = false,
  maxRows,
}) {
  const { getBookingStatus, getRemainingTime, calculateFine } = useApp();

  const displayBookings = maxRows ? bookings.slice(0, maxRows) : bookings;

  if (displayBookings.length === 0) {
    return (
      <div className={sharedStyles.empty} style={{ padding: '30px 16px' }}>
        No bookings found.
      </div>
    );
  }

  return (
    <div className={sharedStyles.tableWrapper}>
      <table className={`${sharedStyles.table} ${styles.bookingTable}`}>
        <thead>
          <tr>
            <th>#</th>
            <th>Vehicle No</th>
            <th>Type</th>
            <th>Slot</th>
            {showEmployee && <th>Employee</th>}
            {!compact && <th>Date</th>}
            <th>Entry</th>
            <th>Sched. Exit</th>
            <th>Remaining</th>
            <th>Status</th>
            {showFine && <th>Fine</th>}
            {showActions && <th>Action</th>}
          </tr>
        </thead>
        <tbody>
          {displayBookings.map((h, i) => {
            const status = getBookingStatus(h);
            const remaining = getRemainingTime(h.scheduledExitTime);
            const fine = h.exitTime ? (h.fineAmount || 0) : calculateFine(h.scheduledExitTime);
            const rowClass = status === 'expired' ? styles.rowExpired
              : status === 'expiring' ? styles.rowExpiring
              : status === 'exited' ? styles.rowExited
              : styles.rowActive;

            return (
              <tr key={i} className={rowClass}>
                <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                <td><b>{h.vehicleNo}</b></td>
                <td style={{ textTransform: 'capitalize' }}>
                  {h.vehicleType === 'car' ? '🚗' : '🏍️'} {h.vehicleType}
                </td>
                <td>
                  <span className={`${sharedStyles.badge} ${sharedStyles.badgeBlue}`}>{h.slotId}</span>
                </td>
                {showEmployee && (
                  <td style={{ color: 'var(--text-secondary)' }}>{h.employeeName}</td>
                )}
                {!compact && (
                  <td style={{ color: 'var(--text-muted)' }}>{fmtDate(h.entryTime)}</td>
                )}
                <td>{fmt(h.entryTime)}</td>
                <td>{fmt(h.scheduledExitTime)}</td>
                <td className={styles.remainingCell}>
                  {h.exitTime ? (
                    <span className={styles.exitedText}>Exited</span>
                  ) : remaining ? (
                    <span className={remaining.overdue ? styles.overdueText : styles.remainingText}>
                      {remaining.text}
                    </span>
                  ) : '—'}
                </td>
                <td>
                  <span className={`${styles.statusBadge} ${styles[`status_${status}`]}`}>
                    {status === 'active' && '● Active'}
                    {status === 'expiring' && '◐ Expiring'}
                    {status === 'expired' && '✖ Expired'}
                    {status === 'exited' && '✓ Exited'}
                  </span>
                </td>
                {showFine && (
                  <td>
                    {fine > 0 ? (
                      <span className={styles.fineAmount}>₹{fine}</span>
                    ) : (
                      <span style={{ color: 'var(--text-muted)' }}>—</span>
                    )}
                  </td>
                )}
                {showActions && !h.exitTime && (
                  <td>
                    <button
                      className={sharedStyles.btnDanger}
                      onClick={() => onRelease?.(h.vehicleNo)}
                      style={{ fontSize: '0.75rem', padding: '5px 10px' }}
                    >
                      🏁 Release
                    </button>
                  </td>
                )}
                {showActions && h.exitTime && <td style={{ color: 'var(--text-muted)' }}>—</td>}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
