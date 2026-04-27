'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/hooks/useAuth';

function LoginForm() {
  const [email, setEmail]         = useState('');
  const [password, setPassword]   = useState('');
  const [showPass, setShowPass]   = useState(false);
  const [error, setError]         = useState('');
  const [loading, setLoading]     = useState(false);
  const { login, user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && user) router.replace('/dashboard');
  }, [user, authLoading, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Email dan password wajib diisi'); return; }
    setLoading(true);
    const result = await login(email.trim(), password);
    if (result.success) {
      router.replace('/dashboard');
    } else {
      setError(result.error ?? 'Login gagal, coba lagi');
    }
    setLoading(false);
  };

  if (authLoading) return (
    <div className="min-h-screen bg-[#F6F8FF] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F8FF] flex">
      {/* Left Panel */}
      <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-14 relative overflow-hidden border-r border-indigo-200/70 bg-gradient-to-br from-slate-50 via-indigo-100/55 to-purple-100/50">
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[520px] h-[520px] bg-indigo-500/18 rounded-full blur-[110px]" />
          <div className="absolute bottom-1/4 left-1/4 w-[320px] h-[320px] bg-purple-500/16 rounded-full blur-[90px]" />
        </div>
        <div className="relative flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <ShieldCheck className="w-5 h-5 text-white" />
          </div>
          <span className="text-slate-900 font-bold">Visions</span>
        </div>
        <div className="relative max-w-[700px]">
          <h2 className="text-4xl xl:text-[46px] font-extrabold text-slate-900 leading-[1.1] mb-5 tracking-tight">
            Pantau & Cegah<br />
            <span className="gradient-text-indigo gradient-text-indigo--light">Churn Pelanggan</span>
          </h2>
          <p className="text-slate-600 text-[18px] leading-relaxed max-w-[640px]">
            Platform prediksi churn berbasis Machine Learning untuk tim Customer Success SaaS Anda.
          </p>
          <div className="mt-12 grid grid-cols-2 gap-4 max-w-[860px]">
            {[
              { v: '94.2%', l: 'Akurasi Model' },
              { v: '0.97',  l: 'AUC-ROC' },
              { v: '18',    l: 'High-Risk Aktif' },
              { v: '247',   l: 'Total Pelanggan' },
            ].map(s => (
              <div key={s.l} className="bg-white/88 border border-indigo-100/70 rounded-2xl p-5 shadow-[0_8px_24px_rgba(15,23,42,0.06)]">
                <div className="text-[38px] leading-none font-extrabold text-slate-900 tabular-nums">{s.v}</div>
                <div className="text-sm text-slate-600 mt-2">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
        <div className="relative text-slate-400 text-xs">© 2026 Visions</div>
      </div>

      {/* Right Panel / Form */}
      <div className="flex-1 flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-8 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Kembali
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="text-gray-900 font-bold">Visions</span>
          </div>

          <div className="mb-8">
            <h1 className="text-2xl font-extrabold text-slate-900">Masuk ke Akun</h1>
            <p className="text-slate-500 mt-1 text-sm">Masukkan kredensial akun Anda</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            {error && (
              <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-600">{error}</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="email@perusahaan.com"
                  className="w-full pl-11 pr-4 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent bg-white transition-all"
                  autoComplete="email"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-gray-400" />
                <input
                  type={showPass ? 'text' : 'password'}
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-11 py-3 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/80 focus:border-transparent bg-white transition-all"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(v => !v)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-600/95 disabled:opacity-60 disabled:cursor-not-allowed text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 mt-2 hover:-translate-y-0.5"
            >
              {loading && <div className="w-4 h-4 border-2 border-white/50 border-t-white rounded-full animate-spin" />}
              {loading ? 'Memverifikasi…' : 'Masuk'}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-gray-400">
            Hubungi admin jika Anda belum memiliki akun
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <AuthProvider>
      <LoginForm />
    </AuthProvider>
  );
}
