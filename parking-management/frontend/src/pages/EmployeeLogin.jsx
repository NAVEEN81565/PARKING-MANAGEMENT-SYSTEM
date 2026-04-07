/* EmployeeLogin – Dedicated employee login page
 * Route: /employee-login
 * On success, redirects to /employee/dashboard */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../services/AppContext';
import Alert from '../components/Alert';
import styles from './Auth.module.css';

export default function EmployeeLogin() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const result = login(email.trim(), password);
    if (result.success) {
      if (result.role !== 'employee') {
        setError('This login is for employees only. Please use the Admin login.');
        return;
      }
      navigate('/employee/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Employee badge */}
        <div className={styles.roleBadge} style={{ background: 'rgba(16,185,129,0.08)', color: 'var(--success)' }}>
          👤 Employee Portal
        </div>

        <div className={styles.logo}>
          <div className={styles.logoIcon}>🅿️</div>
          <span className={styles.logoText}>ParkSys</span>
        </div>
        <h1 className={styles.heading}>Employee Login</h1>
        <p className={styles.subheading}>Sign in to book parking slots and view your dashboard</p>

        <Alert type="error" message={error} onClose={() => setError('')} />

        <div className={styles.hint} style={{ marginBottom: '16px', background: 'var(--success-light)', borderColor: 'var(--success)', color: '#065f46' }}>
          <b>Employee Credentials:</b><br/>
          alice@parksys.com / emp123<br/>
          bob@parksys.com / emp123
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              placeholder="you@parksys.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
          </div>
          <button type="submit" className={styles.submitBtn} style={{ background: 'var(--success)' }}>
            Sign In as Employee →
          </button>
        </form>

        <p className={styles.footer}>
          <Link to="/register" className={styles.link}>Register as new employee</Link>
          {' · '}
          <Link to="/admin-login" className={styles.link}>Admin Login</Link>
          {' · '}
          <Link to="/login" className={styles.link}>Back</Link>
        </p>
      </div>
    </div>
  );
}
