import axios from 'axios';
import { useAuthStore } from '@/store/useAuthStore';

const axiosInstance = axios.create({
  // If in browser, make requests relative to current origin to trigger Next.js API Routes (CORS proxy)
  // If on server, point directly to the Darwinbox API
  baseURL: typeof window === 'undefined'
    ? (process.env.NEXT_PUBLIC_API_BASE || 'https://insantangguh-bulog.darwinbox.com')
    : '',
  timeout: 30000, // 30s timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request Interceptor: Auto inject token from Zustand
axiosInstance.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = useAuthStore.getState().token;
      if (token && config.headers) {
        config.headers['Authorization'] = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Centralized error handling
axiosInstance.interceptors.response.use(
  (response) => {
    // Darwinbox API sometimes returns 200 OK but with status: 0 representing business logic errors.
    // Handle these as rejected promises.
    const data = response.data;
    if (data && typeof data === 'object' && 'status' in data && data.status === 0) {
      const errMsg = data.error || data.message || 'Action failed on server';
      return Promise.reject(new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg)));
    }
    return response;
  },
  (error) => {
    let message = 'Terjadi kesalahan sistem';
    if (error.response) {
      // 401 Unauthorized: Clear session and throw to login
      if (error.response.status === 401) {
        if (typeof window !== 'undefined') {
          useAuthStore.getState().logout();
          window.location.href = '/login';
        }
      }
      // Server replied with non-2xx status
      const data = error.response.data;
      message = data?.error || data?.message || `Error code: ${error.response.status}`;
    } else if (error.request) {
      // Request made, no reply
      message = 'Tidak ada respon dari server. Silakan periksa koneksi internet Anda.';
    } else {
      // Request setup error
      message = error.message || 'Gagal mengirimkan data';
    }
    
    // Create custom error
    const customError = new Error(message);
    // Attach original response if useful
    (customError as any).response = error.response;
    return Promise.reject(customError);
  }
);

export default axiosInstance;
export { axiosInstance };
