/* Register Page */
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '../services/AppContext';
import Alert from '../components/Alert';
import styles from './Auth.module.css';

export default function Register() {
  const { register } = useApp();
  const [form, setForm] = useState({ name: '', email: '', password: '', role: 'employee' });
  const [error, setError] = useState('');

  const handleChange = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.password)
      return setError('Please fill all fields');
    const result = register(form.name, form.email, form.password, form.role);
    if (!result.success) setError(result.message);
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.logo}>
          <div className={styles.logoIcon}>🅿️</div>
          <span className={styles.logoText}>ParkSys</span>
        </div>
        <h1 className={styles.heading}>Create Account</h1>
        <p className={styles.subheading}>Join the parking management system</p>

        <Alert type="error" message={error} onClose={() => setError('')} />

        <form className={styles.form} onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>Full Name</label>
            <input
              name="name"
              type="text"
              className={styles.input}
              placeholder="Your full name"
              value={form.name}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Email Address</label>
            <input
              name="email"
              type="email"
              className={styles.input}
              placeholder="you@parksys.com"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Password</label>
            <input
              name="password"
              type="password"
              className={styles.input}
              placeholder="••••••••"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Role</label>
            <select name="role" className={styles.select} value={form.role} onChange={handleChange}>
              <option value="employee">Employee</option>
            </select>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
              Only employee accounts can be self-registered.
            </span>
          </div>
          <button type="submit" className={styles.submitBtn}>Create Account →</button>
        </form>

        <p className={styles.footer}>
          Already have an account?{' '}
          <Link to="/login" className={styles.link}>Sign in</Link>
        </p>
      </div>
    </div>
  );
}
