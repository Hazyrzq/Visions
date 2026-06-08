'use client';

import { useEffect, useState } from 'react';
import {
  Building2, Mail, Clock, AlertTriangle,
  CheckCircle2, Activity, Ticket, CreditCard, UserCircle, Users, Phone,
  DollarSign, Briefcase, CalendarDays, PieChart, LifeBuoy, Star, AlertCircle, Database
} from 'lucide-react';
import { motion } from 'framer-motion';
import { mockCustomers } from '@/lib/mockData';
import { supabase } from '@/lib/supabase';
import ActivityModal from '@/components/customer/ActivityModal';
import { useLang } from '@/lib/i18n/LanguageContext';
const activityColors = {
  Email: 'bg-[var(--vs-brand-50)] text-[var(--vs-brand)]',
  Call: 'bg-emerald-50 text-emerald-600',
  Meeting: 'bg-purple-50 text-purple-600',
  Ticket: 'bg-amber-50 text-amber-600',
};

const activityIcons = (type) => {
  switch (type) {
    case 'Email': return <Mail className="w-4 h-4" />;
    case 'Call': return <Phone className="w-4 h-4" />;
    case 'Meeting': return <Users className="w-4 h-4" />;
    case 'Ticket': return <Ticket className="w-4 h-4" />;
    default: return <Activity className="w-4 h-4" />;
  }
};

const riskTagClass = {
  High: 'vs-tag vs-tag--high',
  Medium: 'vs-tag vs-tag--medium',
  Low: 'vs-tag vs-tag--low',
};


// Hitung risk_level dari churn_score sesuai threshold baru
function riskLevel(score) {
  const s = parseFloat(score) || 0;
  if (s >= 70) return 'High';
  if (s >= 30) return 'Medium';
  return 'Low';
}

// helper biar ga muncul tulisan "undefined"
const formatText = (val, fallback = '-') => {
  if (val === undefined || val === null || val === 'undefined' || String(val).trim() === '') return fallback;
  return String(val);
};

const formatNumber = (val, fallback = 0) => {
  const num = parseFloat(val);
  return isNaN(num) ? fallback : num;
};

const formatCurrency = (val) => {
  const num = parseFloat(val);
  if (isNaN(num)) return '$0.00';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(num);
};

const getTypeStyle = (type) => {
  const t = formatText(type, '').toLowerCase();
  if (t.includes('b2b') || t.includes('business')) return 'bg-blue-50 text-blue-700 border-blue-200';
  if (t.includes('b2c') || t.includes('consumer')) return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
  if (t.includes('enterprise')) return 'bg-slate-800 text-slate-100 border-slate-700';
  return 'bg-slate-100 text-slate-600 border-slate-200';
};

function resolveCustomerFromMock(id) {
  if (id == null || id === '') return null;
  return mockCustomers.find((c) => String(c.id) === String(id)) ?? null;
}

