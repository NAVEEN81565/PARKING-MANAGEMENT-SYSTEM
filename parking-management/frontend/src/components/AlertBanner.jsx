/* AlertBanner – Teal-themed dismissible banner */
import { useState } from 'react';
import { AlertCircle, AlertTriangle, CheckCircle2, Info, X } from 'lucide-react';

const cfg = {
  info:    { icon: Info,          bg: 'bg-teal-50',    border: 'border-teal-200',   text: 'text-teal-800',   iconCls: 'text-teal-500'   },
  warning: { icon: AlertTriangle, bg: 'bg-amber-50',   border: 'border-amber-200',  text: 'text-amber-800',  iconCls: 'text-amber-500'  },
  danger:  { icon: AlertCircle,   bg: 'bg-rose-50',    border: 'border-rose-200',   text: 'text-rose-800',   iconCls: 'text-rose-500'   },
  success: { icon: CheckCircle2,  bg: 'bg-emerald-50', border: 'border-emerald-200',text: 'text-emerald-800',iconCls: 'text-emerald-500'},
};

export default function AlertBanner({ type = 'info', message, dismissible = true, children }) {
  const [visible, setVisible] = useState(true);
  if (!visible || (!message && !children)) return null;
  const c = cfg[type] || cfg.info;
  const IconCmp = c.icon;
  return (
    <div className={`flex items-start gap-3 p-4 rounded-2xl border fade-in shadow-sm ${c.bg} ${c.border} ${c.text}`}>
      <IconCmp size={18} className={`${c.iconCls} shrink-0 mt-0.5`} />
      <div className="flex-1 text-sm font-medium leading-relaxed">{message || children}</div>
      {dismissible && (
        <button className="shrink-0 p-1 -mt-0.5 opacity-60 hover:opacity-100 hover:bg-black/5 rounded-lg transition-colors" onClick={() => setVisible(false)}>
          <X size={15} />
        </button>
      )}
    </div>
  );
}
