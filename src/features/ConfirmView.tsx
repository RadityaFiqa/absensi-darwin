import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { MapPin, ArrowLeft, CheckCircle2, Navigation } from 'lucide-react';
import Card from '@/components/UI/Card';
import Button from '@/components/UI/Button';
import Toast from '@/components/Toast';
import { LOCATION_OPTIONS } from '@/constants';
import { encodeToBase64 } from '@/utils/base64';
import { getOrCreateUDID } from '@/utils/udid';
import { useAuth } from '@/hooks/useAuth';
import attendanceService from '@/services/attendance.service';

interface ConfirmViewProps {
  verificationId: string;
  selfieBase64: string;
  actionType: 'check_in' | 'check_out';
  onBack: () => void;
  onSuccess: () => void;
}

interface ConfirmFormInput {
  locationId: string;
}

export const ConfirmView: React.FC<ConfirmViewProps> = ({
  verificationId,
  selfieBase64,
  actionType,
  onBack,
  onSuccess,
}) => {
  const { token } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);

  const { register, handleSubmit, watch } = useForm<ConfirmFormInput>({
    defaultValues: {
      locationId: LOCATION_OPTIONS[0].id,
    },
  });

  const selectedLocationId = watch('locationId');
  const selectedLocation = LOCATION_OPTIONS.find((loc) => loc.id === selectedLocationId) || LOCATION_OPTIONS[0];

  const onSubmit = async () => {
    if (!token) {
      setError('Sesi Anda telah kedaluwarsa. Silakan masuk kembali.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const locationStr = selectedLocation.address;
    const base64Location = encodeToBase64(locationStr);
    const udid = getOrCreateUDID();
    const inOutVal = actionType === 'check_out' ? 2 : 1;

    try {
      const payload = {
        latlng: selectedLocation.latlng,
        verification_id: verificationId,
        in_out: inOutVal,
        location_type: '1',
        location: base64Location,
        message: '',
        udid: udid,
        token: token,
      };

      const response = await attendanceService.submitCheckIn(payload);

      if (response.status === 1) {
        setShowSuccess(true);
        setTimeout(() => {
          onSuccess();
        }, 2200);
      } else {
        setError(response.error || 'Gagal merekam data absensi. Silakan hubungi admin.');
      }
    } catch (err: any) {
      setError(err.message || 'Gagal mengirimkan data presensi.');
    } finally {
      setIsLoading(false);
    }
  };

  const actionText = actionType === 'check_out' ? 'Clock Out' : 'Clock In';
  const actionColor = actionType === 'check_out'
    ? 'text-rose-500 bg-rose-50 dark:bg-rose-950/20'
    : 'text-blue-500 bg-blue-50 dark:bg-blue-950/20';

  if (showSuccess) {
    return (
      <div className="w-full max-w-md mx-auto p-4 flex flex-col items-center justify-center min-h-[75vh] text-center gap-6 animate-in zoom-in duration-300">
        <div className="w-20 h-20 rounded-full bg-emerald-500/10 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-500 ring-8 ring-emerald-500/5">
          <CheckCircle2 className="w-12 h-12" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-150">
            Absensi Berhasil!
          </h2>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-[280px] mx-auto leading-relaxed">
            Data presensi {actionText} Anda telah sukses tercatat pada server Perum BULOG.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col justify-between min-h-[90vh] pb-24 animate-in fade-in duration-200">
      {error && (
        <Toast message={error} type="error" onClose={() => setError(null)} />
      )}

      {/* Header Bar */}
      <div>
        <div className="flex items-center gap-2 pb-4 border-b border-zinc-100 dark:border-zinc-900">
          <button
            onClick={onBack}
            className="p-2 rounded-full hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-500 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Konfirmasi Absensi</h1>
            <p className="text-[10px] font-semibold text-zinc-400 dark:text-zinc-500 mt-0.5">Langkah Terakhir Presensi</p>
          </div>
        </div>

        {/* Capture Frame Display */}
        <div className="mt-6 flex flex-col items-center gap-4">
          <div className="relative w-28 h-28 rounded-full overflow-hidden border-2 border-zinc-200 dark:border-zinc-800 shadow-md">
            <img src={selfieBase64} alt="Selfie Verification" className="w-full h-full object-cover scale-x-[-1]" />
          </div>
          <div className={`px-4 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${actionColor}`}>
            {actionText}
          </div>
        </div>

        {/* Form Selection */}
        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 flex flex-col gap-5">
          <div className="flex flex-col gap-2">
            <label className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
              PILIH LOKASI KANTOR/GUDANG
            </label>
            <div className="relative flex items-center">
              <MapPin className="absolute left-4 w-4 h-4 text-zinc-400 dark:text-zinc-500 pointer-events-none" />
              <select
                {...register('locationId')}
                className="w-full rounded-2xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800 text-zinc-950 dark:text-zinc-50 py-4 pl-11 pr-4 focus:border-blue-500 focus:ring-blue-500/20 appearance-none cursor-pointer font-bold"
              >
                {LOCATION_OPTIONS.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Details Card */}
          <Card className="bg-zinc-50 dark:bg-zinc-950 border-zinc-100 dark:border-zinc-900 flex flex-col gap-4 shadow-inner">
            <div className="flex gap-3">
              <Navigation className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Garis Lintang & Bujur (GPS)
                </h4>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 font-mono">
                  {selectedLocation.latlng}
                </p>
              </div>
            </div>

            <div className="flex gap-3 pt-3 border-t border-zinc-100 dark:border-zinc-900">
              <MapPin className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <h4 className="text-[9px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest">
                  Alamat Presensi
                </h4>
                <p className="text-xs font-bold text-zinc-700 dark:text-zinc-300 whitespace-pre-line leading-relaxed">
                  {selectedLocation.address}
                </p>
              </div>
            </div>
          </Card>
        </form>
      </div>

      {/* Action Footer */}
      <div className="fixed bottom-0 left-0 right-0 w-full max-w-md mx-auto p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-900/60 z-20">
        <Button
          onClick={handleSubmit(onSubmit)}
          isLoading={isLoading}
          className="w-full py-4 text-sm bg-gradient-to-r from-blue-600 to-indigo-600 shadow-lg"
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          Konfirmasi Kehadiran
        </Button>
      </div>
    </div>
  );
};

export default ConfirmView;
