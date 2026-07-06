import React, { useState, useEffect } from "react";
import { LogOut, Calendar, Clock, RefreshCw, ChevronRight, User, Upload } from "lucide-react";
import Card from "@/components/UI/Card";
import Button from "@/components/UI/Button";
import { useClock } from "@/hooks/useClock";
import { useAttendance } from "@/hooks/useAttendance";
import { useAuth } from "@/hooks/useAuth";
import { formatTimeString } from "@/utils/format";
import axiosInstance from "@/lib/axios";

interface DashboardViewProps {
  onAction: (stage: "check_in" | "check_out", checkinId?: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onAction }) => {
  const { time, date } = useClock();
  const { attendance, isLoading, error, isValidating, forceRevalidate } =
    useAttendance();
  const { logout, user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const [settings, setSettings] = useState<{
    cutoff_clockin: string;
    cutoff_checkout: string;
    auto_attendance: boolean;
    preferred_location_id: number | null;
    has_image: boolean;
  }>({
    cutoff_clockin: '07:30',
    cutoff_checkout: '17:00',
    auto_attendance: false,
    preferred_location_id: null,
    has_image: false,
  });

  const [locations, setLocations] = useState<any[]>([]);
  const [settingsLoading, setSettingsLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showDebugInfo, setShowDebugInfo] = useState(false);
  const [debugData, setDebugData] = useState<any>(null);

  // Fetch settings and locations on mount
  useEffect(() => {
    const loadSettingsAndLocations = async () => {
      try {
        const settingsRes = await axiosInstance.get('/api/users/settings');
        if (settingsRes.data && settingsRes.data.success) {
          setSettings(settingsRes.data.settings);
        }
      } catch (err) {
        console.error('Gagal memuat pengaturan absensi otomatis:', err);
      }

      try {
        const locationsRes = await axiosInstance.get('/api/locations');
        if (locationsRes.data && locationsRes.data.success) {
          setLocations(locationsRes.data.locations);
        }
      } catch (err) {
        console.error('Gagal mengambil data lokasi:', err);
      }
    };
    loadSettingsAndLocations();
  }, []);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Str = reader.result as string;
      setSettingsLoading(true);
      try {
        const response = await axiosInstance.post('/api/users/settings', {
          default_image: base64Str
        });
        if (response.data && response.data.success) {
          setSettings(prev => ({ ...prev, has_image: true }));
          showToast('Foto default berhasil disimpan!');
        }
      } catch (err) {
        console.error('Gagal menyimpan foto default:', err);
        showToast('Gagal mengunggah foto default.');
      } finally {
        setSettingsLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const updateSettingField = async (field: 'cutoff_clockin' | 'cutoff_checkout' | 'preferred_location_id', value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    try {
      await axiosInstance.post('/api/users/settings', {
        [field]: value
      });
      showToast('Pengaturan berhasil disimpan');
    } catch (err) {
      console.error(`Gagal memperbarui ${field}:`, err);
    }
  };

  const toggleAutoAttendance = async () => {
    if (!settings.has_image) {
      showToast('Harap unggah foto default terlebih dahulu.');
      return;
    }
    const nextVal = !settings.auto_attendance;
    setSettings(prev => ({ ...prev, auto_attendance: nextVal }));
    try {
      await axiosInstance.post('/api/users/settings', {
        auto_attendance: nextVal
      });
      showToast(nextVal ? 'Absen otomatis diaktifkan!' : 'Absen otomatis dinonaktifkan.');
    } catch (err) {
      console.error('Gagal memperbarui absen otomatis:', err);
      setSettings(prev => ({ ...prev, auto_attendance: !nextVal }));
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  const handleToggleDebug = async () => {
    if (!showDebugInfo && !debugData) {
      try {
        const res = await axiosInstance.get('/api/debug/time');
        if (res.data && res.data.success) {
          setDebugData(res.data.debug_info);
        }
      } catch (err) {
        console.error('Gagal mengambil info debug:', err);
      }
    }
    setShowDebugInfo(!showDebugInfo);
  };

  const nextStage =
    attendance?.button_stage === "check_out" ? "check_out" : "check_in";
  const buttonText = nextStage === "check_out" ? "Clock Out" : "Clock In";
  const buttonGradient =
    nextStage === "check_out"
      ? "from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 focus:ring-red-500 shadow-red-500/20"
      : "from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:ring-blue-500 shadow-blue-500/20";

  const showButton = !(
    attendance?.last_action === 2 && nextStage === "check_in"
  );

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
            <h1 className="text-[10px] font-bold text-zinc-400 dark:text-zinc-505 uppercase tracking-widest">
              Aplikasi Absensi
            </h1>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100 mt-0.5">
              Halo, {user?.name || 'Rekan BULOG'}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => forceRevalidate()}
              disabled={isValidating}
              className={`p-2.5 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors cursor-pointer ${
                isValidating ? "animate-spin text-blue-500" : ""
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

        {toastMessage && (
          <div className="mt-4 p-3.5 rounded-2xl bg-zinc-900 dark:bg-zinc-100 text-white dark:text-zinc-950 text-xs font-bold leading-normal shadow-md animate-in fade-in slide-in-from-top-2 duration-300">
            {toastMessage}
          </div>
        )}

        {error && (
          <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-400 text-xs font-bold leading-normal flex items-center justify-between">
            <span>{error}</span>
          </div>
        )}

        {/* Real-time Local Clock Card */}
        <Card className="mt-6 flex flex-col items-center justify-center py-6 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-150 dark:border-zinc-900 shadow-inner">
          <div className="flex items-center gap-1.5 text-zinc-400 dark:text-zinc-505 mb-1">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-[10px] font-bold uppercase tracking-wider">
              Jam Digital (Makassar)
            </span>
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
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
              CLOCK IN
            </span>
            <span className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100 tabular-nums mt-0.5">
              {formatTimeString(
                attendance?.check_in_time || attendance?.first_check_in_time
              )}
            </span>
            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              {attendance?.check_in_time || attendance?.first_check_in_time
                ? "Hadir"
                : "Absen"}
            </span>
          </Card>

          {/* Card Clock Out */}
          <Card className="relative overflow-hidden bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 flex flex-col gap-2">
            <div className="absolute top-0 left-0 w-1 h-full bg-rose-500" />
            <span className="text-[10px] font-bold text-zinc-400 dark:text-zinc-550 uppercase tracking-widest">
              CLOCK OUT
            </span>
            <span className="text-2xl font-extrabold text-zinc-800 dark:text-zinc-100 tabular-nums mt-0.5">
              {formatTimeString(attendance?.check_out_time)}
            </span>
            <span className="text-[9px] font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-wide">
              {attendance?.check_out_time ? "Pulang" : "Belum"}
            </span>
          </Card>
        </div>

        {/* AUTO ATTENDANCE SETTINGS CARD */}
        <Card className="mt-6 flex flex-col gap-4 bg-white dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 shadow-sm">
          <div className="border-b border-zinc-100 dark:border-zinc-900 pb-2">
            <h3 className="text-xs font-extrabold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
              Absen Otomatis
            </h3>
            <p className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed mt-0.5">
              Kelola batas cut-off kehadiran dan upload selfie default
            </p>
          </div>

          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-zinc-500">Status Selfie Default</span>
            {settings.has_image ? (
              <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                ✓ Aktif / Terunggah
              </span>
            ) : (
              <span className="text-amber-500 flex items-center gap-1 animate-pulse">
                ⚠ Belum Upload
              </span>
            )}
          </div>

          <div className="flex gap-2">
            <label htmlFor="default-photo-upload" className="flex-1">
              <div className="w-full py-2.5 px-4 text-center rounded-2xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200 dark:border-zinc-800 text-xs font-bold text-zinc-700 dark:text-zinc-300 cursor-pointer transition-colors flex items-center justify-center gap-1.5">
                <Upload className="w-3.5 h-3.5" />
                {settings.has_image ? 'Ganti Selfie Default' : 'Upload Selfie Default'}
              </div>
            </label>
            <input
              type="file"
              accept="image/*"
              id="default-photo-upload"
              className="hidden"
              onChange={handlePhotoUpload}
              disabled={settingsLoading}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Batas Clock In</label>
              <input
                type="time"
                value={settings.cutoff_clockin}
                onChange={(e) => updateSettingField('cutoff_clockin', e.target.value)}
                className="py-2.5 px-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-850 dark:text-zinc-150 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Batas Clock Out</label>
              <input
                type="time"
                value={settings.cutoff_checkout}
                onChange={(e) => updateSettingField('cutoff_checkout', e.target.value)}
                className="py-2.5 px-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-850 dark:text-zinc-150 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-extrabold text-zinc-400 uppercase tracking-wider">Lokasi Absen Otomatis</label>
            <select
              value={settings.preferred_location_id || ''}
              onChange={(e) => updateSettingField('preferred_location_id', e.target.value ? parseInt(e.target.value, 10) : null)}
              className="py-2.5 px-3 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-transparent text-xs text-zinc-850 dark:text-zinc-150 font-bold focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer"
            >
              <option value="" className="text-zinc-500 dark:bg-zinc-950">-- Gunakan Lokasi Pertama Aktif --</option>
              {locations.map((loc) => (
                <option key={loc.id} value={loc.id} className="text-zinc-850 dark:text-zinc-150 font-medium">
                  {loc.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-between border-t border-zinc-100 dark:border-zinc-900 pt-3">
            <div className="flex flex-col max-w-[70%]">
              <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">Status Absen Otomatis</span>
              <span className="text-[10px] text-zinc-400 dark:text-zinc-500 leading-relaxed mt-0.5">
                Otomatis clock-in/out saat waktu cut-off terlewati
              </span>
            </div>
            <button
              onClick={toggleAutoAttendance}
              disabled={!settings.has_image || settingsLoading}
              className={`relative inline-flex h-6.5 w-12 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                settings.auto_attendance ? 'bg-blue-600' : 'bg-zinc-200 dark:bg-zinc-850'
              } ${!settings.has_image ? 'opacity-40 cursor-not-allowed' : ''}`}
              title={!settings.has_image ? 'Harap upload foto default terlebih dahulu' : ''}
            >
              <span
                className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                  settings.auto_attendance ? 'translate-x-5.5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Debug Action Block */}
          <div className="border-t border-zinc-100 dark:border-zinc-900 pt-3">
            <button
              type="button"
              onClick={handleToggleDebug}
              className="w-full py-2.5 px-4 rounded-2xl bg-zinc-50 hover:bg-zinc-100 dark:bg-zinc-900 dark:hover:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-800/50 text-[10px] font-bold text-zinc-500 dark:text-zinc-400 transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
            >
              {showDebugInfo ? 'Sembunyikan Debug Waktu' : 'Tampilkan Debug Waktu & Timezone'}
            </button>

            {showDebugInfo && debugData && (
              <div className="mt-3 p-3.5 rounded-2xl bg-zinc-50/50 dark:bg-zinc-900/40 border border-zinc-150 dark:border-zinc-900 text-[10px] font-mono text-zinc-500 dark:text-zinc-400 space-y-1.5 overflow-x-auto leading-relaxed animate-in fade-in duration-200">
                <div><strong>Server Raw:</strong> {debugData.server_raw_time}</div>
                <div><strong>Server Local:</strong> {debugData.server_local_time}</div>
                <div><strong>Makassar Local:</strong> {debugData.user_local_time_formatted}</div>
                <div><strong>Parsed WITA:</strong> {debugData.parsed_makassar_time.hour}:{debugData.parsed_makassar_time.minute} ({debugData.parsed_makassar_time.total_minutes_of_day} mins)</div>
                {debugData.auto_attendance_evaluation && (
                  <div className="border-t border-zinc-200/60 dark:border-zinc-800/60 pt-2 mt-2 space-y-1">
                    <div><strong>Auto Enabled:</strong> {debugData.auto_attendance_evaluation.auto_attendance_enabled ? 'Ya' : 'Tidak'}</div>
                    <div><strong>Clock In Cutoff:</strong> {debugData.auto_attendance_evaluation.cutoff_clockin_time} ({debugData.auto_attendance_evaluation.cutoff_clockin_minutes} mins)</div>
                    <div><strong>Clock Out Cutoff:</strong> {debugData.auto_attendance_evaluation.cutoff_checkout_time} ({debugData.auto_attendance_evaluation.cutoff_checkout_minutes} mins)</div>
                    <div><strong>Current Time:</strong> {debugData.auto_attendance_evaluation.current_time_minutes} mins</div>
                    <div><strong>Past Clock In Limit:</strong> {debugData.auto_attendance_evaluation.is_past_clockin_cutoff ? 'Ya' : 'Tidak'}</div>
                    <div><strong>Past Clock Out Limit:</strong> {debugData.auto_attendance_evaluation.is_past_checkout_cutoff ? 'Ya' : 'Tidak'}</div>
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Audit Meta Logs */}
        {attendance && attendance?.last_action != 2 && (
          <div className="mt-6 flex flex-col gap-3.5 p-4 rounded-3xl border border-zinc-150 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-950/20">
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-400">ID Absensi</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-mono text-[10px]">
                {attendance.id || "-"}
              </span>
            </div>
            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-400">Hari Kerja</span>
              <span className="text-zinc-700 dark:text-zinc-300">
                {attendance.date || "-"}
              </span>
            </div>

            <div className="flex justify-between items-center text-xs font-bold">
              <span className="text-zinc-400">Tahap Berikutnya</span>
              <span className="text-zinc-700 dark:text-zinc-300 font-extrabold text-[9px] uppercase tracking-wider">
                {attendance.button_stage === "check_out"
                  ? "Clock Out"
                  : "Clock In"}
              </span>
            </div>
          </div>
        )}

        {attendance && attendance?.last_action == 2 && (
          <div className="mt-6 p-5 rounded-3xl border border-emerald-200 dark:border-emerald-900 bg-gradient-to-b from-emerald-50 to-white dark:from-emerald-950/30 dark:to-zinc-950/10 flex flex-col items-center text-center gap-3">
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center shadow-sm">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-emerald-600 dark:text-emerald-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold text-emerald-700 dark:text-emerald-300">
                Absensi Hari Ini Selesai 🎉
              </h3>

              <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed max-w-[260px] mx-auto">
                Terima kasih sudah bekerja keras hari ini. Semoga harimu
                menyenangkan dan jangan lupa istirahat 😊
              </p>
            </div>

            <div className="w-full mt-2 rounded-2xl bg-white/70 dark:bg-zinc-900/40 border border-zinc-100 dark:border-zinc-800 p-3 flex flex-col gap-2">
              <div className="flex justify-between items-center text-[11px] font-medium">
                <span className="text-zinc-400">ID Absensi</span>
                <span className="font-mono text-zinc-700 dark:text-zinc-300">
                  {attendance.id || "-"}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] font-medium">
                <span className="text-zinc-400">Tanggal</span>
                <span className="text-zinc-700 dark:text-zinc-300">
                  {attendance.date || "-"}
                </span>
              </div>

              <div className="flex justify-between items-center text-[11px] font-medium">
                <span className="text-zinc-400">Status</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold uppercase tracking-wide">
                  Completed
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Bottom Actions Bar */}
      {showButton && (
        <div className={`fixed ${isAdmin ? 'bottom-20' : 'bottom-0'} left-0 right-0 w-full max-w-md mx-auto p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-900/60 z-20`}>
          <Button
            onClick={() => onAction(nextStage, attendance?.id)}
            className={`w-full py-4 text-sm bg-gradient-to-r shadow-lg ${buttonGradient}`}
            rightIcon={<ChevronRight className="w-4 h-4" />}
          >
            {buttonText}
          </Button>
        </div>
      )}
    </div>
  );
};

export default DashboardView;
