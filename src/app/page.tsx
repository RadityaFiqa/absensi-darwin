'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import DashboardView from '@/features/DashboardView';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

export default function DashboardPage() {
  const router = useRouter();
  const { setActionType } = useAttendanceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <DashboardView
      onAction={(stage) => {
        setActionType(stage);
        router.push('/selfie');
      }}
    />
  );
}
