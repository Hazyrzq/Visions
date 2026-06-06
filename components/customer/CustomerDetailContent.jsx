'use client';

import { useEffect, useState } from 'react';
import {
  Building2, Clock, AlertTriangle,
  CheckCircle2, Activity, Ticket, Users, Phone,
  Lightbulb, BarChart2, Loader2, TrendingDown, DollarSign, Zap,
  Headphones, BadgeCheck, XCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion';
import { mockCustomers } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import ActivityModal from '@/components/customer/ActivityModal';
import { getRekomendasi, getAnalisis } from '@/lib/churnshield';
import { useLang } from '@/lib/i18n/LanguageContext';

const activityColors = {
  email:   'bg-[var(--vs-brand-50)] text-[var(--vs-brand)]',
  call:    'bg-emerald-50 text-emerald-600',
  meeting: 'bg-purple-50 text-purple-600',
  note:    'bg-amber-50 text-amber-600',
  other:   'bg-slate-100 text-slate-500',
};

const activityIcons = (type) => {
  switch (type) {
    case 'email':   return <Activity className="w-4 h-4" />;
    case 'call':    return <Phone className="w-4 h-4" />;
    case 'meeting': return <Users className="w-4 h-4" />;
    case 'note':
    case 'ticket':  return <Ticket className="w-4 h-4" />;
    default:        return <Activity className="w-4 h-4" />;
  }
};

// Normalize risk_level dari DB (Tinggi/Sedang/Rendah ↔ High/Medium/Low)
function normalizeRisk(lvl) {
  if (!lvl) return 'Low';
  if (lvl === 'Tinggi' || lvl === 'High')   return 'High';
  if (lvl === 'Sedang' || lvl === 'Medium') return 'Medium';
  return 'Low';
}

const riskTagClass = {
  High:   'vs-tag vs-tag--high',
  Medium: 'vs-tag vs-tag--medium',
  Low:    'vs-tag vs-tag--low',
};

function resolveCustomerFromMock(id) {
  if (id == null || id === '') return null;
  return mockCustomers.find((c) => String(c.id) === String(id)) ?? null;
}

function fmt(n, decimals = 1) {
  if (n == null || n === '') return '-';
  const num = Number(n);
  return isNaN(num) ? '-' : num.toFixed(decimals);
}

function fmtCurrency(n, lang = 'id') {
  if (n == null || n === '') return '-';
  const num = Number(n);
  if (isNaN(num)) return '-';
  if (lang === 'en') {
    if (num >= 1_000_000) return `$${(num / 1_000_000).toFixed(1)}M`;
    if (num >= 1_000)     return `$${(num / 1_000).toFixed(0)}K`;
    return `$${num}`;
  }
  if (num >= 1_000_000) return `Rp ${(num / 1_000_000).toFixed(1)}jt`;
  if (num >= 1_000)     return `Rp ${(num / 1_000).toFixed(0)}rb`;
  return `Rp ${num}`;
}

function MetricRow({ label, value, sub, warn }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2.5 border-b border-[var(--vs-line-soft)] last:border-0">
      <span className="text-[12px] text-[var(--vs-muted)]">{label}</span>
      <span className={`text-[13px] font-semibold tabular-nums ${warn ? 'text-red-600' : 'text-[var(--vs-ink)]'}`}>
        {value}{sub && <span className="ml-0.5 text-[11px] font-normal text-[var(--vs-muted-2)]">{sub}</span>}
      </span>
    </div>
  );
}

