'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, Mail, Lock, Eye, EyeOff, ArrowLeft, AlertCircle, Sparkles } from 'lucide-react';
import { AuthProvider, useAuth } from '@/lib/hooks/useAuth';

/* ============================================================
   STYLES — Disamakan dengan referensi Landing Page
   ============================================================ */
const STYLES = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,SOFT@9..144,300..900,0..100&family=Inter:wght@300;400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');

:root {
  --bg-deep: oklch(0.13 0.02 280);
  --bg-base: oklch(0.16 0.02 280);
  --bg-elev: oklch(0.20 0.025 280);
  --bg-hi:   oklch(0.24 0.028 280);
  --line:    oklch(0.30 0.02 280 / 0.6);
  --line-soft: oklch(0.30 0.02 280 / 0.3);
  --violet:  oklch(0.70 0.20 305);
  --violet-soft: oklch(0.70 0.20 305 / 0.15);
  --coral:   oklch(0.74 0.18 25);
  --emerald: oklch(0.78 0.15 165);
  --amber:   oklch(0.82 0.16 80);
  --rose:    oklch(0.70 0.20 15);
  --text-hi: oklch(0.98 0.005 280);
  --text-md: oklch(0.78 0.015 280);
  --text-lo: oklch(0.58 0.02 280);
  --font-display: 'Fraunces', ui-serif, Georgia, serif;
  --font-sans: 'Inter', ui-sans-serif, system-ui, sans-serif;
  --font-mono: 'JetBrains Mono', ui-monospace, monospace;
}

.visions-root, .visions-root * { box-sizing: border-box; }
.visions-root {
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
  background-color: var(--bg-base);
  color: var(--text-hi);
  font-feature-settings: "ss01","cv11";
}
.visions-root ::selection { background: var(--violet); color: var(--bg-deep); }

.visions-root .font-display { font-family: var(--font-display); }
.visions-root .font-mono    { font-family: var(--font-mono); }

.visions-root .text-hi { color: var(--text-hi); }
.visions-root .text-md { color: var(--text-md); }
.visions-root .text-lo { color: var(--text-lo); }
.visions-root .bg-deep { background-color: var(--bg-deep); }
.visions-root .bg-base { background-color: var(--bg-base); }
.visions-root .bg-elev { background-color: var(--bg-elev); }
.visions-root .bg-hi   { background-color: var(--bg-hi); }
.visions-root .border-line { border-color: var(--line); }

