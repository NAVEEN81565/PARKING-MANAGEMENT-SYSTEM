/* Parking History – Enhanced with expiry status, fines, and advanced filtering
 *
 * Admin view: all bookings with fine amounts, expiry status
 * Employee view: own bookings only
 *
 * Filters: type (car/bike), status (all/active/expired/exited)
 * Highlights overdue rows in red
 * CSV export includes new fine/expiry columns
 */
import { useState } from 'react';
import { useApp } from '../services/AppContext';
import styles from '../styles/shared.module.css';

const fmt = (date) => date ? new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = (date) => date ? new Date(date).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '—';

export default function ParkingHistory() {
  const { history, user, getBookingStatus, calculateFine, getRemainingTime, freeSlot } = useApp();
  const [typeFilter, setTypeFilter]     = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search, setSearch]             = useState('');
  const [startDate, setStartDate]       = useState('');
  const [endDate, setEndDate]           = useState('');

  // Employees only see their own history
  const base = user?.role === 'admin' ? history : history.filter(h => h.employeeId === user?.id);

  const filtered = base.filter(h => {
    const matchType = typeFilter === 'all' || h.vehicleType === typeFilter;

    // Status filter: active = still parked and not expired, expired = past exit time, exited = vehicle left
    const status = getBookingStatus(h);
    let matchStatus = true;
    if (statusFilter === 'active')  matchStatus = (status === 'active' || status === 'expiring');
    if (statusFilter === 'expired') matchStatus = (status === 'expired');
    if (statusFilter === 'exited')  matchStatus = (status === 'exited');

    const matchSearch = !search ||
      h.vehicleNo.toUpperCase().includes(search.toUpperCase()) ||
      h.slotId.includes(search.toUpperCase());

    let matchDate = true;
    if (startDate || endDate) {
      const entryDate = new Date(h.entryTime);
      entryDate.setHours(0,0,0,0);
      if (startDate) {
        const sDate = new Date(startDate);
        sDate.setHours(0,0,0,0);
        if (entryDate < sDate) matchDate = false;
      }
      if (endDate) {
        const eDate = new Date(endDate);
        eDate.setHours(0,0,0,0);
        if (entryDate > eDate) matchDate = false;
      }
    }

    return matchType && matchStatus && matchSearch && matchDate;
  });

  /* ── CSV Export with fine/expiry columns ────────────────── */
  const exportToCSV = () => {
    const headers = [
      'Vehicle No', 'Type', 'Slot',
      ...(user?.role === 'admin' ? ['Employee Name'] : []),
      'Date', 'Entry Time', 'Scheduled Exit', 'Actual Exit', 'Duration (min)',
      'Status', 'Fine (₹)'
    ];

    const csvRows = [headers.join(',')];

    filtered.forEach(h => {
      const status = getBookingStatus(h);
      const fine = h.exitTime ? (h.fineAmount || 0) : calculateFine(h.scheduledExitTime);
      const row = [
        h.vehicleNo,
        h.vehicleType,
        h.slotId,
        ...(user?.role === 'admin' ? [h.employeeName || ''] : []),
        fmtDate(h.entryTime),
        fmt(h.entryTime),
        fmt(h.scheduledExitTime),
        h.exitTime ? fmt(h.exitTime) : '',
        h.duration != null ? h.duration : '',
        status.charAt(0).toUpperCase() + status.slice(1),
        fine > 0 ? fine : 0,
      ];
      csvRows.push(row.map(cell => `"${cell}"`).join(','));
    });

    const csvContent = "data:text/csv;charset=utf-8," + csvRows.join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `parking_history_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleRelease = (vehicleNo) => {
    if (!window.confirm(`Release vehicle ${vehicleNo}?`)) return;
    const result = freeSlot(vehicleNo);
    if (result.success && result.fineAmount > 0) {
      alert(`Vehicle released. Fine: ₹${result.fineAmount}`);
    }
  };

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Parking History</h1>
          <p className={styles.pageSubtitle}>
            {user?.role === 'admin' ? 'Full log of all parking records with fines' : 'Your personal parking history'}
          </p>
        </div>
        <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 600 }}>
          {filtered.length} records
        </div>
      </div>

      {/* ── Filters ──────────────────────────────────────── */}
      <div className={styles.filterBar} style={{ alignItems: 'center' }}>
        <input
          className={styles.searchInput}
          placeholder="🔍  Search by vehicle no or slot..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ maxWidth: 260 }}
        />

        {user?.role === 'admin' && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>From:</span>
            <input
              type="date"
              className={styles.searchInput}
              style={{ minWidth: 130, padding: '7px 10px' }}
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
            />
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>To:</span>
            <input
              type="date"
              className={styles.searchInput}
              style={{ minWidth: 130, padding: '7px 10px' }}
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
            />
          </div>
        )}

        {/* Vehicle type filter */}
        {['all','car','bike'].map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${typeFilter === f ? styles.active : ''}`}
            onClick={() => setTypeFilter(f)}
          >
            {f === 'all' ? 'All Types' : f === 'car' ? '🚗 Cars' : '🏍️ Bikes'}
          </button>
        ))}

        {/* Status filter – updated with expired option */}
        {['all','active','expired','exited'].map(f => (
          <button
            key={f}
            className={`${styles.filterBtn} ${statusFilter === f ? styles.active : ''}`}
            onClick={() => setStatusFilter(f)}
            style={{ textTransform: 'capitalize' }}
          >
            {f === 'all' ? 'All Status' : f === 'active' ? '🟢 Active' : f === 'expired' ? '🔴 Expired' : '✅ Exited'}
          </button>
        ))}

        {user?.role === 'admin' && (
          <button
            className={styles.btnPrimary}
            style={{ marginLeft: 'auto', padding: '9px 16px' }}
            onClick={exportToCSV}
            title="Download CSV"
          >
            ⬇️ Export CSV
          </button>
        )}
      </div>

      {/* ── History Table ─────────────────────────────────── */}
      <div className={styles.card}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Vehicle No</th>
                <th>Type</th>
                <th>Slot</th>
                {user?.role === 'admin' && <th>Employee</th>}
                <th>Date</th>
                <th>Entry</th>
                <th>Sched. Exit</th>
                <th>Actual Exit</th>
                <th>Duration</th>
                <th>Status</th>
                <th>Fine</th>
                {user?.role === 'admin' && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="13" className={styles.empty}>No parking records found.</td></tr>
              ) : (
                filtered.map((h, i) => {
                  const status = getBookingStatus(h);
                  const fine = h.exitTime ? (h.fineAmount || 0) : calculateFine(h.scheduledExitTime);
                  const remaining = getRemainingTime(h.scheduledExitTime);

                  // Row background color based on status
                  const rowBg = status === 'expired' ? 'rgba(239,68,68,0.04)'
                    : status === 'expiring' ? 'rgba(245,158,11,0.04)'
                    : 'transparent';

                  return (
                    <tr key={i} style={{ background: rowBg }}>
                      <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                      <td><b>{h.vehicleNo}</b></td>
                      <td style={{ textTransform: 'capitalize' }}>
                        {h.vehicleType === 'car' ? '🚗 Car' : '🏍️ Bike'}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${styles.badgeBlue}`}>{h.slotId}</span>
                      </td>
                      {user?.role === 'admin' && (
                        <td style={{ color: 'var(--text-secondary)' }}>{h.employeeName}</td>
                      )}
                      <td style={{ color: 'var(--text-muted)' }}>{fmtDate(h.entryTime)}</td>
                      <td>{fmt(h.entryTime)}</td>
                      <td>{fmt(h.scheduledExitTime)}</td>
                      <td>{h.exitTime ? fmt(h.exitTime) : '—'}</td>
                      <td>
                        {h.duration != null ? `${h.duration} min` : h.exitTime ? '< 1 min' : (
                          remaining && !remaining.overdue ? remaining.text : '—'
                        )}
                      </td>
                      <td>
                        <span className={`${styles.badge} ${
                          status === 'expired' ? styles.badgeRed
                          : status === 'expiring' ? styles.badgeOrange
                          : status === 'exited' ? styles.badgeBlue
                          : styles.badgeGreen
                        }`}>
                          {status === 'active' && 'Active'}
                          {status === 'expiring' && 'Expiring'}
                          {status === 'expired' && 'Expired'}
                          {status === 'exited' && 'Exited'}
                        </span>
                      </td>
                      <td>
                        {fine > 0 ? (
                          <span style={{
                            display: 'inline-block',
                            padding: '2px 8px',
                            borderRadius: '8px',
                            background: 'var(--danger-light)',
                            color: 'var(--danger)',
                            fontWeight: 700,
                            fontSize: '0.78rem',
                          }}>₹{fine}</span>
                        ) : (
                          <span style={{ color: 'var(--text-muted)' }}>—</span>
                        )}
                      </td>
                      {user?.role === 'admin' && (
                        <td>
                          {!h.exitTime ? (
                            <button
                              className={styles.btnDanger}
                              onClick={() => handleRelease(h.vehicleNo)}
                              style={{ fontSize: '0.72rem', padding: '4px 10px' }}
                            >
                              🏁 Release
                            </button>
                          ) : (
                            <span style={{ color: 'var(--text-muted)' }}>—</span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
