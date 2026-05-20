'use client';

import React, { useEffect } from 'react';
import Button from '@/components/UI/Button';
import Card from '@/components/UI/Card';
import { AlertCircle, RefreshCw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled Application Error:', error);
  }, [error]);

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col justify-center min-h-[80vh] text-center">
      <Card className="flex flex-col items-center gap-6 p-8 border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950">
        <div className="w-16 h-16 rounded-full bg-red-50 dark:bg-red-950/20 flex items-center justify-center text-red-500">
          <AlertCircle className="w-8 h-8" />
        </div>
        <div className="space-y-2">
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Terjadi Masalah Sistem
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
            Aplikasi mengalami kendala yang tidak terduga. Silakan coba kembali atau hubungi support.
          </p>
        </div>

        {error.message && (
          <div className="w-full p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-900/50 text-[10px] font-mono text-zinc-500 text-left border border-zinc-100 dark:border-zinc-900 break-all leading-normal">
            Detail: {error.message}
          </div>
        )}

        <Button
          onClick={reset}
          className="w-full py-4 text-sm"
          leftIcon={<RefreshCw className="w-4 h-4" />}
        >
          Coba Memuat Ulang
        </Button>
      </Card>
    </div>
  );
}
