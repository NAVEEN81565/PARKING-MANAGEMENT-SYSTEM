/* Admin Dashboard – Teal themes */
import {
  ParkingSquare, CheckCircle2, Car, Bike, Users, ClipboardList,
  CalendarCheck, Timer, Banknote, BadgeCheck, AlertCircle,
} from 'lucide-react';
import { useApp } from '../services/AppContext';
import StatCard from '../components/StatCard';
import ClockComponent from '../components/ClockComponent';
import AlertBanner from '../components/AlertBanner';
import BookingTable from '../components/BookingTable';

function SectionLabel({ children }) {
  return (
    <div className="flex items-center gap-3 mt-8 mb-4">
      <span style={{ fontFamily: 'Poppins, sans-serif' }} className="text-xs font-bold uppercase tracking-[0.15em] text-teal-600">{children}</span>
      <div className="flex-1 h-px bg-teal-100" />
    </div>
  );
}

export default function Dashboard() {
  const {
    stats, history, employees, freeSlot,
    activeBookings, expiredBookings, expiringBookings,
    totalPendingFines, totalCollectedFines,
    FINE_RATE_PER_HOUR,
  } = useApp();

  const todayHistory = history.filter(h => new Date(h.entryTime).toDateString() === new Date().toDateString());

  const handleRelease = async (vehicleNo) => {
    if (!window.confirm(`Release vehicle ${vehicleNo}?`)) return;
    const result = await freeSlot(vehicleNo);
    if (result.success && result.fineAmount > 0) alert(`Vehicle released. Fine: ₹${result.fineAmount}`);
  };

  return (
    <div className="flex flex-col gap-2 max-w-7xl mx-auto">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">
            Admin Dashboard
          </h1>
          <p className="text-slate-500 text-sm">Live overview of parking operations & financials</p>
        </div>
        <div className="hidden sm:block"><ClockComponent /></div>
      </div>

      {/* Alerts */}
      <div className="space-y-3 mb-2">
        {expiredBookings.length > 0 && (
          <AlertBanner type="danger" dismissible={false}>
            <strong>{expiredBookings.length} vehicle(s) exceeded exit time!</strong>{' '}
            Pending fines: ₹{totalPendingFines} <span className="opacity-70 text-xs">(₹{FINE_RATE_PER_HOUR}/hr)</span>
          </AlertBanner>
        )}
        {expiringBookings.length > 0 && (
          <AlertBanner type="warning">
            <strong>{expiringBookings.length} booking(s) expiring within 30 minutes.</strong>
          </AlertBanner>
        )}
      </div>

      {/* Car Stats */}
      <SectionLabel>Car Parking</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ParkingSquare} label="Total Car Slots"  value={stats.totalCar}     accent="primary" />
        <StatCard icon={CheckCircle2}  label="Available"        value={stats.availableCar} accent="success" />
        <StatCard icon={Car}           label="Occupied"         value={stats.occupiedCar}  accent="danger"  />
      </div>

      {/* Bike Stats */}
      <SectionLabel>Bike Parking</SectionLabel>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard icon={ParkingSquare} label="Total Bike Slots" value={stats.totalBike}     accent="primary" />
        <StatCard icon={CheckCircle2}  label="Available"        value={stats.availableBike} accent="success" />
        <StatCard icon={Bike}          label="Occupied"         value={stats.occupiedBike}  accent="danger"  />
      </div>

      {/* Operations */}
      <SectionLabel>Operations & Finance</SectionLabel>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Users}         label="Employees"       value={employees.length}          accent="primary" />
        <StatCard icon={ClipboardList} label="Total Records"   value={history.length}            accent="primary" />
        <StatCard icon={CalendarCheck} label="Today"           value={todayHistory.length}       accent="success" subtitle="vehicles" />
        <StatCard icon={AlertCircle}   label="Expired"         value={expiredBookings.length}    accent="danger"  />
        <StatCard icon={Banknote}      label="Pending Fines"   value={`₹${totalPendingFines}`}  accent={totalPendingFines > 0 ? 'danger' : 'success'} />
        <StatCard icon={BadgeCheck}    label="Collected Fines" value={`₹${totalCollectedFines}`} accent="warning" />
      </div>

      {/* Active Bookings */}
      {activeBookings.length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-teal-100 mt-6 overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-teal-50">
            <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-teal-100 text-teal-600 rounded-lg"><Timer size={16} /></span>
              Active Bookings
              <span className="text-sm font-medium text-slate-400">({activeBookings.length})</span>
            </h3>
          </div>
          <div className="overflow-x-auto">
            <BookingTable bookings={activeBookings} showEmployee showFine showActions onRelease={handleRelease} />
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 mt-6 mb-8 overflow-hidden">
        <div className="px-5 py-4 border-b border-teal-50">
          <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-slate-100 text-slate-500 rounded-lg"><ClipboardList size={16} /></span>
            Recent Parking Activity
          </h3>
        </div>
        <div className="overflow-x-auto">
          <BookingTable bookings={history} showEmployee showFine maxRows={10} />
        </div>
      </div>
    </div>
  );
}
