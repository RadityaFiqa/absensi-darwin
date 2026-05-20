import { create } from 'zustand';

interface AuthState {
  token: string | null;
  isAuthenticated: boolean;
  setToken: (token: string | null) => void;
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
      return localStorage.getItem('absensi_token');
    }
    return null;
  };

  const initialToken = getInitialToken();

  return {
    token: initialToken,
    isAuthenticated: !!initialToken,
    setToken: (token) => {
      if (typeof window !== 'undefined') {
        if (token) {
          localStorage.setItem('absensi_token', token);
          setCookie('absensi_token', token);
        } else {
          localStorage.removeItem('absensi_token');
          deleteCookie('absensi_token');
        }
      }
      set({ token, isAuthenticated: !!token });
    },
    logout: () => {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('absensi_token');
        deleteCookie('absensi_token');
      }
      set({ token: null, isAuthenticated: false });
    },
  };
});
export default useAuthStore;

