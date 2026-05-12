'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import {
  ShieldCheck, Target, AlertOctagon, Lightbulb, Users, BarChart2, Brain,
  Zap, CheckCircle, GraduationCap, Layers, ArrowUpRight, Sparkles,
  LayoutDashboard, Settings, Search, Bell, TrendingDown,
} from 'lucide-react';

/* ============================================================
   STYLES ΓÇö di-inject sekali via <style jsx global>-style tag
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
.visions-root .btn-primary:hover {
  transform: translateY(-1px);
  box-shadow:
    0 0 0 1px oklch(1 0 0 / 0.25),
    inset 0 1px 0 0 oklch(1 0 0 / 0.6),
    0 12px 32px -6px oklch(0 0 0 / 0.6),
    0 0 60px -10px var(--violet);
}

.visions-root .btn-ghost {
  display: inline-flex; align-items: center; gap: 0.5rem;
  padding: 0.85rem 1.4rem; border-radius: 999px;
  font-size: 14px; font-weight: 500; color: var(--text-hi);
  background: oklch(1 0 0 / 0.04); border: 1px solid var(--line);
  transition: background .2s ease; text-decoration: none;
}
.visions-root .btn-ghost:hover { background: oklch(1 0 0 / 0.08); }

.visions-root .gradient-text {
  background: linear-gradient(135deg, var(--violet), var(--coral) 60%, oklch(0.82 0.16 80));
  -webkit-background-clip: text; background-clip: text; color: transparent;
}

@keyframes visions-rise { from { opacity: 0; transform: translateY(24px); } to { opacity: 1; transform: translateY(0); } }
.visions-root .rise { animation: visions-rise 0.9s cubic-bezier(0.16,1,0.3,1) both; }

@keyframes visions-floaty { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-6px) } }
.visions-root .floaty { animation: visions-floaty 6s ease-in-out infinite; }
`;

/* ============================================================
   DASHBOARD PREVIEW (inline)
   ============================================================ */
const customers = [
  { name: 'Acme Corp',      score: 87, risk: 'Tinggi',  tone: 'rose',    init: 'AC', days: '2d' },
  { name: 'Northwind Ltd',  score: 64, risk: 'Sedang',  tone: 'amber',   init: 'NW', days: '5d' },
  { name: 'Globex Studio',  score: 42, risk: 'Sedang',  tone: 'amber',   init: 'GS', days: '1w' },
  { name: 'Initech',        score: 21, risk: 'Rendah',  tone: 'emerald', init: 'IT', days: '2w' },
  { name: 'Umbrella SaaS',  score: 92, risk: 'Tinggi',  tone: 'rose',    init: 'US', days: '1d' },
];

const toneClass = (t) => {
  if (t === 'rose')  return { bg: 'rgba(244,63,94,0.15)',  text: 'rgb(253,164,175)', bar: 'var(--rose)' };
  if (t === 'amber') return { bg: 'rgba(245,158,11,0.15)', text: 'rgb(252,211,77)',  bar: 'var(--amber)' };
  return { bg: 'rgba(16,185,129,0.15)', text: 'rgb(110,231,183)', bar: 'var(--emerald)' };
};

