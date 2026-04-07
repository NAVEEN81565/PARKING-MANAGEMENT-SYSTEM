/* QRCodeGenerator – reusable QR code renderer with download/print support */
import { useRef, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import styles from './QRCodeGenerator.module.css';

/**
 * @param {{ bookingData: object }} props
 * bookingData shape: { employeeId, employeeName, employeePhone, vehicleNo, vehicleType, slotId, entryTime, exitTime }
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

    // Create a richer image: QR + label
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
    <div className={styles.qrWrapper}>
      {/* Decorative ring */}
      <div className={styles.qrRing}>
        <div className={styles.qrCanvas} ref={qrRef}>
          <QRCodeCanvas
            value={qrValue}
            size={220}
            level="H"
            bgColor="#ffffff"
            fgColor="#1e1b4b"
            includeMargin={true}
            imageSettings={{
              src: '',
              excavate: false,
            }}
          />
        </div>
      </div>

      {/* Scan hint */}
      <p className={styles.scanHint}>
        <span className={styles.scanIcon}>📱</span>
        Scan to view parking details
      </p>

      {/* Action buttons */}
      <div className={styles.qrActions}>
        <button className={styles.btnDownload} onClick={handleDownload}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download QR
        </button>
        <button className={styles.btnPrint} onClick={handlePrint}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <polyline points="6 9 6 2 18 2 18 9" />
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
            <rect x="6" y="14" width="12" height="8" />
          </svg>
          Print
        </button>
      </div>
    </div>
  );
}
