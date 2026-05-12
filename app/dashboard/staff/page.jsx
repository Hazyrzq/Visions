'use client';

import Link from 'next/link';
import { ArrowRight, MoreHorizontal, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants, fadeUp, stagger } from '@/lib/motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { mockChurnTrend, mockCustomers, mockStaffPerformance } from '@/lib/mockData';
import LogipHero from '@/components/dashboard/overview/LogipHero';
import LogipPerformanceChart from '@/components/dashboard/overview/LogipPerformanceChart';
import LogipRightColumn from '@/components/dashboard/overview/LogipRightColumn';
import RiskBadge from '@/components/dashboard/RiskBadge';
import ChurnScoreBar from '@/components/dashboard/ChurnScoreBar';

function riskDot(level) {
  if (level === 'Tinggi') return 'bg-orange-500';
  if (level === 'Sedang') return 'bg-sky-500';
  return 'bg-emerald-500';
}

export default function StaffOverviewPage() {
  const { profile } = useAuth();
  const myCustomers = mockCustomers.filter((c) => c.assigned_to === profile?.id);
  const highPriority = myCustomers.filter((c) => c.risk_level === 'Tinggi');
  const myPerf = mockStaffPerformance.find((s) => s.id === profile?.id);

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
      label: 'Selesai (bulan)',
      value: String(myPerf?.resolved_month ?? 0),
      hint: 'Tindakan sukses',
      trend: '+2',
      color: 'text-[var(--vs-brand)]',
      bg: 'bg-[var(--vs-brand-50)]',
    },
    {
      label: 'Success rate',
      value: `${myPerf?.success_rate ?? 0}%`,
      hint: 'Retensi pelanggan',
      trend: '+5%',
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  const donePct = myCustomers.length
    ? Math.round(((myCustomers.length - highPriority.length) / myCustomers.length) * 100)
    : 100;

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
                  {s.value}
                </span>
                <span className={`mb-1 rounded-lg px-2 py-0.5 text-[11px] font-bold ${s.bg} ${s.color}`}>{s.trend}</span>
              </div>
              <p className="mt-2 text-[12px] font-medium text-slate-500">{s.hint}</p>
            </motion.div>
          ))}
        </motion.div>

        <LogipPerformanceChart data={mockChurnTrend} />

        <motion.div variants={fadeUp} className="rounded-[24px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Prioritas Anda</h2>
              <p className="mt-1 text-[13px] text-slate-500">Pelanggan yang di-assign — risiko tinggi dulu.</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-slate-50 px-3 py-1.5 text-[12px] font-semibold text-slate-600">
                Selesai <span className="text-slate-900">{donePct}%</span>
              </div>
              <button
                type="button"
                className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-[12px] font-semibold text-slate-700 shadow-sm"
              >
                Minggu ini <ChevronDown className="h-3.5 w-3.5 opacity-60" />
              </button>
            </div>
          </div>

          {highPriority.length === 0 ? (
            <p className="py-10 text-center text-[13px] text-slate-500">Tidak ada prioritas tinggi — kerja bagus.</p>
          ) : (
            <ul className="divide-y divide-slate-100">
              {highPriority.map((c) => (
                <li key={c.id}>
                  <Link href="/dashboard/staff/customer" className="block py-4 transition-colors hover:bg-slate-50/80">
                    <div className="flex items-start gap-4 sm:gap-5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                        {(c.company_name || '?').slice(0, 2)}
                      </div>
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
                        <MoreHorizontal className="h-5 w-5 text-slate-300" />
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
