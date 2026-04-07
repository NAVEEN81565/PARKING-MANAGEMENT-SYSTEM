import { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

export default function QRScannerComponent({ onScanSuccess, onScanError }) {
  const scannerRef = useRef(null);

  useEffect(() => {
    // Basic configuration for the scanner
    const config = {
      fps: 10,
      qrbox: { width: 250, height: 250 },
      rememberLastUsedCamera: true,
      supportedScanTypes: [] // Empty defaults to all (Camera + File)
    };

    // Initialize the scanner targeting the id="qr-reader" element
    scannerRef.current = new Html5QrcodeScanner("qr-reader", config, false);

    const handleSuccess = (decodedText, decodedResult) => {
      if (onScanSuccess) {
        onScanSuccess(decodedText, decodedResult);
      }
    };

    const handleError = (error) => {
      if (onScanError) {
        onScanError(error);
      }
    };

    scannerRef.current.render(handleSuccess, handleError);

    // Cleanup when component unmounts
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(err => {
          console.error("Failed to clear html5QrcodeScanner", err);
        });
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div 
      id="qr-reader" 
      style={{
        width: '100%', 
        maxWidth: '500px', 
        background: 'var(--bg-card)', 
        borderRadius: '12px',
        overflow: 'hidden',
        border: '1px solid var(--border)'
      }} 
    />
  );
}
