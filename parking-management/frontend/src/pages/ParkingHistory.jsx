/* ParkingHistory – Teal-themed with modern filter bar */
import { useState } from 'react';
import { useApp } from '../services/AppContext';
import { Download, Search, History, Car, Bike } from 'lucide-react';

const fmt     = d => d ? new Date(d).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—';
const fmtDate = d => d ? new Date(d).toLocaleDateString([], { day: 'numeric', month: 'short' }) : '—';

export default function ParkingHistory() {
  const { history, user, getBookingStatus, calculateFine, getRemainingTime, freeSlot } = useApp();
  const [typeFilter,   setTypeFilter]   = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [search,       setSearch]       = useState('');
  const [startDate,    setStartDate]    = useState('');
  const [endDate,      setEndDate]      = useState('');

  const base = user?.role === 'admin' ? history : history.filter(h => h.employeeId === user?.id);
  const filtered = base.filter(h => {
    const matchType   = typeFilter === 'all' || h.vehicleType === typeFilter;
    const status      = getBookingStatus(h);
    const matchStatus = statusFilter === 'all' ? true
      : statusFilter === 'active'  ? (status === 'active' || status === 'expiring')
      : statusFilter === 'expired' ? status === 'expired'
      : status === 'exited';
    const matchSearch = !search
      || h.vehicleNo.toUpperCase().includes(search.toUpperCase())
      || h.slotId.includes(search.toUpperCase());
    let matchDate = true;
    if (startDate || endDate) {
      const ed = new Date(h.entryTime); ed.setHours(0,0,0,0);
      if (startDate) { const s = new Date(startDate); s.setHours(0,0,0,0); if (ed < s) matchDate = false; }
      if (endDate)   { const e2 = new Date(endDate);  e2.setHours(0,0,0,0); if (ed > e2) matchDate = false; }
    }
    return matchType && matchStatus && matchSearch && matchDate;
  });

  const exportToCSV = () => {
    const headers = ['Vehicle No','Type','Slot',...(user?.role==='admin'?['Employee']:[]),'Date','Entry','Sched. Exit','Actual Exit','Dur. (min)','Status','Fine (₹)'];
    const rows = [headers.join(',')];
    filtered.forEach(h => {
      const status = getBookingStatus(h);
      const fine   = h.exitTime ? (h.fineAmount || 0) : calculateFine(h.scheduledExitTime);
      rows.push([h.vehicleNo,h.vehicleType,h.slotId,...(user?.role==='admin'?[h.employeeName||'']:[]),fmtDate(h.entryTime),fmt(h.entryTime),fmt(h.scheduledExitTime),h.exitTime?fmt(h.exitTime):'',h.duration??'',status,fine].map(c=>`"${c}"`).join(','));
    });
    const a = document.createElement('a');
    a.href = 'data:text/csv;charset=utf-8,' + encodeURI(rows.join('\n'));
    a.download = `parking_history_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleRelease = vehicleNo => {
    if (!window.confirm(`Release vehicle ${vehicleNo}?`)) return;
    freeSlot(vehicleNo);
  };

  return (
    <div className="max-w-7xl mx-auto flex flex-col gap-6 fade-in">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1">Parking History</h1>
          <p className="text-slate-400 text-sm">
            {user?.role === 'admin' ? 'Full log of all parking records with fines' : 'Your personal parking history'}
          </p>
        </div>
        <div className="flex items-center gap-2 bg-teal-50 border border-teal-100 text-teal-700 px-4 py-2 rounded-xl font-semibold text-sm">
          <History size={16} /> {filtered.length} records
        </div>
      </div>

      {/* Filter card */}
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 p-5 flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row flex-wrap gap-3">
          {/* Search */}
          <div className="relative w-full sm:w-64 shrink-0">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-500 focus:bg-white transition-all placeholder:text-slate-400"
              placeholder="Search vehicle or slot…" value={search} onChange={e => setSearch(e.target.value)} />
          </div>

          {user?.role === 'admin' && (
            <div className="flex items-center gap-2 flex-wrap">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-500 transition-all" />
              <span className="text-slate-400 text-sm font-medium">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-600 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400/50 focus:border-teal-500 transition-all" />
            </div>
          )}

          {user?.role === 'admin' && (
            <button onClick={exportToCSV}
              className="ml-auto flex items-center gap-2 px-4 py-2.5 bg-teal-50 hover:bg-teal-100 text-teal-700 border border-teal-200 rounded-xl font-semibold text-sm transition-colors">
              <Download size={15} strokeWidth={2.5} /> Export CSV
            </button>
          )}
        </div>

        <div className="w-full h-px bg-teal-50" />

        <div className="flex flex-col sm:flex-row justify-between gap-3">
          {/* Type pills */}
          <div className="flex bg-teal-50 p-1 rounded-xl w-max gap-1">
            {[{id:'all',label:'All'},{id:'car',label:'Cars',Icon:Car},{id:'bike',label:'Bikes',Icon:Bike}].map(f => (
              <button key={f.id} onClick={() => setTypeFilter(f.id)}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${typeFilter===f.id?'bg-white text-teal-700 shadow-sm':'text-teal-600/70 hover:text-teal-700'}`}>
                {f.Icon && <f.Icon size={14} />} {f.label}
              </button>
            ))}
          </div>
          {/* Status pills */}
          <div className="flex flex-wrap bg-slate-100 p-1 rounded-xl gap-1 w-max">
            {[{id:'all',label:'All'},{id:'active',label:'Active',dot:'bg-teal-400'},{id:'expired',label:'Expired',dot:'bg-rose-400'},{id:'exited',label:'Exited',dot:'bg-slate-400'}].map(f => (
              <button key={f.id} onClick={() => setStatusFilter(f.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${statusFilter===f.id?'bg-white text-slate-800 shadow-sm':'text-slate-500 hover:text-slate-700'}`}>
                {f.dot && <span className={`w-2 h-2 rounded-full ${f.dot}`} />} {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap min-w-[860px]">
          <thead>
            <tr className="bg-teal-50/60 border-b border-teal-100 text-[11px] uppercase tracking-widest text-teal-700/70">
              <th className="px-4 py-3 font-bold text-center w-10">#</th>
              <th className="px-4 py-3 font-bold">Vehicle</th>
              <th className="px-4 py-3 font-bold">Type</th>
              <th className="px-4 py-3 font-bold">Slot</th>
              {user?.role === 'admin' && <th className="px-4 py-3 font-bold">Employee</th>}
              <th className="px-4 py-3 font-bold">Date</th>
              <th className="px-4 py-3 font-bold">Entry → Sched. Exit</th>
              <th className="px-4 py-3 font-bold">Actual Exit</th>
              <th className="px-4 py-3 font-bold">Status / Fine</th>
              {user?.role === 'admin' && <th className="px-4 py-3 font-bold text-right">Action</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-sm">
            {filtered.length === 0 ? (
              <tr><td colSpan="10" className="px-5 py-12 text-center text-slate-400 italic">No records found for the selected filters.</td></tr>
            ) : filtered.map((h, i) => {
              const status    = getBookingStatus(h);
              const fine      = h.exitTime ? (h.fineAmount || 0) : calculateFine(h.scheduledExitTime);
              const remaining = getRemainingTime(h.scheduledExitTime);
              const rowBg     = status === 'expired' ? 'bg-rose-50/40' : status === 'expiring' ? 'bg-amber-50/30' : 'hover:bg-teal-50/30';

              return (
                <tr key={i} className={`${rowBg} transition-colors`}>
                  <td className="px-4 py-3 text-center text-slate-400 text-xs">{i + 1}</td>
                  <td className="px-4 py-3 font-bold text-slate-800">{h.vehicleNo}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      {h.vehicleType === 'car'
                        ? <div className="p-1 bg-teal-100 text-teal-700 rounded"><Car size={14}/></div>
                        : <div className="p-1 bg-purple-100 text-purple-700 rounded"><Bike size={14}/></div>}
                      <span className="capitalize text-slate-600">{h.vehicleType}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-bold text-teal-700 bg-teal-50 px-2 py-1 rounded-lg border border-teal-100 text-xs">{h.slotId}</span>
                  </td>
                  {user?.role === 'admin' && <td className="px-4 py-3 text-slate-500 max-w-[120px] truncate">{h.employeeName}</td>}
                  <td className="px-4 py-3 text-slate-400 font-medium">{fmtDate(h.entryTime)}</td>
                  <td className="px-4 py-3 font-medium">
                    <span className="text-slate-700">{fmt(h.entryTime)}</span>
                    <span className="text-slate-300 mx-1">→</span>
                    <span className="text-slate-500">{fmt(h.scheduledExitTime)}</span>
                  </td>
                  <td className="px-4 py-3">
                    {h.exitTime
                      ? <div><span className="font-medium text-slate-700">{fmt(h.exitTime)}</span><span className="block text-xs text-slate-400">{h.duration} min</span></div>
                      : <div>
                          <span className="text-slate-300 italic">—</span>
                          {remaining && !remaining.overdue && <span className="block text-xs text-teal-600">{remaining.text}</span>}
                          {remaining && remaining.overdue  && <span className="block text-xs font-bold text-rose-600">{remaining.text}</span>}
                        </div>
                    }
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1 items-start">
                      {status === 'active'   && <span className="px-2 py-0.5 bg-teal-100 text-teal-700 border border-teal-200 text-[10px] font-bold uppercase tracking-wider rounded">Active</span>}
                      {status === 'expiring' && <span className="px-2 py-0.5 bg-amber-100 text-amber-700 border border-amber-200 text-[10px] font-bold uppercase tracking-wider rounded">Expiring</span>}
                      {status === 'expired'  && <span className="px-2 py-0.5 bg-rose-100 text-rose-700 border border-rose-200 text-[10px] font-bold uppercase tracking-wider rounded">Expired</span>}
                      {status === 'exited'   && <span className="px-2 py-0.5 bg-slate-200 text-slate-600 border border-slate-300 text-[10px] font-bold uppercase tracking-wider rounded">Exited</span>}
                      {fine > 0 ? <span className="text-rose-600 font-bold text-xs">₹{fine}</span> : <span className="text-slate-300 text-xs italic">No fine</span>}
                    </div>
                  </td>
                  {user?.role === 'admin' && (
                    <td className="px-4 py-3 text-right">
                      {!h.exitTime
                        ? <button className="bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors shadow-sm" onClick={() => handleRelease(h.vehicleNo)}>End Session</button>
                        : <span className="text-slate-300 text-xs mr-2">Done</span>}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
