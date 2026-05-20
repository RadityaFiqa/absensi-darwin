import React from 'react';
import LoadingSpinner from './UI/LoadingSpinner';

interface GlobalLoadingProps {
  message?: string;
  isVisible: boolean;
}

export const GlobalLoading: React.FC<GlobalLoadingProps> = ({ message = 'Memproses...', isVisible }) => {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/30 dark:bg-zinc-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="flex flex-col items-center gap-4 p-6 bg-white dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 rounded-3xl shadow-2xl max-w-xs w-full mx-4">
        <LoadingSpinner size="lg" />
        <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 animate-pulse text-center tracking-wide">
          {message}
        </p>
      </div>
    </div>
  );
};

export default GlobalLoading;
