'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useState } from 'react';
import {
  ShieldCheck, Target, AlertOctagon,
  Lightbulb, Users, BarChart2, Brain,
  Zap, CheckCircle,
  GraduationCap, Layers, Sparkles,
} from 'lucide-react';

/* ─── Constants ──────────────────────────────────────────────────── */

const NAV_LINKS = [
  { href: '#tentang',   label: 'Tentang' },
  { href: '#fitur',     label: 'Fitur' },
  { href: '#manfaat',   label: 'Manfaat' },
];

const STATS = [
  { value: '94.2%', label: 'Akurasi Model',     color: '#818CF8' },
  { value: '0.93',  label: 'AUC-ROC Score',      color: '#A78BFA' },
  { value: '51.2%', label: 'Churn Rate Dataset', color: '#F472B6' },
  { value: '47+',   label: 'Fitur Prediksi',     color: '#34D399' },
];

const FEATURES = [
  { icon: Target,      title: 'Churn Score 0–100',   desc: 'Setiap pelanggan mendapat skor risiko otomatis berdasarkan pola perilaku dan riwayat penggunaan platform.', accent: '#4F46E5' },
  { icon: AlertOctagon,title: 'Risk Level Real-time', desc: 'Klasifikasi Tinggi / Sedang / Rendah diperbarui berkala untuk memudahkan prioritisasi tindakan CS.', accent: '#EF4444' },
  { icon: Lightbulb,   title: 'Rekomendasi Retensi', desc: 'Aksi spesifik yang dipersonalisasi per pelanggan dihasilkan otomatis oleh sistem berdasarkan profil risiko.', accent: '#F59E0B' },
  { icon: Users,       title: 'Manajemen Staff',      desc: 'Assign pelanggan berisiko ke tim Customer Success dan pantau workload serta performa setiap anggota tim.', accent: '#10B981' },
  { icon: BarChart2,   title: 'Dashboard Analytics',  desc: 'Visualisasi tren churn rate dan distribusi risiko dengan chart interaktif yang mudah dibaca dan dipahami.', accent: '#6366F1' },
  { icon: Brain,       title: 'Model ML Canggih',     desc: 'XGBoost, LightGBM, CatBoost + Deep Learning MLP — ensemble model untuk prediksi churn yang presisi.', accent: '#7C3AED' },
];

const BENEFITS = [
  {
    icon: Target,
    title: 'Prioritas jelas, bukan tebak-tebakan',
    desc: 'Fokus ke pelanggan yang paling butuh perhatian hari ini—berdasarkan churn score dan sinyal risiko.',
    accent: '#4F46E5',
  },
  {
    icon: Zap,
    title: 'Aksi retensi lebih cepat dieksekusi',
    desc: 'Rekomendasi tindakan yang spesifik membantu tim CS bergerak cepat tanpa menyusun strategi dari nol.',
    accent: '#7C3AED',
  },
  {
    icon: BarChart2,
    title: 'Tim & performa jadi lebih terukur',
    desc: 'Lihat dampak intervensi, tren churn, dan workload staff dalam satu dashboard yang rapi.',
    accent: '#10B981',
  },
];

/* ─── Shared style helpers ───────────────────────────────────────── */
const glass = {
  background: 'rgba(255,255,255,0.86)',
  border: '1px solid rgba(15,23,42,0.08)',
  boxShadow: '0 10px 26px rgba(15,23,42,0.06)',
};

const sectionPill = (label) => (
  <div className="inline-flex items-center gap-2 border rounded-full px-3.5 py-1 mb-5"
       style={{ background: 'rgba(79,70,229,0.07)', borderColor: 'rgba(79,70,229,0.18)' }}>
    <Sparkles className="w-3 h-3 text-indigo-400" />
    <span className="text-xs font-semibold tracking-wide" style={{ color: '#4F46E5' }}>{label}</span>
  </div>
);

