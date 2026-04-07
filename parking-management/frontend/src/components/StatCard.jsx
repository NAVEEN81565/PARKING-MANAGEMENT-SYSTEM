/* StatCard – metric highlight card */
import styles from './StatCard.module.css';

export default function StatCard({ icon, label, value, accent = 'primary', subtitle }) {
  return (
    <div className={`${styles.card} ${styles[accent]}`}>
      <div className={styles.iconBox}>{icon}</div>
      <div className={styles.info}>
        <p className={styles.label}>{label}</p>
        <h3 className={styles.value}>{value}</h3>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
      </div>
    </div>
  );
}
