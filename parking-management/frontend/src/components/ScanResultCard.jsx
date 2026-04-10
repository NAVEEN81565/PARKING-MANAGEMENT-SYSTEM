/* ScanResultCard – Teal theme */
import { useApp } from '../services/AppContext';
import { Car, Bike } from 'lucide-react';

export default function ScanResultCard({ decoded }) {
  const { getBookingStatus, calculateFine } = useApp();
  if (!decoded) return null;

  const statusType = getBookingStatus(decoded);
  const fine       = calculateFine(decoded.exitTime || decoded.scheduledExitTime);

  const statusCfg = {
    active:   { label: 'Active',       cls: 'bg-teal-100 text-teal-700 border-teal-200' },
    expiring: { label: 'Expiring Soon',cls: 'bg-amber-100 text-amber-700 border-amber-200' },
    expired:  { label: 'Expired',      cls: 'bg-rose-100 text-rose-700 border-rose-200' },
    exited:   { label: 'Exited',       cls: 'bg-slate-100 text-slate-600 border-slate-200' },
  };
  const sc = statusCfg[statusType] || statusCfg.active;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden flex flex-col h-full fade-in">

      {/* Teal gradient header */}
      <div className="p-5 text-white flex justify-between items-center shrink-0 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg, #0f9b8e 0%, #17c3b2 100%)' }}>
        <div className="absolute -top-6 -right-6 w-24 h-24 bg-white/10 rounded-full pointer-events-none" />
        <div className="relative flex items-center gap-3">
          <div className={`p-2.5 rounded-xl bg-white/20`}>
            {decoded.vehicleType === 'car' ? <Car size={22} /> : <Bike size={22} />}
          </div>
          <div>
            <p className="text-white/60 text-[10px] font-bold uppercase tracking-wider mb-0.5">Slot Number</p>
            <p style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl font-black">{decoded.slotId}</p>
            <p className="text-white/70 text-xs font-medium capitalize">{decoded.vehicleType} Parking</p>
          </div>
        </div>
        <span className={`px-3 py-1.5 rounded-xl border text-xs font-bold uppercase tracking-wide ${sc.cls}`}>
          {sc.label}
        </span>
      </div>

      {/* Details grid */}
      <div className="p-5 grid grid-cols-2 gap-x-6 gap-y-5 flex-1">
        <Field label="Employee ID"    value={decoded.empId} />
        <Field label="Employee Name"  value={decoded.empName || '—'} />
        <Field label="Phone"          value={decoded.empPhone || 'N/A'} />
        <Field label="Vehicle No"     value={decoded.vehicleNo} highlight />
        <Field label="Vehicle Type"   value={<span className="capitalize">{decoded.vehicleType}</span>} />
        <Field label="Slot"           value={decoded.slotId} highlight />
        <Field label="Entry Time"     value={decoded.entryTime ? new Date(decoded.entryTime).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : '—'} fullWidth />
        <Field label="Exit Time"      value={decoded.exitTime ? new Date(decoded.exitTime).toLocaleString('en-IN',{dateStyle:'medium',timeStyle:'short'}) : 'Still Parked'} fullWidth />
        {fine > 0 && <Field label="Pending Fine" value={`₹${fine}`} highlight isDanger fullWidth />}
      </div>

      {/* Raw JSON */}
      <div className="px-5 pb-5 mt-auto">
        <p className="text-[10px] font-bold text-teal-500 uppercase tracking-wider mb-2">Raw Data</p>
        <pre className="text-[11px] leading-relaxed font-mono bg-slate-800 text-teal-300 p-4 rounded-xl overflow-x-auto shadow-inner">{JSON.stringify(decoded, null, 2)}</pre>
      </div>
    </div>
  );
}

function Field({ label, value, highlight = false, isDanger = false, fullWidth = false }) {
  return (
    <div className={`flex flex-col gap-1 ${fullWidth ? 'col-span-2' : ''}`}>
      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{label}</span>
      <span className={`text-sm font-semibold ${
        highlight
          ? isDanger
            ? 'text-rose-600 text-xl font-black'
            : 'text-teal-700 bg-teal-50 border border-teal-100 px-2 py-1 rounded-lg inline-block w-max text-base'
          : 'text-slate-700'
      }`}>{value}</span>
    </div>
  );
}
