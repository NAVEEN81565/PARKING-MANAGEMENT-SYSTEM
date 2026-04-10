/* QRCodeGenerator – reusable QR code renderer with download/print support (Tailwind CSS Redesign) */
import { useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { Smartphone, Download, Printer } from 'lucide-react';

/**
 * @param {{ bookingData: object }} props
 */
export default function QRCodeGenerator({ bookingData }) {
  const qrRef = useRef(null);

  if (!bookingData) return null;

  // Encode booking details as compact JSON
  const qrValue = JSON.stringify({
    empId:       bookingData.employeeId,
    empName:     bookingData.employeeName,
    empPhone:    bookingData.employeePhone || 'N/A',
    vehicleNo:   bookingData.vehicleNo,
    vehicleType: bookingData.vehicleType,
    slotId:      bookingData.slotId,
    entryTime:   bookingData.entryTime,
    exitTime:    bookingData.exitTime || null,
  });

  /* ── Download QR as PNG ────────────────────────────────────── */
  const handleDownload = useCallback(() => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    const size = 300;
    const padding = 40;
    const labelHeight = 50;
    const totalH = size + padding * 2 + labelHeight;
    const totalW = size + padding * 2;

    const offscreen = document.createElement('canvas');
    offscreen.width = totalW;
    offscreen.height = totalH;
    const ctx = offscreen.getContext('2d');

    // Background
    ctx.fillStyle = '#ffffff';
    ctx.roundRect?.(0, 0, totalW, totalH, 16);
    ctx.fill();

    // Draw QR
    ctx.drawImage(canvas, padding, padding, size, size);

    // Label text
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 14px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`Slot ${bookingData.slotId} • ${bookingData.vehicleNo}`, totalW / 2, size + padding + 28);

    ctx.fillStyle = '#64748b';
    ctx.font = '11px Inter, sans-serif';
    ctx.fillText('Parking Management System', totalW / 2, size + padding + 46);

    const url = offscreen.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `parking-qr-${bookingData.slotId}-${bookingData.vehicleNo}.png`;
    a.click();
  }, [bookingData]);

  /* ── Print QR ──────────────────────────────────────────────── */
  const handlePrint = useCallback(() => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    const imgData = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    if (!win) return;

    win.document.write(`
      <html>
        <head><title>Parking QR – ${bookingData.slotId}</title></head>
        <body style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:100vh;font-family:Inter,sans-serif;margin:0;">
          <h2 style="margin:0 0 6px;color:#0f172a;">Parking Pass</h2>
          <p style="margin:0 0 20px;color:#64748b;font-size:14px;">Slot ${bookingData.slotId} • ${bookingData.vehicleNo}</p>
          <img src="${imgData}" width="260" height="260" />
          <p style="margin:16px 0 4px;font-weight:600;color:#0f172a;">${bookingData.employeeName}</p>
          <p style="margin:0;color:#64748b;font-size:13px;">${bookingData.vehicleType === 'car' ? '🚗 Car' : '🏍️ Bike'} • ${new Date(bookingData.entryTime).toLocaleString()}</p>
        </body>
      </html>
    `);
    win.document.close();
    win.onload = () => { win.print(); win.close(); };
  }, [bookingData]);

  return (
    <div className="flex flex-col items-center">
      {/* Decorative ring */}
      <div className="relative p-3 bg-gradient-to-br from-blue-50 to-emerald-50 rounded-3xl shadow-inner border border-blue-100/50">
        <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100" ref={qrRef}>
          <QRCodeCanvas
            value={qrValue}
            size={220}
            level="H"
            bgColor="#ffffff"
            fgColor="#1e293b"
            includeMargin={true}
            imageSettings={{
              src: '',
              excavate: false,
            }}
          />
        </div>
      </div>

      {/* Scan hint */}
      <p className="flex items-center gap-2 mt-6 mb-8 text-sm font-semibold text-slate-500 tracking-wide">
        <Smartphone size={16} className="text-blue-500 animate-pulse" />
        Scan to view parking details
      </p>

      {/* Action buttons */}
      <div className="flex w-full gap-3">
        <button 
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all active:scale-95 shadow-sm" 
          onClick={handleDownload}
        >
          <Download size={16} strokeWidth={2.5} />
          Download
        </button>
        <button 
          className="flex-1 flex items-center justify-center gap-2 py-2.5 px-4 bg-white border border-slate-300 text-slate-700 rounded-xl font-semibold hover:bg-slate-50 hover:text-blue-600 hover:border-blue-300 transition-all active:scale-95 shadow-sm" 
          onClick={handlePrint}
        >
          <Printer size={16} strokeWidth={2.5} />
          Print
        </button>
      </div>
    </div>
  );
}