function DashboardPreview() {
  return (
    <div className="glass rounded-2xl overflow-hidden w-full" style={{ background: 'var(--bg-elev)' }}>
      <div className="flex items-center gap-2 px-4 py-3 border-b border-line">
        <span className="w-3 h-3 rounded-full" style={{ background: '#FF5F57' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#FEBC2E' }} />
        <span className="w-3 h-3 rounded-full" style={{ background: '#28C840' }} />
        <div className="flex-1 flex justify-center">
          <div className="px-3 py-1 rounded-md text-[11px] font-mono text-lo bg-deep border border-line flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            visions.app/dashboard
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12">
        <aside className="col-span-2 border-r border-line p-3 hidden md:block">
          <div className="flex items-center gap-2 px-2 py-2 mb-4">
            <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--violet), var(--coral))' }}>
              <ShieldCheck className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="text-xs font-semibold">Visions</span>
          </div>
          {[
            { icon: LayoutDashboard, label: 'Overview', active: true },
            { icon: Users, label: 'Pelanggan' },
            { icon: BarChart2, label: 'Analytics' },
            { icon: Settings, label: 'Pengaturan' },
          ].map(({ icon: Icon, label, active }) => (
            <div key={label} className="flex items-center gap-2 px-2 py-1.5 rounded-md text-[11px] mb-0.5"
              style={{ background: active ? 'var(--violet-soft)' : 'transparent', color: active ? 'var(--text-hi)' : 'var(--text-lo)' }}>
              <Icon className="w-3.5 h-3.5" strokeWidth={1.5} />
              {label}
            </div>
          ))}
        </aside>

        <main className="col-span-12 md:col-span-10 p-5">
          <div className="flex items-center justify-between mb-5">
            <div>
              <div className="text-[11px] eyebrow mb-1">Customer Success</div>
              <div className="text-[15px] font-semibold">Selamat pagi, Ari</div>
            </div>
            <div className="flex items-center gap-2">
              <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md bg-deep border border-line text-[11px] text-lo">
                <Search className="w-3 h-3" /> Cari pelangganΓÇª
              </div>
              <div className="w-7 h-7 rounded-md bg-deep border border-line flex items-center justify-center">
                <Bell className="w-3.5 h-3.5 text-lo" />
              </div>
              <div className="w-7 h-7 rounded-full" style={{ background: 'linear-gradient(135deg, var(--coral), var(--violet))' }} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            {[
              { label: 'Akurasi Model',   value: '94.2', suf: '%', trend: '+1.4%',       color: 'var(--violet)' },
              { label: 'Berisiko Tinggi', value: '128',  suf: '',  trend: '+12',         color: 'var(--coral)' },
              { label: 'Diselamatkan',    value: '47',   suf: '',  trend: 'minggu ini',  color: 'var(--emerald)' },
            ].map((k) => (
              <div key={k.label} className="rounded-xl p-3 bg-deep border border-line">
                <div className="text-[10px] eyebrow mb-2">{k.label}</div>
                <div className="flex items-baseline gap-1.5">
                  <div className="text-2xl font-display font-medium num-tab" style={{ color: k.color }}>{k.value}</div>
                  <div className="text-xs text-lo">{k.suf}</div>
                </div>
                <div className="text-[10px] text-md mt-1 flex items-center gap-1">
                  <ArrowUpRight className="w-2.5 h-2.5" /> {k.trend}
                </div>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-3 gap-3 mb-4">
            <div className="col-span-2 rounded-xl p-4 bg-deep border border-line">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-semibold">Distribusi Risiko</div>
                <div className="text-[10px] text-lo font-mono">7 hari</div>
              </div>
              {[
                { label: 'Tinggi', pct: 22, color: 'var(--rose)',    val: '128' },
                { label: 'Sedang', pct: 41, color: 'var(--amber)',   val: '240' },
                { label: 'Rendah', pct: 78, color: 'var(--emerald)', val: '456' },
              ].map((b) => (
                <div key={b.label} className="mb-2.5 last:mb-0">
                  <div className="flex items-center justify-between text-[10px] mb-1">
                    <span className="text-md">{b.label}</span>
                    <span className="text-lo num-tab">{b.val}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-hi overflow-hidden">
                    <div className="h-full rounded-full" style={{ width: `${b.pct}%`, background: `linear-gradient(90deg, ${b.color}, ${b.color}aa)` }} />
                  </div>
                </div>
              ))}
            </div>

            <div className="rounded-xl p-4 bg-deep border border-line relative overflow-hidden">
              <div className="text-[11px] font-semibold mb-1">Churn Rate</div>
              <div className="text-2xl font-display font-medium num-tab gradient-text">4.8<span className="text-sm">%</span></div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 mt-0.5">
                <TrendingDown className="w-3 h-3" /> -0.6% MoM
              </div>
              <svg viewBox="0 0 120 40" className="absolute bottom-2 left-2 right-2 w-[calc(100%-1rem)] h-12">
                <defs>
                  <linearGradient id="visions-spark" x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor="var(--violet)" stopOpacity="0.5" />
                    <stop offset="100%" stopColor="var(--violet)" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d="M0,28 L15,22 L30,26 L45,18 L60,20 L75,12 L90,16 L105,8 L120,10 L120,40 L0,40 Z" fill="url(#visions-spark)" />
                <path d="M0,28 L15,22 L30,26 L45,18 L60,20 L75,12 L90,16 L105,8 L120,10" fill="none" stroke="var(--violet)" strokeWidth="1.2" />
              </svg>
            </div>
          </div>

          <div className="rounded-xl bg-deep border border-line overflow-hidden">
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-line">
              <div className="text-[11px] font-semibold">Pelanggan Berisiko</div>
              <div className="text-[10px] text-lo font-mono">5 dari 824</div>
            </div>
            <div className="divide-y divide-[var(--line)]">
              {customers.map((c) => {
                const t = toneClass(c.tone);
                return (
                  <div key={c.name} className="grid grid-cols-12 items-center px-4 py-2.5 text-[11px]">
                    <div className="col-span-5 flex items-center gap-2.5">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-semibold" style={{ background: t.bg, color: t.text }}>{c.init}</div>
                      <span className="text-md">{c.name}</span>
                    </div>
                    <div className="col-span-4 flex items-center gap-2">
                      <div className="h-1 flex-1 rounded-full bg-hi overflow-hidden">
                        <div className="h-full" style={{ width: `${c.score}%`, background: t.bar }} />
                      </div>
                      <span className="num-tab text-md w-6 text-right">{c.score}</span>
                    </div>
                    <div className="col-span-2 text-center">
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-semibold" style={{ background: t.bg, color: t.text }}>{c.risk}</span>
                    </div>
                    <div className="col-span-1 text-right text-lo font-mono text-[10px]">{c.days}</div>
                  </div>
                );
              })}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ============================================================
   DATA
   ============================================================ */
const NAV_LINKS = [
  { href: '#tentang', label: 'Tentang' },
  { href: '#fitur',   label: 'Fitur' },
  { href: '#manfaat', label: 'Manfaat' },
];

const STATS = [
  { value: '94.2%',  label: 'Akurasi Model' },
  { value: '0.93',   label: 'AUC-ROC Score' },
  { value: '47+',    label: 'Fitur Prediksi' },
  { value: '<200ms', label: 'Latency Inferensi' },
];

const FEATURES = [
  { icon: Target,       title: 'Churn Score 0ΓÇô100',    desc: 'Setiap pelanggan mendapat skor risiko otomatis berdasarkan pola perilaku dan riwayat penggunaan platform.', color: 'var(--violet)' },
  { icon: AlertOctagon, title: 'Risk Level Real-time', desc: 'Klasifikasi Tinggi / Sedang / Rendah diperbarui berkala untuk memudahkan prioritisasi tindakan CS.',         color: 'var(--coral)' },
  { icon: Lightbulb,    title: 'Rekomendasi Retensi',  desc: 'Aksi spesifik yang dipersonalisasi per pelanggan dihasilkan otomatis berdasarkan profil risiko.',             color: 'var(--amber)' },
  { icon: Users,        title: 'Manajemen Staff',      desc: 'Assign pelanggan berisiko ke tim Customer Success dan pantau workload serta performa setiap anggota.',         color: 'var(--emerald)' },
  { icon: BarChart2,    title: 'Dashboard Analytics',  desc: 'Visualisasi tren churn rate dan distribusi risiko dengan chart interaktif yang mudah dibaca.',                 color: 'var(--violet)' },
  { icon: Brain,        title: 'Model ML Canggih',     desc: 'XGBoost, LightGBM, CatBoost + Deep Learning MLP ΓÇö ensemble model untuk prediksi yang presisi.',                color: 'var(--coral)' },
];

const BENEFITS = [
  { icon: Target,    title: 'Prioritas jelas, bukan tebak-tebakan', desc: 'Fokus ke pelanggan yang paling butuh perhatian hari iniΓÇöberdasarkan churn score dan sinyal risiko.' },
  { icon: Zap,       title: 'Aksi retensi lebih cepat dieksekusi',  desc: 'Rekomendasi tindakan spesifik membantu tim CS bergerak cepat tanpa menyusun strategi dari nol.' },
  { icon: BarChart2, title: 'Tim & performa jadi lebih terukur',    desc: 'Lihat dampak intervensi, tren churn, dan workload staff dalam satu dashboard yang rapi.' },
];

/* ============================================================
   PAGE
   ============================================================ */
export default function LandingPage() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  const navigateWithLeave = useCallback(
    (path) => (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      e.preventDefault();
      if (isLeaving) return;
      setIsLeaving(true);
      window.setTimeout(() => router.push(path), 110);
    },
    [router, isLeaving]
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: STYLES }} />
      <div className="visions-root min-h-screen bg-base text-hi overflow-x-hidden relative">
        {/* NAV */}
        <nav className="fixed top-4 inset-x-0 z-50 flex justify-center px-4">
          <div className="glass rounded-full pl-3 pr-2 py-2 flex items-center gap-2 max-w-[920px] w-full">
            <Link href="/" className="flex items-center gap-2 pl-2 pr-3 group">
              <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, var(--violet), var(--coral))' }}>
                <ShieldCheck className="w-3.5 h-3.5 text-white" />
              </div>
              <span className="text-sm font-semibold tracking-tight">Visions</span>
            </Link>

            <div className="hidden md:flex items-center gap-1 mx-auto">
              {NAV_LINKS.map((n) => (
                <a key={n.href} href={n.href} className="px-3 py-1.5 rounded-full text-[13px] text-md hover:text-hi hover:bg-white/5 transition-colors">
                  {n.label}
                </a>
              ))}
            </div>

            <a href="/login" onClick={navigateWithLeave('/login')}
              className="ml-auto md:ml-0 inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[13px] font-medium bg-white hover:gap-2.5 transition-all"
              style={{ color: 'var(--bg-deep)' }}>
              Login <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
          </div>
        </nav>

        {/* HERO */}
        <section className="relative pt-36 pb-32 px-6 overflow-hidden">
          <div className="aurora" />
          <div className="absolute inset-0 grid-bg pointer-events-none" />

          <div className="relative max-w-[1200px] mx-auto text-center">
            <div className="rise inline-flex items-center gap-2 pill mb-8" style={{ animationDelay: '.05s' }}>
              <Sparkles className="w-3 h-3" style={{ color: 'var(--violet)' }} />
              <span>Platform Retensi Pelanggan SaaS</span>
            </div>

            <h1 className="rise display text-[clamp(48px,8vw,112px)] mb-8" style={{ animationDelay: '.1s' }}>
              Cegah <em>churn</em>
              <br />sebelum terjadi.
            </h1>

            <p className="rise text-[17px] md:text-[19px] text-md max-w-2xl mx-auto leading-relaxed mb-10" style={{ animationDelay: '.2s' }}>
              Visions membantu tim Customer Success melihat pelanggan yang mulai menjauh lebih awalΓÇödengan
              Machine LearningΓÇösupaya fokus ke tindakan yang paling berdampak.
            </p>

            <div className="rise flex flex-wrap items-center justify-center gap-3 mb-20" style={{ animationDelay: '.3s' }}>
              <a href="/login" onClick={navigateWithLeave('/login')} className={`btn-primary ${isLeaving ? 'opacity-70' : ''}`}>
                Masuk ke Dashboard <ArrowUpRight className="w-4 h-4" />
              </a>
              <a href="#fitur" className="btn-ghost">Lihat fitur</a>
            </div>

            <div className="rise relative max-w-[1100px] mx-auto" style={{ animationDelay: '.45s' }}>
              <div className="absolute -inset-x-10 -inset-y-6 rounded-3xl pointer-events-none"
                style={{ background: 'radial-gradient(60% 60% at 50% 0%, oklch(0.70 0.20 305 / 0.25), transparent 70%)', filter: 'blur(40px)' }} />
              <DashboardPreview />
              <div className="absolute inset-x-0 -bottom-1 h-32 pointer-events-none"
                style={{ background: 'linear-gradient(to bottom, transparent, var(--bg-base))' }} />
            </div>
          </div>
        </section>

        {/* STATS */}
        <section className="px-6 -mt-8 relative z-10">
          <div className="max-w-[1100px] mx-auto glass rounded-2xl px-6 py-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6">
              {STATS.map((s, i) => (
                <div key={s.label} className={`px-4 ${i < STATS.length - 1 ? 'md:border-r md:border-line' : ''}`}>
                  <div className="text-2xl md:text-3xl font-display font-medium num-tab gradient-text">{s.value}</div>
                  <div className="text-[11px] eyebrow mt-1">{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TENTANG */}
        <section id="tentang" className="py-32 px-6">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid lg:grid-cols-2 gap-12 lg:gap-20 items-center">
              <div>
                <div className="pill mb-6"><span style={{ color: 'var(--violet)' }}>01</span> Tentang</div>
                <h2 className="display text-4xl md:text-6xl mb-8">
                  Solusi cerdas untuk <em>retensi</em> pelanggan SaaS.
                </h2>
                <p className="text-md text-[16px] leading-relaxed mb-5">
                  Visions adalah platform prediksi churn yang dibangun oleh Tim Visions, Politeknik Negeri Jakarta,
                  sebagai solusi nyata untuk tantangan retensi di industri SaaS.
                </p>
                <p className="text-md text-[16px] leading-relaxed mb-10">
                  Menggabungkan algoritma Machine Learning seperti XGBoost, LightGBM, dan Deep Learning, platform ini
                  mampu mengidentifikasi pelanggan berisiko tinggi dan memberikan rekomendasi tindakan yang spesifik
                  dan terukur.
                </p>

                <div className="space-y-3">
                  {[
                    { icon: Brain, text: 'Ditenagai algoritma ML & Deep Learning terkini' },
                    { icon: Layers, text: 'Arsitektur role-based: Admin & Staff CS' },
                    { icon: GraduationCap, text: 'Dikembangkan oleh Tim Visions ΓÇö PNJ, didukung LapisAI' },
                  ].map(({ icon: Icon, text }) => (
                    <div key={text} className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ background: 'var(--violet-soft)', border: '1px solid var(--line)' }}>
                        <Icon className="w-4 h-4" style={{ color: 'var(--violet)' }} strokeWidth={1.5} />
                      </div>
                      <span className="text-sm text-md">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="relative">
                <div className="absolute -inset-8 rounded-3xl pointer-events-none"
                  style={{ background: 'radial-gradient(50% 60% at 50% 50%, oklch(0.70 0.20 305 / 0.25), transparent 70%)', filter: 'blur(60px)' }} />
                <div className="relative glass rounded-2xl p-7">
                  <div className="flex items-center justify-between mb-6 pb-5 border-b border-line">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                        style={{ background: 'linear-gradient(135deg, var(--violet), var(--coral))' }}>
                        <ShieldCheck className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <div className="text-sm font-semibold">Visions</div>
                        <div className="text-[11px] text-lo font-mono">ChurnShield ┬╖ v1.0</div>
                      </div>
                    </div>
                    <span className="pill text-[10px]">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" /> Live
                    </span>
                  </div>

                  {[
                    { label: 'Dibuat oleh', value: 'Tim Visions ΓÇö PNJ' },
                    { label: 'Mitra', value: 'LapisAI' },
                    { label: 'Tech Stack', value: 'Next ┬╖ Supabase ┬╖ ML' },
                    { label: 'Model Utama', value: 'Random Forest 94.2%' },
                    { label: 'Dataset', value: '47+ fitur prediksi' },
                  ].map((r, i, arr) => (
                    <div key={r.label} className={`flex items-center justify-between py-3 ${i < arr.length - 1 ? 'border-b border-line' : ''}`}>
                      <span className="text-[11px] eyebrow">{r.label}</span>
                      <span className="text-[13px] font-medium">{r.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FITUR */}
        <section id="fitur" className="py-32 px-6 relative">
          <div className="absolute inset-0 grid-bg pointer-events-none opacity-40" />
          <div className="relative max-w-[1200px] mx-auto">
            <div className="text-center mb-16">
              <div className="pill mb-6"><span style={{ color: 'var(--violet)' }}>02</span> Fitur</div>
              <h2 className="display text-4xl md:text-6xl mb-6">
                Semua yang dibutuhkan tim <em>Customer Success</em>.
              </h2>
              <p className="text-md max-w-xl mx-auto leading-relaxed">
                Dari prediksi hingga eksekusiΓÇösatu platform terintegrasi untuk mengelola retensi pelanggan SaaS
                secara end-to-end.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
              {FEATURES.map((f, i) => {
                const Icon = f.icon;
                return (
                  <div key={f.title}
                    className="group relative glass rounded-2xl p-6 transition-transform duration-300 hover:-translate-y-1"
                    style={{ animation: `visions-rise .7s cubic-bezier(.16,1,.3,1) ${0.06 * i}s both` }}>
                    <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                      style={{ boxShadow: `inset 0 0 0 1px ${f.color}, 0 0 60px -20px ${f.color}` }} />
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-5"
                      style={{ background: f.color.replace(')', ' / 0.15)'), border: `1px solid ${f.color.replace(')', ' / 0.25)')}` }}>
                      <Icon className="w-5 h-5" style={{ color: f.color }} strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[15px] font-semibold mb-2">{f.title}</h3>
                    <p className="text-[13.5px] text-md leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* MANFAAT */}
        <section id="manfaat" className="py-32 px-6 relative">
          <div className="max-w-[1200px] mx-auto">
            <div className="grid lg:grid-cols-12 gap-12 mb-16">
              <div className="lg:col-span-5">
                <div className="pill mb-6"><span style={{ color: 'var(--violet)' }}>03</span> Manfaat</div>
                <h2 className="display text-4xl md:text-6xl">
                  Dibuat untuk tim CS yang <em>kerja cepat</em>.
                </h2>
              </div>
              <div className="lg:col-span-6 lg:col-start-7 flex items-end">
                <p className="text-md text-[16px] leading-relaxed">
                  Dari identifikasi risiko sampai langkah retensiΓÇöVisions bantu tim Anda mengambil keputusan yang
                  konsisten, terukur, dan mudah dipantau.
                </p>
              </div>
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              {BENEFITS.map((b, i) => {
                const Icon = b.icon;
                return (
                  <div key={b.title} className="glass rounded-2xl p-7 relative overflow-hidden group"
                    style={{ animation: `visions-rise .7s cubic-bezier(.16,1,.3,1) ${0.08 * i}s both` }}>
                    <div className="flex items-baseline justify-between mb-8">
                      <span className="display text-5xl gradient-text num-tab">{String(i + 1).padStart(2, '0')}</span>
                      <Icon className="w-5 h-5 text-lo" strokeWidth={1.5} />
                    </div>
                    <h3 className="text-[16px] font-semibold mb-3 leading-snug">{b.title}</h3>
                    <p className="text-[13.5px] text-md leading-relaxed">{b.desc}</p>
                    <div className="mt-6 pt-5 border-t border-line text-[11px] eyebrow flex items-center gap-2">
                      <CheckCircle className="w-3 h-3 text-emerald-400" /> Tervalidasi
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-32 px-6">
          <div className="max-w-[1100px] mx-auto relative">
            <div className="aurora" style={{ inset: '-10%', opacity: 0.6 }} />
            <div className="relative glass rounded-3xl p-12 md:p-16 text-center overflow-hidden">
              <div className="absolute inset-0 grid-bg pointer-events-none opacity-50" />
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center floaty"
                  style={{ background: 'linear-gradient(135deg, var(--violet), var(--coral))', boxShadow: '0 20px 60px -10px var(--violet)' }}>
                  <ShieldCheck className="w-7 h-7 text-white" />
                </div>
                <h2 className="display text-4xl md:text-6xl mb-4">
                  Siap <em>memulai</em>?
                </h2>
                <p className="text-md text-[16px] max-w-md mx-auto mb-10 leading-relaxed">
                  Masuk ke dashboard dan mulai pantau pelanggan berisikoΓÇölebih rapi, lebih cepat, dan lebih terukur.
                </p>

                <a href="/login" onClick={navigateWithLeave('/login')} className={`btn-primary ${isLeaving ? 'opacity-70' : ''}`}>
                  Masuk ke Login <ArrowUpRight className="w-4 h-4" />
                </a>

                <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                  {['Role-based access', 'ML model siap pakai', 'Supabase Auth'].map((item) => (
                    <div key={item} className="flex items-center gap-2 text-[12px] text-md">
                      <CheckCircle className="w-3.5 h-3.5" style={{ color: 'var(--emerald)' }} strokeWidth={1.5} />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* FOOTER */}
        <footer className="px-6 py-12 border-t border-line">
          <div className="max-w-[1200px] mx-auto grid md:grid-cols-3 gap-8 items-center">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, var(--violet), var(--coral))' }}>
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">Visions</div>
                <div className="text-[11px] text-lo">Prediksi churn berbasis Machine Learning</div>
              </div>
            </div>

            <div className="flex md:justify-center items-center gap-6">
              {NAV_LINKS.map((n) => (
                <a key={n.href} href={n.href} className="text-[12px] text-md hover:text-hi transition-colors">
                  {n.label}
                </a>
              ))}
            </div>

            <div className="md:text-right">
              <div className="text-[12px] text-md">
                Didukung oleh <span className="font-semibold" style={{ color: 'var(--violet)' }}>LapisAI</span>
              </div>
              <div className="text-[11px] text-lo mt-1 font-mono">┬⌐ 2026 ΓÇö Tim Visions, PNJ</div>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}