export default function CustomerDetailContent({ customerId }) {
  const { t, lang } = useLang();
  const [customer, setCustomer] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);

  useEffect(() => {
    if (!customerId) {
      setCustomer(null);
      setActivities([]);
      setLoading(false);
      return;
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
        const assignedName = data.staff?.full_name ?? data.assigned_name ?? null;
        setCustomer({ ...data, assigned_name: assignedName });
      } else {
        setCustomer(resolveCustomerFromMock(customerId));
      }

      const saved = localStorage.getItem(`activities_${customerId}`);
      setActivities(saved ? JSON.parse(saved) : []);
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [customerId]);

  const handleActivityAdded = (newActivity) => {
    if (!customerId) return;
    const updated = [newActivity, ...activities];
    setActivities(updated);
    localStorage.setItem(`activities_${customerId}`, JSON.stringify(updated));
  };

  const formatDate = (d) =>
    new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(new Date(d));

  if (!customerId) return null;

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
      </div>
    );
  }

  if (!customer) {
    return (
      <p className="py-10 text-center text-[13px] text-[var(--vs-muted)]">{t('customerDetail.notFound')}</p>
    );
  }

  const scoreColor = customer.churn_score >= 70 ? 'var(--vs-danger)' : customer.churn_score >= 30 ? 'var(--vs-warn)' : 'var(--vs-success)';

  // Ambil data yang sudah diamankan (terhindar dari undefined/NaN)
  const avgUsage = formatNumber(customer.avg_usage_hrs ?? customer.monthly_usage_hrs);
  const avgNps = formatNumber(customer.avg_nps_score ?? customer.nps_latest);
  const totalTickets = formatNumber(customer.total_tickets ?? customer.open_tickets);
  const payDelay = formatNumber(customer.avg_payment_delay);
  const severityLvl = formatNumber(customer.avg_severity);
  const dunningCount = formatNumber(customer.total_dunning);

  // Analisa AI Churn Dinamis
  const aiFactors = [];
  
  if (avgUsage < 30) {
    aiFactors.push({
      bad: true,
      title: lang === 'en' ? `Low Usage (${avgUsage} hrs)` : `Penggunaan Rendah (${avgUsage} jam)`,
      desc: lang === 'en' ? 'Minimal application usage. Indication that product value is not felt.' : 'Penggunaan aplikasi sangat minim. Indikasi nilai produk tidak dirasakan.'
    });
  } else {
    aiFactors.push({
      bad: false,
      title: lang === 'en' ? `Active Usage (${avgUsage} hrs)` : `Penggunaan Aktif (${avgUsage} jam)`,
      desc: lang === 'en' ? 'Customer engagement is at a healthy level.' : 'Engagement pelanggan berada di level yang sehat.'
    });
  }
 
  if (avgNps < 7) {
    aiFactors.push({
      bad: true,
      title: lang === 'en' ? `Low Satisfaction (NPS: ${avgNps}/10)` : `Kepuasan Rendah (NPS: ${avgNps}/10)`,
      desc: lang === 'en' ? 'Customer is dissatisfied and falls into detractor/passive category.' : 'Pelanggan tidak puas dan masuk kategori detractor/passive.'
    });
  } else {
    aiFactors.push({
      bad: false,
      title: lang === 'en' ? `High Satisfaction (NPS: ${avgNps}/10)` : `Kepuasan Tinggi (NPS: ${avgNps}/10)`,
      desc: lang === 'en' ? 'Loyal customer (Promoter).' : 'Pelanggan loyal (Promoter).'
    });
  }
 
  if (totalTickets > 2 || severityLvl >= 3) {
    aiFactors.push({
      bad: true,
      title: lang === 'en' ? `Service Issues (Tickets: ${totalTickets})` : `Isu Layanan (Tiket: ${totalTickets})`,
      desc: lang === 'en' ? 'Too many technical issues or high-severity complaints.' : 'Terlalu banyak kendala teknis atau komplain berskala tinggi.'
    });
  } else {
    aiFactors.push({
      bad: false,
      title: lang === 'en' ? 'Support Under Control' : 'Support Terkendali',
      desc: lang === 'en' ? 'Minimal technical issues, reasonable complaint queue.' : 'Minim masalah teknis, antrean keluhan wajar.'
    });
  }
 
  if (payDelay > 10 || dunningCount > 0) {
    aiFactors.push({
      bad: true,
      title: lang === 'en' ? `Payment Delay (${payDelay} days)` : `Keterlambatan Bayar (${payDelay} hari)`,
      desc: lang === 'en' ? 'History of late payments or collection warnings (Dunning).' : 'Ada riwayat terlambat bayar atau peringatan penagihan (Dunning).'
    });
  }

  return (
    <div className="pb-8">
      {/* HEADER */}
      <div className="mb-6 flex flex-col gap-3 border-b border-[var(--vs-line-soft)] pb-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <h2 className="truncate text-lg font-bold tracking-tight text-[var(--vs-ink)] sm:text-xl uppercase">
            {formatText(customer.company_name, 'Unknown Company')}
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <p className="font-mono text-[12px] font-semibold text-[var(--vs-brand)]">
              {formatText(customer.customer_id, 'No ID')}
            </p>
            <span className={`px-2 py-0.5 rounded border text-[9px] font-bold tracking-wide uppercase ${getTypeStyle(customer.customer_type)}`}>
              {formatText(customer.customer_type, 'Tipe Tidak Diketahui')}
            </span>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className={riskTagClass[formatText(customer.risk_level, 'Low')] ?? riskTagClass.Low}>
            {formatText(customer.risk_level, 'Low')}
          </span>
          <button
            type="button"
            onClick={() => setIsActivityModalOpen(true)}
            className="vs-btn vs-btn--primary gap-2 text-[12px] h-8"
          >
            <Activity className="h-3.5 w-3.5" /> {t('activity.save')}
          </button>
        </div>
      </div>

      <div className="flex flex-col gap-5">

        {/* ROW 1: INFO UMUM & FINANSIAL */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.05, ease:[0.16,1,0.3,1] }} className="vs-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-[var(--vs-muted)] border-b pb-2">
              <Briefcase className="h-3.5 w-3.5" /> {t('customerDetail.subscriptionProfile')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-500 flex items-center gap-1.5"><CreditCard className="w-3.5 h-3.5"/> {t('customer.plan')}</span>
                <span className="text-[12px] font-semibold text-slate-800">{formatText(customer.plan_type)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-500 flex items-center gap-1.5"><CalendarDays className="w-3.5 h-3.5"/> {lang === 'en' ? 'Contract Type' : 'Masa Kontrak'}</span>
                <span className="text-[12px] font-semibold text-slate-800">{formatText(customer.contract_type)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-500 flex items-center gap-1.5"><Clock className="w-3.5 h-3.5"/> {lang === 'en' ? 'Subscription Duration' : 'Lama Berlangganan'}</span>
                <span className="text-[12px] font-semibold text-slate-800">{formatNumber(customer.tenure_months)} {lang === 'en' ? 'Months' : 'Bulan'}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-dashed">
                <span className="text-[12px] text-slate-500 flex items-center gap-1.5"><UserCircle className="w-3.5 h-3.5"/> Account Manager</span>
                <span className="text-[12px] font-semibold text-slate-800">{formatText(customer.assigned_name, t('customer.unassigned'))}</span>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.12, ease:[0.16,1,0.3,1] }} className="vs-card p-4 bg-emerald-50/30 border-emerald-100">
            <h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-emerald-700 border-b border-emerald-100 pb-2">
              <DollarSign className="h-3.5 w-3.5" /> {t('customerDetail.financial')}
            </h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-600 font-medium">Monthly Revenue (MRR)</span>
                <span className="text-[14px] font-bold text-emerald-700 font-mono">{formatCurrency(customer.mrr)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-600 font-medium">{lang === 'en' ? 'Total Payment' : 'Total Pembayaran'}</span>
                <span className="text-[13px] font-semibold text-slate-800 font-mono">{formatCurrency(customer.total_payment_value)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-600 font-medium flex items-center gap-1">
                  {lang === 'en' ? 'Avg. Payment Delay' : 'Rata-rata Telat Bayar'}
                  {payDelay > 10 && <AlertCircle className="w-3 h-3 text-red-500"/>}
                </span>
                <span className={`text-[12px] font-bold ${payDelay > 10 ? 'text-red-600' : 'text-slate-800'}`}>{payDelay} {lang === 'en' ? 'Days' : 'Hari'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-[12px] text-slate-600 font-medium">{lang === 'en' ? 'Payment Warning (Dunning)' : 'Peringatan Tagihan (Dunning)'}</span>
                <span className="text-[12px] font-bold text-slate-800">{dunningCount} {lang === 'en' ? 'Times' : 'Kali'}</span>
              </div>
            </div>
          </motion.div>
        </div>

        {/* ROW 2: USAGE & SUPPORT METRICS */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.19, ease:[0.16,1,0.3,1] }} className="vs-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-blue-700 border-b border-blue-100 pb-2 bg-blue-50/20 -mx-4 px-4 pt-1">
              <PieChart className="h-3.5 w-3.5" /> {lang === 'en' ? 'Usage Engagement' : 'Engagement Penggunaan'}
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">{lang === 'en' ? 'Avg. Usage' : 'Rata-rata Usage'}</div>
                <div className="text-xl font-black text-[var(--vs-brand)]">{avgUsage}<span className="text-xs font-semibold text-slate-500 ml-1">{lang === 'en' ? 'Hrs' : 'Jam'}</span></div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Feature Adoption</div>
                <div className="text-xl font-black text-[var(--vs-brand)]">{formatNumber(customer.avg_feature_adoption)}<span className="text-xs font-semibold text-slate-500 ml-1">%</span></div>
              </div>
              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">{lang === 'en' ? 'Last Login Activity' : 'Aktivitas Login Terakhir'}</div>
                  <div className="text-[13px] font-bold text-slate-700">{formatNumber(customer.days_since_login)} {lang === 'en' ? 'days ago' : 'Hari yang lalu'}</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">Usage / User</div>
                  <div className="text-[13px] font-bold text-slate-700">{formatNumber(customer.usage_per_user)} {lang === 'en' ? 'Hrs' : 'Jam'}</div>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.26, ease:[0.16,1,0.3,1] }} className="vs-card p-4">
            <h3 className="mb-3 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-amber-700 border-b border-amber-100 pb-2 bg-amber-50/20 -mx-4 px-4 pt-1">
              <LifeBuoy className="h-3.5 w-3.5" /> {t('customerDetail.supportQuality')}
            </h3>
            <div className="grid grid-cols-2 gap-3 mt-4">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">{lang === 'en' ? 'NPS Score (0-10)' : 'Skor NPS (0-10)'}</div>
                <div className="text-xl font-black flex items-center gap-1 text-amber-600">
                  {avgNps} <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
                </div>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">{lang === 'en' ? 'Total Issue Tickets' : 'Total Tiket Isu'}</div>
                <div className="text-xl font-black text-slate-700">{totalTickets}</div>
              </div>
              <div className="col-span-2 bg-slate-50 p-3 rounded-xl border border-slate-100 flex justify-between items-center">
                <div>
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">{lang === 'en' ? 'Avg. Severity' : 'Rata-rata Severity'}</div>
                  <div className="text-[13px] font-bold text-slate-700">{lang === 'en' ? 'Level' : 'Level'} {severityLvl}</div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-slate-500 font-bold uppercase mb-0.5">{lang === 'en' ? 'Critical Issue Ratio' : 'Rasio Isu Kritis'}</div>
                  <div className="text-[13px] font-bold text-slate-700">{formatNumber(customer.severe_ticket_ratio)}%</div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* SECTION AI CHURN ANALYSIS */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.33, ease:[0.16,1,0.3,1] }} className="vs-card overflow-hidden">
          <div className="flex items-center justify-between border-b border-[var(--vs-line)] bg-[var(--vs-brand-50)] px-4 py-3 sm:px-5">
            <h3 className="flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)]">
              <Activity className="h-4 w-4 text-[var(--vs-brand)]" /> {t('customerDetail.aiAnalysis')}
            </h3>
            <span className="rounded-md border border-[var(--vs-brand-100)] bg-[var(--vs-surface)] px-2 py-0.5 text-[10px] font-medium text-[var(--vs-brand)]">
              {lang === 'en' ? 'ML Prediction' : 'ML Prediksi'}
            </span>
          </div>

          <div className="flex flex-col items-center gap-6 p-5 sm:flex-row sm:items-start sm:p-6">
            <div className="flex shrink-0 flex-col items-center justify-center">
              <div
                className="flex h-28 w-28 flex-col items-center justify-center rounded-full border-[5px] bg-slate-50 shadow-inner"
                style={{ borderColor: scoreColor }}
              >
                <span className="text-3xl font-black tracking-tighter" style={{ color: scoreColor }}>{formatNumber(customer.churn_score)}%</span>
                <span className="mt-0.5 text-[9px] font-semibold uppercase tracking-widest text-[var(--vs-muted-3)]">Score</span>
              </div>
            </div>

            <div className="w-full flex-1 space-y-3 bg-slate-50/50 p-4 rounded-xl border border-[var(--vs-line-soft)]">
              <h4 className="text-[11px] font-bold uppercase tracking-wider text-[var(--vs-muted-2)] mb-3">{lang === 'en' ? 'Algorithm Determining Factors' : 'Faktor Penentu Algoritma'}</h4>
              {aiFactors.map(({ bad, title, desc }) => (
                <div key={title} className="flex items-start gap-2.5">
                  {bad
                    ? <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vs-warn)]" />
                    : <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--vs-success)]" />}
                  <div>
                    <p className={`text-[12px] font-bold ${bad ? 'text-slate-800' : 'text-emerald-700'}`}>{title}</p>
                    <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--vs-muted)]">{desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* SECTION SEMUA DATA (RAW DUMP) */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.40, ease:[0.16,1,0.3,1] }} className="vs-card p-5 border border-slate-200">
          <h3 className="mb-4 flex items-center gap-2 text-[12px] font-bold uppercase tracking-wider text-slate-700 border-b border-slate-100 pb-3">
            <Database className="h-4 w-4 text-slate-500" /> {t('customerDetail.rawData')}
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-y-4 gap-x-4">
            {Object.keys(customer)
              .filter(k => !['id', 'created_at', 'updated_at', 'staff', 'model_history_id', 'assigned_name'].includes(k))
              .sort()
              .map(key => {
                const val = customer[key];
                const displayVal = (val === undefined || val === null || String(val) === 'undefined' || String(val) === '') ? '-' : String(val);
                return (
                  <div key={key} className="bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div className="text-[9px] text-slate-500 font-bold uppercase tracking-wider mb-1">
                      {key.replace(/_/g, ' ')}
                    </div>
                    <div className="text-[12px] font-semibold text-slate-800 break-all" title={displayVal}>
                      {displayVal}
                    </div>
                  </div>
                );
              })}
          </div>
        </motion.div>

        {/* SECTION ACTIVITY HISTORY */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.47, ease:[0.16,1,0.3,1] }} className="vs-card p-5 sm:p-6">
          <h3 className="mb-4 flex items-center gap-2 text-[13px] font-bold text-[var(--vs-ink)] border-b border-[var(--vs-line-soft)] pb-3">
            <Clock className="h-4 w-4 text-[var(--vs-muted-3)]" /> {t('customerDetail.activityLog')}
          </h3>

          {activities.length === 0 ? (
            <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-200">
              <p className="text-[12px] font-medium text-[var(--vs-muted-2)]">{lang === 'en' ? 'No interaction history or activity logs yet.' : 'Belum ada riwayat interaksi atau catatan aktivitas.'}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {activities.map((act) => (
                <div key={act.id} className="flex items-start gap-3">
                  <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full shadow-sm border border-white ring-2 ring-slate-50 ${activityColors[act.activity_type] ?? 'bg-[var(--vs-bg-2)] text-[var(--vs-muted)]'}`}>
                    {activityIcons(act.activity_type)}
                  </div>
                  <div className="min-w-0 flex-1 rounded-xl border border-[var(--vs-line-soft)] bg-white shadow-sm p-3.5 hover:border-[var(--vs-brand-200)] transition-colors">
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <span className="text-[12px] font-bold text-[var(--vs-ink)]">{act.activity_type}</span>
                      <span className="shrink-0 font-mono text-[10px] text-[var(--vs-muted-3)] bg-slate-50 px-2 py-0.5 rounded">{formatDate(act.created_at)}</span>
                    </div>
                    <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-slate-600">{act.notes}</p>
                    {act.staff?.full_name && (
                      <p className="mt-2.5 border-t border-[var(--vs-line-soft)] pt-2 text-[10px] font-medium text-[var(--vs-muted-2)] flex items-center gap-1">
                        <UserCircle className="w-3 h-3" /> {lang === 'en' ? 'Logged by' : 'Dicatat oleh'} {act.staff.full_name}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <ActivityModal
        isOpen={isActivityModalOpen}
        onClose={() => setIsActivityModalOpen(false)}
        customerId={customer.id}
        onActivityAdded={handleActivityAdded}
      />
    </div>
  );
}