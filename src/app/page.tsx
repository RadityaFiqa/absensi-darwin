'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { LayoutDashboard, Clock, Users, MapPin, Activity } from 'lucide-react';
import DashboardView from '@/features/DashboardView';
import AdminDashboard from '@/components/Admin/AdminDashboard';
import AdminUsers from '@/components/Admin/AdminUsers';
import AdminLocations from '@/components/Admin/AdminLocations';
import AdminLogs from '@/components/Admin/AdminLogs';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import { useAuth } from '@/hooks/useAuth';

type TabType = 'dashboard' | 'attendance' | 'users' | 'locations' | 'logs';

export default function DashboardPage() {
  const router = useRouter();
  const { setActionType, setCheckinId } = useAttendanceStore();
  const [mounted, setMounted] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('attendance');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated) {
      router.replace('/login');
    }
  }, [mounted, isAuthenticated, router]);

  if (!mounted || !isAuthenticated) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const isAdmin = user?.role === 'ADMIN';

  const renderActiveContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <AdminDashboard />;
      case 'users':
        return <AdminUsers />;
      case 'locations':
        return <AdminLocations />;
      case 'logs':
        return <AdminLogs />;
      case 'attendance':
      default:
        return (
          <DashboardView
            onAction={(stage, checkinId) => {
              setActionType(stage);
              setCheckinId(checkinId || null);
              router.push('/selfie');
            }}
          />
        );
    }
  };

  return (
    <div className="flex flex-col min-h-screen w-full relative">
      <div className={`flex-1 w-full ${isAdmin ? 'pb-20' : ''}`}>
        {activeTab !== 'attendance' ? (
          <div className="p-4 w-full pb-20">{renderActiveContent()}</div>
        ) : (
          renderActiveContent()
        )}
      </div>

      {/* Admin Bottom Navigation Tab Bar */}
      {isAdmin && (
        <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto h-16 bg-white/95 dark:bg-zinc-950/95 border-t border-zinc-100 dark:border-zinc-900/80 flex justify-around items-center z-30 shadow-2xl backdrop-blur-md">
          {/* Dashboard Tab */}
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 cursor-pointer transition-all duration-250 ${
              activeTab === 'dashboard'
                ? 'text-blue-500 scale-105'
                : 'text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400'
            }`}
          >
            <LayoutDashboard className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Dashboard</span>
          </button>

          {/* Attendance Tab */}
          <button
            onClick={() => setActiveTab('attendance')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 cursor-pointer transition-all duration-250 ${
              activeTab === 'attendance'
                ? 'text-blue-500 scale-105'
                : 'text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400'
            }`}
          >
            <Clock className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Absen</span>
          </button>

          {/* Users Tab */}
          <button
            onClick={() => setActiveTab('users')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 cursor-pointer transition-all duration-250 ${
              activeTab === 'users'
                ? 'text-blue-500 scale-105'
                : 'text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400'
            }`}
          >
            <Users className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">User</span>
          </button>

          {/* Locations Tab */}
          <button
            onClick={() => setActiveTab('locations')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 cursor-pointer transition-all duration-250 ${
              activeTab === 'locations'
                ? 'text-blue-500 scale-105'
                : 'text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400'
            }`}
          >
            <MapPin className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Lokasi</span>
          </button>

          {/* Activity Logs Tab */}
          <button
            onClick={() => setActiveTab('logs')}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-2 cursor-pointer transition-all duration-250 ${
              activeTab === 'logs'
                ? 'text-blue-500 scale-105'
                : 'text-zinc-400 hover:text-zinc-500 dark:text-zinc-500 dark:hover:text-zinc-400'
            }`}
          >
            <Activity className="w-5 h-5" />
            <span className="text-[9px] font-black uppercase tracking-wider">Logs</span>
          </button>
        </div>
      )}
    </div>
  );
}
