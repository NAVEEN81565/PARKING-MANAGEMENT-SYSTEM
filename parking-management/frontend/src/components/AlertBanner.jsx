/* AlertBanner – Dismissible alert banners for expiry warnings
 * Variants: info (blue), warning (yellow), danger (red), success (green)
 * Shows icon + message + optional dismiss button */
import { useState } from 'react';
import styles from './AlertBanner.module.css';

const icons = {
  info:    'ℹ️',
  warning: '⚠️',
  danger:  '🚨',
  success: '✅',
};

export default function AlertBanner({ type = 'info', message, dismissible = true, children }) {
  const [visible, setVisible] = useState(true);

  if (!visible || (!message && !children)) return null;

  return (
    <div className={`${styles.banner} ${styles[type]}`}>
      <span className={styles.icon}>{icons[type]}</span>
      <span className={styles.text}>{message || children}</span>
      {dismissible && (
        <button className={styles.dismiss} onClick={() => setVisible(false)} aria-label="Dismiss">
          ✕
        </button>
      )}
    </div>
  );
}
