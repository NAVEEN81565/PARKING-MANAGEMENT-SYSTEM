/* QRScanner – Teal theme */
import { useState } from 'react';
import { ScanLine, Clock, AlertCircle, X, QrCode } from 'lucide-react';
import QRScannerComponent from '../components/QRScannerComponent';
import ScanResultCard from '../components/ScanResultCard';

export default function QRScanner() {
  const [decoded,        setDecoded]        = useState(null);
  const [error,          setError]          = useState('');
  const [recentBookings, setRecentBookings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('pms_bookings') || localStorage.getItem('pms_history') || '[]'); }
    catch { return []; }
  });

  const handleScanSuccess = async decodedText => {
    try {
      const data = JSON.parse(decodedText);
      if (data.empId && data.slotId) { setDecoded(data); setError(''); }
      else setError('QR does not contain valid parking data.');
    } catch {
      try {
        const { apiFetch } = await import('../services/api');
        const result = await apiFetch('/parking/qr/validate/', { method:'POST', body:{ qr_token: decodedText } });
        setDecoded({ empId:result.booking.employee_id, empName:result.booking.employee_name, vehicleNo:result.booking.vehicle_no, slotId:result.booking.slot_id, entryTime:result.booking.entry_time, exitTime:result.booking.exit_time });
        setError('');
      } catch { setError('Invalid QR data or unauthorized.'); setDecoded(null); }
    }
  };

  const handleSelectBooking = b => {
    setDecoded({ empId:b.employeeId, empName:b.employeeName, empPhone:b.phone||b.employeePhone, vehicleNo:b.vehicleNo, vehicleType:b.vehicleType, slotId:b.slotId, entryTime:b.entryTime, exitTime:b.exitTime||null, scheduledExitTime:b.scheduledExitTime||null });
    setError('');
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col gap-6 fade-in">

      {/* Header */}
      <div>
        <h1 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-2xl sm:text-3xl font-bold text-slate-800 tracking-tight mb-1 flex items-center gap-3">
          <span className="p-2 rounded-xl text-white" style={{ background: 'linear-gradient(135deg,#0f9b8e,#17c3b2)' }}>
            <ScanLine size={20} />
          </span>
          QR Scanner
        </h1>
        <p className="text-slate-400 text-sm mt-1 ml-12">Scan camera or upload a QR image to view booking details</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

        {/* Left panel */}
        <div className="flex flex-col gap-6">
          {/* Scanner card */}
          <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-teal-50 flex items-center justify-between"
              style={{ background: 'linear-gradient(135deg,#0f9b8e0a,transparent)' }}>
              <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-slate-800 flex items-center gap-2">
                <span className="p-1.5 bg-teal-100 text-teal-600 rounded-lg"><ScanLine size={15} /></span>
                Scan QR Code
              </h3>
              {decoded && (
                <button
                  className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-rose-600 hover:bg-rose-50 px-3 py-1.5 rounded-lg border border-slate-200 transition-colors"
                  onClick={() => { setDecoded(null); setError(''); }}>
                  <X size={13} /> Clear
                </button>
              )}
            </div>
            <div className="p-5 bg-slate-50/50 flex justify-center">
              <QRScannerComponent onScanSuccess={handleScanSuccess} onScanError={() => {}} />
            </div>
            {error && (
              <div className="mx-5 mb-5 p-3.5 bg-rose-50 border border-rose-200 text-rose-700 text-sm font-medium rounded-xl flex items-center gap-2 fade-in">
                <AlertCircle size={16} className="shrink-0" /> {error}
              </div>
            )}
          </div>

          {/* Recent bookings */}
          {recentBookings.length > 0 && (
            <div className="bg-white rounded-2xl shadow-sm border border-teal-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-teal-50"
                style={{ background: 'linear-gradient(135deg,#0f9b8e08,transparent)' }}>
                <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="font-bold text-slate-800 flex items-center gap-2">
                  <span className="p-1.5 bg-slate-100 text-slate-500 rounded-lg"><Clock size={15} /></span>
                  Recent Bookings
                </h3>
              </div>
              <div className="p-3 flex flex-col gap-2 max-h-[280px] overflow-y-auto">
                {recentBookings.slice().reverse().slice(0, 10).map((b, i) => (
                  <button key={i} onClick={() => handleSelectBooking(b)}
                    className="flex justify-between items-center px-4 py-3 bg-slate-50 hover:bg-teal-50 border border-transparent hover:border-teal-200 rounded-xl transition-all text-left group">
                    <div className="flex items-center gap-3">
                      <span className="font-bold text-teal-700 bg-teal-50 group-hover:bg-white border border-teal-100 px-2 py-0.5 rounded-md text-xs transition-colors">{b.slotId}</span>
                      <span className="font-bold text-slate-700 text-sm tracking-wide">{b.vehicleNo}</span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">
                      {new Date(b.entryTime).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right: result or placeholder */}
        <div className="min-h-[400px]">
          {decoded ? (
            <ScanResultCard decoded={decoded} />
          ) : (
            <div className="bg-white rounded-2xl shadow-sm border border-teal-100 h-full min-h-[400px] flex flex-col items-center justify-center p-10 text-center gap-5">
              <div className="h-24 w-24 rounded-full flex items-center justify-center text-slate-200"
                style={{ background: 'linear-gradient(135deg,#f0fdf4,#f0fdfa)' }}>
                <QrCode size={44} strokeWidth={1} />
              </div>
              <div>
                <h3 style={{ fontFamily: 'Poppins, sans-serif' }} className="text-xl font-bold text-slate-700 mb-2">Waiting for Scan…</h3>
                <p className="text-slate-400 text-sm leading-relaxed max-w-[220px] mx-auto">
                  Point your camera at a parking QR code, or select a recent booking.
                </p>
              </div>
              <div className="flex items-center gap-1.5 text-teal-500 text-xs font-semibold bg-teal-50 border border-teal-100 px-4 py-2 rounded-full">
                <span className="w-2 h-2 bg-teal-400 rounded-full animate-pulse" />
                Scanner ready
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