.visions-root .display { font-family: var(--font-sans); font-weight: 500; letter-spacing: -0.04em; line-height: 1; }
.visions-root .display em {
  font-family: var(--font-display); font-style: italic; font-weight: 300;
  letter-spacing: -0.03em; font-variation-settings: "opsz" 144, "SOFT" 100;
  background: linear-gradient(135deg, var(--violet), var(--coral));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

.visions-root .eyebrow {
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.16em;
  text-transform: uppercase; color: var(--text-lo);
}
.visions-root .num-tab { font-variant-numeric: tabular-nums; }

.visions-root .glass {
  background: linear-gradient(180deg, oklch(1 0 0 / 0.04), oklch(1 0 0 / 0.01)), var(--bg-elev);
  border: 1px solid var(--line);
  box-shadow:
    inset 0 1px 0 0 oklch(1 0 0 / 0.06),
    0 1px 0 0 oklch(0 0 0 / 0.4),
    0 30px 60px -20px oklch(0 0 0 / 0.5);
  backdrop-filter: blur(20px);
}

.visions-root .pill {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.35rem 0.75rem; border-radius: 999px;
  background: oklch(1 0 0 / 0.04); border: 1px solid var(--line);
  font-family: var(--font-mono); font-size: 11px; letter-spacing: 0.08em;
  text-transform: uppercase; color: var(--text-md);
}

.visions-root .aurora {
  position: absolute; inset: -20%; pointer-events: none;
  background:
    radial-gradient(60% 50% at 20% 20%, oklch(0.70 0.20 305 / 0.35), transparent 60%),
    radial-gradient(50% 50% at 85% 30%, oklch(0.74 0.18 25 / 0.28), transparent 60%),
    radial-gradient(70% 50% at 50% 90%, oklch(0.65 0.18 240 / 0.25), transparent 60%);
  filter: blur(80px) saturate(1.2); opacity: 0.85;
}

.visions-root .grid-bg {
  background-image:
    linear-gradient(to right, oklch(1 0 0 / 0.04) 1px, transparent 1px),
    linear-gradient(to bottom, oklch(1 0 0 / 0.04) 1px, transparent 1px);
  background-size: 56px 56px;
  mask-image: radial-gradient(ellipse 80% 60% at 50% 0%, black 30%, transparent 80%);
}

.visions-root .btn-primary {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.85rem 1.4rem; border-radius: 999px;
  font-size: 14px; font-weight: 500; color: var(--bg-deep);
  background: linear-gradient(180deg, oklch(0.98 0.005 280), oklch(0.92 0.01 280));
  box-shadow:
    0 0 0 1px oklch(1 0 0 / 0.2),
    inset 0 1px 0 0 oklch(1 0 0 / 0.5),
    0 8px 24px -6px oklch(0 0 0 / 0.5),
    0 0 40px -10px var(--violet);
  transition: transform .25s cubic-bezier(.16,1,.3,1), box-shadow .25s ease;
  text-decoration: none;
}
.visions-root .btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow:
    0 0 0 1px oklch(1 0 0 / 0.25),
    inset 0 1px 0 0 oklch(1 0 0 / 0.6),
    0 12px 32px -6px oklch(0 0 0 / 0.6),
    0 0 60px -10px var(--violet);
}
.visions-root .btn-primary:disabled {
  opacity: 0.7; cursor: not-allowed; transform: none;
}
`;

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
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="visions-root min-h-screen bg-base flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-line border-t-[var(--violet)] rounded-full animate-spin" />
      </div>
    </>
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="visions-root min-h-screen flex overflow-hidden">
        
        {/* ═══════════════════════ LEFT PANEL ═══════════════════════ */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 p-12 xl:p-14 relative bg-deep border-r border-line">
          <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
          <div className="aurora opacity-40 pointer-events-none" />
          <div className="absolute inset-0 bg-gradient-to-br from-transparent to-base/50 pointer-events-none" />
          
          {/* Logo */}
          <div className="relative flex items-center gap-2.5 z-10">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                 style={{ background: 'linear-gradient(135deg, var(--violet), var(--coral))', boxShadow: '0 4px 20px -5px var(--violet)' }}>
              <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.2} />
            </div>
            <span className="text-[16px] font-semibold text-hi tracking-tight">Visions</span>
          </div>

          {/* Content */}
          <div className="relative max-w-[560px] my-auto z-10">
            <div className="inline-flex items-center gap-2 pill mb-6">
              <Sparkles className="w-3 h-3" style={{ color: 'var(--violet)' }} />
              <span>Akses Dashboard</span>
            </div>
            <h2 className="display text-[40px] xl:text-[46px] leading-[1.05] mb-5">
              Pantau & Cegah <br />
              <em>Churn Pelanggan</em>
            </h2>
            <p className="text-[17px] leading-[1.6] text-md max-w-[480px]">
              Platform prediksi churn berbasis Machine Learning untuk tim Customer Success SaaS Anda.
            </p>
            
            {/* Stats Cards */}
            <div className="mt-12 grid grid-cols-2 gap-4">
              {[
                { v: '94.2%', l: 'Akurasi Model', color: 'var(--violet)' },
                { v: '0.97',  l: 'AUC-ROC', color: 'var(--coral)' },
                { v: '18',    l: 'High-Risk Aktif', color: 'var(--rose)' },
                { v: '247',   l: 'Total Pelanggan', color: 'var(--emerald)' },
              ].map(s => (
                <div key={s.l} className="glass rounded-2xl p-5 transition-transform duration-300 hover:-translate-y-1">
                  <div className="text-[32px] font-display font-medium num-tab" style={{ color: s.color }}>{s.v}</div>
                  <div className="text-[11px] eyebrow mt-2">{s.l}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="relative text-[11px] text-lo font-mono z-10">
            © 2026 VISIONS — CHURNSHIELD PLATFORM
          </div>
        </div>

        {/* ═══════════════════════ RIGHT PANEL (FORM) ═══════════════════════ */}
        <div className="flex-1 flex items-center justify-center px-6 py-12 bg-base relative">
          <div className="w-full max-w-[400px] z-10">
            
            <Link href="/" className="inline-flex items-center gap-2 text-[13px] font-medium text-lo hover:text-hi mb-8 transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" /> Kembali
            </Link>

            {/* Mobile Logo Header */}
            <div className="lg:hidden flex items-center gap-2.5 mb-8">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, var(--violet), var(--coral))', boxShadow: '0 4px 20px -5px var(--violet)' }}>
                <ShieldCheck className="w-4 h-4 text-white" strokeWidth={2.2} />
              </div>
              <span className="text-[16px] font-semibold text-hi tracking-tight">Visions</span>
            </div>

            <div className="mb-8">
              <h1 className="text-[26px] font-semibold tracking-tight text-hi">Masuk ke Akun</h1>
              <p className="text-[14px] text-md mt-1.5">Masukkan kredensial untuk melanjutkan ke dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 md:p-7 space-y-5">
              {error && (
                <div className="flex items-start gap-2.5 p-3.5 rounded-lg border" style={{ backgroundColor: 'rgba(244,63,94,0.15)', borderColor: 'rgba(244,63,94,0.2)' }}>
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--rose)' }} strokeWidth={2.5} />
                  <p className="text-[13px] font-medium" style={{ color: 'var(--rose)' }}>{error}</p>
                </div>
              )}

              <div className="space-y-4">
                {/* Email Field */}
                <div>
                  <label className="block text-[13px] font-medium text-md mb-1.5">Email</label>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lo" />
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@perusahaan.com"
                      className="w-full bg-deep border border-line rounded-xl text-[14px] text-hi pl-[38px] pr-4 py-2.5 focus:outline-none focus:border-[var(--violet)] transition-colors placeholder:text-lo"
                      autoComplete="email"
                    />
                  </div>
                </div>

                {/* Password Field */}
                <div>
                  <label className="block text-[13px] font-medium text-md mb-1.5">Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-lo" />
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••"
                      className="w-full bg-deep border border-line rounded-xl text-[14px] text-hi pl-[38px] pr-[38px] py-2.5 focus:outline-none focus:border-[var(--violet)] transition-colors placeholder:text-lo"
                      autoComplete="current-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-lo hover:text-hi transition-colors"
                    >
                      {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary w-full justify-center py-[11px]"
                >
                  {loading && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
                  {loading ? 'Memverifikasi...' : 'Masuk sekarang'}
                </button>
              </div>
            </form>

            <p className="mt-8 text-center text-[13px] text-lo">
              Hubungi administrator jika Anda belum memiliki akses.
            </p>
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