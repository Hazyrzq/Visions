'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useMemo, useState } from 'react';
import {
  motion,
  useReducedMotion,
} from 'framer-motion';
import {
  ShieldCheck,
  ArrowRight,
  ArrowUpRight,
  TrendingDown,
  AlertTriangle,
  Zap,
  Users,
  BarChart2,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const G = `
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
`;

const E = [0.16, 1, 0.3, 1];
/** Dasar viewport scroll; `once` di-set di dalam komponen (ulang tiap scroll kecuali reduced motion) */
const VIEWPORT_SCROLL = { amount: 0.2, margin: '0px 0px -40px 0px' };

const BRAND = '#2563EB';
const BRAND_HOVER = '#1d4ed8';
const BRAND_SOFT = '#EFF6FF';
const MUTED = '#6B7280';
const COOL_BG = '#F4F6F8';

const HERO_IMG =
  'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=2000&q=80';
const MANFAAT_IMG =
  'https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=1200&q=80';

const HERO_WORDS = ['Tahu', 'pelanggan', 'yang', 'hampir', 'pergi', '—', 'sebelum', 'terlambat.'];

const springSnappy = { type: 'spring', stiffness: 420, damping: 28 };
const springSoft = { type: 'spring', stiffness: 260, damping: 22 };

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.52, ease: E } },
};
const fadeUpSm = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: E } },
};
const fadeIn = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.5, ease: E } },
};
const slideLeft = {
  hidden: { opacity: 0, x: -36 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: E } },
};
const slideRight = {
  hidden: { opacity: 0, x: 40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.55, ease: E } },
};
const scaleIn = {
  hidden: { opacity: 0, y: 20, scale: 0.96 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { ...springSnappy },
  },
};
const stg = { hidden: {}, visible: { transition: { staggerChildren: 0.07, delayChildren: 0.06 } } };
const stgFast = { hidden: {}, visible: { transition: { staggerChildren: 0.05, delayChildren: 0.04 } } };
const stgTight = { hidden: {}, visible: { transition: { staggerChildren: 0.045 } } };

const NAV = [
  ['#fitur', 'Fitur'],
  ['#manfaat', 'Manfaat'],
];

const FEATURES = [
  {
    icon: TrendingDown,
    title: 'Skor risiko per pelanggan',
    desc: 'Skor 0–100 dari pola pemakaian, tiket, dan NPS supaya prioritas tim jelas.',
  },
  {
    icon: AlertTriangle,
    title: 'Prioritas otomatis',
    desc: 'Antrean pelanggan berisiko tersusun otomatis agar tidak ada yang terlewat.',
  },
  {
    icon: Zap,
    title: 'Rekomendasi konkret',
    desc: 'Langkah tindak lanjut per pelanggan sehingga staf tidak mulai dari nol.',
  },
  {
    icon: Users,
    title: 'Distribusi ke tim staf',
    desc: 'Assign ke anggota tim secara merata atau manual sesuai kebijakan Anda.',
  },
  {
    icon: BarChart2,
    title: 'Laporan retensi',
    desc: 'Ringkasan retention, churn, dan performa tim untuk rapat atau laporan.',
  },
  {
    icon: Activity,
    title: 'Dua peran, satu platform',
    desc: 'Admin melihat gambaran besar; staf fokus pada pelanggan yang ditugaskan.',
  },
];

const MANFAAT_ITEMS = [
  { n: '01', title: 'Pantau risiko churn secara real-time' },
  { n: '02', title: 'Tugaskan pelanggan ke tim CS' },
  { n: '03', title: 'Laporan siap untuk keputusan retensi' },
];

