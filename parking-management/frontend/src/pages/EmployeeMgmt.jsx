/* Employee Management – Add, search, delete employees (Admin only) */
import { useState } from 'react';
import { useApp } from '../services/AppContext';
import Alert from '../components/Alert';
import styles from '../styles/shared.module.css';

export default function EmployeeMgmt() {
  const { employees, addEmployee, deleteEmployee } = useApp();
  const [form, setForm]       = useState({ name: '', email: '', password: 'emp123' });
  const [search, setSearch]   = useState('');
  const [alert, setAlert]     = useState(null);

  const showAlert = (type, text) => {
    setAlert({ type, text });
    setTimeout(() => setAlert(null), 4000);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!form.name || !form.email) return;
    if (form.password.length < 6) {
      showAlert('error', 'Password must be at least 6 characters.');
      return;
    }
    const result = await addEmployee(form.name.trim(), form.email.trim().toLowerCase(), form.password);
    if (result.success) {
      showAlert('success', `Employee "${form.name}" added. They can log in with their email and the password you set.`);
      setForm({ name: '', email: '', password: 'emp123' });
    } else {
      showAlert('error', result.message);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove employee "${name}"?`)) return;
    await deleteEmployee(id);
    showAlert('success', `Employee "${name}" removed.`);
  };

  const filtered = employees.filter(e =>
    e.name.toLowerCase().includes(search.toLowerCase()) ||
    e.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div>
      <div className={styles.pageHeader}>
        <div>
          <h1 className={styles.pageTitle}>Employee Management</h1>
          <p className={styles.pageSubtitle}>Add, search, and manage employee accounts</p>
        </div>
      </div>

      {alert && <Alert type={alert.type} message={alert.text} onClose={() => setAlert(null)} />}

      {/* Add Employee Form */}
      <div className={styles.card} style={{ marginBottom: 24 }}>
        <h3 style={{ fontWeight: 700, marginBottom: 16 }}>➕ Add New Employee</h3>
        <form className={styles.form} onSubmit={handleAdd}>
          <div className={styles.formRow}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Full Name</label>
              <input
                className={styles.input}
                placeholder="Full name"
                value={form.name}
                onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Email Address</label>
              <input
                type="email"
                className={styles.input}
                placeholder="employee@parksys.com"
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                required
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Initial Password</label>
              <input
                type="text"
                className={styles.input}
                placeholder="min 6 characters"
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                required
              />
            </div>
          </div>
          <div>
            <button type="submit" className={styles.btnPrimary}>👤 Add Employee</button>
          </div>
        </form>
      </div>

      {/* Employee List */}
      <div className={styles.card}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
          <h3 style={{ fontWeight: 700 }}>👥 Employee List ({filtered.length})</h3>
        </div>

        <div className={styles.filterBar}>
          <input
            className={styles.searchInput}
            placeholder="🔍  Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan="5" className={styles.empty}>No employees found.</td></tr>
              ) : (
                filtered.map((emp, i) => (
                  <tr key={emp.id}>
                    <td style={{ color: 'var(--text-muted)' }}>{i + 1}</td>
                    <td><b>{emp.name}</b></td>
                    <td style={{ color: 'var(--text-secondary)' }}>{emp.email}</td>
                    <td>
                      <span className={`${styles.badge} ${styles.badgeBlue}`}>{emp.role}</span>
                    </td>
                    <td>
                      <button
                        className={styles.btnDanger}
                        onClick={() => handleDelete(emp.id, emp.name)}
                      >
                        🗑 Remove
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
