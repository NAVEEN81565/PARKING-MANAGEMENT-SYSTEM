/* Layout.jsx – Teal Mobile-Inspired Sidebar + Topbar */
import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Users, ParkingSquare, ClipboardList,
  ScanLine, Menu, X, LogOut, User, ChevronRight,
} from 'lucide-react';
import { useApp } from '../services/AppContext';
import ClockComponent from './ClockComponent';
import ProfileModal from './ProfileModal';

const adminLinks = [
  { to: '/dashboard',   Icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/employees',   Icon: Users,            label: 'Employees' },
  { to: '/slots',       Icon: ParkingSquare,    label: 'Parking Slots' },
  { to: '/history',     Icon: ClipboardList,    label: 'All History' },
  { to: '/qr-scanner',  Icon: ScanLine,         label: 'QR Scanner' },
];

const employeeLinks = [
  { to: '/employee/dashboard', Icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/slots',              Icon: ParkingSquare,   label: 'Book Slot' },
  { to: '/history',            Icon: ClipboardList,   label: 'My History' },
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
  const navigate  = useNavigate();
  const location  = useLocation();

  const [collapsed,    setCollapsed]    = useState(window.innerWidth <= 1024);
  const [mobileOpen,   setMobileOpen]   = useState(false);
  const [profileOpen,  setProfileOpen]  = useState(false);

  useEffect(() => {
    const onResize = () => setCollapsed(window.innerWidth <= 1024);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  const links = user?.role === 'admin' ? adminLinks : employeeLinks;
  const title = pageTitles[location.pathname] || 'ParkSys';

  const handleLogout = () => { logout(); navigate('/login'); };

  const toggleSidebar = () => {
    if (window.innerWidth <= 768) setMobileOpen(p => !p);
    else setCollapsed(p => !p);
  };

  return (
    <div className="flex min-h-screen overflow-hidden" style={{ background: '#f0fafa' }}>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 bg-teal-950/40 backdrop-blur-sm md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <aside
        className={`
          fixed md:relative z-50 flex flex-col h-screen transition-all duration-300 ease-in-out shrink-0
          ${collapsed ? 'w-20' : 'w-64'}
          ${mobileOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
        style={{ background: 'linear-gradient(160deg, #0f9b8e 0%, #0b7a70 100%)' }}
      >
        {/* Logo */}
        <div className={`h-16 flex items-center shrink-0 border-b border-white/10 ${collapsed ? 'justify-center' : 'px-5 gap-3'}`}>
          <div className="h-9 w-9 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-inner shrink-0">
            <ParkingSquare size={20} strokeWidth={2.5} className="text-white" />
          </div>
          {!collapsed && (
            <span style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-xl tracking-tight text-white">
              ParkSys
            </span>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-5 px-2.5 space-y-1">
          {!collapsed && (
            <p className="px-3 mb-3 text-[10px] font-bold uppercase tracking-[0.15em] text-white/40">
              {user?.role === 'admin' ? 'Admin Panel' : 'Employee Panel'}
            </p>
          )}
          {links.map(({ to, Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              onClick={() => setMobileOpen(false)}
              title={collapsed ? label : undefined}
              className={({ isActive }) => `
                flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200
                ${isActive
                  ? 'bg-white text-teal-700 font-semibold shadow-md shadow-black/10'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'}
                ${collapsed ? 'justify-center' : ''}
              `}
            >
              {({ isActive }) => (
                <>
                  <Icon size={20} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-teal-600' : ''} />
                  {!collapsed && <span className="flex-1 text-sm">{label}</span>}
                  {!collapsed && isActive && <ChevronRight size={14} className="text-teal-400 opacity-60" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* User badge */}
        <div className="p-3 border-t border-white/10">
          <div
            onClick={() => setProfileOpen(true)}
            className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white/10 transition-colors ${collapsed ? 'justify-center' : ''}`}
          >
            <div className="h-9 w-9 shrink-0 rounded-full bg-white/20 ring-2 ring-white/30 flex items-center justify-center text-white font-bold text-sm overflow-hidden">
              {user?.avatar
                ? <img src={user.avatar} alt="Avatar" className="w-full h-full object-cover" />
                : user?.name?.charAt(0).toUpperCase()
              }
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-white truncate">{user?.name}</div>
                <div className="text-[11px] text-white/50 capitalize">{user?.role}</div>
              </div>
            )}
            {!collapsed && <User size={14} className="text-white/40" />}
          </div>
        </div>
      </aside>

      {/* ── Main ─────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">

        {/* Topbar */}
        <header className="h-16 shrink-0 bg-white border-b border-teal-100/80 flex items-center justify-between px-4 sm:px-6 z-10 shadow-sm">
          <div className="flex items-center gap-3">
            <button
              onClick={toggleSidebar}
              className="p-2 -ml-1 rounded-xl text-slate-500 hover:bg-teal-50 hover:text-teal-700 transition-colors"
              aria-label="Toggle sidebar"
            >
              {mobileOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
            <div className="hidden sm:flex flex-col">
              <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-base font-bold text-slate-800 leading-tight">{title}</h1>
              <p className="text-[11px] text-teal-600 font-medium">Parking Management System</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <ClockComponent />
            <div className="h-5 w-px bg-slate-200 hidden sm:block" />
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 transition-colors"
            >
              <LogOut size={16} />
              <span className="hidden sm:block">Logout</span>
            </button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6" style={{ background: '#f0fafa' }}>
          <div className="max-w-7xl mx-auto fade-in">
            <Outlet />
          </div>
        </main>
      </div>

      <ProfileModal isOpen={profileOpen} onClose={() => setProfileOpen(false)} />
    </div>
  );
}
