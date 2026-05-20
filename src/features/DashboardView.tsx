import React from 'react';
import { LogOut, Calendar, Clock, RefreshCw, ChevronRight } from 'lucide-react';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import { useClock } from '@/hooks/useClock';
import { useAttendance } from '@/hooks/useAttendance';
import { useAuth } from '@/hooks/useAuth';
import { formatTimeString } from '@/utils/format';

interface DashboardViewProps {
  onAction: (stage: 'check_in' | 'check_out') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onAction }) => {
  const { time, date } = useClock();
  const { attendance, isLoading, error, isValidating, forceRevalidate } = useAttendance();
  const { logout } = useAuth();

  const nextStage = attendance?.button_stage === 'check_out' ? 'check_out' : 'check_in';
  const buttonText = nextStage === 'check_out' ? 'Clock Out' : 'Clock In';
  const buttonGradient = nextStage === 'check_out'
    ? 'from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:ring-red-500 shadow-red-500/20'
    : 'from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 shadow-blue-500/20';

  if (isLoading) {
    return (
      <div className="w-full max-w-md mx-auto p-4 flex flex-col justify-center min-h-[70vh] gap-4">
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900 animate-pulse">
          <div className="h-4 bg-zinc-200 dark:bg-zinc-800 rounded-lg w-1/3" />
          <div className="h-8 w-8 bg-zinc-200 dark:bg-zinc-800 rounded-full" />
        </div>
        <div className="space-y-4">
          <div className="h-28 bg-zinc-200 dark:bg-zinc-800/60 rounded-3xl w-full animate-pulse" />
          <div className="grid grid-cols-2 gap-4">
            <div className="h-24 bg-zinc-200 dark:bg-zinc-800/60 rounded-3xl w-full animate-pulse" />
            <div className="h-24 bg-zinc-200 dark:bg-zinc-800/60 rounded-3xl w-full animate-pulse" />
          </div>
          <div className="h-32 bg-zinc-200 dark:bg-zinc-800/60 rounded-3xl w-full animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col min-h-[90vh] justify-between pb-24">
      {/* Header Panel */}
      <div>
        <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <div>
            <h1 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              Aplikasi Absensi
            </h1>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              Halo, Rekan BULOG
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => forceRevalidate()}
              disabled={isValidating}
              className={`p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer ${
                isValidating ? 'animate-spin text-blue-500' : ''
              }`}
              title="Refresh Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <button
              onClick={logout}
              className="p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-red-500 transition-colors cursor-pointer"
              title="Keluar"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>

        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 text-xs font-bold leading-normal flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        {/* Real-time Local Clock Card */}
        <Card className="mt-6 flex flex-col items-center justify-center py-6 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-150 dark:border-zinc-900 shadow-inner">
          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-500 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">Jam Digital</span>
          </div>
          <span className="text-3xl font-extrabold text-zinc-950 dark:text-zinc-50 tabular-nums tracking-tight">
            {time}
          </span>
          <div className="flex items-center gap-1.5 text-zinc-500 dark:text-zinc-400 text-xs font-bold mt-2">
            <Calendar className="w-3.5 h-3.5" />
            <span>{date}</span>
          </div>
        </Card>

        {/* Attendance Summary */}
        <div className="grid grid-cols-2 gap-4 mt-6">
          {/* Card Clock In */}
          <Card className="relative overflow-hidden bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 flex flex-col gap-2">
            <div className="absolute top-0 left-0 w-1 h-full bg-emerald-500" />
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              CLOCK IN
            </span>
            <span className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100 tabular-nums mt-0.5">
              {formatTimeString(attendance?.check_in_time)}
            </span>
            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              {attendance?.check_in_time ? 'Hadir' : 'Absen'}
            </span>
          </Card>

          {/* Card Clock Out */}
          <Card className="relative overflow-hidden bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 flex flex-col gap-2">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
              CLOCK OUT
            </span>
            <span className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100 tabular-nums mt-0.5">
              {formatTimeString(attendance?.check_out_time)}
            </span>
            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              {attendance?.check_out_time ? 'Pulang' : 'Belum'}
            </span>
          </Card>
        </div>

        {/* Audit Meta Logs */}
        {attendance && (
          <div className="mt-8 flex flex-col gap-3.5 p-4 rounded-3xl border border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-400">ID Absensi</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[10px]">
                {attendance.id || '-'}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-400">Hari Kerja</span>
              <span className="text-zinc-700 dark:text-zinc-300">{attendance.date || '-'}</span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-400">Tahap Berikutnya</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-extrabold text-[9px] uppercase tracking-wider">
                {attendance.button_stage === 'check_out' ? 'Clock Out' : 'Clock In'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-900/60 z-20">
        <Button
          onClick={() => onAction(nextStage)}
          className={`w-full py-4 text-sm bg-gradient-to-r shadow-lg ${buttonGradient}`}
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          {buttonText}
        </Button>
      </div>
    </div>
  );
};

export default DashboardView;
