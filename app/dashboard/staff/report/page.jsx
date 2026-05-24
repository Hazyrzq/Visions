'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { Download, TrendingDown, Users, Star, FileText } from 'lucide-react';

function printReport(element, title) {
  const style = document.createElement('style');
  style.setAttribute('data-print-report', '');
  style.textContent = `
    @media print {
      @page { margin: 12mm; }
      body * { visibility: hidden !important; }
      #report-print-area, #report-print-area * { visibility: visible !important; }
      #report-print-area {
        position: fixed !important; inset: 0 !important;
        padding: 0 !important; margin: 0 !important;
        background: #fff !important;
      }
    }
  `;
  const wrapper = document.createElement('div');
  wrapper.id = 'report-print-area';
  wrapper.innerHTML = `<h2 style="font-size:16px;font-weight:700;margin-bottom:16px;color:#0f172a">${title}</h2>`;
  wrapper.appendChild(element.cloneNode(true));
  document.body.appendChild(wrapper);
  document.head.appendChild(style);
  window.print();
  document.body.removeChild(wrapper);
  document.head.removeChild(style);
}
import { motion } from 'framer-motion';
import MetricCard from '@/components/dashboard/MetricCard';
import RiskBadge from '@/components/dashboard/RiskBadge';
import { supabase } from '@/lib/supabase';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function StaffReportPage() {
  const { profile } = useAuth();
  const [myCustomers, setMyCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);

  const handleExport = () => {
    if (!contentRef.current) return;
    printReport(contentRef.current, 'Laporan Saya — ChurnShield');
  };

  useEffect(() => {
    if (!profile?.id) return;
    const fetchData = async () => {
      const { data } = await supabase
        .from('customers')
        .select('*')
        .eq('assigned_to', profile.id)
        .order('churn_score', { ascending: false });
      setMyCustomers(data ?? []);
      setLoading(false);
    };
    fetchData();
  }, [profile?.id]);

  const highRisk = myCustomers.filter(c => c.risk_level === 'Tinggi');
  const avgScore = myCustomers.length
    ? Math.round(myCustomers.reduce((s, c) => s + (c.churn_score ?? 0), 0) / myCustomers.length)
    : 0;

  return (
    <DashboardShell
      title="Laporan saya"
      description="Performa pelanggan yang Anda tangani."
      icon={FileText}
      actions={(
        <button type="button" onClick={handleExport} disabled={loading} className="vs-btn vs-btn--secondary disabled:opacity-50">
          <Download className="h-3.5 w-3.5" /> Export PDF
        </button>
      )}
    >
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
        </div>
      ) : (
        <div ref={contentRef} className="space-y-5">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3 sm:gap-4">
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.05, ease:[0.16,1,0.3,1] }}>
              <MetricCard title="Total pelanggan saya" value={myCustomers.length} icon={Users} color="indigo" />
            </motion.div>
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.12, ease:[0.16,1,0.3,1] }}>
              <MetricCard title="High risk" value={highRisk.length} icon={TrendingDown} color="red" />
            </motion.div>
            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.19, ease:[0.16,1,0.3,1] }}>
              <MetricCard title="Avg churn score" value={`${avgScore}%`} icon={Star} color="amber" />
            </motion.div>
          </div>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.26, ease:[0.16,1,0.3,1] }} className="vs-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-[var(--vs-sidebar-light-line)] bg-[var(--vs-dash-canvas-soft)]/80 px-5 py-4">
              <h2 className="text-[14px] font-bold text-[var(--vs-ink)]">Ringkasan pelanggan</h2>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-[var(--vs-line)] bg-[var(--vs-bg)]">
                    {['ID', 'Pelanggan', 'Plan', 'Churn Score', 'Risiko', 'NPS', 'Last Login'].map(h => (
                      <th key={h} className="whitespace-nowrap px-4 py-3 text-[11px] font-semibold uppercase tracking-wider text-[var(--vs-muted-2)]">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--vs-line-soft)]">
                  {myCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-[13px] text-[var(--vs-muted-2)]">Tidak ada pelanggan yang ditugaskan</td>
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
                          {c.churn_score ?? '—'}%
                        </td>
                        <td className="px-4 py-3">
                          <RiskBadge level={c.risk_level} />
                        </td>
                        <td className="px-4 py-3 text-[13px] tabular-nums text-[var(--vs-muted)]">
                          {c.avg_nps_score != null ? `${c.avg_nps_score}/10` : '—'}
                        </td>
                        <td className="px-4 py-3 font-mono text-[12px] tabular-nums text-[var(--vs-muted-2)]">
                          {c.days_since_login != null ? `${c.days_since_login}h lalu` : '—'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>
      )}
    </DashboardShell>
  );
}
