'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import SelfieView from '@/features/SelfieView';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

export default function SelfiePage() {
  const router = useRouter();
  const { actionType, setWorkflowData } = useAttendanceStore();
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
    <SelfieView
      actionType={actionType}
      onSuccess={(verId, imgBase64) => {
        setWorkflowData(verId, imgBase64);
        router.push('/confirm');
      }}
      onCancel={() => router.push('/')}
    />
  );
}
