/* ClockComponent – Real-time digital clock with date display
 * Uses useState + setInterval(1000ms) for live updates.
 * Shows current date, time with seconds, and a pulsing dot indicator. */
import { useState, useEffect } from 'react';
import styles from './ClockComponent.module.css';

export default function ClockComponent({ compact = false }) {
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });

  if (compact) {
    return (
      <div className={styles.compact}>
        <span className={styles.pulse} />
        <span className={styles.compactTime}>{timeStr}</span>
      </div>
    );
  }

  return (
    <div className={styles.clock}>
      <div className={styles.timeRow}>
        <span className={styles.pulse} />
        <span className={styles.time}>{timeStr}</span>
      </div>
      <span className={styles.date}>{dateStr}</span>
    </div>
  );
}
