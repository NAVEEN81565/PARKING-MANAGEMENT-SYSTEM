/* BookingModal – Inline overlay modal for booking a parking slot
 *
 * ENHANCED with EXIT TIME selection:
 * - User selects a parking duration (30min, 1hr, 2hr, 3hr, 4hr, or Custom)
 * - The scheduled exit time is calculated from current time + selected duration
 * - This exit time is FIXED at booking and cannot be changed later
 * - Fines are calculated at ₹10/hr if the vehicle stays past this time
 */
import { useState, useEffect, useRef } from 'react';
import styles from './BookingModal.module.css';

const DURATION_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '1 hour', value: 60 },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
  { label: 'Custom',  value: 'custom' },
];

export default function BookingModal({ slot, onConfirm, onClose }) {
  const [vehicleNo, setVehicleNo]       = useState('');
  const [phone, setPhone]               = useState('');
  const [duration, setDuration]          = useState(120); // default 2 hours
  const [customMinutes, setCustomMinutes] = useState(90);
  const [error, setError]               = useState('');
  const [loading, setLoading]           = useState(false);
  const inputRef = useRef(null);

  // Auto-focus vehicle number input
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 120);
    return () => clearTimeout(t);
  }, []);

  // Close on Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  if (!slot) return null;

  const vehicleType = slot.type === 'car' ? 'Car' : 'Bike';
  const vehicleIcon = slot.type === 'car' ? '🚗' : '🏍️';

  // Calculate the scheduled exit time based on selected duration
  const getScheduledExitTime = () => {
    const mins = duration === 'custom' ? parseInt(customMinutes) || 30 : duration;
    const exitDate = new Date(Date.now() + mins * 60 * 1000);
    return exitDate.toISOString();
  };

  const getDisplayExitTime = () => {
    const mins = duration === 'custom' ? parseInt(customMinutes) || 30 : duration;
    const exitDate = new Date(Date.now() + mins * 60 * 1000);
    return exitDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = vehicleNo.trim().toUpperCase();
    if (!trimmed) { setError('Vehicle number is required.'); return; }
    if (trimmed.length < 3) { setError('Enter a valid vehicle number.'); return; }

    const finalMins = duration === 'custom' ? parseInt(customMinutes) : duration;
    if (!finalMins || finalMins < 15) { setError('Minimum parking duration is 15 minutes.'); return; }

    setLoading(true);
    await new Promise(r => setTimeout(r, 350)); // UX delay
    const scheduledExitTime = getScheduledExitTime();
    const result = onConfirm(slot.id, trimmed, slot.type, scheduledExitTime, phone.trim());
    setLoading(false);

    if (!result.success) {
      setError(result.message);
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose} role="dialog" aria-modal="true">
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.slotBadge}>
            <span className={styles.slotIcon}>{vehicleIcon}</span>
            <div>
              <span className={styles.slotIdText}>{slot.id}</span>
              <span className={styles.slotTypeText}>{vehicleType} Slot</span>
            </div>
          </div>
          <button className={styles.closeBtn} onClick={onClose} aria-label="Close modal">✕</button>
        </div>

        <div className={styles.divider} />

        {/* Status pill */}
        <div className={styles.statusRow}>
          <span className={styles.statusPill}>
            <span className={styles.statusDot} />
            Available
          </span>
          <span className={styles.hintText}>Press Esc to cancel</span>
        </div>

        {/* Form */}
        <form className={styles.form} onSubmit={handleSubmit} noValidate>
          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="vehicleNo">Vehicle Number</label>
            <input
              id="vehicleNo"
              ref={inputRef}
              className={styles.input}
              type="text"
              placeholder={slot.type === 'car' ? 'e.g. KA 01 AB 1234' : 'e.g. MH 12 XY 5678'}
              value={vehicleNo}
              onChange={e => { setVehicleNo(e.target.value.toUpperCase()); setError(''); }}
              maxLength={15}
              autoComplete="off"
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="phoneNo">
              Phone Number <span style={{ opacity: 0.5, fontWeight: 400, textTransform: 'none' }}>(optional)</span>
            </label>
            <input
              id="phoneNo"
              className={styles.input}
              type="tel"
              placeholder="e.g. 9876543210"
              value={phone}
              onChange={e => { setPhone(e.target.value.replace(/[^0-9+\- ]/g, '')); setError(''); }}
              maxLength={15}
              autoComplete="off"
            />
          </div>

          {/* ── EXIT TIME DURATION SELECTOR ────────────────── */}
          <div className={styles.formGroup}>
            <label className={styles.label}>Parking Duration (Exit Time)</label>
            <div className={styles.durationGrid}>
              {DURATION_OPTIONS.map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  className={`${styles.durationBtn} ${
                    duration === opt.value ? styles.durationActive : ''
                  }`}
                  onClick={() => { setDuration(opt.value); setError(''); }}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {/* Custom duration input */}
            {duration === 'custom' && (
              <div className={styles.customDuration}>
                <input
                  className={styles.input}
                  type="number"
                  min={15}
                  max={1440}
                  value={customMinutes}
                  onChange={e => setCustomMinutes(e.target.value)}
                  placeholder="Minutes"
                  style={{ width: 100 }}
                />
                <span className={styles.customLabel}>minutes</span>
              </div>
            )}

            {/* Display calculated exit time */}
            <div className={styles.exitTimePreview}>
              ⏱ Scheduled exit: <strong>{getDisplayExitTime()}</strong>
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label} htmlFor="vehicleType">Vehicle Type</label>
            <input
              id="vehicleType"
              className={`${styles.input} ${styles.readOnly}`}
              type="text"
              value={`${vehicleIcon} ${vehicleType}`}
              readOnly
            />
          </div>

          {error && (
            <div className={styles.errorBox}>
              <span>⚠️</span> {error}
            </div>
          )}

          <div className={styles.actions}>
            <button type="button" className={styles.btnCancel} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className={styles.btnBook} disabled={loading}>
              {loading ? (
                <><span className={styles.spinner} /> Booking…</>
              ) : (
                <><span>✓</span> Book Slot {slot.id}</>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
