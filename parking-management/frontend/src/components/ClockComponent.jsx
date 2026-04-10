/* ClockComponent – Teal-themed real-time clock */
import { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';

export default function ClockComponent({ compact = false }) {
  const [now, setNow] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  const dateStr = now.toLocaleDateString([], { weekday: 'short', day: 'numeric', month: 'short' });

  if (compact) {
    return (
      <div className="flex items-center gap-1.5 bg-teal-50 border border-teal-100 text-teal-700 px-3 py-1.5 rounded-xl text-sm font-semibold">
        <Clock size={14} strokeWidth={2.5} />
        <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
        <span className="tabular-nums">{timeStr}</span>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-end">
      <div className="flex items-center gap-2 tabular-nums font-bold text-slate-700 text-base">
        <Clock size={15} className="text-teal-500" strokeWidth={2.5} />
        <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
        <span>{timeStr}</span>
      </div>
      <span className="text-[11px] font-semibold text-slate-400 tracking-wider uppercase">{dateStr}</span>
    </div>
  );
}
