'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import ConfirmView from '@/features/ConfirmView';
import { useAttendanceStore } from '@/store/useAttendanceStore';
import LoadingSpinner from '@/components/UI/LoadingSpinner';

export default function ConfirmPage() {
  const router = useRouter();
  const { verificationId, selfieBase64, actionType, clearWorkflow } = useAttendanceStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && (!verificationId || !selfieBase64)) {
      router.replace('/');
    }
  }, [verificationId, selfieBase64, mounted, router]);

  if (!mounted || !verificationId || !selfieBase64) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-zinc-50 dark:bg-zinc-950">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <ConfirmView
      verificationId={verificationId}
      selfieBase64={selfieBase64}
      actionType={actionType}
      onBack={() => router.push('/selfie')}
      onSuccess={() => {
        clearWorkflow();
        router.replace('/');
      }}
    />
  );
}
