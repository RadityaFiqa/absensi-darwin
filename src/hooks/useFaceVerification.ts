import { useState } from 'react';
import { useAuth } from './useAuth';
import attendanceService from '@/services/attendance.service';

export const useFaceVerification = () => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [verificationId, setVerificationId] = useState<string | null>(null);

  const verifyFace = async (imageBase64: string): Promise<string | null> => {
    if (!token) {
      setError('Sesi pengguna tidak valid. Silakan masuk kembali.');
      return null;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await attendanceService.verifyFace(token, imageBase64);
      if (response.status === 1 && response.verification_result === 1) {
        setVerificationId(response.verification_id);
        return response.verification_id;
      } else {
        setError(response.message || 'Verifikasi wajah gagal. Silakan coba lagi.');
        return null;
      }
    } catch (err: any) {
      setError(err.message || 'Sistem verifikasi wajah mengalami gangguan jaringan.');
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setError(null);
    setVerificationId(null);
  };

  return {
    verifyFace,
    verificationId,
    isLoading,
    error,
    reset,
  };
};

export default useFaceVerification;