/** Orbs halus di hero — “hidup” tanpa mengganggu baca */
function HeroAmbience({ reduced }) {
  if (reduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden rounded-[inherit]">
      <motion.div
        className="absolute -right-[20%] -top-[30%] h-[55%] w-[55%] rounded-full bg-blue-500/25 blur-[100px]"
        animate={{ opacity: [0.35, 0.55, 0.35], scale: [1, 1.06, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute -bottom-[25%] -left-[15%] h-[45%] w-[45%] rounded-full bg-indigo-500/20 blur-[90px]"
        animate={{ opacity: [0.25, 0.45, 0.25], x: [0, 12, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
    </div>
  );
}

function FeatureCard({ icon: Icon, title, desc, index, reduced }) {
  return (
    <motion.div
      variants={scaleIn}
      whileHover={
        reduced
          ? {}
          : {
              y: -6,
              boxShadow: '0 20px 40px -12px rgba(37, 99, 235, 0.18)',
              transition: springSoft,
            }
      }
      whileTap={{ scale: 0.99 }}
      className="group relative overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm"
    >
      {!reduced && (
        <motion.div
          className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-gradient-to-br from-blue-400/20 to-transparent opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100"
        />
      )}
      <div className="relative">
        <motion.div
          className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-blue-100 bg-blue-50 text-blue-600"
          whileHover={reduced ? {} : { rotate: [0, -6, 6, 0], transition: { duration: 0.45 } }}
        >
          <motion.div
            animate={reduced ? {} : { y: [0, -2.5, 0] }}
            transition={{
              duration: 3.2 + index * 0.15,
              repeat: Infinity,
              ease: 'easeInOut',
              delay: index * 0.2,
            }}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} />
          </motion.div>
        </motion.div>
        <h3 className="mb-2 text-[16px] font-bold text-slate-900 transition-colors group-hover:text-blue-700">{title}</h3>
        <p className="text-[14px] leading-relaxed" style={{ color: MUTED }}>
          {desc}
        </p>
      </div>
    </motion.div>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [leaving, setLeaving] = useState(false);
  const reduceMotion = useReducedMotion() ?? false;

  /** Animasi `whileInView` ulang setiap kali elemen masuk layar; jika reduced motion → hanya sekali */
  const vpScroll = useMemo(
    () => ({ ...VIEWPORT_SCROLL, once: reduceMotion === true }),
    [reduceMotion],
  );

  const go = useCallback(
    (path) => (e) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey) return;
      e.preventDefault();
      if (leaving) return;
      setLeaving(true);
      setTimeout(() => router.push(path), 80);
    },
    [router, leaving],
  );

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: G }} />
      <div className="min-h-screen bg-white text-slate-900 antialiased" style={{ fontFamily: "'Inter',sans-serif" }}>

        <motion.header
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: E }}
          className="sticky top-0 z-50 border-b border-slate-100 bg-white/90 backdrop-blur-md"
        >
          <div className="mx-auto flex h-16 max-w-6xl items-center gap-3 px-4 sm:px-6 lg:px-8">
            <motion.div whileHover={reduceMotion ? {} : { scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Link href="/" className="flex shrink-0 items-center gap-2.5">
                <motion.span
                  className="flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md shadow-blue-500/25"
                  style={{ backgroundColor: BRAND }}
                  animate={reduceMotion ? {} : { boxShadow: ['0 4px 14px rgba(37,99,235,0.25)', '0 6px 22px rgba(37,99,235,0.38)', '0 4px 14px rgba(37,99,235,0.25)'] }}
                  transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  <ShieldCheck className="h-[18px] w-[18px]" strokeWidth={2} />
                </motion.span>
                <span className="text-[16px] font-bold tracking-tight text-slate-900">Visions</span>
              </Link>
            </motion.div>

            <nav className="hidden flex-1 items-center justify-center gap-0.5 md:flex">
              {NAV.map(([href, label]) => (
                <motion.a
                  key={href}
                  href={href}
                  whileHover={reduceMotion ? { y: 0 } : { y: -2 }}
                  whileTap={{ scale: 0.97 }}
                  transition={springSnappy}
                  className="rounded-lg px-3 py-2 text-[14px] font-medium text-slate-600 transition-colors hover:bg-blue-50 hover:text-blue-700"
                >
                  {label}
                </motion.a>
              ))}
            </nav>

            <div className="ml-auto flex shrink-0 items-center gap-2">
              <nav className="flex items-center gap-0.5 md:hidden">
                {NAV.map(([href, label]) => (
                  <a key={href} href={href} className="rounded-md px-1.5 py-1.5 text-[11px] font-medium text-slate-600 sm:px-2 sm:text-xs">
                    {label}
                  </a>
                ))}
              </nav>
              <motion.a
                href="/login"
                onClick={go('/login')}
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={springSnappy}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-[13px] font-semibold text-white shadow-sm sm:px-5 sm:py-2.5',
                  leaving && 'pointer-events-none opacity-60',
                )}
                style={{ backgroundColor: BRAND }}
              >
                Mulai sekarang
                <motion.span animate={reduceMotion ? {} : { x: [0, 3, 0] }} transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}>
                  <ArrowUpRight className="h-3.5 w-3.5 opacity-90" />
                </motion.span>
              </motion.a>
            </div>
          </div>
        </motion.header>

        <main className="pb-4">
          <section className="px-4 pt-6 sm:px-6 lg:px-8 lg:pt-8">
            <div className="mx-auto max-w-6xl">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, ease: E }}
                className="relative overflow-hidden rounded-3xl border border-slate-200/80 bg-slate-900 shadow-[0_20px_50px_-15px_rgba(37,99,235,0.15)] md:rounded-[2rem]"
              >
                <HeroAmbience reduced={reduceMotion} />
                <div className="relative min-h-[380px] md:min-h-[440px]">
                  <div className="absolute inset-0 overflow-hidden">
                    <img
                      src={HERO_IMG}
                      alt=""
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 z-[1] bg-gradient-to-t from-black/80 via-black/45 to-black/25" />
                  <div
                    className="relative z-[2] flex min-h-[380px] flex-col justify-end p-6 pb-8 text-white md:min-h-[440px] md:p-10 md:pb-10 lg:p-12"
                    style={{ color: '#ffffff' }}
                  >
                    <div className="max-w-[680px] [&_h1]:text-white [&_h1_span]:text-white [&_p]:text-white">
                      <motion.p
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1, duration: 0.45, ease: E }}
                        className="mb-3 flex flex-wrap items-center gap-2 text-[13px] font-semibold text-blue-100"
                        style={{ color: '#dbeafe' }}
                      >
                        <span className="relative flex h-2 w-2">
                          {!reduceMotion && (
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
                          )}
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                        </span>
                        Platform Customer Success & churn
                      </motion.p>
                      <h1
                        className="max-w-[680px] text-[clamp(28px,4.5vw,48px)] font-extrabold leading-[1.12] tracking-[-0.03em] text-white drop-shadow-[0_2px_24px_rgba(0,0,0,0.45)]"
                        style={{ color: '#ffffff' }}
                      >
                        {HERO_WORDS.map((w, i) => (
                          <motion.span
                            key={`${w}-${i}`}
                            initial={{ opacity: 0, y: 16 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.12 + i * 0.045, duration: 0.42, ease: E }}
                            className="mr-[0.2em] inline-block text-white"
                            style={{ color: '#ffffff' }}
                          >
                            {w}
                          </motion.span>
                        ))}
                      </h1>
                      <motion.p
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.52, duration: 0.45, ease: E }}
                        className="mt-4 max-w-[520px] text-[15px] leading-relaxed text-white/90"
                        style={{ color: 'rgba(255,255,255,0.92)' }}
                      >
                        Skor risiko, prioritas otomatis, dan tugas untuk tim dalam satu tempat.
                      </motion.p>
                      <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.68, duration: 0.45, ease: E }}
                        className="mt-8 flex flex-wrap gap-4"
                      >
                        <motion.a
                          href="/login"
                          onClick={go('/login')}
                          whileHover={{ scale: 1.04, y: -1 }}
                          whileTap={{ scale: 0.97 }}
                          transition={springSnappy}
                          className={cn(
                            'inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-[14px] font-semibold text-blue-700 shadow-lg shadow-black/15 transition-colors hover:bg-blue-50',
                            leaving && 'pointer-events-none opacity-60',
                          )}
                        >
                          Mulai sekarang <ArrowRight className="h-4 w-4" />
                        </motion.a>
                        <motion.a
                          href="#fitur"
                          whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.2)' }}
                          whileTap={{ scale: 0.98 }}
                          transition={springSnappy}
                          className="inline-flex items-center gap-2 rounded-full border border-white/40 bg-white/10 px-6 py-3 text-[14px] font-semibold text-white backdrop-blur-sm"
                          style={{ color: '#ffffff' }}
                        >
                          Lihat fitur
                        </motion.a>
                      </motion.div>
                    </div>
                  </div>
                </div>
                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ ...vpScroll, amount: 0.3 }}
                  variants={stgTight}
                  className="relative grid grid-cols-3 divide-x divide-slate-200 bg-white"
                >
                  {[
                    { v: '24/7', l: 'Pemantauan' },
                    { v: '< 2s', l: 'Update skor' },
                    { v: '100%', l: 'Berbasis data' },
                  ].map((s) => (
                    <motion.div key={s.l} variants={fadeUpSm} className="px-3 py-5 text-center sm:py-6 md:px-6">
                      <motion.p
                        className="text-lg font-extrabold tracking-tight text-slate-900 sm:text-xl md:text-2xl"
                        whileInView={reduceMotion ? {} : { scale: [0.92, 1] }}
                        viewport={vpScroll}
                        transition={springSnappy}
                      >
                        {s.v}
                      </motion.p>
                      <p className="mt-1 text-[11px] font-medium text-slate-500 sm:text-xs">{s.l}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </motion.div>
            </div>
          </section>

          <section id="tentang" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
            <div className="grid gap-10 lg:grid-cols-2 lg:items-start lg:gap-16">
              <motion.h2
                initial="hidden"
                whileInView="visible"
                viewport={vpScroll}
                variants={slideLeft}
                className="text-[clamp(22px,2.5vw,32px)] font-bold leading-snug tracking-tight text-slate-900"
              >
                Data retensi yang bisa dipercaya tim CS Anda.
              </motion.h2>
              <motion.div initial="hidden" whileInView="visible" viewport={vpScroll} variants={stg} className="space-y-5">
                <motion.p variants={fadeUpSm} className="text-[15px] leading-relaxed" style={{ color: MUTED }}>
                  Visions membantu tim Customer Success melihat siapa yang berisiko churn dan apa yang perlu dilakukan —
                  tanpa spreadsheet panjang atau rapat ad hoc setiap minggu.
                </motion.p>
                <motion.ul variants={stgFast} className="space-y-3">
                  {['Sinyal dari pemakaian produk & dukungan', 'Skor dan prioritas yang konsisten', 'Peran admin & staf dalam satu alur'].map((t) => (
                    <motion.li key={t} variants={fadeUpSm} className="flex items-start gap-3 text-[14px] text-slate-700">
                      <motion.span
                        initial={{ scale: 0 }}
                        whileInView={{ scale: 1 }}
                        viewport={vpScroll}
                        transition={springSnappy}
                        className="mt-0.5 shrink-0"
                      >
                        <CheckCircle2 className="h-5 w-5 text-blue-600" strokeWidth={2} />
                      </motion.span>
                      {t}
                    </motion.li>
                  ))}
                </motion.ul>
              </motion.div>
            </div>
          </section>

          <section id="fitur" className="border-t border-slate-100 py-16 sm:py-20" style={{ backgroundColor: COOL_BG }}>
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={vpScroll}
                variants={stg}
                className="mb-12 max-w-2xl lg:mb-14"
              >
                <motion.h2 variants={fadeUp} className="text-[clamp(24px,3vw,36px)] font-bold leading-tight tracking-tight text-slate-900">
                  Fitur untuk tim yang fokus ke retensi
                </motion.h2>
                <motion.p variants={fadeUpSm} className="mt-3 text-[15px] leading-relaxed" style={{ color: MUTED }}>
                  Dari skor risiko sampai laporan — dirancang untuk operasional harian CS.
                </motion.p>
              </motion.div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={vpScroll}
                variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06, delayChildren: 0.05 } } }}
                className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3 lg:gap-x-10 lg:gap-y-10"
              >
                {FEATURES.map(({ icon, title, desc }, i) => (
                  <FeatureCard key={title} icon={icon} title={title} desc={desc} index={i} reduced={reduceMotion} />
                ))}
              </motion.div>
            </div>
          </section>

          <section id="manfaat" className="border-t border-slate-100 py-16 sm:py-20 lg:py-24">
            <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
              <div className="grid gap-10 lg:grid-cols-2 lg:items-stretch lg:gap-12">
                <motion.div initial="hidden" whileInView="visible" viewport={vpScroll} variants={stg} className="flex flex-col">
                  <motion.h2 variants={fadeUp} className="mb-8 text-[clamp(24px,3vw,34px)] font-bold leading-tight text-slate-900">
                    Manfaat nyata untuk operasi CS
                  </motion.h2>
                  <ul className="flex-1 space-y-0">
                    {MANFAAT_ITEMS.map((s, i) => (
                      <motion.li
                        key={s.n}
                        variants={fadeUpSm}
                        whileHover={reduceMotion ? {} : { x: 4 }}
                        transition={springSoft}
                        className={cn('flex gap-4 border-slate-100 py-6', i < MANFAAT_ITEMS.length - 1 && 'border-b')}
                      >
                        <span className="w-8 shrink-0 pt-0.5 text-[13px] font-bold tabular-nums text-slate-400">{s.n}</span>
                        <div className="min-w-0">
                          <p className="text-[16px] font-semibold text-slate-900">{s.title}</p>
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                </motion.div>

                <motion.div
                  initial="hidden"
                  whileInView="visible"
                  viewport={vpScroll}
                  variants={slideRight}
                  className="relative min-h-[280px] overflow-hidden rounded-3xl border border-slate-200 bg-slate-100 shadow-sm lg:min-h-0"
                >
                  <motion.img
                    src={MANFAAT_IMG}
                    alt=""
                    className="absolute inset-0 h-full w-full object-cover"
                    animate={reduceMotion ? {} : { scale: [1, 1.04, 1] }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <div className="absolute inset-0 bg-gradient-to-tr from-blue-950/35 to-transparent" />
                </motion.div>
              </div>

              <motion.div
                initial="hidden"
                whileInView="visible"
                viewport={vpScroll}
                variants={stg}
                className="relative mt-12 overflow-hidden rounded-2xl border border-blue-100 bg-gradient-to-br from-blue-50 via-white to-blue-50/80 p-6 sm:flex-row sm:items-center sm:p-8"
              >
                {!reduceMotion && (
                  <motion.div
                    className="pointer-events-none absolute inset-0 opacity-40"
                    style={{
                      background: 'linear-gradient(110deg, transparent 40%, rgba(255,255,255,0.85) 50%, transparent 60%)',
                      backgroundSize: '200% 100%',
                    }}
                    animate={{ backgroundPosition: ['200% 0', '-200% 0'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  />
                )}
                <div className="relative flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                  <motion.div variants={fadeUpSm}>
                    <h3 className="text-lg font-bold text-slate-900 sm:text-xl">Siap pakai bersama tim?</h3>
                    <p className="mt-1 max-w-xl text-[14px] leading-relaxed" style={{ color: MUTED }}>
                      Minta akses dari admin organisasi Anda, lalu masuk ke dashboard.
                    </p>
                  </motion.div>
                  <motion.a
                    href="/login"
                    onClick={go('/login')}
                    variants={fadeUpSm}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    transition={springSnappy}
                    className={cn(
                      'inline-flex shrink-0 items-center gap-2 rounded-full px-6 py-3 text-[14px] font-semibold text-white shadow-md shadow-blue-500/30',
                      leaving && 'pointer-events-none opacity-60',
                    )}
                    style={{ backgroundColor: BRAND }}
                  >
                    Mulai sekarang <ArrowRight className="h-4 w-4" />
                  </motion.a>
                </div>
              </motion.div>
            </div>
          </section>
        </main>

        <motion.footer
          initial="hidden"
          whileInView="visible"
          viewport={{ ...vpScroll, amount: 0.4 }}
          variants={fadeIn}
          className="border-t border-slate-200 bg-white"
        >
          <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6 lg:px-8">
            <motion.div className="flex items-center gap-2" whileHover={reduceMotion ? {} : { scale: 1.02 }}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-white shadow-sm shadow-blue-500/30">
                <ShieldCheck className="h-4 w-4" strokeWidth={2} />
              </span>
              <span className="text-[15px] font-bold text-slate-900">Visions</span>
            </motion.div>
            <div className="flex flex-wrap justify-center gap-6 text-[13px] font-medium text-slate-500">
              {NAV.map(([href, label]) => (
                <motion.a key={href} href={href} whileHover={{ y: -1 }} className="transition-colors hover:text-blue-600">
                  {label}
                </motion.a>
              ))}
            </div>
            <p className="text-[12px] text-slate-400">© 2026 Visions</p>
          </div>
        </motion.footer>
      </div>
    </>
  );
}
