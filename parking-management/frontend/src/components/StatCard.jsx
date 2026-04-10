/* StatCard – Teal-themed metric card with Lucide icon */
export default function StatCard({ icon: Icon, label, value, accent = 'primary', subtitle }) {
  const accentMap = {
    primary: { bg: 'bg-teal-500',   icon: 'text-white',     card: 'border-teal-100',   shadow: 'hover:shadow-teal-100/60' },
    success: { bg: 'bg-emerald-500', icon: 'text-white',     card: 'border-emerald-100', shadow: 'hover:shadow-emerald-100/60' },
    danger:  { bg: 'bg-rose-500',   icon: 'text-white',     card: 'border-rose-100',   shadow: 'hover:shadow-rose-100/60' },
    warning: { bg: 'bg-amber-400',  icon: 'text-white',     card: 'border-amber-100',  shadow: 'hover:shadow-amber-100/60' },
  };
  const a = accentMap[accent] || accentMap.primary;

  return (
    <div className={`bg-white rounded-2xl p-5 flex items-center gap-4 border ${a.card} shadow-sm hover:shadow-lg ${a.shadow} transition-all duration-300 hover:-translate-y-1 group`}>
      <div className={`h-12 w-12 rounded-xl ${a.bg} flex items-center justify-center shrink-0 shadow-md group-hover:scale-110 transition-transform duration-300`}>
        {Icon && <Icon size={22} strokeWidth={2} className={a.icon} />}
      </div>
      <div className="min-w-0">
        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-0.5 truncate">{label}</p>
        <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl font-bold text-slate-800 leading-none truncate">{value}</h3>
        {subtitle && <p className="text-xs text-slate-400 mt-1 truncate">{subtitle}</p>}
      </div>
    </div>
  );
}
