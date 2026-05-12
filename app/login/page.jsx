'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldCheck,
  Mail,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BarChart3,
  Users,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { AuthProvider, useAuth } from '@/lib/hooks/useAuth';

const G = `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');`;

const E = [0.16, 1, 0.3, 1];
const BRAND = '#2563EB';
const BRAND_HOVER = '#1d4ed8';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Email dan password wajib diisi');
      return;
    }
    setLoading(true);
    const result = await login(email.trim(), password);
    if (result.success) {
      router.replace('/dashboard');
    } else {
      setError(result.error ?? 'Login gagal, coba lagi');
    }
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="flex min-h-dvh items-center justify-center bg-[#F0F7FF]">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />
      <div
        className="relative flex min-h-dvh flex-col bg-[#F0F7FF] text-slate-900 antialiased"
        style={{ fontFamily: "'Inter',sans-serif" }}
      >
        {/* Latar: blur lembut saja (tanpa bentuk keras yang mengganggu) */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -left-24 top-1/4 h-80 w-80 rounded-full bg-blue-200/30 blur-[100px]" />
          <div className="absolute -right-20 bottom-1/4 h-72 w-72 rounded-full bg-sky-200/35 blur-[100px]" />
        </div>

        <div className="relative z-10 mx-auto flex w-full max-w-[1024px] flex-1 flex-col px-4 pb-8 pt-[max(1.25rem,env(safe-area-inset-top))] sm:px-6 sm:pb-10 sm:pt-6">
          {/* Selalu di alur dokumen — tidak absolute, supaya tidak terpotong */}
          <Link
            href="/"
            className="mb-5 inline-flex w-fit shrink-0 items-center gap-2 rounded-full border border-blue-100 bg-white px-3.5 py-2 text-[13px] font-medium text-slate-600 shadow-sm transition-colors hover:border-blue-200 hover:text-blue-700"
          >
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Kembali ke beranda
          </Link>

          <div className="flex min-h-0 flex-1 flex-col justify-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: E }}
              className="mx-auto w-full max-w-[1000px] overflow-hidden rounded-2xl border border-slate-200/90 bg-white shadow-[0_20px_60px_-24px_rgba(37,99,235,0.2)] sm:rounded-3xl lg:grid lg:min-h-[520px] lg:grid-cols-[minmax(0,1fr)_minmax(0,1.08fr)]"
            >
              {/* Kiri: hanya gradient + konten (tanpa lingkaran/kotak dekor mengambang) */}
              <aside className="relative hidden bg-gradient-to-br from-blue-50 via-white to-blue-50/95 lg:flex lg:flex-col lg:border-r lg:border-slate-100">
                <div className="flex flex-1 flex-col justify-between p-10 xl:p-11">
                  <div className="flex items-center gap-3">
                    <span
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl text-white shadow-md shadow-blue-500/25"
                      style={{ backgroundColor: BRAND }}
                    >
                      <ShieldCheck className="h-6 w-6" strokeWidth={2} />
                    </span>
                    <span className="text-[18px] font-bold tracking-tight text-slate-900">Visions</span>
                  </div>

                  <div className="mt-10 max-w-sm space-y-5">
                    <p className="inline-flex w-fit items-center rounded-full bg-white px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-blue-700 ring-1 ring-blue-100">
                      Customer Success
                    </p>
                    <h2 className="text-[26px] font-extrabold leading-[1.2] tracking-tight text-slate-900 xl:text-[28px]">
                      Pantau risiko pelanggan dengan tenang.
                    </h2>
                    <p className="text-[14px] leading-relaxed text-slate-600">
                      Satu tempat untuk skor churn, prioritas tim, dan laporan retensi.
                    </p>

                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1, duration: 0.4, ease: E }}
                      className="rounded-2xl border border-blue-100 bg-white p-4 shadow-sm"
                    >
                      <div className="mb-3 flex items-center justify-between">
                        <span className="text-[12px] font-semibold text-slate-600">Ringkasan hari ini</span>
                        <span className="h-2 w-2 shrink-0 rounded-full bg-emerald-500" aria-hidden />
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="rounded-xl border border-blue-100 bg-blue-50/60 p-3">
                          <BarChart3 className="h-5 w-5 text-blue-600" strokeWidth={1.75} />
                          <p className="mt-2 text-xl font-extrabold tabular-nums text-slate-900">78</p>
                          <p className="mt-0.5 text-[11px] font-medium text-slate-500">Skor risiko tertinggi</p>
                        </div>
                        <div className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                          <Users className="h-5 w-5 text-slate-500" strokeWidth={1.75} />
                          <p className="mt-2 text-sm font-bold text-slate-800">3 staf</p>
                          <p className="mt-0.5 text-[11px] text-slate-500">Siap ditugaskan</p>
                        </div>
                      </div>
                    </motion.div>
                  </div>

                  <p className="mt-8 text-[11px] text-slate-400">Platform retensi pelanggan</p>
                </div>
              </aside>

              {/* Kanan: form + footer sekali */}
              <div className="flex flex-col bg-white px-6 py-9 sm:px-10 sm:py-10 lg:min-h-[520px] lg:px-11 lg:py-11">
                <div className="mb-6 flex items-center gap-2.5 lg:hidden">
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-white shadow-md"
                    style={{ backgroundColor: BRAND }}
                  >
                    <ShieldCheck className="h-5 w-5" strokeWidth={2} />
                  </span>
                  <span className="text-[17px] font-bold text-slate-900">Visions</span>
                </div>

                <div className="flex flex-1 flex-col">
                  <div className="mb-8">
                    <h1 className="text-[26px] font-extrabold tracking-tight text-slate-900 sm:text-[28px]">Masuk</h1>
                    <p className="mt-2 max-w-md text-[14px] leading-relaxed text-slate-500">
                      Gunakan email organisasi. Belum punya akses? Hubungi admin.
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="flex flex-1 flex-col space-y-5">
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-start gap-3 rounded-2xl border border-red-100 bg-red-50 px-4 py-3"
                      >
                        <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                        <p className="text-[13px] text-red-700">{error}</p>
                      </motion.div>
                    )}

                    <div className="space-y-2">
                      <label htmlFor="login-email" className="block text-[13px] font-semibold text-slate-800">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="login-email"
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="nama@perusahaan.com"
                          autoComplete="email"
                          className={cn(
                            'h-[50px] rounded-full border-slate-200 bg-slate-50 pl-11 pr-4 text-[14px]',
                            'placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20',
                          )}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="login-password" className="block text-[13px] font-semibold text-slate-800">
                        Password
                      </label>
                      <div className="relative">
                        <Lock className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                          id="login-password"
                          type={showPass ? 'text' : 'password'}
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          autoComplete="current-password"
                          className={cn(
                            'h-[50px] rounded-full border-slate-200 bg-slate-50 pl-11 pr-12 text-[14px]',
                            'placeholder:text-slate-400 focus-visible:border-blue-500 focus-visible:bg-white focus-visible:ring-2 focus-visible:ring-blue-500/20',
                          )}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPass((v) => !v)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                          aria-label={showPass ? 'Sembunyikan password' : 'Tampilkan password'}
                        >
                          {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    <div className="pt-1">
                      <motion.button
                        type="submit"
                        disabled={loading}
                        whileHover={loading ? {} : { scale: 1.01, backgroundColor: BRAND_HOVER }}
                        whileTap={loading ? {} : { scale: 0.99 }}
                        className="flex h-[50px] w-full items-center justify-center gap-2 rounded-full text-[15px] font-semibold text-white shadow-md shadow-blue-500/20 disabled:opacity-60"
                        style={{ backgroundColor: BRAND }}
                      >
                        {loading && (
                          <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        )}
                        {loading ? 'Memverifikasi…' : 'Masuk'}
                        {!loading && <ArrowRight className="h-4 w-4" />}
                      </motion.button>
                    </div>

                    <p className="pt-4 text-center text-[13px] leading-relaxed text-slate-500">
                      Lupa password?{' '}
                      <span className="font-medium text-blue-600">Hubungi administrator</span>
                    </p>

                    <div className="mt-auto border-t border-slate-100 pt-6">
                      <div className="flex items-center justify-center gap-2">
                        <span
                          className="flex h-7 w-7 items-center justify-center rounded-md text-white"
                          style={{ backgroundColor: BRAND }}
                        >
                          <ShieldCheck className="h-3.5 w-3.5" strokeWidth={2} />
                        </span>
                        <span className="text-[11px] font-medium text-slate-400">© 2026 Visions</span>
                      </div>
                    </div>
                  </form>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
