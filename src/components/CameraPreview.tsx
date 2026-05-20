import React, { useRef } from 'react';
import { Camera, X, RefreshCw, Image as ImageIcon } from 'lucide-react';
import Button from './UI/Button';

interface CameraPreviewProps {
  videoRef: React.RefObject<HTMLVideoElement | null>;
  onCapture: () => void;
  onCancel: () => void;
  isLoading?: boolean;
  error: string | null;
  title: string;
  subTitle: string;
  onRetry?: () => void;
  facingMode?: 'user' | 'environment';
  onToggleFacingMode?: () => void;
  onGalleryImport?: (base64: string) => void;
}

export const CameraPreview: React.FC<CameraPreviewProps> = ({
  videoRef,
  onCapture,
  onCancel,
  isLoading = false,
  error,
  title,
  subTitle,
  onRetry,
  facingMode = 'user',
  onToggleFacingMode,
  onGalleryImport,
}) => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleGalleryClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = 400;
        canvas.height = 400;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          const size = Math.min(img.width, img.height);
          const sx = (img.width - size) / 2;
          const sy = (img.height - size) / 2;
          ctx.drawImage(img, sx, sy, size, size, 0, 0, 400, 400);
          const base64 = canvas.toDataURL('image/jpeg', 0.85);
          if (onGalleryImport) {
            onGalleryImport(base64);
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="relative flex flex-col items-center justify-between min-h-[460px] w-full bg-zinc-950 rounded-3xl overflow-hidden border border-zinc-900 p-6 shadow-2xl animate-in fade-in duration-200">
      {/* Header Info */}
      <div className="w-full flex items-center justify-between z-10">
        <div>
          <h3 className="text-sm font-bold text-white tracking-wide">{title}</h3>
          <p className="text-[10px] font-semibold text-zinc-400 mt-0.5">{subTitle}</p>
        </div>
        <button
          onClick={onCancel}
          className="p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Frame Ring / Error Layout */}
      <div className="relative w-full aspect-square max-w-[280px] rounded-full overflow-hidden border-[6px] border-blue-500/20 bg-zinc-900/60 flex items-center justify-center my-6 shadow-inner ring-4 ring-blue-500/10">
        {error ? (
          <div className="flex flex-col items-center justify-center text-center p-6 gap-3">
            <p className="text-[11px] font-bold text-red-400">{error}</p>
            {onRetry && (
              <Button size="sm" variant="secondary" onClick={onRetry} leftIcon={<RefreshCw className="w-3.5 h-3.5" />}>
                Minta Akses Kamera
              </Button>
            )}
          </div>
        ) : (
          <>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-cover ${facingMode === 'user' ? 'scale-x-[-1]' : ''}`}
            />
            {/* Pulsing Face Guide */}
            <div className="absolute inset-0 border-[6px] border-transparent rounded-full pointer-events-none ring-4 ring-blue-500/30 ring-offset-4 ring-offset-zinc-950/20 animate-pulse" />
          </>
        )}
      </div>

      {/* Shutter Panel Control Strip */}
      <div className="w-full flex items-center justify-between px-4 z-10">
        {/* Toggle facingMode */}
        {onToggleFacingMode ? (
          <button
            type="button"
            onClick={onToggleFacingMode}
            disabled={!!error || isLoading}
            className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-90 hover:scale-105 disabled:opacity-50 cursor-pointer"
            title="Ganti Kamera"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        ) : (
          <div className="w-12 h-12" />
        )}

        {/* Shutter Capture Button */}
        <button
          onClick={onCapture}
          disabled={!!error || isLoading}
          className="flex items-center justify-center w-16 h-16 rounded-full border-[6px] border-white/20 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-xl shadow-blue-500/30 transition-transform active:scale-90 hover:scale-105 disabled:opacity-50 cursor-pointer"
        >
          <Camera className="w-6 h-6" />
        </button>

        {/* Gallery Import */}
        {onGalleryImport ? (
          <div>
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
              disabled={isLoading}
              className="flex items-center justify-center w-12 h-12 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white transition-all active:scale-90 hover:scale-105 disabled:opacity-50 cursor-pointer"
              title="Pilih dari Galeri"
            >
              <ImageIcon className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="w-12 h-12" />
        )}
      </div>
    </div>
  );
};

export default CameraPreview;
