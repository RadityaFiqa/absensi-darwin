import { create } from 'zustand';

export interface User {
  id: number;
  employee_no: string;
  name: string;
  email: string;
  department?: string;
  designation?: string;
  role: 'ADMIN' | 'SUPERVISOR' | 'EMPLOYEE';
  is_active: boolean;
}

interface AuthState {
  token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
}

const setCookie = (name: string, value: string, days = 7) => {
  if (typeof document === 'undefined') return;
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Strict; Secure`;
};

const deleteCookie = (name: string) => {
  if (typeof document === 'undefined') return;
  document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
};

export const useAuthStore = create<AuthState>((set) => {
  const getInitialToken = () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('absensi_token') || localStorage.getItem('token_absensi');
    }
    return null;
  };

  const getInitialUser = () => {
    if (typeof window !== 'undefined') {
      const savedUser = localStorage.getItem('absensi_user');
      if (savedUser) {
        try {
          return JSON.parse(savedUser);
        } catch (e) {
          return null;
        }
      }
    }
    return null;
  };

  const initialToken = getInitialToken();
  const initialUser = getInitialUser();

  return {
    token: initialToken,
    user: initialUser,
    isAuthenticated: !!initialToken,
    setToken: (token) => {
      if (typeof window !== 'undefined') {
        if (token) {
          localStorage.setItem('absensi_token', token);
          localStorage.setItem('token_absensi', token);
          setCookie('absensi_token', token);
          setCookie('token_absensi', token);
        } else {
          localStorage.removeItem('absensi_token');
          localStorage.removeItem('token_absensi');
          deleteCookie('absensi_token');
          deleteCookie('token_absensi');
        }
      }
      set({ token, isAuthenticated: !!token });
    },
    setUser: (user) => {
      if (typeof window !== 'undefined') {
        if (user) {
          localStorage.setItem('absensi_user', JSON.stringify(user));
        } else {
          localStorage.removeItem('absensi_user');
        }
      }
      set({ user });
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('absensi_token');
        localStorage.removeItem('token_absensi');
        localStorage.removeItem('absensi_user');
        deleteCookie('absensi_token');
        deleteCookie('token_absensi');
      }
      set({ token: null, user: null, isAuthenticated: false });
    },
  };
});
export default useAuthStore;

