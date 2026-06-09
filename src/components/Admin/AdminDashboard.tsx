import React, { useState, useEffect } from "react";
import { Users, MapPin, Clock, ShieldAlert, Activity, ArrowRight } from "lucide-react";
import Card from "@/components/UI/Card";
import axiosInstance from "@/lib/axios";
import LoadingSpinner from "@/components/UI/LoadingSpinner";

interface DashboardStats {
  users: { total: number; active: number };
  locations: { total: number; active: number };
  attendance: { clockIn: number; clockOut: number };
}

interface ActivityLog {
  id: number;
  employee_no: string;
  user_name: string;
  action: string;
  description: string;
  ip_address: string;
  created_at: string;
}

export const AdminDashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await axiosInstance.get('/api/admin/stats');
        if (response.data && response.data.success) {
          setStats(response.data.stats);
          setRecentLogs(response.data.recentLogs);
        } else {
          setError(response.data.message || 'Gagal memuat statistik');
        }
      } catch (err: any) {
        setError(err.message || 'Terjadi kesalahan sistem');
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center p-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 text-xs font-bold">
        {error}
      </div>
    );
  }

  const formatLogTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) + ' - ' + date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20';
      case 'LOGOUT':
        return 'text-zinc-600 bg-zinc-50 dark:text-zinc-400 dark:bg-zinc-900/30';
      case 'CLOCK_IN':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20';
      case 'CLOCK_OUT':
        return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20';
      case 'CREATE_USER':
      case 'CREATE_LOCATION':
        return 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/20';
      case 'UPDATE_USER':
      case 'UPDATE_LOCATION':
        return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20';
      case 'DELETE_USER':
      case 'DELETE_LOCATION':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20';
      default:
        return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Welcome Area */}
      <div>
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50">Monitoring Ringkasan</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Statistik sistem presensi digital saat ini</p>
      </div>

      {/* Grid Stats */}
      <div className="grid grid-cols-2 gap-4">
        {/* Users Stats */}
        <Card className="flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-150 dark:border-zinc-900 shadow-sm relative overflow-hidden">
          <div className="absolute top-2 right-2 text-zinc-300 dark:text-zinc-800">
            <Users className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Karyawan</span>
          <span className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{stats?.users.total}</span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold">{stats?.users.active} Karyawan Aktif</span>
        </Card>

        {/* Locations Stats */}
        <Card className="flex flex-col gap-2 p-4 bg-zinc-50 dark:bg-zinc-900/40 border-zinc-150 dark:border-zinc-900 shadow-sm relative overflow-hidden">
          <div className="absolute top-2 right-2 text-zinc-300 dark:text-zinc-800">
            <MapPin className="w-8 h-8" />
          </div>
          <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider">Lokasi / Kantor</span>
          <span className="text-3xl font-extrabold text-zinc-800 dark:text-zinc-100 mt-1">{stats?.locations.total}</span>
          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold">{stats?.locations.active} Lokasi Aktif</span>
        </Card>

        {/* Attendance Checkins */}
        <Card className="col-span-2 flex items-center justify-between p-4 bg-gradient-to-r from-blue-50/50 to-indigo-50/50 dark:from-indigo-950/10 dark:to-blue-950/10 border-blue-100 dark:border-blue-900/30">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Clock className="w-5 h-5" />
            </div>
            <div className="space-y-0.5">
              <h4 className="text-xs font-black text-zinc-800 dark:text-zinc-200">Presensi Hari Ini</h4>
              <p className="text-[10px] text-zinc-500 dark:text-zinc-400">Jumlah rekapitulasi masuk/pulang hari ini</p>
            </div>
          </div>
          <div className="flex gap-4">
            <div className="text-right">
              <div className="text-xs font-bold text-zinc-400">Clock In</div>
              <div className="text-lg font-black text-emerald-600 dark:text-emerald-400">{stats?.attendance.clockIn}</div>
            </div>
            <div className="text-right">
              <div className="text-xs font-bold text-zinc-400">Clock Out</div>
              <div className="text-lg font-black text-rose-600 dark:text-rose-400">{stats?.attendance.clockOut}</div>
            </div>
          </div>
        </Card>
      </div>

      {/* Recent Activity Logs */}
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center">
          <h3 className="text-sm font-black text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
            <Activity className="w-4 h-4 text-blue-500" />
            Log Aktivitas Terbaru
          </h3>
        </div>

        <div className="flex flex-col gap-2.5">
          {recentLogs.length === 0 ? (
            <div className="text-center py-6 text-xs text-zinc-400 dark:text-zinc-600 font-bold border border-dashed border-zinc-200 dark:border-zinc-850 rounded-2xl">
              Belum ada aktivitas tercatat
            </div>
          ) : (
            recentLogs.map((log) => (
              <div 
                key={log.id} 
                className="p-3 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-2xl flex flex-col gap-2 shadow-xs hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full ${getActionBadgeColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-semibold">
                    {formatLogTime(log.created_at)}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-800 dark:text-zinc-300 font-bold leading-normal">
                  {log.description}
                </p>
                <div className="flex justify-between items-center text-[9px] font-medium text-zinc-400">
                  <span>
                    Oleh: <strong className="text-zinc-600 dark:text-zinc-450">{log.user_name || log.employee_no}</strong> ({log.employee_no})
                  </span>
                  <span className="font-mono text-[8px] bg-zinc-50 dark:bg-zinc-900 px-1.5 py-0.5 rounded">
                    IP: {log.ip_address || 'Local'}
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
