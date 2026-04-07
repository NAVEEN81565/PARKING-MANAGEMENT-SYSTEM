/**
 * AppContext.jsx – Global state management for the Smart Parking System
 *
 * KEY FEATURES:
 * - Role-based authentication (admin / employee) with localStorage persistence
 * - Parking slot management (car A01–A30, bike B01–B20)
 * - Booking with FIXED EXIT TIME set at booking time
 * - Real-time expiry tracking using setInterval (1-second tick)
 * - Fine calculation: ₹10 per hour (or partial hour) after scheduled exit time
 * - Full localStorage persistence for bookings/history
 */
import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

/* ─── Constants ─────────────────────────────────────────────── */
const TOTAL_CAR_SLOTS  = 30; // Slots A01–A30
const TOTAL_BIKE_SLOTS = 20; // Slots B01–B20
const FINE_RATE_PER_HOUR = 10; // ₹10 per hour after expiry

/** Build initial slot arrays */
const buildSlots = (prefix, count) =>
  Array.from({ length: count }, (_, i) => ({
    id:         `${prefix}${String(i + 1).padStart(2, '0')}`,
    type:       prefix === 'A' ? 'car' : 'bike',
    isOccupied: false,
    record:     null,
  }));

const initialEmployees = [
  { id: 'emp-001', name: 'Alice Johnson', email: 'alice@parksys.com', role: 'employee' },
  { id: 'emp-002', name: 'Bob Smith',    email: 'bob@parksys.com',   role: 'employee' },
];

/* ────────────────────────────────────────────────────────────
 * FINE CALCULATION LOGIC
 * ────────────────────────────────────────────────────────────
 * Fine is charged when current time exceeds the scheduledExitTime.
 * Calculation: Math.ceil(overtimeHours) × FINE_RATE_PER_HOUR
 * e.g., 15 minutes over = 1 hour × ₹10 = ₹10
 *       2.5 hours over  = 3 hours × ₹10 = ₹30
 * ──────────────────────────────────────────────────────────── */
const calculateFine = (scheduledExitTime) => {
  if (!scheduledExitTime) return 0;
  const now = new Date();
  const exit = new Date(scheduledExitTime);
  if (now <= exit) return 0;
  const overtimeMs = now - exit;
  const overtimeHours = overtimeMs / (1000 * 60 * 60);
  return Math.ceil(overtimeHours) * FINE_RATE_PER_HOUR;
};

/* ────────────────────────────────────────────────────────────
 * BOOKING STATUS LOGIC
 * ────────────────────────────────────────────────────────────
 * 'active'   – booking is within its time window
 * 'expiring' – booking exits within the next 30 minutes
 * 'expired'  – current time has passed the scheduled exit
 * 'exited'   – vehicle has already left (exitTime is set)
 * ──────────────────────────────────────────────────────────── */
const getBookingStatus = (booking) => {
  if (booking.exitTime) return 'exited';
  if (!booking.scheduledExitTime) return 'active';
  const now = new Date();
  const exit = new Date(booking.scheduledExitTime);
  const diffMs = exit - now;
  if (diffMs <= 0) return 'expired';
  if (diffMs <= 30 * 60 * 1000) return 'expiring'; // within 30 minutes
  return 'active';
};

/** Get remaining time in human-readable form */
const getRemainingTime = (scheduledExitTime) => {
  if (!scheduledExitTime) return null;
  const now = new Date();
  const exit = new Date(scheduledExitTime);
  const diffMs = exit - now;
  if (diffMs <= 0) {
    const overMs = Math.abs(diffMs);
    const overHrs = Math.floor(overMs / 3600000);
    const overMins = Math.floor((overMs % 3600000) / 60000);
    return { overdue: true, hours: overHrs, minutes: overMins, text: `Overdue by ${overHrs}h ${overMins}m` };
  }
  const hrs = Math.floor(diffMs / 3600000);
  const mins = Math.floor((diffMs % 3600000) / 60000);
  const secs = Math.floor((diffMs % 60000) / 1000);
  return { overdue: false, hours: hrs, minutes: mins, seconds: secs, text: `${hrs}h ${mins}m ${secs}s remaining` };
};

