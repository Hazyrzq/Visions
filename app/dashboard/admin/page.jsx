'use client';

import Link from 'next/link';
import { ArrowRight, MoreHorizontal, ChevronDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { pageVariants, fadeUp, stagger } from '@/lib/motion';
import {
  mockChurnTrend,
  mockRiskDistribution,
  mockCustomers,
  mockReportSummary,
} from '@/lib/mockData';
import LogipHero from '@/components/dashboard/overview/LogipHero';
import LogipPerformanceChart from '@/components/dashboard/overview/LogipPerformanceChart';
import LogipRightColumn from '@/components/dashboard/overview/LogipRightColumn';

const RISK_COLORS = { Tinggi: '#EF4444', Sedang: '#F59E0B', Rendah: '#10B981' };

function riskDot(level) {
  if (level === 'Tinggi') return 'bg-orange-500';
  if (level === 'Sedang') return 'bg-sky-500';
  return 'bg-emerald-500';
}

export default function AdminOverviewPage() {
  const highRisk = mockCustomers.filter((c) => c.risk_level === 'Tinggi');
  const avgScore = Math.round(mockCustomers.reduce((s, c) => s + c.churn_score, 0) / mockCustomers.length);
  const total = mockCustomers.length || 247;

  const stats = [
    {
      label: 'Pelanggan at-risk',
      value: String(mockReportSummary.total_at_risk),
      hint: 'Butuh follow-up',
      trend: '+3',
      up: false,
      color: 'text-red-600',
      bg: 'bg-red-50',
    },
    {
      label: 'Churn rate',
      value: '23.4%',
      hint: 'Rata-rata 6 bulan',
      trend: '+0.7%',
      up: false,
      color: 'text-orange-600',
      bg: 'bg-orange-50',
    },
    {
      label: 'Skor risiko avg',
      value: String(avgScore),
      hint: 'Skala 0–100',
      trend: '−1.2',
      up: true,
      color: 'text-emerald-600',
      bg: 'bg-emerald-50',
    },
  ];

  const donePct = Math.min(100, Math.round(((mockCustomers.length - highRisk.length) / mockCustomers.length) * 100));

  return (
    <motion.div
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="grid gap-10 xl:grid-cols-12 xl:items-start xl:gap-12"
    >
      <div className="space-y-10 xl:col-span-8">
        <LogipHero
          eyebrow="ChurnShield"
          subtitle="Ringkas retensi, risiko, dan tindakan tim — tampilan kerja harian yang fokus."
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

        <motion.div variants={fadeUp} className="rounded-[22px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6">
          <h3 className="text-sm font-bold text-slate-900">Distribusi risiko</h3>
          <p className="mt-0.5 text-[12px] text-slate-500">{total} pelanggan dalam model</p>
          <div className="mt-5 space-y-4">
            {mockRiskDistribution.map((d) => (
              <div key={d.name} className="flex items-center gap-4">
                <span className="w-16 shrink-0 text-[12px] font-semibold text-slate-600">{d.name}</span>
                <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-slate-100">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{
                      width: `${Math.min(100, (d.value / total) * 100)}%`,
                      background: RISK_COLORS[d.name] ?? '#94a3b8',
                    }}
                  />
                </div>
                <span className="w-8 shrink-0 text-right text-[13px] font-bold tabular-nums text-slate-800">{d.value}</span>
              </div>
            ))}
          </div>
        </motion.div>

        <LogipPerformanceChart data={mockChurnTrend} />

        <motion.div variants={fadeUp} className="rounded-[24px] border border-slate-200/90 bg-white p-5 shadow-sm sm:p-6 lg:p-7">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-bold tracking-tight text-slate-900 sm:text-xl">Prioritas minggu ini</h2>
              <p className="mt-1 text-[13px] text-slate-500">Pelanggan dengan risiko tinggi — urutkan oleh skor.</p>
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

          <ul className="divide-y divide-slate-100">
            {highRisk.slice(0, 6).map((c) => (
              <li key={c.id}>
                <Link
                  href={`/dashboard/admin/customer?detail=${encodeURIComponent(c.id)}`}
                  className="flex items-center gap-4 py-4 transition-colors hover:bg-slate-50/80 sm:gap-5"
                >
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-slate-200 bg-slate-50 text-[11px] font-bold uppercase text-slate-600">
                    {(c.company_name || '?').slice(0, 2)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[14px] font-semibold text-slate-900">{c.company_name}</p>
                    <p className="mt-0.5 truncate text-[12px] text-slate-500">{c.plan_type} · {c.customer_id}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${riskDot(c.risk_level)}`} title={c.risk_level} />
                    <span className="text-[13px] font-bold tabular-nums text-slate-800">{c.churn_score}</span>
                  </div>
                  <span className="shrink-0 rounded-full p-2 text-slate-400">
                    <MoreHorizontal className="h-5 w-5" />
                  </span>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-4 border-t border-slate-100 pt-4 text-center">
            <Link
              href="/dashboard/admin/customer"
              className="inline-flex items-center gap-2 text-[13px] font-semibold text-[var(--vs-brand)] hover:underline"
            >
              Buka semua pelanggan <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="xl:col-span-4">
        <LogipRightColumn customerHref="/dashboard/admin/customer" />
      </div>
    </motion.div>
  );
}
