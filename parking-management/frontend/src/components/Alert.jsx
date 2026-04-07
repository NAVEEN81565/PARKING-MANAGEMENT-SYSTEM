/* Reusable Alert / Toast-style notification */
import styles from './Alert.module.css';

export default function Alert({ type = 'success', message, onClose }) {
  if (!message) return null;
  return (
    <div className={`${styles.alert} ${styles[type]} animate-fade-in`}>
      <span className={styles.icon}>{type === 'success' ? '✅' : '❌'}</span>
      <span className={styles.text}>{message}</span>
      {onClose && <button className={styles.close} onClick={onClose}>✕</button>}
    </div>
  );
}
