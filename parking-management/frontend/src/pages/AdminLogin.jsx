/* AdminLogin – Dedicated admin login page with admin branding
 * Route: /admin-login
 * On success, redirects to /dashboard (admin dashboard) */
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../services/AppContext';
import Alert from '../components/Alert';
import styles from './Auth.module.css';

export default function AdminLogin() {
  const { login } = useApp();
  const navigate = useNavigate();
  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await login(email.trim(), password);
    if (result.success) {
      if (result.role !== 'admin') {
        setError('This login is for administrators only. Please use the Employee login.');
        return;
      }
      navigate('/dashboard');
    } else {
      setError(result.message);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        {/* Admin badge */}
        <div className={styles.roleBadge} style={{ background: 'rgba(99,102,241,0.08)', color: 'var(--primary)' }}>
          🔐 Admin Portal
        </div>

        <div className={styles.logo}>
          <div className={styles.logoIcon}>🅿️</div>
          <span className={styles.logoText}>ParkSys</span>
        </div>
        <h1 className={styles.heading}>Admin Login</h1>
        <p className={styles.subheading}>Sign in as administrator to manage the parking system</p>

        <Alert type="error" message={error} onClose={() => setError('')} />

        <div className={styles.hint} style={{ marginBottom: '16px' }}>
          <b>Admin Credentials:</b><br/>
          admin@parksys.com / admin123
        </div>

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              type="email"
              className={styles.input}
              placeholder="admin@parksys.com"
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
          <button type="submit" className={styles.submitBtn}>Sign In as Admin →</button>
        </form>

        <p className={styles.footer}>
          Not an admin?{' '}
          <Link to="/employee-login" className={styles.link}>Employee Login</Link>
          {' · '}
          <Link to="/login" className={styles.link}>Back</Link>
        </p>
      </div>
    </div>
  );
}