export default function CustomerDetailContent({ customerId }) {
  const { t, lang } = useLang();

  const [customer, setCustomer]               = useState(null);
  const [activities, setActivities]           = useState([]);
  const [loading, setLoading]                 = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [rekResult, setRekResult]             = useState(null);
  const [rekLoading, setRekLoading]           = useState(false);
  const [rekError, setRekError]               = useState('');
  const [analResult, setAnalResult]           = useState(null);
  const [analLoading, setAnalLoading]         = useState(false);
  const [analError, setAnalError]             = useState('');

  useEffect(() => {
    setRekResult(null); setRekError('');
    setAnalResult(null); setAnalError('');
    if (!customerId) {
      setCustomer(null); setActivities([]); setLoading(false); return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('customers')
        .select('*, staff:profiles!customers_assigned_to_fkey(full_name)')
        .eq('id', customerId)
        .maybeSingle();
      if (cancelled) return;
      if (data && !error) {
        setCustomer({ ...data, assigned_name: data.staff?.full_name ?? data.assigned_name ?? null });
      } else {
        setCustomer(resolveCustomerFromMock(customerId));
        if (!cancelled) setLoading(false);
        return;
      }
      const textId = data?.customer_id ?? null;
      if (textId) {
        const { data: acts } = await supabase
          .from('activities')
          .select('*, staff:profiles(full_name)')
          .eq('customer_id', textId)
          .order('created_at', { ascending: false });
        if (!cancelled) setActivities(acts ?? []);
      }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [customerId]);

  const handleActivityAdded = (newActivity) => setActivities(prev => [newActivity, ...prev]);

  const handleRekomendasi = async () => {
    if (!customer?.customer_id) return;
    setRekLoading(true); setRekError('');
    try {
      const res = await getRekomendasi(customer.customer_id);
      setRekResult(res?.rekomendasi ?? res?.result ?? res?.message ?? JSON.stringify(res));
    } catch (e) { setRekError(e.message); }
    finally { setRekLoading(false); }
  };

  const handleAnalisis = async () => {
    if (!customer?.customer_id) return;
    setAnalLoading(true); setAnalError('');
    try {
      const res = await getAnalisis(customer.customer_id);
      setAnalResult(res?.analisis ?? res?.result ?? res?.message ?? JSON.stringify(res));
    } catch (e) { setAnalError(e.message); }
    finally { setAnalLoading(false); }
  };

  const formatDate = (d) =>
    new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit'
    }).format(new Date(d));

  if (!customerId) return null;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
      </div>
    );
  }

  if (!customer) {
    return <p className="py-10 text-center text-[13px] text-[var(--vs-muted)]">{t('customerDetail.notFound')}</p>;
  }

  // Field aliases
  const usageHrs       = customer.avg_usage_hrs ?? customer.monthly_usage_hrs ?? 0;
  const totalTickets   = customer.total_tickets ?? customer.open_tickets ?? 0;
  const npsScore       = customer.avg_nps_score ?? customer.nps_latest ?? 0;
  const featureAdoption= customer.avg_feature_adoption ?? customer.feature_adoption_pct ?? 0;
  const tenure         = customer.tenure_months ?? 0;
  const mrr            = customer.mrr ?? 0;
  const totalPayment   = customer.total_payment_value ?? 0;
  const totalDunning   = customer.total_dunning ?? customer.dunning_count ?? 0;
  const avgPaymentDelay= customer.avg_payment_delay ?? 0;
  const usagePerUser   = customer.usage_per_user ?? 0;
  const avgSeverity    = customer.avg_severity ?? 0;
  const severeRatio    = customer.severe_ticket_ratio ?? 0;

  const scoreColor = customer.churn_score >= 70 ? 'var(--vs-danger)' : customer.churn_score >= 30 ? 'var(--vs-warn)' : 'var(--vs-success)';
  const isChurned  = customer.churn_actual === true;
  const riskNorm   = normalizeRisk(customer.risk_level);

  // Label risiko bilingual
  const riskLabel = {
    High:   lang === 'en' ? 'High Risk'   : 'Risiko Tinggi',
    Medium: lang === 'en' ? 'Medium Risk' : 'Risiko Sedang',
    Low:    lang === 'en' ? 'Low Risk'    : 'Risiko Rendah',
  }[riskNorm] ?? riskNorm;

  // Unit bilingual
  const months = lang === 'en' ? ' mo'  : ' bulan';
  const hours  = lang === 'en' ? ' hrs' : ' jam';
  const days   = lang === 'en' ? ' days ago' : ' hari lalu';
  const times  = lang === 'en' ? '×'   : '×';

  // Faktor utama bilingual
  const factors = [
    {
      bad: usageHrs < 20,
      title: lang === 'en'
        ? `Usage (${fmt(usageHrs)} hrs/mo)`
        : `Penggunaan (${fmt(usageHrs)} jam/bln)`,
      desc: usageHrs < 20
        ? (lang === 'en' ? 'Usage declining — churn risk indicator.' : 'Penggunaan menurun — indikator risiko churn.')
        : (lang === 'en' ? 'Usage stable.' : 'Penggunaan stabil.'),
    },
    {
      bad: totalTickets > 3,
      title: lang === 'en'
        ? `Tickets (${totalTickets} total)`
        : `Tiket (${totalTickets} total)`,
      desc: totalTickets > 3
        ? (lang === 'en' ? 'Many complaints — needs immediate attention.' : 'Banyak keluhan — perlu perhatian segera.')
        : (lang === 'en' ? 'Complaint volume controlled.' : 'Volume keluhan terkendali.'),
    },
    {
      bad: npsScore < 7,
      title: `NPS (${fmt(npsScore, 1)}/10)`,
      desc: npsScore < 7
        ? (lang === 'en' ? 'Detractor / passive — low satisfaction.' : 'Detractor / passive — kepuasan rendah.')
        : (lang === 'en' ? 'Promoter — satisfied customer.' : 'Promoter — pelanggan puas.'),
    },
    {
      bad: totalDunning > 1,
      title: lang === 'en'
        ? `Dunning (${totalDunning}${times})`
        : `Dunning (${totalDunning}×)`,
      desc: totalDunning > 1
        ? (lang === 'en' ? 'Late payment history.' : 'Riwayat keterlambatan pembayaran.')
        : (lang === 'en' ? 'Payments on time.' : 'Pembayaran lancar.'),
    },
  ];

  return (
    <>
      {/* ── Header ── */}
      <div className="mb-6 flex flex-col gap-3 border-b border-[var(--vs-line-soft)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-[var(--vs-ink)] sm:text-xl">{customer.company_name}</h2>
          <p className="mt-0.5 font-mono text-[12px] text-[var(--vs-muted-2)]">{customer.customer_id}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={riskTagClass[riskNorm] ?? riskTagClass.Low}>{riskLabel}</span>
          {isChurned ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-50 px-2.5 py-1 text-[11px] font-bold text-red-600 border border-red-100">
              <XCircle className="h-3 w-3" /> Churn
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-600 border border-emerald-100">
              <BadgeCheck className="h-3 w-3" /> {lang === 'en' ? 'Active' : 'Aktif'}
            </span>
          )}
          <button
            type="button"
            onClick={() => setIsActivityModalOpen(true)}
            className="vs-btn vs-btn--primary gap-2 text-[12px]"
          >
            <Activity className="h-3.5 w-3.5" /> {t('activity.save')}
          </button>
        </div>
      </div>

      <motion.div variants={stagger} className="flex flex-col gap-5">

        {/* ── Informasi Umum ── */}
        <motion.div variants={fadeUp} className="vs-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
            <Building2 className="h-4 w-4 text-[var(--vs-muted-3)]" />
            {t('customerDetail.subscriptionProfile')}
          </h3>
          <div className="grid grid-cols-2 gap-x-6">
            <MetricRow label={t('customer.plan')} value={customer.plan_type ?? '-'} />
            <MetricRow label={lang === 'en' ? 'Contract Type' : 'Tipe Kontrak'} value={customer.contract_type ?? '-'} />
            <MetricRow label={lang === 'en' ? 'Customer Type' : 'Tipe Pelanggan'} value={customer.customer_type ?? '-'} />
            <MetricRow label="Tenure" value={tenure} sub={months} />
            <MetricRow
              label={t('customer.assignedTo')}
              value={customer.assigned_name ?? t('customer.unassigned')}
            />
            <MetricRow
              label={lang === 'en' ? 'Last Login' : 'Terakhir Login'}
              value={`${customer.days_since_login ?? '-'}${days}`}
              warn={(customer.days_since_login ?? 0) > 30}
            />
          </div>
        </motion.div>

        {/* ── Metrik Keuangan ── */}
        <motion.div variants={fadeUp} className="vs-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
            <DollarSign className="h-4 w-4 text-emerald-500" />
            {t('customerDetail.financial')}
          </h3>
          <div className="grid grid-cols-2 gap-x-6">
            <MetricRow label="MRR" value={fmtCurrency(mrr, lang)} />
            <MetricRow label={lang === 'en' ? 'Total Payment' : 'Total Pembayaran'} value={fmtCurrency(totalPayment, lang)} />
            <MetricRow label="Dunning" value={totalDunning} warn={totalDunning > 2} />
            <MetricRow
              label={lang === 'en' ? 'Avg. Payment Delay' : 'Rata-rata Terlambat Bayar'}
              value={`${fmt(avgPaymentDelay)} ${lang === 'en' ? 'days' : 'hari'}`}
              warn={avgPaymentDelay > 5}
            />
          </div>
        </motion.div>

        {/* ── Metrik Penggunaan ── */}
        <motion.div variants={fadeUp} className="vs-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
            <Zap className="h-4 w-4 text-amber-500" />
            {lang === 'en' ? 'Usage' : 'Penggunaan'}
          </h3>
          <div className="grid grid-cols-2 gap-x-6">
            <MetricRow label={lang === 'en' ? 'Avg. Usage' : 'Rata-rata Usage'} value={`${fmt(usageHrs)}${hours}`} warn={usageHrs < 20} />
            <MetricRow label={lang === 'en' ? 'Usage per User' : 'Usage per User'} value={`${fmt(usagePerUser)}${hours}`} />
            <MetricRow
              label={t('customerModal.featureAdoption')}
              value={`${fmt(featureAdoption * (featureAdoption <= 1 ? 100 : 1), 0)}%`}
              warn={featureAdoption < 0.3 && featureAdoption <= 1}
            />
            <MetricRow label="NPS" value={`${fmt(npsScore, 1)} / 10`} warn={npsScore < 7} />
          </div>
          <div className="mt-4 space-y-3">
            {[
              { label: t('customerModal.featureAdoption'), pct: Math.min(100, featureAdoption <= 1 ? featureAdoption * 100 : featureAdoption), color: featureAdoption < 0.3 ? '#EF4444' : '#10B981' },
              { label: 'NPS', pct: (npsScore / 10) * 100, color: npsScore < 7 ? '#F59E0B' : '#10B981' },
            ].map(({ label, pct, color }) => (
              <div key={label}>
                <div className="mb-1 flex justify-between text-[11px] text-[var(--vs-muted-2)]">
                  <span>{label}</span><span>{Math.round(pct)}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                  <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* ── Support & Tiket ── */}
        <motion.div variants={fadeUp} className="vs-card p-5">
          <h3 className="mb-3 flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
            <Headphones className="h-4 w-4 text-sky-500" />
            {t('customerDetail.supportQuality')}
          </h3>
          <div className="grid grid-cols-2 gap-x-6">
            <MetricRow label={lang === 'en' ? 'Total Tickets' : 'Total Tiket'} value={totalTickets} warn={totalTickets > 3} />
            <MetricRow label={lang === 'en' ? 'Avg. Severity' : 'Rata-rata Severity'} value={fmt(avgSeverity)} warn={avgSeverity > 3} />
            <MetricRow
              label={lang === 'en' ? 'Severe Ticket Ratio' : 'Rasio Tiket Berat'}
              value={`${fmt(severeRatio * (severeRatio <= 1 ? 100 : 1), 0)}%`}
              warn={severeRatio > 0.4 && severeRatio <= 1}
            />
          </div>
        </motion.div>

        {/* ── AI Churn Score ── */}
        <motion.div variants={fadeUp} className="vs-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--vs-line)] bg-[var(--vs-brand-50)] px-4 py-3 sm:px-5">
            <h3 className="flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
              <TrendingDown className="h-4 w-4 text-[var(--vs-brand)]" /> {t('customerDetail.aiAnalysis')}
            </h3>
            <span className="rounded-md border border-[var(--vs-brand-100)] bg-[var(--vs-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--vs-brand)]">
              {lang === 'en' ? 'ML Prediction' : 'ML Prediksi'}
            </span>
          </div>
          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-start sm:p-6">
            <div className="flex shrink-0 flex-col items-center justify-center">
              <div className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[5px]" style={{ borderColor: scoreColor }}>
                <span className="text-3xl font-black tracking-tighter" style={{ color: scoreColor }}>{customer.churn_score}</span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-[var(--vs-muted-3)]">Score</span>
              </div>
              <p className="mt-2 text-[11px] font-semibold text-[var(--vs-muted-2)]">{riskLabel}</p>
            </div>
            <div className="w-full flex-1 space-y-3">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--vs-muted-2)]">
                {lang === 'en' ? 'Key factors' : 'Faktor utama'}
              </h4>
              {factors.map(({ bad, title, desc }) => (
                <div key={title} className="flex items-start gap-2.5">
                  {bad
                    ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vs-warn)]" />
                    : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vs-success)]" />}
                  <div>
                    <p className="text-[13px] font-semibold text-[var(--vs-ink)]">{title}</p>
                    <p className="mt-0.5 text-[12px] leading-relaxed text-[var(--vs-muted)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* ── Rekomendasi Retensi ── */}
        <motion.div variants={fadeUp} className="vs-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--vs-line)] bg-violet-50/60 px-4 py-3">
            <h3 className="flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
              <Lightbulb className="h-4 w-4 text-violet-600" />
              {lang === 'en' ? 'Retention Recommendations' : 'Rekomendasi Retensi'}
            </h3>
            <button
              onClick={handleRekomendasi}
              disabled={rekLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-violet-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-violet-700 disabled:opacity-60"
            >
              {rekLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Lightbulb className="h-3 w-3" />}
              {rekLoading
                ? (lang === 'en' ? 'Processing…' : 'Memproses…')
                : rekResult
                  ? (lang === 'en' ? 'Refresh' : 'Perbarui')
                  : (lang === 'en' ? 'Get AI'  : 'Dapatkan AI')}
            </button>
          </div>
          <div className="p-4">
            {rekError && <p className="text-[12px] font-medium text-red-600">{rekError}</p>}
            {rekResult ? (
              <ul className="space-y-2">
                {rekResult.split('\n').filter(Boolean).map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-violet-400" />
                    {l.replace(/^[-•*\d.]\s*/, '')}
                  </li>
                ))}
              </ul>
            ) : (
              !rekLoading && (
                <p className="text-[12px] text-[var(--vs-muted-2)]">
                  {lang === 'en'
                    ? 'Click "Get AI" for AI-powered retention action recommendations.'
                    : 'Klik "Dapatkan AI" untuk rekomendasi tindakan retensi dari AI.'}
                </p>
              )
            )}
          </div>
        </motion.div>

        {/* ── Analisis Mendalam ── */}
        <motion.div variants={fadeUp} className="vs-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--vs-line)] bg-blue-50/60 px-4 py-3">
            <h3 className="flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
              <BarChart2 className="h-4 w-4 text-blue-600" />
              {lang === 'en' ? 'Deep Analysis' : 'Analisis Mendalam'}
            </h3>
            <button
              onClick={handleAnalisis}
              disabled={analLoading}
              className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3 py-1.5 text-[11px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
            >
              {analLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <BarChart2 className="h-3 w-3" />}
              {analLoading
                ? (lang === 'en' ? 'Analyzing…' : 'Menganalisis…')
                : analResult
                  ? (lang === 'en' ? 'Refresh'    : 'Perbarui')
                  : (lang === 'en' ? 'AI Analysis': 'Analisis AI')}
            </button>
          </div>
          <div className="p-4">
            {analError && <p className="text-[12px] font-medium text-red-600">{analError}</p>}
            {analResult ? (
              <ul className="space-y-2">
                {analResult.split('\n').filter(Boolean).map((l, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] leading-relaxed text-slate-700">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400" />
                    {l.replace(/^[-•*\d.]\s*/, '')}
                  </li>
                ))}
              </ul>
            ) : (
              !analLoading && (
                <p className="text-[12px] text-[var(--vs-muted-2)]">
                  {lang === 'en'
                    ? 'Click "AI Analysis" for an in-depth churn risk factor analysis.'
                    : 'Klik "Analisis AI" untuk mendapatkan analisis faktor risiko churn mendalam.'}
                </p>
              )
            )}
          </div>
        </motion.div>

        {/* ── Log Aktivitas ── */}
        <motion.div variants={fadeUp} className="vs-card p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
            <Clock className="h-4 w-4 text-[var(--vs-muted-3)]" />
            {t('customerDetail.activityLog')}
          </h3>
          {activities.length === 0 ? (
            <p className="py-8 text-center text-[13px] text-[var(--vs-muted-2)]">
              {lang === 'en' ? 'No activities yet.' : 'Belum ada aktivitas.'}
            </p>
          ) : (
            <div className="space-y-3">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-2.5">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${activityColors[act.action_type] ?? 'bg-[var(--vs-bg-2)] text-[var(--vs-muted)]'}`}>
                    {activityIcons(act.action_type)}
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border border-[var(--vs-line-soft)] bg-[var(--vs-bg)] p-3">
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-[var(--vs-ink)] capitalize">
                        {t(`activity.type.${act.action_type}`) ?? act.action_type}
                      </span>
                      <span className="shrink-0 font-mono text-[10px] text-[var(--vs-muted-3)]">{formatDate(act.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-[var(--vs-muted)]">{act.description}</p>
                    {act.staff?.full_name && (
                      <p className="mt-2 border-t border-[var(--vs-line-soft)] pt-2 text-[10px] text-[var(--vs-muted-3)]">
                        {act.staff.full_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>

      </motion.div>

      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        customerTextId={customer.customer_id}
        onActivityAdded={handleActivityAdded}
      />
    </>
  );
}
