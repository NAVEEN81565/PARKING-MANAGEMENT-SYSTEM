import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { apiFetch } from './api';

const AppContext = createContext();
export const useApp = () => useContext(AppContext);

const FINE_RATE_PER_HOUR = 10;

const calculateFine = (scheduledExitTime) => {
  if (!scheduledExitTime) return 0;
  const now = new Date();
  const exit = new Date(scheduledExitTime);
  if (now <= exit) return 0;
  const overtimeMs = now - exit;
  const overtimeHours = overtimeMs / (1000 * 60 * 60);
  return Math.ceil(overtimeHours) * FINE_RATE_PER_HOUR;
};

const getBookingStatus = (booking) => {
  if (booking.exit_time || booking.exitTime) return 'exited';
  const exitTime = booking.scheduled_exit_time || booking.scheduledExitTime;
  if (!exitTime) return 'active';
  const now = new Date();
  const exit = new Date(exitTime);
  const diffMs = exit - now;
  if (diffMs <= 0) return 'expired';
  if (diffMs <= 30 * 60 * 1000) return 'expiring';
  return 'active';
};

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

export const AppProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('pms_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [employees, setEmployees] = useState([]);
  const [carSlots, setCarSlots] = useState([]);
  const [bikeSlots, setBikeSlots] = useState([]);
  const [history, setHistory] = useState([]);
  const [stats, setStats] = useState({
    totalCar: 30, availableCar: 30, occupiedCar: 0,
    totalBike: 20, availableBike: 20, occupiedBike: 0,
  });

  const [tick, setTick] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(interval);
  }, []);

  const loadInitialData = useCallback(async () => {
    if (!user) return;
    try {
      const [slotsRes, historyRes, statsRes] = await Promise.all([
        apiFetch('/parking/slots/'),
        apiFetch('/parking/history/'),
        apiFetch('/parking/slots/stats/')
      ]);

      // Backend wraps responses: { success, slots: [...] }, { success, history: [...] }, { success, stats: {...} }
      const slots = slotsRes.slots || [];
      const historyList = historyRes.history || [];
      const statsObj = statsRes.stats || {};
      
      setCarSlots(slots.filter(s => s.slot_type === 'car').map(s => ({
        id: s.slot_id,
        type: s.slot_type,
        isOccupied: s.is_occupied,
        record: s.current_booking ? {
          vehicleNo: s.current_booking.vehicle_no,
          entryTime: s.current_booking.entry_time,
          scheduledExitTime: s.current_booking.scheduled_exit_time,
        } : null
      })));
      
      setBikeSlots(slots.filter(s => s.slot_type === 'bike').map(s => ({
        id: s.slot_id,
        type: s.slot_type,
        isOccupied: s.is_occupied,
        record: s.current_booking ? {
          vehicleNo: s.current_booking.vehicle_no,
          entryTime: s.current_booking.entry_time,
          scheduledExitTime: s.current_booking.scheduled_exit_time,
        } : null
      })));

      setHistory(historyList.map(h => ({
        id: h.id, 
        vehicleNo: h.vehicle_no,
        vehicleType: h.vehicle_type,
        slotId: h.slot_id,
        entryTime: h.entry_time,
        scheduledExitTime: h.scheduled_exit_time,
        exitTime: h.exit_time,
        duration: h.duration_minutes,
        fineAmount: h.fine_amount || h.current_fine || 0,
        employeeName: h.employee_name || '',
        employeeId: h.employee_id || null,
        phone: h.customer_phone || ''
      })));

      setStats({
        totalCar: statsObj.totalCar || 30,
        availableCar: statsObj.availableCar || 30,
        occupiedCar: statsObj.occupiedCar || 0,
        totalBike: statsObj.totalBike || 20,
        availableBike: statsObj.availableBike || 20,
        occupiedBike: statsObj.occupiedBike || 0,
      });

      if (user.role === 'admin') {
        const empsRes = await apiFetch('/auth/employees/');
        const empsList = empsRes.employees || [];
        setEmployees(empsList.map(e => ({
          id: e.id,
          name: e.name,
          email: e.email,
          role: e.role,
        })));
      }
    } catch (error) {
      console.error('Failed to load initial data:', error);
    }
  }, [user]);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const login = async (email, password) => {
    try {
      const data = await apiFetch('/auth/login/', {
        method: 'POST',
        body: { email, password }
      });
      localStorage.setItem('pms_token', data.access);
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role || 'employee',
        profile_photo: data.user.profile_photo,
      };
      // fallback
      if (userData.email === 'admin@parksys.com' || data.user.is_superuser) userData.role = 'admin';

      setUser(userData);
      localStorage.setItem('pms_user', JSON.stringify(userData));
      return { success: true, role: userData.role };
    } catch (err) {
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const register = async (name, email, password) => {
    try {
      const data = await apiFetch('/auth/register/', {
        method: 'POST',
        body: { name, email, password, password2: password }
      });
      localStorage.setItem('pms_token', data.access);
      const userData = {
        id: data.user.id,
        name: data.user.name,
        email: data.user.email,
        role: data.user.role || 'employee',
        profile_photo: data.user.profile_photo,
      };
      setUser(userData);
      localStorage.setItem('pms_user', JSON.stringify(userData));
      return { success: true, role: userData.role };
    } catch (err) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('pms_token');
    localStorage.removeItem('pms_user');
    setUser(null);
    setCarSlots([]);
    setBikeSlots([]);
    setHistory([]);
  };

  const updateProfile = async (updatedData) => {
     try {
       let options = { method: 'PUT' };
       if (updatedData instanceof FormData) {
          options.body = updatedData;
       } else {
          options.body = { ...updatedData };
       }
       const res = await apiFetch('/auth/profile/', options);
       const profile = res.user || res;
       
       const userData = { ...user, name: profile.name, email: profile.email, phone: profile.phone, profile_photo: profile.profile_photo };
       setUser(userData);
       localStorage.setItem('pms_user', JSON.stringify(userData));
       await loadInitialData(); 
       return { success: true };
     } catch (err) {
       return { success: false, message: err.message || "Failed to update profile" };
     }
  };

  const addEmployee = async (name, email, password = 'emp123') => {
    try {
      await apiFetch('/auth/employees/', {
        method: 'POST',
        body: { name, email, password }
      });
      await loadInitialData();
      return { success: true };
    } catch (err) {
      return { success: false, message: err.message || 'Failed to add employee' };
    }
  };

  const deleteEmployee = async (id) => {
    try {
      await apiFetch(`/auth/employees/${id}/`, { method: 'DELETE' });
      await loadInitialData();
    } catch (err) {
      console.error(err);
    }
  };

  const assignSlotById = async (slotId, vehicleNo, vehicleType, scheduledExitTime, phone) => {
    try {
      await apiFetch('/parking/bookings/', {
        method: 'POST',
        body: {
          slot_id: slotId,
          vehicle_no: vehicleNo,
          vehicle_type: vehicleType,
          customer_phone: phone || '',
          scheduled_exit_time: scheduledExitTime || null
        }
      });
      await loadInitialData();
      return { success: true, slotId };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const assignSlot = async (vehicleNo, vehicleType, scheduledExitTime) => {
    const slots = vehicleType === 'car' ? carSlots : bikeSlots;
    const freeSlotObj = slots.find(s => !s.isOccupied);
    if (!freeSlotObj) return { success: false, message: `No ${vehicleType} slots available` };
    return assignSlotById(freeSlotObj.id, vehicleNo, vehicleType, scheduledExitTime, '');
  };

  const freeSlot = async (vehicleNo) => {
    try {
      const activeBooking = history.find(h => h.vehicleNo === vehicleNo && !h.exitTime);
      if (!activeBooking) {
        return { success: false, message: 'Vehicle not found or already exited' };
      }
      
      const res = await apiFetch(`/parking/bookings/${activeBooking.id}/exit/`, { method: 'POST' });
      await loadInitialData();
      return { success: true, slotId: res.slot_id, duration: res.duration_minutes, fineAmount: res.fine_amount };
    } catch (err) {
      return { success: false, message: err.message };
    }
  };

  const activeBookings = history.filter(h => !h.exitTime);
  const expiredBookings = activeBookings.filter(h => getBookingStatus(h) === 'expired');
  const expiringBookings = activeBookings.filter(h => getBookingStatus(h) === 'expiring');

  const totalPendingFines = expiredBookings.reduce((sum, h) => sum + calculateFine(h.scheduledExitTime), 0);
  const totalCollectedFines = history.filter(h => h.exitTime && h.fineAmount > 0).reduce((sum, h) => sum + h.fineAmount, 0);

  return (
    <AppContext.Provider value={{
      user, login, register, logout, updateProfile,
      employees, addEmployee, deleteEmployee,
      carSlots, bikeSlots, history,
      assignSlot, assignSlotById, freeSlot,
      stats, tick,
      getBookingStatus, getRemainingTime, calculateFine,
      activeBookings, expiredBookings, expiringBookings,
      totalPendingFines, totalCollectedFines, FINE_RATE_PER_HOUR,
    }}>
      {children}
    </AppContext.Provider>
  );
};
