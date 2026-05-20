import axiosInstance from '@/lib/axios';
import { AttendanceResponse, FaceVerificationResponse, CheckInPayload, CheckInResponse } from '@/types';
import { API_ROUTES } from '@/constants';

export const attendanceService = {
  getDashboard: async (token: string): Promise<AttendanceResponse> => {
    const response = await axiosInstance.post<AttendanceResponse>(API_ROUTES.PROXY_DASHBOARD, { token });
    return response.data;
  },

  verifyFace: async (token: string, imageBase64: string): Promise<FaceVerificationResponse> => {
    // Strip the data URL prefix if it exists (e.g. data:image/jpeg;base64,)
    const cleanImage = imageBase64.includes('base64,')
      ? imageBase64.split('base64,')[1]
      : imageBase64;

    const response = await axiosInstance.post<FaceVerificationResponse>(API_ROUTES.PROXY_VERIFY_FACE, {
      token,
      image: cleanImage,
    });
    return response.data;
  },

  submitCheckIn: async (payload: CheckInPayload): Promise<CheckInResponse> => {
    const response = await axiosInstance.post<CheckInResponse>(API_ROUTES.PROXY_CHECKIN, payload);
    return response.data;
  },
};

export default attendanceService;
