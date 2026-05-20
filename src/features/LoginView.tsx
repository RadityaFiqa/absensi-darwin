import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { KeyRound, QrCode, LogIn } from 'lucide-react';
import Card from '@/components/UI/Card';
import Input from '@/components/UI/Input';
import Button from '@/components/UI/Button';
import QrScanner from '@/components/QrScanner';
import { useAuth } from '@/hooks/useAuth';

interface LoginFormInput {
  token: string;
}

export const LoginView: React.FC = () => {
  const { loginWithQr, loginWithToken, isLoading, error, setError } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [showManual, setShowManual] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<LoginFormInput>();

  const onManualSubmit = (data: LoginFormInput) => {
    loginWithToken(data.token);
  };

  const handleQrScanSuccess = async (qrcode: string) => {
    setShowScanner(false);
    await loginWithQr(qrcode);
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col justify-center min-h-[85vh]">
      {/* BRAND EMBLEM */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight">
          ABSENSI ENTERPRISE
        </h1>
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
          Perum BULOG Kantor Wilayah Kalsel
        </p>
      </div>

      {showScanner ? (
        <QrScanner
          onScanSuccess={handleQrScanSuccess}
          onCancel={() => setShowScanner(false)}
        />
      ) : (
        <Card className="flex flex-col gap-6 shadow-xl border-zinc-100 dark:border-zinc-900 bg-white dark:bg-zinc-950/80 backdrop-blur-md">
          <div className="flex flex-col gap-2">
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">Selamat Datang</h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Silakan pindai kode QR kehadiran Anda, atau input token autentikasi Anda secara manual.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold leading-normal">
              {error}
            </div>
          )}

          {/* Action Pathways */}
          <div className="flex flex-col gap-3">
            <Button
              type="button"
              onClick={() => {
                setError(null);
                setShowScanner(true);
              }}
              className="py-4 text-sm"
              leftIcon={<QrCode className="w-5 h-5" />}
            >
              Pindai QR Absensi
            </Button>

            {!showManual && (
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setShowManual(true);
                }}
                className="py-4 text-sm bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                leftIcon={<KeyRound className="w-5 h-5" />}
              >
                Masukan Token Manual
              </Button>
            )}
          </div>

          {showManual && (
            <form
              onSubmit={handleSubmit(onManualSubmit)}
              className="flex flex-col gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 animate-in fade-in duration-300"
            >
              <Input
                label="TOKEN AKTIF"
                placeholder="Masukkan token absensi Anda..."
                leftIcon={<KeyRound className="w-4 h-4" />}
                error={errors.token?.message}
                {...register('token', { required: 'Token wajib diisi' })}
              />

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => setShowManual(false)}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isLoading}
                  leftIcon={<LogIn className="w-4 h-4" />}
                >
                  Kirim
                </Button>
              </div>
            </form>
          )}
        </Card>
      )}
    </div>
  );
};

export default LoginView;