/* ─── Provider ──────────────────────────────────────────────── */
export const AppProvider = ({ children }) => {
  // ── Auth ──────────────────────────────────────────────────────
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pms_user');
    return saved ? JSON.parse(saved) : null;
  });

  // ── Persist user in localStorage ───────────────────────────
  useEffect(() => {
    if (user) localStorage.setItem('pms_user', JSON.stringify(user));
    else       localStorage.removeItem('pms_user');
  }, [user]);

  // ── Employees (admin manages) ─────────────────────────────────
  const [employees, setEmployees] = useState(() => {
    const saved = localStorage.getItem('pms_employees');
    return saved ? JSON.parse(saved) : initialEmployees;
  });

  useEffect(() => {
    localStorage.setItem('pms_employees', JSON.stringify(employees));
  }, [employees]);

  // ── Parking slots (car + bike) ────────────────────────────────
  const [carSlots, setCarSlots] = useState(() => {
    const saved = localStorage.getItem('pms_carSlots');
    return saved ? JSON.parse(saved) : buildSlots('A', TOTAL_CAR_SLOTS);
  });
  const [bikeSlots, setBikeSlots] = useState(() => {
    const saved = localStorage.getItem('pms_bikeSlots');
    return saved ? JSON.parse(saved) : buildSlots('B', TOTAL_BIKE_SLOTS);
  });

  useEffect(() => { localStorage.setItem('pms_carSlots', JSON.stringify(carSlots)); }, [carSlots]);
  useEffect(() => { localStorage.setItem('pms_bikeSlots', JSON.stringify(bikeSlots)); }, [bikeSlots]);

  // ── Parking history log ───────────────────────────────────────
  const [history, setHistory] = useState(() => {
    const saved = localStorage.getItem('pms_history');
    return saved ? JSON.parse(saved) : [];
  });

  useEffect(() => { localStorage.setItem('pms_history', JSON.stringify(history)); }, [history]);

  /* ── Real-time tick for expiry tracking ─────────────────────
   * This forces a re-render every second so that components
   * reading getBookingStatus / getRemainingTime see live data.
   * ─────────────────────────────────────────────────────────── */
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  /* ─── Auth helpers ──────────────────────────────────────────── */
  /**
   * ROLE-BASED LOGIN
   * Admin credentials: admin@parksys.com / admin123
   * Employee credentials: <registered email> / emp123
   * The role is stored alongside user data in localStorage.
   */
  const login = (email, password) => {
    if (email === 'admin@parksys.com' && password === 'admin123') {
      setUser({ id: 'admin-001', name: 'Admin', email, role: 'admin' });
      return { success: true, role: 'admin' };
    }
    const emp = employees.find(e => e.email === email);
    if (emp && password === 'emp123') {
      setUser({ ...emp, role: 'employee' });
      return { success: true, role: 'employee' };
    }
    return { success: false, message: 'Invalid credentials.' };
  };

  const register = (name, email, password) => {
    if (employees.find(e => e.email === email))
      return { success: false, message: 'Email already registered' };

    const newEmp = { id: `emp-${Date.now()}`, name, email, role: 'employee' };
    setEmployees(prev => [...prev, newEmp]);
    setUser({ ...newEmp });
    return { success: true };
  };

  const logout = () => setUser(null);

  const updateProfile = (updatedData) => {
    const newUser = { ...user, ...updatedData };
    setUser(newUser);
    if (user.role === 'employee') {
      setEmployees(prev => prev.map(e => e.id === user.id ? { ...e, ...updatedData } : e));
    }
    return { success: true };
  };

  /* ─── Employee management (admin) ──────────────────────────── */
  const addEmployee = (name, email) => {
    if (employees.find(e => e.email === email))
      return { success: false, message: 'Email already exists' };
    setEmployees(prev => [...prev, { id: `emp-${Date.now()}`, name, email, role: 'employee' }]);
    return { success: true };
  };

  const deleteEmployee = (id) => {
    setEmployees(prev => prev.filter(e => e.id !== id));
  };

  /* ─── Slot allocation with scheduled exit time ─────────────── */
  /**
   * assignSlotById – Books a SPECIFIC slot by ID
   * @param {string} slotId - The slot to book (e.g. 'A05')
   * @param {string} vehicleNo - Vehicle registration number
   * @param {string} vehicleType - 'car' or 'bike'
   * @param {string} scheduledExitTime - ISO string of fixed exit time
   * @param {string} phone - Optional phone number
   *
   * TIME LOGIC:
   * - entryTime is set to Date.now()
   * - scheduledExitTime is fixed at booking and CANNOT change
   * - Fine begins accruing once current time > scheduledExitTime
   */
  const assignSlotById = (slotId, vehicleNo, vehicleType, scheduledExitTime, phone) => {
    const alreadyParked = history.find(h => h.vehicleNo === vehicleNo && !h.exitTime);
    if (alreadyParked) return { success: false, message: `${vehicleNo} is already parked in Slot ${alreadyParked.slotId}` };

    const entryTime = new Date().toISOString();
    const bookingRecord = {
      vehicleNo,
      vehicleType,
      slotId,
      entryTime,
      scheduledExitTime: scheduledExitTime || null,
      exitTime: null,
      duration: null,
      fineAmount: 0,
      employeeId: user.id,
      employeeName: user.name,
      phone: phone || '',
    };

    if (vehicleType === 'car') {
      const idx = carSlots.findIndex(s => s.id === slotId);
      if (idx === -1) return { success: false, message: `Slot ${slotId} not found` };
      if (carSlots[idx].isOccupied) return { success: false, message: `Slot ${slotId} is already occupied` };

      setCarSlots(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], isOccupied: true, record: { vehicleNo, entryTime, scheduledExitTime, employeeId: user.id } };
        return next;
      });
    } else {
      const idx = bikeSlots.findIndex(s => s.id === slotId);
      if (idx === -1) return { success: false, message: `Slot ${slotId} not found` };
      if (bikeSlots[idx].isOccupied) return { success: false, message: `Slot ${slotId} is already occupied` };

      setBikeSlots(prev => {
        const next = [...prev];
        next[idx] = { ...next[idx], isOccupied: true, record: { vehicleNo, entryTime, scheduledExitTime, employeeId: user.id } };
        return next;
      });
    }

    setHistory(prev => [bookingRecord, ...prev]);
    return { success: true, slotId };
  };

  /** Auto-assign first free slot (legacy support) */
  const assignSlot = (vehicleNo, vehicleType, scheduledExitTime) => {
    const slots = vehicleType === 'car' ? carSlots : bikeSlots;
    const freeSlotObj = slots.find(s => !s.isOccupied);
    if (!freeSlotObj) return { success: false, message: `No ${vehicleType} slots available` };
    return assignSlotById(freeSlotObj.id, vehicleNo, vehicleType, scheduledExitTime);
  };

  /**
   * freeSlot – Release a parked vehicle
   *
   * FINE CALCULATION at exit:
   * If current time > scheduledExitTime:
   *   overtime = currentTime - scheduledExitTime
   *   fineAmount = Math.ceil(overtime in hours) × ₹10
   */
  const freeSlot = (vehicleNo) => {
    const exitTime = new Date();

    const carIdx = carSlots.findIndex(s => s.isOccupied && s.record?.vehicleNo === vehicleNo);
    if (carIdx !== -1) {
      const record = carSlots[carIdx].record;
      const entryTime = record.entryTime;
      const mins = Math.round((exitTime - new Date(entryTime)) / 60000);
      const fine = calculateFine(record.scheduledExitTime);

      setCarSlots(prev => {
        const next = [...prev];
        next[carIdx] = { ...next[carIdx], isOccupied: false, record: null };
        return next;
      });
      setHistory(prev =>
        prev.map(h => h.vehicleNo === vehicleNo && !h.exitTime
          ? { ...h, exitTime: exitTime.toISOString(), duration: mins, fineAmount: fine }
          : h
        )
      );
      return { success: true, slotId: carSlots[carIdx].id, duration: mins, fineAmount: fine };
    }

    const bikeIdx = bikeSlots.findIndex(s => s.isOccupied && s.record?.vehicleNo === vehicleNo);
    if (bikeIdx !== -1) {
      const record = bikeSlots[bikeIdx].record;
      const entryTime = record.entryTime;
      const mins = Math.round((exitTime - new Date(entryTime)) / 60000);
      const fine = calculateFine(record.scheduledExitTime);

      setBikeSlots(prev => {
        const next = [...prev];
        next[bikeIdx] = { ...next[bikeIdx], isOccupied: false, record: null };
        return next;
      });
      setHistory(prev =>
        prev.map(h => h.vehicleNo === vehicleNo && !h.exitTime
          ? { ...h, exitTime: exitTime.toISOString(), duration: mins, fineAmount: fine }
          : h
        )
      );
      return { success: true, slotId: bikeSlots[bikeIdx].id, duration: mins, fineAmount: fine };
    }

    return { success: false, message: 'Vehicle not found in any slot' };
  };

  /* ─── Computed stats ─────────────────────────────────────────── */
  const stats = {
    totalCar:      carSlots.length,
    availableCar:  carSlots.filter(s => !s.isOccupied).length,
    occupiedCar:   carSlots.filter(s => s.isOccupied).length,
    totalBike:     bikeSlots.length,
    availableBike: bikeSlots.filter(s => !s.isOccupied).length,
    occupiedBike:  bikeSlots.filter(s => s.isOccupied).length,
  };

  // Active (not exited) bookings
  const activeBookings = history.filter(h => !h.exitTime);
  const expiredBookings = activeBookings.filter(h => getBookingStatus(h) === 'expired');
  const expiringBookings = activeBookings.filter(h => getBookingStatus(h) === 'expiring');

  // Total pending fines across all active expired bookings
  const totalPendingFines = expiredBookings.reduce((sum, h) => sum + calculateFine(h.scheduledExitTime), 0);
  // Total collected fines (from exited bookings)
  const totalCollectedFines = history.filter(h => h.exitTime && h.fineAmount > 0).reduce((sum, h) => sum + h.fineAmount, 0);

  return (
    <AppContext.Provider value={{
      user, login, register, logout, updateProfile,
      employees, addEmployee, deleteEmployee,
      carSlots, bikeSlots,
      history,
      assignSlot, assignSlotById, freeSlot,
      stats,
      tick, // forces re-render for live updates
      // Utility functions exposed for components
      getBookingStatus,
      getRemainingTime,
      calculateFine,
      // Computed aggregates
      activeBookings,
      expiredBookings,
      expiringBookings,
      totalPendingFines,
      totalCollectedFines,
      FINE_RATE_PER_HOUR,
    }}>
      {children}
    </AppContext.Provider>
  );
};
