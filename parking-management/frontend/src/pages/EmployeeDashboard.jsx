/* EmployeeDashboard – Teal theme */
import { useNavigate } from 'react-router-dom';
import {
  Car, Bike, ClipboardList, Banknote, ParkingSquare,
  ChevronRight, Timer, History, FlagTriangleRight,
} from 'lucide-react';
import { useApp } from '../services/AppContext';
import ClockComponent from '../components/ClockComponent';
import AlertBanner from '../components/AlertBanner';
import BookingTable from '../components/BookingTable';
import StatCard from '../components/StatCard';

export default function EmployeeDashboard() {
  const {
    user, stats, history, freeSlot,
    getBookingStatus, calculateFine, getRemainingTime, FINE_RATE_PER_HOUR,
  } = useApp();
  const navigate = useNavigate();

  const myBookings = history.filter(h => h.employeeId === user?.id);
  const myActive   = myBookings.filter(h => !h.exitTime);
  const myExpired  = myActive.filter(h => getBookingStatus(h) === 'expired');
  const myExpiring = myActive.filter(h => getBookingStatus(h) === 'expiring');
  const pendingFineTotal = myExpired.reduce((s, h) => s + calculateFine(h.scheduledExitTime), 0);

  const handleRelease = async (vehicleNo) => {
    if (!window.confirm(`Release vehicle ${vehicleNo}?`)) return;
    const result = await freeSlot(vehicleNo);
    if (result.success && result.fineAmount > 0)
      alert(`Released from Slot ${result.slotId}. Fine: ₹${result.fineAmount}`);
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-2 fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-2">
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">My Dashboard</h1>
          <p className="text-slate-500 text-sm">
            Welcome back, <strong className="text-teal-700">{user?.name}</strong> — here's your parking overview
          </p>
        </div>
        <div className="hidden sm:block"><ClockComponent /></div>
      </div>

      {/* Alerts */}
      <div className="space-y-3 mb-4">
        {myExpired.length > 0 && (
          <AlertBanner type="danger" dismissible={false}>
            <strong>{myExpired.length} booking(s) EXPIRED!</strong> Fines at ₹{FINE_RATE_PER_HOUR}/hr. Release immediately.
          </AlertBanner>
        )}
        {myExpiring.length > 0 && (
          <AlertBanner type="warning">
            <strong>{myExpiring.length} booking(s) expiring within 30 minutes.</strong>
          </AlertBanner>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatCard icon={Car}          label="Free Car Slots"   value={stats.availableCar}      accent="success" subtitle={`of ${stats.totalCar}`} />
        <StatCard icon={Bike}         label="Free Bike Slots"  value={stats.availableBike}     accent="success" subtitle={`of ${stats.totalBike}`} />
        <StatCard icon={ClipboardList} label="Active Bookings" value={myActive.length}          accent="primary" />
        <StatCard icon={Banknote}     label="Pending Fines"    value={`₹${pendingFineTotal}`}  accent={pendingFineTotal > 0 ? 'danger' : 'success'} />
      </div>

      {/* Hero CTA */}
      <button
        onClick={() => navigate('/slots')}
        className="group w-full flex items-center justify-between gap-4 px-6 py-5 rounded-2xl text-white shadow-lg shadow-teal-500/30 transition-all duration-300 hover:shadow-teal-500/50 hover:scale-[1.01] active:scale-[0.99] mb-6"
        style={{ background: 'linear-gradient(135deg, #0f9b8e 0%, #17c3b2 100%)' }}
      >
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
            <ParkingSquare size={26} strokeWidth={2.5} />
          </div>
          <div className="text-left">
            <p style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-lg leading-tight">Book a Parking Slot</p>
            <p className="text-white/70 text-sm">{stats.availableCar + stats.availableBike} slots available right now</p>
          </div>
        </div>
        <ChevronRight size={22} strokeWidth={2.5} className="opacity-70 group-hover:translate-x-1 transition-transform" />
      </button>

      {/* Pending Fines */}
      {pendingFineTotal > 0 && (
        <div className="bg-white rounded-2xl border-l-4 border-l-red-500 border border-slate-200 shadow-sm mb-6 overflow-hidden">
          <div className="flex justify-between items-center px-5 py-4 border-b border-slate-100">
            <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-rose-700 flex items-center gap-2">
              <Banknote size={18} /> Pending Fines
            </h3>
            <span className="bg-rose-100 text-rose-700 font-bold px-3 py-1 rounded-full text-sm">Total: ₹{pendingFineTotal}</span>
          </div>
          <p className="text-sm text-slate-500 px-5 pt-3 pb-2">Fines at ₹{FINE_RATE_PER_HOUR}/hr for each hour past scheduled exit.</p>
          <div className="p-4 flex flex-col gap-3">
            {myExpired.map((h, i) => {
              const fine = calculateFine(h.scheduledExitTime);
              const rem  = getRemainingTime(h.scheduledExitTime);
              return (
                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-rose-50/50 border border-rose-100 rounded-xl">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-bold text-slate-800 bg-white px-2 py-0.5 rounded-lg border border-slate-200 shadow-sm">{h.vehicleNo}</span>
                      <span className="text-sm text-slate-500 font-medium">Slot {h.slotId}</span>
                    </div>
                    <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">{rem?.text}</span>
                  </div>
                  <div className="flex items-center justify-between sm:justify-end gap-5">
                    <span style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl font-black text-rose-600">₹{fine}</span>
                    <button
                      className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors active:scale-95"
                      onClick={() => handleRelease(h.vehicleNo)}
                    >
                      <FlagTriangleRight size={15} /> Release Now
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Active Bookings Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 mb-6 overflow-hidden">
        <div className="flex justify-between items-center px-5 py-4 border-b border-teal-50">
          <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-slate-800 flex items-center gap-2">
            <span className="p-1.5 bg-teal-100 text-teal-600 rounded-lg"><Timer size={16} /></span>
            My Active Bookings
          </h3>
          <span className="text-sm font-semibold text-slate-400 bg-slate-100 px-3 py-1 rounded-full">{myActive.length} active</span>
        </div>
        <div className="overflow-x-auto">
          <BookingTable bookings={myActive} showFine showActions onRelease={handleRelease} compact />
        </div>
      </div>

      {/* Recent History */}
      {myBookings.filter(h => h.exitTime).length > 0 && (
        <div className="bg-white rounded-2xl shadow-sm border border-teal-100 mb-8 overflow-hidden">
          <div className="px-5 py-4 border-b border-teal-50">
            <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-slate-800 flex items-center gap-2">
              <span className="p-1.5 bg-slate-100 text-slate-500 rounded-lg"><History size={16} /></span>
              Recent History
            </h3>
          </div>
          <div className="overflow-x-auto">
            <BookingTable bookings={myBookings.filter(h => h.exitTime)} showFine compact maxRows={5} />
          </div>
        </div>
      )}
    </div>
  );
}
