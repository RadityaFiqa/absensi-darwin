import { useState, useCallback, useRef } from 'react';

export const useCamera = () => {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startCamera = useCallback(async (facingMode: 'user' | 'environment' = 'user') => {
    setIsLoading(true);
    setError(null);
    
    // Stop any existing stream using ref to avoid state-trigger dependencies
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      const constraints: MediaStreamConstraints = {
        video: {
          facingMode: facingMode,
          width: { ideal: 640 },
          height: { ideal: 480 },
        },
        audio: false,
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = mediaStream;
      setStream(mediaStream);

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        // Wait for metadata to load and then play
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch((err) => {
            console.error('Error playing camera feed:', err);
          });
        };
      }
    } catch (err: any) {
      console.error('Failed to open camera:', err);
      let friendlyMessage = 'Gagal mengakses kamera.';
      if (err.name === 'NotAllowedError') {
        friendlyMessage = 'Izin kamera ditolak. Harap berikan izin di pengaturan browser Anda.';
      } else if (err.name === 'NotFoundError') {
        friendlyMessage = 'Perangkat kamera tidak ditemukan.';
      }
      setError(friendlyMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setStream(null);
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, []);

  const capturePhoto = useCallback((): string | null => {
    if (!videoRef.current) return null;
    try {
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      
      // We want to crop a centered square for optimal face verification
      const videoWidth = video.videoWidth || 640;
      const videoHeight = video.videoHeight || 480;
      const size = Math.min(videoWidth, videoHeight);

      canvas.width = 400; // Standardize output size to keep base64 string lightweight
      canvas.height = 400;

      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      // Calculate centering offset
      const sx = (videoWidth - size) / 2;
      const sy = (videoHeight - size) / 2;

      ctx.drawImage(video, sx, sy, size, size, 0, 0, 400, 400);

      // Return standard base64 image jpeg
      return canvas.toDataURL('image/jpeg', 0.85);
    } catch (err) {
      console.error('Error capturing image frame:', err);
      return null;
    }
  }, []);

  return {
    videoRef,
    startCamera,
    stopCamera,
    capturePhoto,
    isLoading,
    error,
    isActive: !!stream,
  };
};

export default useCamera;
