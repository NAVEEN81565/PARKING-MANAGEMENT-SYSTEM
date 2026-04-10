/* Alert – Teal-themed inline alert */
import { CheckCircle2, XCircle, X } from 'lucide-react';

const cfg = {
  success: { Icon: CheckCircle2, bg: 'bg-teal-50',  border: 'border-teal-200',  text: 'text-teal-800',  icon: 'text-teal-500'  },
  error:   { Icon: XCircle,      bg: 'bg-rose-50',  border: 'border-rose-200',  text: 'text-rose-800',  icon: 'text-rose-500'  },
};

export default function Alert({ type = 'success', message, onClose }) {
  if (!message) return null;
  const c = cfg[type] || cfg.error;
  const IconCmp = c.Icon;
  return (
    <div className={`flex items-start gap-2.5 p-3.5 rounded-xl border text-sm font-medium fade-in shadow-sm ${c.bg} ${c.border} ${c.text}`}>
      <IconCmp size={16} strokeWidth={2.5} className={`${c.icon} shrink-0 mt-0.5`} />
      <span className="flex-1 leading-relaxed">{message}</span>
      {onClose && (
        <button className="shrink-0 p-1 -mt-0.5 opacity-60 hover:opacity-100 hover:bg-black/5 rounded-md transition-all" onClick={onClose}>
          <X size={14} />
        </button>
      )}
    </div>
  );
}
