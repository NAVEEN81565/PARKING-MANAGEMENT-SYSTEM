/* BookingTable – Teal-themed reusable table */
import { Car, Bike, CircleDot, Clock, XCircle, CheckCircle2, FlagTriangleRight } from 'lucide-react';
import { useApp } from '../services/AppContext';

const fmt     = d => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = d => d ? new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '—';

const VehicleIcon = ({ type }) =>
  type === 'car'
    ? <div className="p-1 bg-teal-100 text-teal-700 rounded-md"><Car size={14} strokeWidth={2} /></div>
    : <div className="p-1 bg-purple-100 text-purple-700 rounded-md"><Bike size={14} strokeWidth={2} /></div>;

const StatusBadge = ({ status }) => {
  const map = {
    active:   { Icon: CircleDot,    cls: 'bg-teal-100 text-teal-700 border-teal-200',       label: 'Active',   pulse: true },
    expiring: { Icon: Clock,        cls: 'bg-amber-100 text-amber-700 border-amber-200',     label: 'Expiring'  },
    expired:  { Icon: XCircle,      cls: 'bg-rose-100 text-rose-700 border-rose-200',        label: 'Expired'   },
    exited:   { Icon: CheckCircle2, cls: 'bg-slate-100 text-slate-600 border-slate-200',     label: 'Exited'    },
  };
  const c = map[status] || map.active;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-bold uppercase tracking-wider ${c.cls}`}>
      <c.Icon size={10} strokeWidth={2.5} className={c.pulse ? 'animate-pulse' : ''} />
      {c.label}
    </span>
  );
};

export default function BookingTable({ bookings = [], showEmployee = false, showFine = true, showActions = false, onRelease, compact = false, maxRows }) {
  const { getBookingStatus, getRemainingTime, calculateFine } = useApp();
  const display = maxRows ? bookings.slice(0, maxRows) : bookings;

  if (display.length === 0) {
    return <div className="p-10 text-center text-slate-400 italic text-sm">No bookings found.</div>;
  }

  return (
    <table className="w-full text-left border-collapse whitespace-nowrap">
      <thead>
        <tr className="bg-teal-50/60 border-y border-teal-100 text-[11px] uppercase tracking-widest text-teal-700/70">
          <th className="px-4 py-3 font-bold text-center w-10">#</th>
          <th className="px-4 py-3 font-bold">Vehicle</th>
          <th className="px-4 py-3 font-bold">Type</th>
          <th className="px-4 py-3 font-bold">Slot</th>
          {showEmployee && <th className="px-4 py-3 font-bold">Employee</th>}
          {!compact && <th className="px-4 py-3 font-bold">Date</th>}
          <th className="px-4 py-3 font-bold">Entry</th>
          <th className="px-4 py-3 font-bold">Sched. Exit</th>
          <th className="px-4 py-3 font-bold">Remaining</th>
          <th className="px-4 py-3 font-bold">Status</th>
          {showFine && <th className="px-4 py-3 font-bold">Fine</th>}
          {showActions && <th className="px-4 py-3 font-bold text-right">Action</th>}
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {display.map((h, i) => {
          const status    = getBookingStatus(h);
          const remaining = getRemainingTime(h.scheduledExitTime);
          const fine      = h.exitTime ? (h.fineAmount || 0) : calculateFine(h.scheduledExitTime);
          const rowCls    = status === 'expired' ? 'bg-rose-50/30' : status === 'expiring' ? 'bg-amber-50/20' : 'hover:bg-teal-50/30';

          return (
            <tr key={i} className={`${rowCls} transition-colors group`}>
              <td className="px-4 py-3 text-center text-slate-400 text-xs">{i + 1}</td>
              <td className="px-4 py-3 font-bold text-slate-800">{h.vehicleNo}</td>
              <td className="px-4 py-3"><div className="flex items-center gap-2"><VehicleIcon type={h.vehicleType}/><span className="capitalize text-slate-600">{h.vehicleType}</span></div></td>
              <td className="px-4 py-3">
                <span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100 text-xs">{h.slotId}</span>
              </td>
              {showEmployee && <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{h.employeeName}</td>}
              {!compact && <td className="px-4 py-3 text-slate-400">{fmtDate(h.entryTime)}</td>}
              <td className="px-4 py-3 text-slate-600">{fmt(h.entryTime)}</td>
              <td className="px-4 py-3 text-slate-600">{fmt(h.scheduledExitTime)}</td>
              <td className="px-4 py-3">
                {h.exitTime
                  ? <span className="text-slate-400">Exited</span>
                  : remaining
                    ? <span className={remaining.overdue ? 'text-rose-600 font-bold' : 'text-teal-600 font-semibold'}>{remaining.text}</span>
                    : '—'}
              </td>
              <td className="px-4 py-3"><StatusBadge status={status} /></td>
              {showFine && (
                <td className="px-4 py-3">
                  {fine > 0
                    ? <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2 py-0.5 rounded-md">₹{fine}</span>
                    : <span className="text-slate-300">—</span>}
                </td>
              )}
              {showActions && (
                <td className="px-4 py-3 text-right">
                  {!h.exitTime
                    ? <button
                        className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white transition-all border border-rose-200 hover:border-rose-600 active:scale-95"
                        onClick={() => onRelease?.(h.vehicleNo)}
                      >
                        <FlagTriangleRight size={13} /> Release
                      </button>
                    : <span className="text-slate-300 text-xs">—</span>}
                </td>
              )}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}
