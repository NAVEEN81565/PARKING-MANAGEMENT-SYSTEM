/* SlotGrid – Teal-themed slot cards */
import { Car, Bike, ParkingSquare } from 'lucide-react';

function SlotCard({ slot, onSlotClick, selectedSlotId }) {
  const isOccupied = slot.isOccupied;
  const isSelected = selectedSlotId === slot.id;
  const VehicleIcon = slot.type === 'car' ? Car : Bike;

  return (
    <div
      onClick={() => { if (!isOccupied) onSlotClick?.(slot); }}
      role={!isOccupied ? 'button' : undefined}
      tabIndex={!isOccupied ? 0 : -1}
      onKeyDown={!isOccupied ? e => { if (e.key === 'Enter' || e.key === ' ') onSlotClick?.(slot); } : undefined}
      title={isOccupied ? `Occupied: ${slot.record?.vehicleNo}` : `Book Slot ${slot.id}`}
      className={`
        relative flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all duration-200 select-none
        ${isOccupied
          ? 'bg-rose-50 border-rose-100 cursor-not-allowed'
          : 'bg-white border-teal-100 cursor-pointer hover:-translate-y-1.5 hover:shadow-lg hover:shadow-teal-200/60 hover:border-teal-300'}
        ${isSelected ? 'ring-4 ring-teal-300 border-teal-500 scale-105 shadow-xl shadow-teal-200/80' : ''}
      `}
    >
      {/* Slot ID badge */}
      <span className={`absolute top-2 left-2 text-[10px] font-bold rounded-md px-1.5 py-0.5 ${
        isOccupied ? 'bg-rose-100 text-rose-600' : 'bg-teal-100 text-teal-700'
      }`}>
        {slot.id}
      </span>

      {/* Icon */}
      <div className={`mt-3 mb-2 p-2.5 rounded-xl ${isOccupied ? 'bg-rose-100' : 'bg-teal-50'}`}>
        <VehicleIcon size={22} strokeWidth={2} className={isOccupied ? 'text-rose-400' : 'text-teal-500'} />
      </div>

      {/* Status */}
      <span className={`text-xs font-bold ${isOccupied ? 'text-rose-500' : 'text-teal-600'}`}>
        {isOccupied ? (
          <span className="truncate max-w-[72px] block text-center">{slot.record?.vehicleNo || 'Occupied'}</span>
        ) : 'Free'}
      </span>
    </div>
  );
}

export default function SlotGrid({ slots, title, Icon, onSlotClick, selectedSlotId }) {
  const freeCount = slots.filter(s => !s.isOccupied).length;
  const occCount  = slots.filter(s => s.isOccupied).length;

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="flex items-center gap-2 text-base font-bold text-slate-700">
          {Icon && <span className="p-1.5 bg-teal-100 text-teal-600 rounded-lg"><Icon size={18} strokeWidth={2} /></span>}
          {title}
        </h3>
        <div className="flex items-center gap-3 text-xs font-semibold">
          <span className="flex items-center gap-1.5 text-teal-700">
            <span className="h-2 w-2 rounded-full bg-teal-400 ring-2 ring-teal-100" />
            {freeCount} Free
          </span>
          <span className="flex items-center gap-1.5 text-rose-600">
            <span className="h-2 w-2 rounded-full bg-rose-400 ring-2 ring-rose-100" />
            {occCount} Occupied
          </span>
        </div>
      </div>

      <div className="grid grid-cols-3 min-[480px]:grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-3">
        {slots.map(slot => (
          <SlotCard key={slot.id} slot={slot} onSlotClick={onSlotClick} selectedSlotId={selectedSlotId} />
        ))}
      </div>

      {onSlotClick && (
        <p className="mt-4 text-center text-xs text-teal-500 font-medium flex items-center justify-center gap-1.5">
          <ParkingSquare size={13} /> Tap any teal free slot to book instantly
        </p>
      )}
    </div>
  );
}
