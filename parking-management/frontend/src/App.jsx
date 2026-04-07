/* App.jsx – Root routing with role-based protection
 *
 * ROLE-BASED ROUTING:
 * /login            → Role selection landing page
 * /admin-login      → Admin login → redirects to /dashboard
 * /employee-login   → Employee login → redirects to /employee/dashboard
 * /register         → New employee registration
 *
 * PROTECTED ROUTES:
 * Admin:    /dashboard, /employees, /qr-scanner (adminOnly)
 * Employee: /employee/dashboard (employeeOnly)
 * Shared:   /slots, /history (any authenticated user)
 *
 * REMOVED: /entry (VehicleEntry), /exit (VehicleExit)
 */
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './services/AppContext';
import Layout            from './components/Layout';
import Login             from './pages/Login';
import AdminLogin        from './pages/AdminLogin';
import EmployeeLogin     from './pages/EmployeeLogin';
import Register          from './pages/Register';
import Dashboard         from './pages/Dashboard';
import EmployeeDashboard from './pages/EmployeeDashboard';
import EmployeeMgmt      from './pages/EmployeeMgmt';
import ParkingSlots      from './pages/ParkingSlots';
import ParkingHistory    from './pages/ParkingHistory';
import QRScanner         from './pages/QRScanner';

/** Redirect to login if not authenticated.
 *  adminOnly  = only admin can access
 *  employeeOnly = only employee can access */
const PrivateRoute = ({ children, adminOnly = false, employeeOnly = false }) => {
  const { user } = useApp();
  if (!user) return <Navigate to="/login" replace />;
  if (adminOnly && user.role !== 'admin') return <Navigate to="/employee/dashboard" replace />;
  if (employeeOnly && user.role !== 'employee') return <Navigate to="/dashboard" replace />;
  return children;
};

const AppRoutes = () => {
  const { user } = useApp();

  // Helper: where to redirect an already-logged-in user
  const getHomeRoute = () => {
    if (!user) return '/login';
    return user.role === 'admin' ? '/dashboard' : '/employee/dashboard';
  };

  return (
    <Routes>
      {/* ── Public Auth Routes ──────────────────────────── */}
      <Route path="/login"          element={user ? <Navigate to={getHomeRoute()} /> : <Login />} />
      <Route path="/admin-login"    element={user ? <Navigate to={getHomeRoute()} /> : <AdminLogin />} />
      <Route path="/employee-login" element={user ? <Navigate to={getHomeRoute()} /> : <EmployeeLogin />} />
      <Route path="/register"       element={user ? <Navigate to={getHomeRoute()} /> : <Register />} />

      {/* ── Protected Layout-Wrapped Routes ─────────────── */}
      <Route element={<Layout />}>
        {/* Admin-only routes */}
        <Route path="/dashboard" element={
          <PrivateRoute adminOnly={true}><Dashboard /></PrivateRoute>
        } />
        <Route path="/employees" element={
          <PrivateRoute adminOnly={true}><EmployeeMgmt /></PrivateRoute>
        } />
        <Route path="/qr-scanner" element={
          <PrivateRoute adminOnly={true}><QRScanner /></PrivateRoute>
        } />

        {/* Employee-only routes */}
        <Route path="/employee/dashboard" element={
          <PrivateRoute employeeOnly={true}><EmployeeDashboard /></PrivateRoute>
        } />

        {/* Shared routes (any authenticated user) */}
        <Route path="/slots" element={
          <PrivateRoute><ParkingSlots /></PrivateRoute>
        } />
        <Route path="/history" element={
          <PrivateRoute><ParkingHistory /></PrivateRoute>
        } />
      </Route>

      {/* ── Catch-all redirect ──────────────────────────── */}
      <Route path="*" element={<Navigate to={getHomeRoute()} />} />
    </Routes>
  );
};

export default function App() {
  return (
    <AppProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AppProvider>
  );
}
