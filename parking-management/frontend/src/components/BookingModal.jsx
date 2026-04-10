/* BookingModal – Teal gradient header, mobile-inspired form */
import { useState, useEffect, useRef } from 'react';
import { Car, Bike, X, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

const DURATION_OPTIONS = [
  { label: '30 min',  value: 30  },
  { label: '1 hour',  value: 60  },
  { label: '2 hours', value: 120 },
  { label: '3 hours', value: 180 },
  { label: '4 hours', value: 240 },
  { label: 'Custom',  value: 'custom' },
];

const inputCls = 'w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 text-slate-900 transition-all focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-500 focus:bg-white placeholder:text-slate-400';

export default function BookingModal({ slot, onConfirm, onClose }) {
  const [vehicleNo,     setVehicleNo]     = useState('');
  const [phone,         setPhone]         = useState('');
  const [duration,      setDuration]      = useState(120);
  const [customMinutes, setCustomMinutes] = useState(90);
  const [error,         setError]         = useState('');
  const [loading,       setLoading]       = useState(false);
  const inputRef = useRef(null);

  useEffect(() => { const t = setTimeout(() => inputRef.current?.focus(), 120); return () => clearTimeout(t); }, []);
  useEffect(() => {
    const h = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  if (!slot) return null;

  const VehicleIcon = slot.type === 'car' ? Car : Bike;
  const getMins = () => duration === 'custom' ? parseInt(customMinutes) || 30 : duration;
  const getScheduledExit = () => new Date(Date.now() + getMins() * 60000).toISOString();
  const getDisplayExit   = () => new Date(Date.now() + getMins() * 60000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const handleSubmit = async e => {
    e.preventDefault();
    const trimmed = vehicleNo.trim().toUpperCase();
    if (!trimmed) { setError('Vehicle number is required.'); return; }
    if (trimmed.length < 3) { setError('Enter a valid vehicle number.'); return; }
    const finalMins = getMins();
    if (!finalMins || finalMins < 15) { setError('Minimum parking duration is 15 minutes.'); return; }
    setLoading(true);
    await new Promise(r => setTimeout(r, 350));
    const result = await onConfirm(slot.id, trimmed, slot.type, getScheduledExit(), phone.trim());
    setLoading(false);
    if (!result.success) setError(result.message);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-slate-900/50 backdrop-blur-sm p-0 sm:p-4 fade-in"
      onClick={onClose} role="dialog" aria-modal="true">
      <div className="bg-white w-full sm:max-w-md rounded-t-3xl sm:rounded-2xl shadow-2xl overflow-hidden slide-up relative flex flex-col max-h-[95vh]"
        onClick={e => e.stopPropagation()}>

        {/* Teal gradient header */}
        <div className="px-6 pt-6 pb-5 text-white relative overflow-hidden shrink-0"
          style={{ background: 'linear-gradient(135deg, #0f9b8e 0%, #17c3b2 100%)' }}>
          <div className="absolute -top-6 -right-6 w-28 h-28 bg-white/10 rounded-full" />
          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 bg-white/20 rounded-xl flex items-center justify-center">
                <VehicleIcon size={24} strokeWidth={2} />
              </div>
              <div>
                <p className="text-white/70 text-xs font-semibold uppercase tracking-wider mb-0.5">Booking Slot</p>
                <h2 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl font-bold">{slot.id}</h2>
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold bg-white/20 px-2.5 py-0.5 rounded-full mt-1">
                  <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" /> Available
                </span>
              </div>
            </div>
            <button className="p-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors" onClick={onClose}>
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Form */}
        <div className="p-6 overflow-y-auto">
          <form id="booking-form" onSubmit={handleSubmit} noValidate className="space-y-5">

            {/* Vehicle No */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Vehicle Number</label>
              <input
                ref={inputRef} id="vehicleNo" type="text" maxLength={15} autoComplete="off"
                className={`${inputCls} font-mono uppercase tracking-widest text-lg font-bold`}
                placeholder={slot.type === 'car' ? 'e.g. KA 01 AB 1234' : 'e.g. MH 12 XY 5678'}
                value={vehicleNo}
                onChange={e => { setVehicleNo(e.target.value.toUpperCase()); setError(''); }}
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                Phone <span className="normal-case font-normal text-slate-400">(optional)</span>
              </label>
              <input id="phoneNo" type="tel" maxLength={15} autoComplete="off"
                className={inputCls}
                placeholder="e.g. 9876543210"
                value={phone}
                onChange={e => { setPhone(e.target.value.replace(/[^0-9+\- ]/g, '')); setError(''); }}
              />
            </div>

            {/* Duration selector */}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-3">Parking Duration</label>
              <div className="grid grid-cols-3 gap-2">
                {DURATION_OPTIONS.map(opt => (
                  <button
                    key={opt.value} type="button"
                    className={`py-2.5 px-2 text-sm rounded-xl border-2 font-semibold transition-all duration-150 ${
                      duration === opt.value
                        ? 'border-teal-500 bg-teal-50 text-teal-700 shadow-sm shadow-teal-100'
                        : 'border-slate-200 bg-white text-slate-600 hover:border-teal-300 hover:bg-teal-50/50'
                    }`}
                    onClick={() => { setDuration(opt.value); setError(''); }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>

              {duration === 'custom' && (
                <div className="mt-3 flex items-center gap-2">
                  <input
                    type="number" min={15} max={1440} value={customMinutes} placeholder="Mins"
                    className="px-3 py-2.5 rounded-xl border-2 border-teal-300 bg-teal-50 w-24 text-center text-lg font-bold text-teal-700 focus:outline-none"
                    onChange={e => setCustomMinutes(e.target.value)}
                  />
                  <span className="text-sm font-medium text-slate-600">minutes</span>
                </div>
              )}

              <div className="mt-3 flex items-center gap-2.5 bg-teal-50 border border-teal-100 rounded-xl px-4 py-3 text-sm text-teal-800 font-medium">
                <Clock size={15} className="text-teal-500 shrink-0" />
                Scheduled exit: <strong>{getDisplayExit()}</strong>
              </div>
            </div>

            {error && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-start gap-2">
                <AlertCircle size={16} className="mt-0.5 shrink-0" /> {error}
              </div>
            )}
          </form>
        </div>

        {/* Footer */}
        <div className="px-6 pb-6 pt-2 flex gap-3 shrink-0">
          <button type="button" onClick={onClose}
            className="flex-1 py-3 rounded-xl border-2 border-slate-200 text-slate-600 font-semibold hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button form="booking-form" type="submit" disabled={loading}
            className="flex-[2] py-3 rounded-xl text-white font-bold shadow-lg shadow-teal-500/30 transition-all active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2"
            style={{ background: loading ? '#99f6e4' : 'linear-gradient(135deg, #0f9b8e, #17c3b2)' }}>
            {loading ? (
              <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
              </svg>
            ) : <CheckCircle2 size={18} />}
            {loading ? 'Booking…' : `Confirm — Slot ${slot.id}`}
          </button>
        </div>
      </div>
    </div>
  );
}
