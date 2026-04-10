/* ParkingSlots – Teal hero strip + slot grid */
import { useState, useCallback } from 'react';
import { Car, Bike, ParkingSquare, CheckCircle2, XCircle } from 'lucide-react';
import { useApp } from '../services/AppContext';
import SlotGrid from '../components/SlotGrid';
import BookingModal from '../components/BookingModal';
import BookingConfirmationModal from '../components/BookingConfirmationModal';

export default function ParkingSlots() {
  const { carSlots, bikeSlots, stats, assignSlotById, user } = useApp();

  const [filter,           setFilter]           = useState('all');
  const [selectedSlot,     setSelectedSlot]     = useState(null);
  const [toast,            setToast]            = useState(null);
  const [confirmedBooking, setConfirmedBooking] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  const handleSlotClick = useCallback(slot => {
    if (slot.isOccupied) return;
    setSelectedSlot(slot);
  }, []);

  const handleConfirm = async (slotId, vehicleNo, vehicleType, scheduledExitTime, phone) => {
    const result = await assignSlotById(slotId, vehicleNo, vehicleType, scheduledExitTime, phone);
    if (result.success) {
      setSelectedSlot(null);
      const bookingData = {
        employeeId: user.id, employeeName: user.name,
        employeePhone: phone || user.phone || 'N/A',
        vehicleNo, vehicleType, slotId: result.slotId,
        entryTime: new Date().toISOString(), scheduledExitTime, exitTime: null,
      };
      const stored = JSON.parse(localStorage.getItem('pms_bookings') || '[]');
      stored.push(bookingData);
      localStorage.setItem('pms_bookings', JSON.stringify(stored));
      setConfirmedBooking(bookingData);
      showToast(`Slot ${result.slotId} booked for ${vehicleNo}!`);
    } else {
      showToast(`Booking failed: ${result.message}`, 'error');
    }
    return result;
  };

  const totalFree = stats.availableCar + stats.availableBike;
  const totalAll  = stats.totalCar + stats.totalBike;

  const filters = [
    { key: 'all',  Icon: ParkingSquare, label: 'All Slots'  },
    { key: 'car',  Icon: Car,           label: 'Car Slots'  },
    { key: 'bike', Icon: Bike,          label: 'Bike Slots' },
  ];

  return (
    <div className="flex flex-col gap-5 max-w-7xl mx-auto">

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-2.5 px-5 py-3.5 rounded-2xl shadow-xl font-semibold text-sm fade-in ${
          toast.type === 'success'
            ? 'text-white shadow-teal-500/30'
            : 'bg-rose-600 text-white shadow-rose-500/30'
        }`}
          style={toast.type === 'success' ? { background: 'linear-gradient(135deg,#0f9b8e,#17c3b2)' } : {}}
        >
          {toast.type === 'success' ? <CheckCircle2 size={18} /> : <XCircle size={18} />}
          {toast.message}
        </div>
      )}

      {/* Hero strip */}
      <div className="rounded-2xl p-6 text-white shadow-lg shadow-teal-500/20 overflow-hidden relative"
        style={{ background: 'linear-gradient(135deg, #0f9b8e 0%, #17c3b2 100%)' }}
      >
        {/* decorative circles */}
        <div className="absolute -top-10 -right-10 w-48 h-48 bg-white/5 rounded-full pointer-events-none" />
        <div className="absolute -bottom-6 -left-6 w-32 h-32 bg-white/5 rounded-full pointer-events-none" />

        <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl sm:text-3xl font-bold mb-1">Parking Slots</h1>
            <p className="text-white/80 text-sm">Live view — tap any <strong>free</strong> slot to book instantly.</p>
          </div>
          <div className="flex gap-4">
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p style={{ fontFamily: 'Poppins, sans-serif' }} className="text-3xl font-black">{totalFree}</p>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Free</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-5 py-3 text-center">
              <p style={{ fontFamily: 'Poppins, sans-serif' }} className="text-3xl font-black">{totalAll}</p>
              <p className="text-white/70 text-xs font-semibold uppercase tracking-wider">Total</p>
            </div>
          </div>
        </div>

        {/* inline stats */}
        <div className="relative flex flex-wrap gap-4 mt-5">
          {[
            { label: 'Car Free',  val: stats.availableCar,  Icon: Car  },
            { label: 'Car Occ',   val: stats.occupiedCar,   Icon: Car  },
            { label: 'Bike Free', val: stats.availableBike, Icon: Bike },
            { label: 'Bike Occ',  val: stats.occupiedBike,  Icon: Bike },
          ].map(({ label, val, Icon }) => (
            <div key={label} className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-xl px-4 py-2 text-sm font-semibold">
              <Icon size={15} className="opacity-70" />
              <span className="opacity-80">{label}:</span>
              <span className="font-black">{val}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Filter + Grid panel */}
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-5">
        {/* Filters */}
        <div className="flex flex-wrap p-1 bg-teal-50 rounded-xl w-max mb-6 gap-1">
          {filters.map(({ key, Icon, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key)}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold transition-all duration-200 ${
                filter === key
                  ? 'bg-white text-teal-700 shadow-sm shadow-teal-100'
                  : 'text-teal-600/70 hover:text-teal-700 hover:bg-white/60'
              }`}
            >
              <Icon size={15} strokeWidth={2} /> {label}
            </button>
          ))}
        </div>

        {/* Grids */}
        <div className="space-y-4">
          {(filter === 'all' || filter === 'car') && (
            <SlotGrid slots={carSlots} title="Car Parking (A01–A30)" Icon={Car} onSlotClick={handleSlotClick} selectedSlotId={selectedSlot?.id} />
          )}
          {(filter === 'all' || filter === 'bike') && (
            <SlotGrid slots={bikeSlots} title="Bike Parking (B01–B20)" Icon={Bike} onSlotClick={handleSlotClick} selectedSlotId={selectedSlot?.id} />
          )}
        </div>
      </div>

      {/* Modals */}
      {selectedSlot && (
        <BookingModal slot={selectedSlot} onConfirm={handleConfirm} onClose={() => setSelectedSlot(null)} />
      )}
      {confirmedBooking && (
        <BookingConfirmationModal bookingData={confirmedBooking} onClose={() => setConfirmedBooking(null)} />
      )}
    </div>
  );
}
