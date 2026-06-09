import React, { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Filter, Calendar, Terminal } from "lucide-react";
import Card from "@/components/UI/Card";
import Button from "@/components/UI/Button";
import axiosInstance from "@/lib/axios";
import LoadingSpinner from "@/components/UI/LoadingSpinner";

interface ActivityLog {
  id: number;
  employee_no: string;
  user_name: string;
  action: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
}

export const AdminLogs: React.FC = () => {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [employeeNo, setEmployeeNo] = useState("");
  const [action, setAction] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const limit = 10;

  const fetchLogs = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.append('page', String(page));
      params.append('limit', String(limit));
      
      if (employeeNo) params.append('employee_no', employeeNo.trim());
      if (action) params.append('action', action);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const response = await axiosInstance.get(`/api/activity-logs?${params.toString()}`);
      if (response.data && response.data.success) {
        setLogs(response.data.logs);
        setTotalPages(response.data.totalPages || 1);
        setTotalItems(response.data.total || 0);
      } else {
        setError(response.data.message || 'Gagal memuat log aktivitas');
      }
    } catch (err: any) {
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [page, action, startDate, endDate]);

  // Handle employee number search with debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (page !== 1) {
        setPage(1); // Reset to page 1 for new searches
      } else {
        fetchLogs();
      }
    }, 500);

    return () => clearTimeout(delayDebounceFn);
  }, [employeeNo]);

  const handleClearFilters = () => {
    setEmployeeNo("");
    setAction("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  const formatLogDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    }) + ' ' + date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  const getActionBadgeColor = (action: string) => {
    switch (action) {
      case 'LOGIN':
        return 'text-emerald-600 bg-emerald-50 dark:text-emerald-400 dark:bg-emerald-950/20 border-emerald-200/50 dark:border-emerald-900/30';
      case 'LOGOUT':
        return 'text-zinc-500 bg-zinc-50 dark:text-zinc-400 dark:bg-zinc-900/30 border-zinc-200 dark:border-zinc-800';
      case 'CLOCK_IN':
        return 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-950/20 border-blue-200/50 dark:border-blue-900/30';
      case 'CLOCK_OUT':
        return 'text-rose-600 bg-rose-50 dark:text-rose-400 dark:bg-rose-950/20 border-rose-200/50 dark:border-rose-900/30';
      case 'CREATE_USER':
      case 'CREATE_LOCATION':
        return 'text-cyan-600 bg-cyan-50 dark:text-cyan-400 dark:bg-cyan-950/20 border-cyan-200/50 dark:border-cyan-900/30';
      case 'UPDATE_USER':
      case 'UPDATE_LOCATION':
        return 'text-amber-600 bg-amber-50 dark:text-amber-400 dark:bg-amber-950/20 border-amber-200/50 dark:border-amber-900/30';
      case 'DELETE_USER':
      case 'DELETE_LOCATION':
        return 'text-red-600 bg-red-50 dark:text-red-400 dark:bg-red-950/20 border-red-200/50 dark:border-red-900/30';
      default:
        return 'text-indigo-600 bg-indigo-50 dark:text-indigo-400 dark:bg-indigo-950/20 border-indigo-200/50 dark:border-indigo-900/30';
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full animate-in fade-in duration-200">
      {/* Header Panel */}
      <div>
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-50 font-sans">Audit Log Aktivitas</h2>
        <p className="text-xs text-zinc-500 dark:text-zinc-400">Jejak audit seluruh aksi pengguna dalam aplikasi</p>
      </div>

      {/* Advanced Filters */}
      <Card className="p-4 bg-zinc-50/50 dark:bg-zinc-900/20 border-zinc-150 dark:border-zinc-900 flex flex-col gap-3">
        <div className="flex items-center justify-between text-xs font-bold text-zinc-400 border-b border-zinc-100 dark:border-zinc-900/60 pb-2">
          <span className="flex items-center gap-1">
            <Filter className="w-3.5 h-3.5" />
            Filter Pencarian
          </span>
          {(employeeNo || action || startDate || endDate) && (
            <button 
              onClick={handleClearFilters}
              className="text-[10px] text-blue-500 hover:text-blue-600 font-extrabold cursor-pointer"
            >
              Hapus Semua Filter
            </button>
          )}
        </div>

        <div className="flex flex-col gap-3">
          <input 
            type="text"
            placeholder="Cari Employee No (Darwinbox)..."
            value={employeeNo}
            onChange={(e) => setEmployeeNo(e.target.value)}
            className="w-full text-xs font-bold rounded-2xl border py-3 px-3.5 focus:outline-none focus:ring-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:ring-blue-500/20 placeholder-zinc-400"
          />

          <select 
            value={action}
            onChange={(e) => { setAction(e.target.value); setPage(1); }}
            className="w-full text-xs font-bold rounded-2xl border py-3 px-3 focus:outline-none focus:ring-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:ring-blue-500/20 font-bold"
          >
            <option value="">Semua Aksi / Action</option>
            <option value="LOGIN">LOGIN</option>
            <option value="LOGOUT">LOGOUT</option>
            <option value="CLOCK_IN">CLOCK_IN</option>
            <option value="CLOCK_OUT">CLOCK_OUT</option>
            <option value="CREATE_USER">CREATE_USER</option>
            <option value="UPDATE_USER">UPDATE_USER</option>
            <option value="DELETE_USER">DELETE_USER</option>
            <option value="CREATE_LOCATION">CREATE_LOCATION</option>
            <option value="UPDATE_LOCATION">UPDATE_LOCATION</option>
            <option value="DELETE_LOCATION">DELETE_LOCATION</option>
          </select>

          <div className="grid grid-cols-2 gap-3">
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase text-zinc-400 pl-1">Mulai Tanggal</span>
              <input 
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(1); }}
                className="w-full text-xs font-bold rounded-2xl border py-3 px-3.5 focus:outline-none focus:ring-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:ring-blue-500/20 font-bold"
              />
            </div>
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black uppercase text-zinc-400 pl-1">Sampai Tanggal</span>
              <input 
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(1); }}
                className="w-full text-xs font-bold rounded-2xl border py-3 px-3.5 focus:outline-none focus:ring-2 bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800 text-zinc-900 dark:text-zinc-100 focus:border-blue-500 focus:ring-blue-500/20 font-bold"
              />
            </div>
          </div>
        </div>
      </Card>

      {/* Logs Feed */}
      {loading ? (
        <div className="flex justify-center p-8">
          <LoadingSpinner size="md" />
        </div>
      ) : error ? (
        <div className="p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-250 rounded-2xl text-amber-700 text-xs font-bold">
          {error}
        </div>
      ) : logs.length === 0 ? (
        <div className="text-center py-12 text-xs text-zinc-400 dark:text-zinc-650 font-bold border border-dashed border-zinc-200 dark:border-zinc-900 rounded-2xl">
          Tidak ada log audit yang cocok dengan filter aktif
        </div>
      ) : (
        <div className="flex flex-col gap-3.5">
          <div className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 px-1">
            Menampilkan {logs.length} dari {totalItems} log aktivitas
          </div>

          <div className="flex flex-col gap-3">
            {logs.map((log) => (
              <div 
                key={log.id} 
                className="p-3.5 bg-white dark:bg-zinc-950 border border-zinc-100 dark:border-zinc-900 rounded-2xl flex flex-col gap-2.5 shadow-xs"
              >
                <div className="flex justify-between items-start">
                  <span className={`text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border ${getActionBadgeColor(log.action)}`}>
                    {log.action}
                  </span>
                  <span className="text-[9px] text-zinc-400 dark:text-zinc-500 font-bold">
                    {formatLogDate(log.created_at)}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-800 dark:text-zinc-200 font-bold leading-relaxed whitespace-pre-line">
                  {log.description}
                </p>

                <div className="pt-2 border-t border-zinc-50 dark:border-zinc-900/60 flex flex-col gap-1 text-[9px] text-zinc-400 font-medium">
                  <div className="flex justify-between">
                    <span>Oleh: <strong className="text-zinc-700 dark:text-zinc-350">{log.user_name || log.employee_no}</strong> ({log.employee_no})</span>
                    <span>IP: <strong className="text-zinc-700 dark:text-zinc-350 font-mono text-[8px]">{log.ip_address || 'Local'}</strong></span>
                  </div>
                  {log.user_agent && (
                    <div className="text-[8px] font-mono truncate max-w-full text-zinc-500 dark:text-zinc-600 flex items-center gap-1 mt-0.5" title={log.user_agent}>
                      <Terminal className="w-2.5 h-2.5 shrink-0" />
                      UA: {log.user_agent}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center py-2 px-1 mt-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer select-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-xl"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </button>

              <span className="text-xs font-bold text-zinc-500 dark:text-zinc-400 select-none">
                Halaman {page} dari {totalPages}
              </span>

              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-zinc-500 dark:text-zinc-400 hover:text-zinc-800 dark:hover:text-zinc-100 disabled:opacity-30 disabled:pointer-events-none cursor-pointer select-none bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-850 rounded-xl"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminLogs;
