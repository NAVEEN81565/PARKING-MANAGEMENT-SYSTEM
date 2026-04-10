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
      className="w-full max-w-[500px] bg-white rounded-xl overflow-hidden border border-slate-200 shadow-sm [&_video]:rounded-lg [&_button]:mt-4 [&_button]:px-4 [&_button]:py-2 [&_button]:bg-blue-600 [&_button]:text-white [&_button]:font-semibold [&_button]:rounded-lg hover:[&_button]:bg-blue-700" 
    />
  );
}
