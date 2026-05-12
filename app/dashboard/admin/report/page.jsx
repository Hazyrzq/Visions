'use client';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, TrendingDown, Users, Star, Clock, FileText } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion';
import { mockChurnTrend, mockStaffPerformance, mockReportSummary } from '@/lib/mockData';
import DashboardShell from '@/components/dashboard/DashboardShell';

const retentionData = [
  { bulan: 'Jan', berhasil: 8,  gagal: 4 },
  { bulan: 'Feb', berhasil: 10, gagal: 5 },
  { bulan: 'Mar', berhasil: 9,  gagal: 3 },
  { bulan: 'Apr', berhasil: 13, gagal: 6 },
  { bulan: 'Mei', berhasil: 11, gagal: 4 },
  { bulan: 'Jun', berhasil: 12, gagal: 3 },
];

export default function AdminReportPage() {
  const metrics = [
    { title: 'Pelanggan At-Risk',  value: mockReportSummary.total_at_risk,                       icon: TrendingDown, color: 'var(--vs-danger)' },
    { title: 'Berhasil Diretain',  value: mockReportSummary.retained_this_month,                 icon: Users,        color: 'var(--vs-success)' },
    { title: 'Retention Rate',     value: `${mockReportSummary.retention_rate}%`,                icon: Star,         color: 'var(--vs-brand)' },
    { title: 'Avg Response Time',  value: `${mockReportSummary.avg_response_time_hrs} jam`,      icon: Clock,        color: 'var(--vs-warn)' },
  ];

  return (
    <DashboardShell
      title="Laporan & analitik"
      description="Ringkasan performa retensi, tren churn, dan efektivitas tim."
      icon={FileText}
      actions={(
        <button type="button" className="vs-btn vs-btn--secondary">
          <Download className="h-3.5 w-3.5" /> Export (.pdf)
        </button>
      )}
    >

      {/* Metric Cards */}
      <motion.div variants={stagger} className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {metrics.map((m) => {
          const Icon = m.icon;
          return (
            <motion.div key={m.title} variants={fadeUp} className="vs-card p-5 hover:border-[var(--vs-line-2)] transition-all">
              <div className="flex items-center gap-2.5 mb-4">
                <div className="w-8 h-8 rounded-lg bg-[var(--vs-brand-50)] border border-[var(--vs-brand-100)] flex items-center justify-center">
                  <Icon className="w-4 h-4" style={{ color: m.color }} />
                </div>
                <span className="text-[13px] font-medium text-[var(--vs-muted)]">{m.title}</span>
              </div>
              <div className="text-[30px] font-bold tabular-nums leading-none" style={{ color: m.color }}>{m.value}</div>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Charts */}
      <motion.div variants={stagger} className="grid xl:grid-cols-2 gap-5">
        <motion.div variants={fadeUp} className="vs-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-[var(--vs-ink)]">Hasil Intervensi Retensi</h3>
              <p className="text-[12px] text-[var(--vs-muted-2)] mt-0.5">Berhasil vs Gagal per bulan</p>
            </div>
            <button className="vs-btn vs-btn--secondary px-2.5 py-1.5"><Download className="w-3.5 h-3.5" /></button>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={retentionData} barGap={4} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--vs-line-soft)" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: 'var(--vs-muted-3)' }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--vs-muted-3)' }} axisLine={false} tickLine={false} dx={-6} />
                <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px' }} itemStyle={{ color: '#fff' }} cursor={{ fill: 'var(--vs-bg)' }} />
                <Bar dataKey="berhasil" fill="var(--vs-success)" radius={[4,4,0,0]} name="Berhasil" maxBarSize={36} />
                <Bar dataKey="gagal"    fill="var(--vs-danger)"  radius={[4,4,0,0]} name="Gagal"    maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div variants={fadeUp} className="vs-card p-6">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-[15px] font-bold text-[var(--vs-ink)]">Trend Churn Rate</h3>
              <p className="text-[12px] text-[var(--vs-muted-2)] mt-0.5">Pergerakan 6 bulan terakhir</p>
            </div>
            <button className="vs-btn vs-btn--secondary px-2.5 py-1.5"><Download className="w-3.5 h-3.5" /></button>
          </div>
          <div className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={mockChurnTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--vs-line-soft)" />
                <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: 'var(--vs-muted-3)' }} axisLine={false} tickLine={false} dy={8} />
                <YAxis tick={{ fontSize: 11, fill: 'var(--vs-muted-3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} dx={-6} />
                <Tooltip contentStyle={{ background: '#0F172A', border: 'none', borderRadius: '10px', color: '#fff', fontSize: '12px' }} itemStyle={{ color: '#fff' }} formatter={v => [`${v}%`, 'Churn Rate']} />
                <Line type="monotone" dataKey="churn_rate" stroke="var(--vs-brand)" strokeWidth={2.5}
                  dot={{ fill: '#fff', stroke: 'var(--vs-brand)', strokeWidth: 2, r: 4 }}
                  activeDot={{ r: 6, fill: 'var(--vs-brand)', stroke: '#fff', strokeWidth: 2 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </motion.div>

      {/* Staff Performance Table */}
      <motion.div variants={fadeUp} className="vs-card overflow-hidden">
        <div className="px-5 py-4 border-b border-[var(--vs-line)] flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-[var(--vs-ink)]">Performa Tim Customer Success</h3>
          <button className="vs-btn vs-btn--secondary px-2.5 py-1.5"><Download className="w-3.5 h-3.5" /></button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--vs-bg)] border-b border-[var(--vs-line)]">
                {['Staff', 'Total Assigned', 'Selesai (Bulan Ini)', 'Success Rate', 'Workload', 'Performa'].map(h => (
                  <th key={h} className="px-5 py-3 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--vs-line-soft)]">
              {mockStaffPerformance.map(s => (
                <tr key={s.id} className="hover:bg-[var(--vs-bg)] transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--vs-bg-2)] border border-[var(--vs-line)] flex items-center justify-center text-[11px] font-bold text-[var(--vs-muted)] uppercase">
                        {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <span className="text-[13px] font-semibold text-[var(--vs-ink)]">{s.name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[var(--vs-muted)] tabular-nums">{s.assigned} tiket</td>
                  <td className="px-5 py-3.5 text-[13px] font-bold text-[var(--vs-ink)] tabular-nums">{s.resolved_month} tiket</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <span className="text-[12px] font-bold tabular-nums w-8 text-[var(--vs-ink)] text-right">{s.success_rate}%</span>
                      <div className="flex-1 h-1.5 rounded-full bg-[var(--vs-line-soft)] overflow-hidden">
                        <div className="h-full rounded-full bg-[var(--vs-brand)]" style={{ width: `${s.success_rate}%` }} />
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[var(--vs-muted)] tabular-nums">{s.workload_pct}%</td>
                  <td className="px-5 py-3.5">
                    <span className={`vs-tag ${s.performance === 'Sangat Baik' ? 'vs-tag--low' : s.performance === 'Baik' ? 'vs-tag--blue' : 'vs-tag--medium'}`}>
                      {s.performance}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

    </DashboardShell>
  );
}
