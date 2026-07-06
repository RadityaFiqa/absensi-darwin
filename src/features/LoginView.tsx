import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { KeyRound, QrCode, LogIn, User, Lock } from "lucide-react";
import { useRouter } from "next/navigation";
import Card from "@/components/UI/Card";
import Input from "@/components/UI/Input";
import Button from "@/components/UI/Button";
import QrScanner from "@/components/QrScanner";
import { useAuth } from "@/hooks/useAuth";

interface LoginFormInput {
  token: string;
}

interface SsoFormInput {
  username: string;
  password: string;
}

export const LoginView: React.FC = () => {
  const router = useRouter();
  const { loginWithQr, loginWithSso, loginWithToken, isLoading, error, setError } = useAuth();
  const [showScanner, setShowScanner] = useState(false);
  const [showManual, setShowManual] = useState(false);
  const [showSso, setShowSso] = useState(false);

  const {
    register: registerManual,
    handleSubmit: handleManualSubmit,
    formState: { errors: manualErrors },
  } = useForm<LoginFormInput>();

  const {
    register: registerSso,
    handleSubmit: handleSsoSubmit,
    formState: { errors: ssoErrors },
  } = useForm<SsoFormInput>();

  const onManualSubmit = async (data: LoginFormInput) => {
    const success = await loginWithToken(data.token);
    if (success) {
      router.replace("/");
    }
  };

  const onSsoSubmit = async (data: SsoFormInput) => {
    const success = await loginWithSso(data.username, data.password);
    if (success) {
      router.replace("/");
    }
  };

  const handleQrScanSuccess = async (qrcode: string) => {
    setShowScanner(false);
    const success = await loginWithQr(qrcode);
    if (success) {
      router.replace("/");
    }
  };

  return (
    <div className="w-full max-w-md mx-auto p-4 flex flex-col justify-center min-h-[85vh]">
      {/* BRAND EMBLEM */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-500 bg-clip-text text-transparent tracking-tight">
          ABSENSI
        </h1>
        <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-widest mt-1">
          Perum BULOG
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
            <h2 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Selamat Datang
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Silakan login menggunakan akun SSO Bulog Anda, pindai kode QR kehadiran, atau masukkan token autentikasi.
            </p>
          </div>

          {error && (
            <div className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 text-red-700 dark:text-red-400 text-xs font-bold leading-normal">
              {error}
            </div>
          )}

          {/* Action Pathways */}
          {!showManual && !showSso && (
            <div className="flex flex-col gap-3 animate-in fade-in duration-300">
              <Button
                type="button"
                onClick={() => {
                  setError(null);
                  setShowScanner(true);
                }}
                className="py-4 text-sm"
                leftIcon={<QrCode className="w-5 h-5" />}
              >
                Pindai QR Login
              </Button>

              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(null);
                  setShowSso(true);
                }}
                className="py-4 text-sm bg-transparent border-zinc-200 dark:border-zinc-800 text-zinc-800 dark:text-zinc-200"
                leftIcon={<User className="w-5 h-5" />}
              >
                Login dengan SSO Bulog
              </Button>

              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  setError(null);
                  setShowManual(true);
                }}
                className="py-4 text-sm text-zinc-500 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                leftIcon={<KeyRound className="w-5 h-5" />}
              >
                Masukan Token Manual
              </Button>
            </div>
          )}

          {/* SSO LOGIN FORM */}
          {showSso && (
            <form
              onSubmit={handleSsoSubmit(onSsoSubmit)}
              className="flex flex-col gap-4 pt-2 animate-in fade-in duration-300"
            >
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                Login via SSO Bulog
              </h3>
              
              <Input
                label="USERNAME / NIK"
                placeholder="Masukkan NIK Bulog Anda (contoh: 0326056)..."
                leftIcon={<User className="w-4 h-4" />}
                error={ssoErrors.username?.message}
                disabled={isLoading}
                {...registerSso("username", { required: "Username/NIK wajib diisi" })}
              />

              <Input
                label="PASSWORD SSO"
                type="password"
                placeholder="Masukkan password SSO Anda..."
                leftIcon={<Lock className="w-4 h-4" />}
                error={ssoErrors.password?.message}
                disabled={isLoading}
                {...registerSso("password", { required: "Password SSO wajib diisi" })}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => {
                    setError(null);
                    setShowSso(false);
                  }}
                  disabled={isLoading}
                >
                  Batal
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  isLoading={isLoading}
                  leftIcon={<LogIn className="w-4 h-4" />}
                >
                  Masuk
                </Button>
              </div>
            </form>
          )}

          {/* MANUAL TOKEN FORM */}
          {showManual && (
            <form
              onSubmit={handleManualSubmit(onManualSubmit)}
              className="flex flex-col gap-4 pt-2 animate-in fade-in duration-300"
            >
              <h3 className="text-sm font-bold text-zinc-800 dark:text-zinc-200 mb-2">
                Input Token Manual
              </h3>

              <Input
                label="TOKEN AKTIF"
                placeholder="Masukkan token absensi Anda..."
                leftIcon={<KeyRound className="w-4 h-4" />}
                error={manualErrors.token?.message}
                disabled={isLoading}
                {...registerManual("token", { required: "Token wajib diisi" })}
              />

              <div className="flex gap-2 pt-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex-1 text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                  onClick={() => {
                    setError(null);
                    setShowManual(false);
                  }}
                  disabled={isLoading}
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
