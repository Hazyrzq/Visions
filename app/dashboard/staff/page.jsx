'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants, fadeUp, stagger } from '@/lib/motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import LogipHero from '@/components/dashboard/overview/LogipHero';
import LogipPerformanceChart from '@/components/dashboard/overview/LogipPerformanceChart';
import LogipRightColumn from '@/components/dashboard/overview/LogipRightColumn';
import RiskBadge from '@/components/dashboard/RiskBadge';
import ChurnScoreBar from '@/components/dashboard/ChurnScoreBar';

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];

function riskDot(level) {
  if (level === 'Tinggi') return 'bg-orange-500';
  if (level === 'Sedang') return 'bg-sky-500';
  return 'bg-emerald-500';
}

export default function StaffOverviewPage() {
  const { profile } = useAuth();
  const [myCustomers, setMyCustomers] = useState([]);
  const [activitiesCount, setActivitiesCount] = useState(0);
  const [churnTrend, setChurnTrend] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString();

    const fetchAll = async () => {
      const [{ data: customers }, { count: actCount }, { data: predictions }] = await Promise.all([
        supabase.from('customers').select('*').eq('assigned_to', profile.id),
        supabase.from('activities').select('*', { count: 'exact', head: true })
          .eq('staff_id', profile.id).gte('created_at', thisMonthStart),
        supabase.from('prediction_history').select('churn_score,created_at').order('created_at'),
      ]);

      setMyCustomers(customers ?? []);
      setActivitiesCount(actCount ?? 0);

      // build churn trend
      const map = {};
      for (const row of (predictions ?? [])) {
        if (!row.created_at || row.churn_score == null) continue;
        const d = new Date(row.created_at);
        const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
        if (!map[key]) map[key] = { bulan: MONTH_NAMES[d.getMonth()], _key: key, sum: 0, n: 0 };
        map[key].sum += Number(row.churn_score);
        map[key].n += 1;
      }
      const trend = Object.values(map).sort((a,b) => a._key.localeCompare(b._key)).slice(-12)
        .map(m => ({ bulan: m.bulan, churn_rate: m.n > 0 ? Math.round((m.sum / m.n) * 10) / 10 : 0 }));
      setChurnTrend(trend);
      setLoading(false);
    };
    fetchAll();
  }, [profile?.id]);

  const highPriority = myCustomers.filter(c => c.risk_level === 'Tinggi');
  const successRate = myCustomers.length > 0
    ? Math.round((myCustomers.filter(c => !c.churn_actual).length / myCustomers.length) * 100)
    : 0;
  const donePct = myCustomers.length
    ? Math.round(((myCustomers.length - highPriority.length) / myCustomers.length) * 100)
    : 100;

  const stats = [
    {
      label: 'Prioritas tinggi',
      value: String(highPriority.length),
      hint: 'Perlu tindakan',
      trend: highPriority.length ? '!' : 'OK',
      color: highPriority.length ? 'text-red-600' : 'text-emerald-600',
      bg: highPriority.length ? 'bg-red-50' : 'bg-emerald-50',
    },
    {
      label: 'Aktivitas (bulan)',
      value: String(activitiesCount),
      hint: 'Total tindakan bulan ini',
      trend: activitiesCount > 0 ? `+${activitiesCount}` : '0',
      color: 'text-[var(--vs-brand)]',
      bg: 'bg-[var(--vs-brand-50)]',
    },
    {
      label: 'Success rate',
      value: `${successRate}%`,
      hint: 'Pelanggan tidak churn',
      trend: `${successRate}%`,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-10 xl:grid-cols-12 xl:items-start xl:gap-12"
    >
      <div className="space-y-10 xl:col-span-8">
        <LogipHero
          eyebrow="Staf"
          subtitle="Fokus ke pelanggan Anda: prioritas, performa, dan aktivitas terbaru."
        />

        <motion.div variants={stagger} className="grid gap-4 sm:grid-cols-3">
          {stats.map((s) => (
            <motion.div
              key={s.label}
              variants={fadeUp}
              className="rounded-[22px] border border-slate-200/90 bg-white p-5 shadow-sm transition-transform hover:-translate-y-0.5"
            >
              <p className="text-[12px] font-semibold uppercase tracking-wide text-slate-400">{s.label}</p>
              <div className="mt-3 flex items-end justify-between gap-2">
                <span className={`text-[2rem] font-bold tabular-nums leading-none tracking-tight sm:text-[2.25rem] ${s.color}`}>
                  {loading ? '—' : s.value}
                </span>
                <span className={`mb-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${s.bg} ${s.color}`}>{s.trend}</span>
              </div>
              <p className="mt-2 text-[12px] font-medium text-slate-500">{s.hint}</p>
            </motion.div>
          ))}
        </motion.div>

        <LogipPerformanceChart data={churnTrend} />

        <motion.div variants={fadeUp} className="rounded-[24px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Prioritas Anda</h2>
              <p className="mt-1 text-[13px] text-slate-500">
                {loading ? 'Memuat...' : `${myCustomers.length} pelanggan — risiko tinggi dulu.`}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
                Selesai <span className="text-slate-900">{donePct}%</span>
              </div>
            </div>
          </div>

          {loading ? (
            <div className="flex justify-center py-10">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
            </div>
          ) : highPriority.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-slate-500">
              {myCustomers.length === 0 ? 'Belum ada pelanggan yang di-assign.' : 'Tidak ada prioritas tinggi — kerja bagus.'}
            </p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {highPriority.slice(0, 10).map((c) => (
                <li key={c.id}>
                  <Link href="/dashboard/staff/customer" className="block py-4 transition-colors hover:bg-slate-50/80">
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-[14px] font-semibold text-slate-900">{c.company_name}</p>
                          <RiskBadge level={c.risk_level} />
                        </div>
                        <p className="mt-0.5 text-[12px] text-slate-500">{c.customer_id} · {c.plan_type}</p>
                        <div className="mt-3 max-w-md">
                          <ChurnScoreBar score={c.churn_score} />
                        </div>
                      </div>
                      <div className="flex shrink-0 items-center gap-2 pt-1">
                        <span className={`h-2.5 w-2.5 rounded-full ${riskDot(c.risk_level)}`} />
                        <span className="text-[13px] font-bold tabular-nums text-slate-800">{c.churn_score}</span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-4 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/dashboard/staff/customer"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--vs-brand)] hover:underline"
            >
              Buka pelanggan saya <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="xl:col-span-4">
        <LogipRightColumn
          activityFilterStaffId={profile?.id}
          customerHref="/dashboard/staff/customer"
          showAlerts={false}
        />
      </div>
    </motion.div>
  );
}
