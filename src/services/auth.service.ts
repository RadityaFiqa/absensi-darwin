import axiosInstance from '@/lib/axios';
import { AuthResponse } from '@/types';
import { API_ROUTES } from '@/constants';

export const authService = {
  loginWithQr: async (qrcode: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(API_ROUTES.PROXY_AUTH, { qrcode });
    return response.data;
  },
  loginWithSso: async (username: string, password: string): Promise<AuthResponse> => {
    const response = await axiosInstance.post<AuthResponse>(API_ROUTES.PROXY_AUTH, { username, password });
    return response.data;
  },
};

export default authService;
