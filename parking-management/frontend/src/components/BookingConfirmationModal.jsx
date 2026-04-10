/* BookingConfirmationModal – Teal success theme */
import { useEffect } from 'react';
import QRCodeGenerator from './QRCodeGenerator';
import { CheckCircle2, Car, Bike, X } from 'lucide-react';

export default function BookingConfirmationModal({ bookingData, onClose }) {
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!bookingData) return null;

  const VehicleIcon  = bookingData.vehicleType === 'car' ? Car : Bike;
  const vehicleLabel = bookingData.vehicleType === 'car' ? 'Car' : 'Bike';

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/60 backdrop-blur-sm p-0 sm:p-4 fade-in"
      onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden slide-up relative flex flex-col max-h-[95vh]"
        onClick={e => e.stopPropagation()}>

        {/* Teal gradient success header */}
        <div className="pt-8 pb-6 px-6 text-center text-white relative overflow-hidden shrink-0"
          style={{ background: 'linear-gradient(135deg, #0f9b8e 0%, #17c3b2 100%)' }}>
          <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full pointer-events-none" />
          <div className="absolute -bottom-4 -left-4 w-20 h-20 bg-white/10 rounded-full pointer-events-none" />

          <button
            className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
            onClick={onClose}>
            <X size={18} />
          </button>

          <div className="relative">
            <div className="h-16 w-16 mx-auto bg-white/20 rounded-full flex items-center justify-center mb-3 ring-4 ring-white/20">
              <CheckCircle2 size={34} strokeWidth={2.5} />
            </div>
            <h2 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl font-bold mb-1">Booking Confirmed!</h2>
            <p className="text-white/75 text-sm">Your parking slot has been reserved.</p>

            <div className="flex items-center justify-center gap-3 mt-4">
              <div className="bg-white/15 rounded-xl px-5 py-2">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Slot</p>
                <p style={{ fontFamily: 'Poppins, sans-serif' }} className="text-xl font-black">{bookingData.slotId}</p>
              </div>
              <div className="bg-white/15 rounded-xl px-5 py-2">
                <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Vehicle</p>
                <p style={{ fontFamily: 'Poppins, sans-serif' }} className="text-xl font-black">{bookingData.vehicleNo}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto">
          {/* QR Code */}
          <div className="px-6 py-5 border-b border-slate-100 flex justify-center bg-slate-50/50">
            <QRCodeGenerator bookingData={bookingData} />
          </div>

          {/* Details grid */}
          <div className="p-6">
            <p className="text-xs font-bold text-teal-600 uppercase tracking-wider mb-4 flex items-center gap-2">
              <span className="h-0.5 w-4 bg-teal-400 rounded" /> Booking Details
            </p>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <DetailRow title="Slot ID"       value={bookingData.slotId}         highlight />
              <DetailRow title="Vehicle No"    value={bookingData.vehicleNo} />
              <DetailRow title="Type"          value={<div className="flex items-center gap-1.5"><VehicleIcon size={14}/>{vehicleLabel}</div>} />
              <DetailRow title="Employee"      value={bookingData.employeeName} />
              <DetailRow title="Phone"         value={bookingData.employeePhone || 'N/A'} />
              <DetailRow title="Entry Time"    value={new Date(bookingData.entryTime).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'})} fullWidth />
              <DetailRow title="Scheduled Exit" value={new Date(bookingData.scheduledExitTime).toLocaleString('en-IN',{timeStyle:'short',dateStyle:'short'})} fullWidth />
            </div>

            <button
              className="w-full mt-6 py-3.5 rounded-xl text-white font-bold shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98]"
              style={{ background: 'linear-gradient(135deg, #0f9b8e, #17c3b2)' }}
              onClick={onClose}
            >
              Done
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DetailRow({ title, value, highlight = false, fullWidth = false }) {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-2' : ''}`}>
      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{title}</span>
      <span className={`font-semibold text-slate-800 truncate ${highlight ? 'text-teal-600 text-lg' : ''}`}>{value}</span>
    </div>
  );
}
