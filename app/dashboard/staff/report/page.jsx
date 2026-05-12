'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { Download, TrendingDown, Users, Star, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion';
import MetricCard from '@/components/dashboard/MetricCard';
import RiskBadge from '@/components/dashboard/RiskBadge';
import { mockCustomers } from '@/lib/mockData';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function StaffReportPage() {
  const { profile } = useAuth();
  const myCustomers = mockCustomers.filter(c => c.assigned_to === profile?.id);
  const highRisk = myCustomers.filter(c => c.risk_level === 'Tinggi');
  const avgScore = myCustomers.length
    ? Math.round(myCustomers.reduce((s, c) => s + c.churn_score, 0) / myCustomers.length)
    : 0;

  return (
    <DashboardShell
      title="Laporan saya"
      description="Performa pelanggan yang Anda tangani."
      icon={FileText}
      actions={(
        <button type="button" className="vs-btn vs-btn--secondary">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </button>
      )}
    >

      <motion.div variants={stagger} className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
        <motion.div variants={fadeUp}>
          <MetricCard title="Total pelanggan saya" value={myCustomers.length} icon={Users} color="indigo" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MetricCard title="High risk" value={highRisk.length} icon={TrendingDown} color="red" />
        </motion.div>
        <motion.div variants={fadeUp}>
          <MetricCard title="Avg churn score" value={avgScore} icon={Star} color="amber" />
        </motion.div>
      </motion.div>

      <motion.div variants={fadeUp} className="vs-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--vs-sidebar-light-line)] bg-[var(--vs-dash-canvas-soft)]/80 px-5 py-4">
          <h2 className="text-[14px] font-bold text-[var(--vs-ink)]">Ringkasan pelanggan</h2>
          <button type="button" className="vs-btn vs-btn--secondary px-2.5 py-1.5">
            <Download className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-[var(--vs-line)] bg-[var(--vs-bg)]">
                {['ID', 'Pelanggan', 'Plan', 'Churn score', 'Risiko', 'NPS', 'Last login'].map(h => (
                  <th key={h} className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--vs-muted-2)]">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--vs-line-soft)]">
              {myCustomers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-[13px] text-[var(--vs-muted-2)]">Tidak ada data pelanggan</td>
                </tr>
              ) : (
                myCustomers.map(c => (
                  <tr key={c.id} className="transition-colors hover:bg-[var(--vs-bg)]">
                    <td className="px-4 py-3 font-mono text-[12px] text-[var(--vs-muted-2)]">{c.customer_id}</td>
                    <td className="px-4 py-3 text-[13px] font-semibold text-[var(--vs-ink)]">{c.company_name}</td>
                    <td className="px-4 py-3">
                      <span className="vs-tag">{c.plan_type}</span>
                    </td>
                    <td
                      className="px-4 py-3 text-[13px] font-bold tabular-nums"
                      style={{ color: c.churn_score > 65 ? 'var(--vs-danger)' : c.churn_score > 30 ? 'var(--vs-warn)' : 'var(--vs-success)' }}
                    >
                      {c.churn_score}
                    </td>
                    <td className="px-4 py-3">
                      <RiskBadge level={c.risk_level} />
                    </td>
                    <td className="px-4 py-3 text-[13px] tabular-nums text-[var(--vs-muted)]">{c.nps_latest}/10</td>
                    <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-[var(--vs-muted-2)]">{c.days_since_login}h lalu</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </DashboardShell>
  );
}
