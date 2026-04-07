/* SlotGrid – renders a grid of clickable parking slot cards */
import styles from './SlotGrid.module.css';

/* ── SlotCard: individual slot tile ───────────────────────────── */
function SlotCard({ slot, onSlotClick, selectedSlotId }) {
  const isOccupied = slot.isOccupied;
  const isSelected = selectedSlotId === slot.id;
  const vehicleIcon = slot.type === 'car' ? '🚗' : '🏍️';

  const handleClick = () => {
    if (isOccupied) return; // Occupied slots are non-clickable
    onSlotClick && onSlotClick(slot);
  };

  return (
    <div
      className={`
        ${styles.slot}
        ${isOccupied ? styles.occupied : styles.free}
        ${isSelected ? styles.selected : ''}
        ${!isOccupied ? styles.clickable : ''}
      `}
      onClick={handleClick}
      title={
        isOccupied
          ? `Occupied by: ${slot.record?.vehicleNo} (click disabled)`
          : `Click to book Slot ${slot.id}`
      }
      role={!isOccupied ? 'button' : undefined}
      aria-label={
        isOccupied
          ? `Slot ${slot.id}: occupied by ${slot.record?.vehicleNo}`
          : `Slot ${slot.id}: available, click to book`
      }
      tabIndex={!isOccupied ? 0 : -1}
      onKeyDown={!isOccupied ? (e) => { if (e.key === 'Enter' || e.key === ' ') handleClick(); } : undefined}
    >
      <span className={styles.slotId}>{slot.id}</span>
      <span className={styles.slotStatus}>
        {isOccupied ? vehicleIcon : '✓'}
      </span>
      {isOccupied ? (
        <span className={styles.vehicleNo}>{slot.record?.vehicleNo}</span>
      ) : (
        <span className={styles.freeLabel}>Free</span>
      )}
      {isSelected && <span className={styles.selectedRing} />}
    </div>
  );
}

/* ── SlotGrid: section of slots ──────────────────────────────── */
export default function SlotGrid({ slots, title, icon, onSlotClick, selectedSlotId }) {
  return (
    <div className={styles.section}>
      <h3 className={styles.sectionTitle}>{icon} {title}</h3>
      <div className={styles.grid}>
        {slots.map(slot => (
          <SlotCard
            key={slot.id}
            slot={slot}
            onSlotClick={onSlotClick}
            selectedSlotId={selectedSlotId}
          />
        ))}
      </div>
      <div className={styles.legend}>
        <span className={styles.legendFree}>
          <span className={styles.legendDot} style={{ background: 'var(--success)' }} />
          Free: {slots.filter(s => !s.isOccupied).length}
        </span>
        <span className={styles.legendOcc}>
          <span className={styles.legendDot} style={{ background: 'var(--danger)' }} />
          Occupied: {slots.filter(s => s.isOccupied).length}
        </span>
        {onSlotClick && (
          <span className={styles.legendHint}>↑ Click a free slot to book</span>
        )}
      </div>
    </div>
  );
}
