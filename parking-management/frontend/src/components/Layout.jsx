/* Layout.jsx – Sidebar + Topbar shell
 *
 * ROLE-BASED NAVIGATION:
 * Admin links:  Dashboard, Employees, Parking Slots, All History, QR Scanner
 * Employee links: My Dashboard, Parking Slots, My History
 *
 * VehicleEntry and VehicleExit have been REMOVED from employee navigation.
 * Employee now has a unified dashboard at /employee/dashboard.
 */
import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useApp } from '../services/AppContext';
import ClockComponent from './ClockComponent';
import ProfileModal from './ProfileModal';
import styles from './Layout.module.css';

const adminLinks = [
  { to: '/dashboard',   icon: '📊', label: 'Dashboard' },
  { to: '/employees',   icon: '👥', label: 'Employees' },
  { to: '/slots',       icon: '🅿️',  label: 'Parking Slots' },
  { to: '/history',     icon: '📋', label: 'All History' },
  { to: '/qr-scanner',  icon: '🔍', label: 'QR Scanner' },
];

/* Employee navigation – REMOVED Vehicle Entry & Exit
 * Replaced with Employee Dashboard with live slot view, alerts, fines */
const employeeLinks = [
  { to: '/employee/dashboard', icon: '📊', label: 'My Dashboard' },
  { to: '/slots',              icon: '🅿️',  label: 'Book Slot' },
  { to: '/history',            icon: '📋', label: 'My History' },
];

const pageTitles = {
  '/dashboard':          'Admin Dashboard',
  '/employees':          'Employee Management',
  '/slots':              'Parking Slots',
  '/history':            'Parking History',
  '/qr-scanner':         'QR Scanner',
  '/employee/dashboard': 'My Dashboard',
};

export default function Layout() {
  const { user, logout } = useApp();
  const navigate   = useNavigate();
  const location   = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;
  const title = pageTitles[location.pathname] || 'ParkSys';

  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <div className={styles.wrapper}>
      {/* Mobile Overlay */}
      <div
        className={`${styles.overlay} ${mobileOpen ? styles.show : ''}`}
        onClick={() => setMobileOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`${styles.sidebar} ${collapsed ? styles.collapsed : ''} ${mobileOpen ? styles.mobileOpen : ''}`}>
        <div className={styles.sidebarLogo}>
          <div className={styles.logoIcon}>🅿️</div>
          {!collapsed && <span className={styles.logoText}>ParkSys</span>}
        </div>

        <nav className={styles.nav}>
          {!collapsed && (
            <span className={styles.sectionLabel}>
              {user?.role === 'admin' ? 'Admin Panel' : 'Employee Panel'}
            </span>
          )}
          {links.map(link => (
            <NavLink
              key={link.to}
              to={link.to}
              className={({ isActive }) => `${styles.navLink} ${isActive ? styles.active : ''}`}
              onClick={() => setMobileOpen(false)}
            >
              <span className={styles.navIcon}>{link.icon}</span>
              {!collapsed && <span className={styles.navLabel}>{link.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className={styles.sidebarBottom}>
          <div className={styles.userBadge} onClick={() => setProfileOpen(true)}>
            <div className={styles.userAvatar}>
              {user?.avatar ? (
                <img src={user.avatar} alt="Avatar" style={{width: '100%', height: '100%', borderRadius: '8px', objectFit: 'cover'}} />
              ) : (
                user?.name?.charAt(0).toUpperCase()
              )}
            </div>
            {!collapsed && (
              <div className={styles.userInfo}>
                <div className={styles.userName}>{user?.name}</div>
                <div className={styles.userRole}>{user?.role}</div>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className={`${styles.main} ${collapsed ? styles.collapsed : ''}`}>
        {/* Topbar */}
        <header className={styles.topbar}>
          <div className={styles.topbarLeft}>
            <button className={styles.collapseBtn} onClick={() => { setCollapsed(p => !p); setMobileOpen(p => !p); }}>
              {collapsed || !mobileOpen ? '☰' : '✕'}
            </button>
            <span className={styles.topbarTitle}>{title}</span>
          </div>
          <div className={styles.topbarRight}>
            <ClockComponent compact={true} />
            <button className={styles.logoutBtn} onClick={handleLogout}>
              ⏻ Logout
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className={styles.content}>
          <Outlet />
        </main>
      </div>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