/* ─── Page ───────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [isLeaving, setIsLeaving] = useState(false);

  const navigateWithLeave = useCallback((path) => (e) => {
    // allow open-in-new-tab etc.
    if (
      e?.defaultPrevented ||
      e?.button !== 0 ||
      e?.metaKey ||
      e?.ctrlKey ||
      e?.shiftKey ||
      e?.altKey
    ) return;

    e.preventDefault();
    if (isLeaving) return;

    setIsLeaving(true);
    document.documentElement.classList.add('page-leave');
    window.setTimeout(() => router.push(path), 110);
    window.setTimeout(() => {
      document.documentElement.classList.remove('page-leave');
    }, 300);
  }, [router, isLeaving]);

  return (
    <div
      className="landing landing--light min-h-screen overflow-x-hidden"
      style={{
        background:
          'radial-gradient(900px 520px at 50% 0%, rgba(79,70,229,0.10) 0%, rgba(79,70,229,0.02) 48%, rgba(255,255,255,0) 70%), linear-gradient(180deg, #F8FAFF 0%, #F7F8FF 55%, #FFFFFF 100%)',
      }}
    >

      {/* Fixed dot grid */}
      <div className="fixed inset-0 dot-pattern dot-pattern--light pointer-events-none" />

      {/* ═══════════════════════════════════════════════════════════════
          NAVBAR
      ═══════════════════════════════════════════════════════════════ */}
      <nav className="nav-enter fixed top-0 inset-x-0 z-50 backdrop-blur-2xl landing-nav">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

          {/* Logo — hanya "Visions" */}
          <Link href="/" className="flex items-center gap-2.5 group flex-shrink-0">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:scale-105"
                 style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 6px 18px rgba(79,70,229,0.18)' }}>
              <ShieldCheck className="w-4 h-4 text-white" />
            </div>
            <span className="font-bold text-slate-900 text-sm tracking-tight">Visions</span>
          </Link>

          {/* Nav links — tengah */}
          <div className="hidden md:flex items-center gap-1">
            {NAV_LINKS.map(n => (
              <a
                key={n.href}
                href={n.href}
                className="nav-link"
              >
                {n.label}
              </a>
            ))}
          </div>

          {/* CTA kanan */}
          <Link
            href="/login"
            onClick={navigateWithLeave('/login')}
            aria-disabled={isLeaving}
            className={`btn-primary btn-primary--light btn-sm flex-shrink-0 ${isLeaving ? 'is-loading' : ''}`}
          >
            Login
          </Link>
        </div>
      </nav>

      {/* ═══════════════════════════════════════════════════════════════
          HERO
      ═══════════════════════════════════════════════════════════════ */}
      <section id="beranda" className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-16 pb-16 overflow-hidden">

        {/* Glow blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="glow-blob absolute top-[30%] left-1/2 -translate-x-1/2 -translate-y-1/2 w-[760px] h-[520px] rounded-full blur-[140px]"
               style={{ background: 'radial-gradient(ellipse, rgba(79,70,229,0.18) 0%, rgba(124,58,237,0.08) 55%, transparent 100%)' }} />
          <div className="glow-blob-2 absolute top-[55%] left-[12%] w-[320px] h-[320px] rounded-full blur-[110px]"
               style={{ background: 'rgba(99,102,241,0.10)' }} />
          <div className="glow-blob absolute bottom-[20%] right-[8%] w-[260px] h-[260px] rounded-full blur-[100px]"
               style={{ background: 'rgba(124,58,237,0.08)' }} />
        </div>

        <div className="relative max-w-4xl mx-auto text-center w-full">

          {/* Badge */}
          <div className="fade-up float-badge inline-flex items-center gap-2.5 border rounded-full px-4 py-1.5 mb-8 landing-pill">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse-slow" />
            <span className="text-xs font-semibold tracking-wider" style={{ color: '#4F46E5' }}>Platform Retensi Pelanggan SaaS</span>
          </div>

          {/* Headline */}
          <h1 className="fade-up-1 text-5xl md:text-[64px] lg:text-[76px] font-extrabold leading-[1.05] tracking-tight mb-6">
            <span className="text-slate-900">Cegah Churn</span>{' '}
            <br className="hidden sm:block" />
            <span className="gradient-text-indigo gradient-text-indigo--light">Sebelum Terjadi</span>
          </h1>

          {/* Subtitle */}
          <p className="fade-up-2 text-base md:text-lg max-w-2xl mx-auto leading-relaxed mb-14 text-slate-600">
            <span className="text-slate-900 font-semibold">Visions</span> membantu Anda melihat pelanggan yang mulai “menjauh”
            lebih awal—dengan Machine Learning—supaya tim{' '}
            <span className="text-slate-800">Customer Success</span> bisa fokus ke tindakan yang paling berdampak.
          </p>

          {/* Stats grid */}
          <div className="fade-up-3 grid grid-cols-2 md:grid-cols-4 gap-3 max-w-3xl mx-auto">
            {STATS.map((s) => (
              <div key={s.label}
                   className="stat-card stat-card--light group rounded-2xl px-5 py-5 cursor-default"
                   style={{ '--accent': s.color }}
              >
                <div className="text-3xl font-extrabold tabular-nums" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs font-medium mt-1.5 text-slate-500">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 fade-up-4">
          <span className="text-[11px] font-medium" style={{ color: 'rgba(100,116,139,0.6)' }}>scroll</span>
          <div className="w-px h-8" style={{ background: 'linear-gradient(to bottom, rgba(79,70,229,0.35), transparent)' }} />
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          TENTANG
      ═══════════════════════════════════════════════════════════════ */}
      <section id="tentang" className="py-28 px-6" style={{ borderTop: '1px solid rgba(15,23,42,0.08)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Left text */}
            <div>
              {sectionPill('Tentang Visions')}
              <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
                Solusi Cerdas untuk<br />
                <span className="gradient-text-indigo">Retensi Pelanggan SaaS</span>
              </h2>
              <p className="text-base leading-relaxed mb-5 text-slate-600">
                <strong className="text-slate-900">Visions</strong> adalah platform prediksi churn pelanggan yang dibangun
                oleh <strong className="text-indigo-600">Tim Visions, Politeknik Negeri Jakarta</strong>, sebagai solusi
                nyata untuk tantangan retensi di industri SaaS.
              </p>
              <p className="text-base leading-relaxed mb-8 text-slate-600">
                Dengan menggabungkan kekuatan algoritma Machine Learning seperti XGBoost, LightGBM, dan Deep Learning,
                platform ini mampu mengidentifikasi pelanggan berisiko tinggi dan memberikan rekomendasi tindakan
                retensi yang spesifik dan terukur kepada tim Customer Success.
              </p>

              {/* Key points */}
              <div className="space-y-3">
                {[
                  { icon: Brain,         text: 'Ditenagai algoritma ML & Deep Learning terkini' },
                  { icon: Layers,        text: 'Arsitektur role-based: Admin & Staff CS' },
                  { icon: GraduationCap, text: 'Dikembangkan oleh Tim Visions — PNJ, didukung LapisAI' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                         style={{ background: 'rgba(79,70,229,0.10)', border: '1px solid rgba(79,70,229,0.18)' }}>
                      <Icon className="w-4 h-4 text-indigo-600" />
                    </div>
                    <span className="text-sm text-slate-700">{text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right — info card */}
            <div className="relative">
              {/* Glow behind card */}
              <div className="absolute inset-0 rounded-3xl blur-2xl"
                   style={{ background: 'radial-gradient(ellipse, rgba(79,70,229,0.14) 0%, transparent 70%)' }} />

              <div className="relative rounded-3xl p-8 space-y-5"
                   style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(15,23,42,0.08)', boxShadow: '0 18px 50px rgba(15,23,42,0.08)' }}>

                {/* Header card */}
                <div className="flex items-center gap-4 pb-5"
                     style={{ borderBottom: '1px solid rgba(15,23,42,0.08)' }}>
                  <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl"
                       style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 8px 24px rgba(79,70,229,0.45)' }}>
                    <ShieldCheck className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-lg">Visions</div>
                    <div className="text-xs mt-0.5 text-slate-500">ChurnShield Platform — v1.0</div>
                  </div>
                </div>

                {/* Info rows */}
                {[
                  { label: 'Dibuat oleh',    value: 'Tim Visions — PNJ' },
                  { label: 'Mitra',          value: 'LapisAI' },
                  { label: 'Tech Stack',     value: 'Next.js 14 + Supabase + ML' },
                  { label: 'Model Utama',    value: 'Random Forest (Akurasi 94.2%)' },
                  { label: 'Dataset',        value: '47+ fitur prediksi churn' },
                ].map(r => (
                  <div key={r.label} className="flex items-center justify-between py-2"
                       style={{ borderBottom: '1px solid rgba(15,23,42,0.06)' }}>
                    <span className="text-xs font-medium text-slate-500">{r.label}</span>
                    <span className="text-xs font-semibold text-slate-900">{r.value}</span>
                  </div>
                ))}

                {/* Status badge */}
                <div className="flex items-center gap-2 pt-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse-slow" />
                  <span className="text-xs font-semibold text-emerald-600">Platform Aktif</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FITUR
      ═══════════════════════════════════════════════════════════════ */}
      <section id="fitur" className="py-28 px-6" style={{ borderTop: '1px solid rgba(15,23,42,0.08)' }}>
        <div className="max-w-6xl mx-auto">

          <div className="text-center mb-16">
            {sectionPill('Fitur Platform')}
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Semua yang Dibutuhkan<br className="hidden sm:block" />{' '}
              Tim Customer Success
            </h2>
            <p className="max-w-xl mx-auto text-base leading-relaxed text-slate-600">
              Dari prediksi hingga eksekusi — satu platform terintegrasi untuk mengelola
              retensi pelanggan SaaS secara end-to-end.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map((f, i) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.title}
                  className="group relative rounded-2xl p-6 transition-all duration-300 cursor-default"
                  style={{
                    ...glass,
                    animation: `cardEnter 0.6s cubic-bezier(0.16,1,0.3,1) ${0.08 * i}s both`,
                  }}
                >
                  {/* Hover glow border */}
                  <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-all duration-400 pointer-events-none"
                       style={{ border: `1px solid ${f.accent}50`, boxShadow: `0 0 28px ${f.accent}15, inset 0 0 20px ${f.accent}05` }} />

                  {/* Top accent line */}
                  <div className="absolute top-0 left-6 right-6 h-px rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                       style={{ background: `linear-gradient(90deg, transparent, ${f.accent}80, transparent)` }} />

                  {/* Icon */}
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-5 transition-all duration-300 group-hover:-translate-y-1 group-hover:scale-105"
                       style={{ background: `${f.accent}18`, border: `1px solid ${f.accent}30` }}>
                    <Icon className="w-5 h-5 transition-colors" style={{ color: f.accent }} />
                  </div>

                  <h3 className="text-[15px] font-bold text-slate-900 mb-2 transition-colors">{f.title}</h3>
                  <p className="text-sm leading-relaxed text-slate-600">{f.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          MANFAAT / VALUE
      ═══════════════════════════════════════════════════════════════ */}
      <section
        id="manfaat"
        className="py-28 px-6 relative overflow-hidden"
        style={{ borderTop: '1px solid rgba(15,23,42,0.08)', background: 'rgba(79,70,229,0.02)' }}
      >
        {/* soft bg accents */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-20 -right-24 w-[420px] h-[420px] rounded-full blur-[90px]"
               style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.14) 0%, transparent 65%)' }} />
          <div className="absolute -bottom-28 -left-24 w-[520px] h-[520px] rounded-full blur-[110px]"
               style={{ background: 'radial-gradient(circle, rgba(124,58,237,0.10) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-16">
            {sectionPill('Manfaat')}
            <h2 className="text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight mb-4">
              Dibuat untuk tim CS yang kerja cepat
            </h2>
            <p className="max-w-2xl mx-auto text-base leading-relaxed text-slate-600">
              Dari identifikasi risiko sampai langkah retensi—Visions bantu tim Anda mengambil keputusan yang konsisten,
              terukur, dan mudah dipantau.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <div
                  key={b.title}
                  className="group relative rounded-3xl p-7 transition-all duration-300"
                  style={{
                    ...glass,
                    animation: `cardEnter 0.65s cubic-bezier(0.16,1,0.3,1) ${0.10 * i}s both`,
                    borderColor: 'rgba(15,23,42,0.08)',
                  }}
                >
                  {/* gradient border glow on hover */}
                  <div
                    className="absolute inset-0 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"
                    style={{
                      boxShadow: `0 18px 60px ${b.accent}22`,
                      border: `1px solid ${b.accent}22`,
                    }}
                  />

                  <div className="relative">
                    <div className="flex items-start gap-4">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:scale-[1.03]"
                        style={{
                          background: `linear-gradient(135deg, ${b.accent}18, ${b.accent}08)`,
                          border: `1px solid ${b.accent}22`,
                        }}
                      >
                        <Icon className="w-6 h-6" style={{ color: b.accent }} />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-[16px] font-extrabold text-slate-900 leading-snug mb-2">
                          {b.title}
                        </h3>
                        <p className="text-sm leading-relaxed text-slate-600">{b.desc}</p>
                      </div>
                    </div>

                    {/* tiny proof chips */}
                    <div className="mt-6 flex flex-wrap gap-2">
                      {[
                        { t: 'Lebih fokus', c: 'rgba(79,70,229,0.10)' },
                        { t: 'Lebih cepat', c: 'rgba(124,58,237,0.10)' },
                        { t: 'Lebih terukur', c: 'rgba(16,185,129,0.10)' },
                      ].map((chip) => (
                        <span
                          key={chip.t}
                          className="text-[11px] font-semibold px-2.5 py-1 rounded-full"
                          style={{ background: chip.c, color: 'rgba(15,23,42,0.72)', border: '1px solid rgba(15,23,42,0.06)' }}
                        >
                          {chip.t}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          CTA BOTTOM
      ═══════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6" style={{ borderTop: '1px solid rgba(15,23,42,0.08)' }}>
        <div className="max-w-3xl mx-auto">
          <div className="relative rounded-3xl p-12 text-center overflow-hidden"
               style={{
                 background: 'linear-gradient(135deg, rgba(79,70,229,0.11) 0%, rgba(124,58,237,0.09) 55%, rgba(255,255,255,0.85) 100%)',
                 border: '1px solid rgba(15,23,42,0.08)',
                 boxShadow: '0 24px 70px rgba(15,23,42,0.10)',
               }}>

            {/* Top glow */}
            <div className="absolute inset-0 rounded-3xl pointer-events-none"
                 style={{ background: 'radial-gradient(ellipse at 50% -10%, rgba(79,70,229,0.22) 0%, transparent 65%)' }} />
            {/* Bottom shimmer line */}
            <div className="absolute bottom-0 left-[20%] right-[20%] h-px"
                 style={{ background: 'linear-gradient(90deg, transparent, rgba(79,70,229,0.6), transparent)' }} />
            {/* Side accents */}
            <div className="absolute -left-20 top-10 w-56 h-56 rounded-full blur-[80px] pointer-events-none"
                 style={{ background: 'rgba(79,70,229,0.14)' }} />
            <div className="absolute -right-24 bottom-6 w-72 h-72 rounded-full blur-[90px] pointer-events-none"
                 style={{ background: 'rgba(124,58,237,0.12)' }} />

            <div className="relative">
              <div className="w-14 h-14 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', boxShadow: '0 10px 34px rgba(79,70,229,0.35)' }}>
                <ShieldCheck className="w-7 h-7 text-white" />
              </div>

              <h2 className="text-3xl md:text-[40px] font-extrabold text-slate-900 mb-3 tracking-tight">Siap Memulai?</h2>
              <p className="mb-8 max-w-md mx-auto text-base leading-relaxed text-slate-600">
                Masuk ke dashboard dan mulai pantau pelanggan berisiko—lebih rapi, lebih cepat, dan lebih terukur.
              </p>

              {/* mini trust row */}
              <div className="mb-10 flex flex-wrap items-center justify-center gap-2.5">
                {[
                  { label: 'Role-based access', tone: 'rgba(79,70,229,0.10)' },
                  { label: 'Realtime risk level', tone: 'rgba(124,58,237,0.10)' },
                  { label: 'Supabase Auth', tone: 'rgba(16,185,129,0.10)' },
                ].map((b) => (
                  <span
                    key={b.label}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full"
                    style={{ background: b.tone, color: 'rgba(15,23,42,0.75)', border: '1px solid rgba(15,23,42,0.06)' }}
                  >
                    {b.label}
                  </span>
                ))}
              </div>

              <Link
                href="/login"
                onClick={navigateWithLeave('/login')}
                aria-disabled={isLeaving}
                className={`btn-primary btn-primary--light btn-lg ${isLeaving ? 'is-loading' : ''}`}
              >
                Masuk ke Login
              </Link>

              <div className="mt-8 flex flex-wrap items-center justify-center gap-x-8 gap-y-3">
                {['Role-based access', 'ML model siap pakai', 'Supabase Auth terintegrasi'].map(item => (
                  <div key={item} className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="text-sm text-slate-600">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          FOOTER
      ═══════════════════════════════════════════════════════════════ */}
      <footer className="px-6 py-10" style={{ borderTop: '1px solid rgba(15,23,42,0.08)' }}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">

            {/* Logo */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                   style={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)' }}>
                <ShieldCheck className="w-4 h-4 text-white" />
              </div>
              <div>
                <div className="text-sm font-bold text-slate-900">Visions</div>
                <div className="text-[11px] text-slate-500">Platform prediksi churn berbasis Machine Learning</div>
              </div>
            </div>

            {/* Nav links footer */}
            <div className="flex items-center gap-6">
              {NAV_LINKS.map(n => (
                <a key={n.href} href={n.href} className="footer-link text-xs">
                  {n.label}
                </a>
              ))}
            </div>

            {/* Right */}
            <div className="flex flex-col items-center md:items-end gap-1.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                   style={{ background: 'rgba(255,255,255,0.9)', border: '1px solid rgba(15,23,42,0.08)' }}>
                <span className="text-[11px] text-slate-500">Didukung oleh</span>
                <span className="text-[11px] font-bold text-indigo-600">LapisAI</span>
              </div>
              <p className="text-[11px] text-slate-500">
                © 2026 Visions — Tim Visions, Politeknik Negeri Jakarta
              </p>
            </div>
          </div>
        </div>
      </footer>

    </div>
  );
}
