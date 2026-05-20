import React, { useEffect, useState } from 'react';
import useCamera from '@/hooks/useCamera';
import useFaceVerification from '@/hooks/useFaceVerification';
import CameraPreview from '@/components/CameraPreview';
import Toast from '@/components/Toast';

interface SelfieViewProps {
  onSuccess: (verificationId: string, selfieBase64: string) => void;
  onCancel: () => void;
  actionType: 'check_in' | 'check_out';
}

export const SelfieView: React.FC<SelfieViewProps> = ({ onSuccess, onCancel, actionType }) => {
  const { videoRef, startCamera, stopCamera, capturePhoto, error: cameraError } = useCamera();
  const { verifyFace, isLoading: isVerifying, error: verifyError, reset: resetVerify } = useFaceVerification();
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  useEffect(() => {
    // Open front camera immediately on mount
    startCamera('user');
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Handle errors coming from verification service
  useEffect(() => {
    if (verifyError) {
      setToastMessage(verifyError);
    }
  }, [verifyError]);

  const handleCapture = async () => {
    resetVerify();
    const base64Image = capturePhoto();
    if (!base64Image) {
      setToastMessage('Gagal mengambil gambar. Pastikan izin kamera aktif.');
      return;
    }

    // Call face verification proxy endpoint
    const verificationId = await verifyFace(base64Image);
    if (verificationId) {
      onSuccess(verificationId, base64Image);
    }
  };

  const handleToastClose = () => {
    setToastMessage(null);
    resetVerify();
  };

  const titleAction = actionType === 'check_out' ? 'Clock Out' : 'Clock In';

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col justify-center min-h-[80vh]">
      {toastMessage && (
        <Toast message={toastMessage} type="error" onClose={handleToastClose} />
      )}

      <CameraPreview
        videoRef={videoRef}
        onCapture={handleCapture}
        onCancel={onCancel}
        isLoading={isVerifying}
        error={cameraError || verifyError}
        title={`Verifikasi Wajah (${titleAction})`}
        subTitle="Sejajarkan wajah Anda pada area lingkaran"
        onRetry={() => startCamera('user')}
      />
    </div>
  );
};

export default SelfieView;
