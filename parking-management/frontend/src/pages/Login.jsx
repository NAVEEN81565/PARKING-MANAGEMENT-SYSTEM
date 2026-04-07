/* Login – Role Selection Landing Page
 * Route: /login
 * Presents two cards for Admin and Employee login portals.
 * ROLE-BASED ROUTING: Each card navigates to its dedicated login page. */
import { Link } from 'react-router-dom';
import styles from './Auth.module.css';

export default function Login() {
  return (
    <div className={styles.page}>
      <div className={styles.card} style={{ maxWidth: 520 }}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🅿️</div>
          <span className={styles.logoText}>ParkSys</span>
        </div>
        <h1 className={styles.heading}>Welcome to ParkSys</h1>
        <p className={styles.subheading}>Smart Parking Management System — Choose your portal</p>

        <div className={styles.roleGrid}>
          {/* Admin Card */}
          <Link to="/admin-login" className={styles.roleCard} style={{ '--accent': 'var(--primary)' }}>
            <div className={styles.roleIcon} style={{ background: 'rgba(99,102,241,0.1)', color: 'var(--primary)' }}>
              🔐
            </div>
            <h3 className={styles.roleTitle}>Admin Login</h3>
            <p className={styles.roleDesc}>Manage employees, view all bookings, monitor fines & expiry</p>
            <span className={styles.roleArrow} style={{ color: 'var(--primary)' }}>Sign in →</span>
          </Link>

          {/* Employee Card */}
          <Link to="/employee-login" className={styles.roleCard} style={{ '--accent': 'var(--success)' }}>
            <div className={styles.roleIcon} style={{ background: 'rgba(16,185,129,0.1)', color: 'var(--success)' }}>
              👤
            </div>
            <h3 className={styles.roleTitle}>Employee Login</h3>
            <p className={styles.roleDesc}>Book parking slots, view your dashboard & pending fines</p>
            <span className={styles.roleArrow} style={{ color: 'var(--success)' }}>Sign in →</span>
          </Link>
        </div>

        <p className={styles.footer} style={{ marginTop: 28 }}>
          New employee?{' '}
          <Link to="/register" className={styles.link}>Register here</Link>
        </p>
      </div>
    </div>
  );
}
