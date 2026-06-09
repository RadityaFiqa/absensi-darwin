import useSWR from 'swr';
import { useAuth } from './useAuth';
import swrFetcher from '@/lib/fetcher';
import { AttendanceResponse } from '@/types';
import attendanceService from '@/services/attendance.service';
import useAuthStore from '@/store/useAuthStore';

export const useAttendance = () => {
  const { token } = useAuth();

  // Use SWR to query attendance status
  const { data, error, isLoading, mutate } = useSWR<AttendanceResponse>(
    token ? ['/api/dashboard', { token }] : null,
    swrFetcher,
    {
      refreshInterval: 30000, // Auto revalidate every 30s as requested
      revalidateOnFocus: true,
      errorRetryCount: 3,
      onSuccess: (res) => {
        if (res && (res as any).user) {
          useAuthStore.getState().setUser((res as any).user);
        }
      },
    }
  );

  const forceRevalidate = async () => {
    if (!token) return;
    try {
      const fresh = await attendanceService.getDashboard(token);
      if (fresh && (fresh as any).user) {
        useAuthStore.getState().setUser((fresh as any).user);
      }
      await mutate(fresh, { revalidate: false });
    } catch (err) {
      console.error('Failed to manually revalidate dashboard:', err);
      await mutate();
    }
  };

  return {
    attendance: data?.message,
    status: data?.status,
    error: error ? error.message : data?.error ? data.error : null,
    isLoading: isLoading && !data,
    isValidating: isLoading,
    mutate,
    forceRevalidate,
  };
};

export default useAttendance;
