import { useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import authService from '@/services/auth.service';

export const useAuth = () => {
  const store = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loginWithQr = async (qrcode: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.loginWithQr(qrcode);
      
      // Check potential token locations in response payload
      let token = response.token;
      if (!token && response.message) {
        if (typeof response.message === 'string') {
          token = response.message;
        } else if (typeof response.message === 'object' && 'token' in response.message) {
          token = response.message.token;
        }
      }

      if (response.status === 1 && token) {
        store.setToken(token);
        return true;
      } else {
        setError(response.error || 'Autentikasi gagal. Kode QR tidak valid atau kedaluwarsa.');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan koneksi sistem.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithToken = (token: string): boolean => {
    setError(null);
    const cleanToken = token.trim();
    if (!cleanToken) {
      setError('Token tidak boleh kosong.');
      return false;
    }
    store.setToken(cleanToken);
    return true;
  };

  return {
    token: store.token,
    isAuthenticated: store.isAuthenticated,
    logout: store.logout,
    loginWithQr,
    loginWithToken,
    isLoading,
    error,
    setError,
  };
};

export default useAuth;
