import styles from '../pages/QRScanner.module.css';
import { useApp } from '../services/AppContext';

export default function ScanResultCard({ decoded }) {
  const { getBookingStatus, calculateFine } = useApp();
  
  if (!decoded) return null;

  // Re-calculate the current status from the decoded QR data
  const statusType = getBookingStatus(decoded);
  const fine = calculateFine(decoded.exitTime || decoded.scheduledExitTime);

  let statusBadge = null;
  if (statusType === 'active') {
    statusBadge = <span className={styles.badgeActive}>✅ Active</span>;
  } else if (statusType === 'expiring') {
    statusBadge = <span className={styles.badgeExpiring}>⚠️ Expiring Soon</span>;
  } else if (statusType === 'expired') {
    statusBadge = <span className={styles.badgeExpired}>❌ Expired</span>;
  } else if (statusType === 'exited') {
    statusBadge = <span className={styles.badgeExited}>🏁 Exited</span>;
  }

  return (
    <div className={styles.resultCard}>
      <div className={styles.resultHeader}>
        <div className={styles.resultBadge}>
          <span className={styles.resultIcon}>
            {decoded.vehicleType === 'car' ? '🚗' : '🏍️'}
          </span>
          <div>
            <span className={styles.resultSlot}>{decoded.slotId}</span>
            <span className={styles.resultType}>
              {decoded.vehicleType === 'car' ? 'Car' : 'Bike'} Parking
            </span>
          </div>
        </div>
        {statusBadge}
      </div>

      <div className={styles.resultDivider} />

      <div className={styles.resultGrid}>
        <ResultField label="Employee ID" value={decoded.empId} />
        <ResultField label="Employee Name" value={decoded.empName || '—'} />
        <ResultField label="Phone Number" value={decoded.empPhone || 'N/A'} />
        <ResultField label="Vehicle Number" value={decoded.vehicleNo} highlight />
        <ResultField label="Vehicle Type" value={decoded.vehicleType === 'car' ? '🚗 Car' : '🏍️ Bike'} />
        <ResultField label="Slot Number" value={decoded.slotId} highlight />
        <ResultField
          label="Entry Time"
          value={decoded.entryTime ? new Date(decoded.entryTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : '—'}
        />
        <ResultField
          label="Exit Time"
          value={decoded.exitTime ? new Date(decoded.exitTime).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' }) : 'Still Parked'}
        />
        {fine > 0 && (
          <ResultField
            label="Pending Fine"
            value={`₹${fine}`}
            highlight
          />
        )}
      </div>

      <div className={styles.resultDivider} />

      <div className={styles.resultFooter}>
        <span className={styles.footerLabel}>Raw Data Overview:</span>
        <pre className={styles.rawJson}>{JSON.stringify(decoded, null, 2)}</pre>
      </div>
    </div>
  );
}

function ResultField({ label, value, highlight = false }) {
  return (
    <div className={styles.resultField}>
      <span className={styles.fieldLabel}>{label}</span>
      <span className={`${styles.fieldValue} ${highlight ? styles.fieldHighlight : ''}`}>{value}</span>
    </div>
  );
}
