import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { RefreshCw, X, Image as ImageIcon } from 'lucide-react';
import Button from './UI/Button';

interface QrScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onCancel: () => void;
}

export const QrScanner: React.FC<QrScannerProps> = ({ onScanSuccess, onCancel }) => {
  const [error, setError] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState(false);
  const [isScanningFile, setIsScanningFile] = useState(false);
  const html5QrcodeRef = useRef<HTMLVideoElement | any | null>(null);
  const qrRegionId = 'qr-reader-element';
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const startScanner = async () => {
    setError(null);
    setPermissionError(false);
    try {
      // Clean up previous reader if running
      if (html5QrcodeRef.current) {
        try {
          await html5QrcodeRef.current.stop();
        } catch (e) {
          // ignore error
        }
      }

      const html5Qrcode = new Html5Qrcode(qrRegionId);
      html5QrcodeRef.current = html5Qrcode;

      const config = {
        fps: 10,
        qrbox: (width: number, height: number) => {
          const size = Math.min(width, height) * 0.7;
          return { width: size, height: size };
        },
      };

      // scanner menggunakan kamera belakang
      await html5Qrcode.start(
        { facingMode: 'environment' },
        config,
        (decodedText) => {
          // Release camera resource immediately upon detection
          html5Qrcode.stop().then(() => {
            onScanSuccess(decodedText);
          }).catch((err) => {
            console.error('Failed to stop QR reader safely:', err);
            onScanSuccess(decodedText);
          });
        },
        () => {
          // ignore video frames where QR is not found
        }
      );
    } catch (err: any) {
      console.error('Error starting QR reader:', err);
      let errMsg = 'Gagal memulai pemindai QR.';
      if (err.toString().includes('NotAllowedError') || err.name === 'NotAllowedError') {
        errMsg = 'Izin kamera ditolak. Silakan izinkan kamera di browser Anda.';
        setPermissionError(true);
      } else if (err.toString().includes('NotFoundError')) {
        errMsg = 'Kamera belakang tidak ditemukan pada perangkat ini.';
      }
      setError(errMsg);
    }
  };

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setIsScanningFile(true);

    try {
      // 1. Stop camera scanning if active
      if (html5QrcodeRef.current) {
        try {
          await html5QrcodeRef.current.stop();
        } catch (err) {
          // ignore stop error
        }
      }

      // 2. Setup reader
      let html5Qrcode = html5QrcodeRef.current;
      if (!html5Qrcode) {
        html5Qrcode = new Html5Qrcode(qrRegionId);
        html5QrcodeRef.current = html5Qrcode;
      }

      // 3. Scan file
      const decodedText = await html5Qrcode.scanFile(file, false);

      // 4. Trigger success callback
      onScanSuccess(decodedText);
    } catch (err: any) {
      console.error('Failed to decode QR code from file:', err);
      setError('Gagal membaca QR Code dari galeri. Pastikan gambar memiliki QR Code yang jelas.');

      // Attempt to restart camera
      startScanner();
    } finally {
      setIsScanningFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  useEffect(() => {
    startScanner();

    return () => {
      if (html5QrcodeRef.current) {
        try {
          html5QrcodeRef.current.stop().catch((e) => console.log('Cleanup qr reader error:', e));
        } catch (e) {
          // ignore
        }
      }
    };
  }, []);

  return (
    <div className="relative flex flex-col items-center justify-between min-h-[460px] w-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-900 p-6 shadow-2xl">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between z-10">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">Pindai Kode QR</h3>
          <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">Arahkan kamera belakang ke kode QR absensi</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Reader Box */}
      <div className="relative w-full aspect-square max-w-[280px] rounded-3xl overflow-hidden border-2 border-zinc-800 bg-zinc-900/60 flex items-center justify-center my-6 shadow-2xl">
        <div
          id={qrRegionId}
          className={`w-full h-full object-cover [&_video]:object-cover [&_video]:w-full [&_video]:h-full ${error ? 'hidden' : 'block'}`}
        />

        {error ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 gap-3">
            <p className="text-[11px] font-bold text-red-400">{error}</p>
            {permissionError && (
              <Button size="sm" variant="secondary" onClick={startScanner} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Buka Kamera
              </Button>
            )}
          </div>
        ) : (
          /* Scanning Overlay Guideline Box */
          <div className="absolute inset-12 border-2 border-blue-500 rounded-2xl pointer-events-none ring-4 ring-blue-500/10">
            {/* Scan Laser Animation */}
            <div
              className="w-full h-0.5 bg-blue-500 shadow-md shadow-blue-400 absolute left-0"
              style={{
                animation: 'scan-line 2s ease-in-out infinite',
              }}
            />
          </div>
        )}
      </div>

      {/* Bottom Controls */}
      <div className="w-full flex flex-col items-center gap-4 z-10">
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileChange}
          accept="image/*"
          className="hidden"
        />

        <button
          type="button"
          onClick={handleGalleryClick}
          disabled={isScanningFile}
          className="w-full py-3.5 px-4 rounded-2xl border border-zinc-800 hover:border-zinc-700 bg-zinc-900/60 hover:bg-zinc-900 text-zinc-300 hover:text-white text-xs font-bold transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <ImageIcon className="w-4 h-4 text-blue-500" />
          {isScanningFile ? 'Membaca QR...' : 'Pilih dari Galeri'}
        </button>

        <div className="text-[9px] font-extrabold text-zinc-500 animate-pulse tracking-widest uppercase">
          {isScanningFile ? 'Mendekode...' : 'Memindai...'}
        </div>
      </div>
    </div>
  );
};

export default QrScanner;
