import { useState } from 'react';
import useAuthStore from '@/store/useAuthStore';
import authService from '@/services/auth.service';
import axiosInstance from '@/lib/axios';

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
        if ((response as any).user) {
          store.setUser((response as any).user);
        }
        return true;
      } else {
        setError(response.error || 'Autentikasi gagal. Kode QR tidak valid atau kedaluwarsa.');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan koneksi sistem atau user tidak aktif.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSso = async (username: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await authService.loginWithSso(username, password);
      
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
        if ((response as any).user) {
          store.setUser((response as any).user);
        }
        return true;
      } else {
        setError(response.error || 'Autentikasi SSO gagal. Username atau password salah.');
        return false;
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Terjadi kesalahan login SSO.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithToken = async (token: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);
    const cleanToken = token.trim();
    if (!cleanToken) {
      setError('Token tidak boleh kosong.');
      setIsLoading(false);
      return false;
    }
    try {
      // Call token validation endpoint
      const response = await axiosInstance.post('/api/auth/validate', { token: cleanToken });
      if (response.data && response.data.success) {
        store.setToken(cleanToken);
        if (response.data.user) {
          store.setUser(response.data.user);
        }
        return true;
      } else {
        setError(response.data?.message || 'Autentikasi token gagal.');
        return false;
      }
    } catch (err: any) {
      setError(err.message || 'Token tidak valid atau user tidak aktif.');
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/api/auth/logout');
    } catch (err) {
      console.error('Failed to log logout activity:', err);
    }
    store.logout();
  };

  return {
    token: store.token,
    user: store.user,
    isAuthenticated: store.isAuthenticated,
    logout,
    loginWithQr,
    loginWithSso,
    loginWithToken,
    isLoading,
    error,
    setError,
  };
};

export default useAuth;
