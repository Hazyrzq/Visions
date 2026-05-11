'use client';

import { useAuth } from '@/lib/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, TrendingDown, Users, Star, Clock, FileText } from 'lucide-react';
import { mockChurnTrend, mockStaffPerformance, mockReportSummary } from '@/lib/mockData';

// Catatan: Impor komponen UI bawaan dinonaktifkan sementara karena 
// UI-nya di-inline langsung agar presisi dengan design system yang baru.
// import MetricCard from '@/components/dashboard/MetricCard';
// import Button from '@/components/ui/Button';

const retentionData = [
  { bulan: 'Jan', berhasil: 8,  gagal: 4 },
  { bulan: 'Feb', berhasil: 10, gagal: 5 },
  { bulan: 'Mar', berhasil: 9,  gagal: 3 },
  { bulan: 'Apr', berhasil: 13, gagal: 6 },
  { bulan: 'Mei', berhasil: 11, gagal: 4 },
  { bulan: 'Jun', berhasil: 12, gagal: 3 },
];

export default function AdminReportPage() {
  return (
    <div className="vs-root">
      {/* ─── CSS Global (Design System Visions) ─── */}
      <style jsx global>{`
        .vs-root {
          --bg:        #FAFAFA;
          --bg-2:      #F4F4F5;
          --surface:   #FFFFFF;
          --ink:       #0A0A0A;
          --ink-2:     #18181B;
          --muted:     #52525B;
          --muted-2:   #71717A;
          --muted-3:   #A1A1AA;
          --line:      #E4E4E7;
          --line-2:    #EAEAEC;
          --line-soft: #F0F0F2;

          --brand:     #4F46E5;
          --success:   #10B981;
          --warn:      #F59E0B;
          --danger:    #EF4444;

          --shadow-xs: 0 1px 2px rgba(16,24,40,0.04);
          
          font-family: 'Geist', 'Inter', -apple-system, sans-serif;
          color: var(--ink);
        }
        .vs-root .mono { font-family: 'Geist Mono', monospace; }
        
        .vs-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          box-shadow: var(--shadow-xs);
        }
        
        .vs-tag {
          display: inline-flex; align-items: center; justify-content: center; gap: 4px;
          padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
          border: 1px solid transparent; text-transform: capitalize;
        }

        .vs-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:6px;
          font-size: 12px; font-weight: 500; padding: 6px 12px; border-radius: 8px;
          transition: all .2s ease; cursor: pointer;
        }
        .vs-btn--secondary {
          color: var(--ink); background: var(--surface); border: 1px solid var(--line);
          box-shadow: var(--shadow-xs);
        }
        .vs-btn--secondary:hover { background: var(--bg-2); border-color: var(--line-2); }
      `}</style>

      <div className="w-full px-8 space-y-6 pb-12">
        
        {/* ═══════════════════════ HEADER ═══════════════════════ */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center">
                <FileText className="w-4 h-4 text-[var(--ink)]" />
              </div>
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">Laporan & Analitik</h1>
            </div>
            <p className="text-[14px] text-[var(--muted)] ml-11">Ringkasan performa retensi, tren churn, dan efektivitas tim Customer Success.</p>
          </div>
          <button className="vs-btn vs-btn--secondary">
            <Download className="w-3.5 h-3.5 text-[var(--muted)]" /> Export Report (.pdf)
          </button>
        </div>

        {/* ═══════════════════════ METRIC SUMMARY CARDS ═══════════════════════ */}
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { title: "Pelanggan At-Risk",  value: mockReportSummary.total_at_risk,         icon: TrendingDown, color: "var(--danger)" },
            { title: "Berhasil Diretain",  value: mockReportSummary.retained_this_month,   icon: Users,        color: "var(--success)" },
            { title: "Retention Rate",     value: `${mockReportSummary.retention_rate}%`,  icon: Star,         color: "var(--brand)" },
            { title: "Avg Response Time",  value: `${mockReportSummary.avg_response_time_hrs} jam`, icon: Clock, color: "var(--warn)" },
          ].map((m, i) => {
            const Icon = m.icon;
            return (
              <div key={i} className="vs-card p-5 transition-colors hover:border-[var(--line-2)]">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-7 h-7 rounded-md bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5" style={{ color: m.color }} />
                  </div>
                  <span className="text-[13px] font-medium text-[var(--muted)]">{m.title}</span>
                </div>
                <div className="text-[32px] font-semibold tracking-[-0.02em] tabular-nums text-[var(--ink)] leading-none">
                  {m.value}
                </div>
              </div>
            );
          })}
        </div>

        {/* ═══════════════════════ CHARTS SECTION ═══════════════════════ */}
        <div className="grid xl:grid-cols-2 gap-5">
          
          {/* Retention Chart (Bar) */}
          <div className="vs-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--ink)]">Hasil Intervensi Retensi</h3>
                <p className="text-[12px] text-[var(--muted-2)] mt-0.5">Keberhasilan vs Kegagalan tindakan retensi per bulan</p>
              </div>
              <button className="vs-btn vs-btn--secondary px-2.5 py-1.5"><Download className="w-3.5 h-3.5" /></button>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={retentionData} barGap={4} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line-soft)" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: 'var(--muted-3)' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-3)' }} axisLine={false} tickLine={false} dx={-10} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--ink-2)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    itemStyle={{ color: '#fff' }}
                    cursor={{ fill: 'var(--bg-2)' }}
                  />
                  <Bar dataKey="berhasil" fill="var(--success)" radius={[4,4,0,0]} name="Berhasil" maxBarSize={40} />
                  <Bar dataKey="gagal"    fill="var(--danger)"  radius={[4,4,0,0]} name="Gagal"    maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Churn Trend (Line) */}
          <div className="vs-card p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-[15px] font-semibold text-[var(--ink)]">Trend Churn Rate</h3>
                <p className="text-[12px] text-[var(--muted-2)] mt-0.5">Pergerakan persentase churn dalam 6 bulan terakhir</p>
              </div>
              <button className="vs-btn vs-btn--secondary px-2.5 py-1.5"><Download className="w-3.5 h-3.5" /></button>
            </div>
            <div className="h-[240px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={mockChurnTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--line-soft)" />
                  <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: 'var(--muted-3)' }} axisLine={false} tickLine={false} dy={10} />
                  <YAxis tick={{ fontSize: 11, fill: 'var(--muted-3)' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} dx={-10} />
                  <Tooltip 
                    contentStyle={{ background: 'var(--ink-2)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                    itemStyle={{ color: '#fff' }}
                    formatter={v => [`${v}%`, 'Churn Rate']} 
                  />
                  <Line type="monotone" dataKey="churn_rate" stroke="var(--ink)" strokeWidth={2} dot={{ fill: 'var(--surface)', stroke: 'var(--ink)', strokeWidth: 2, r: 4 }} activeDot={{ r: 6, fill: 'var(--brand)', stroke: 'var(--surface)' }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* ═══════════════════════ STAFF PERFORMANCE TABLE ═══════════════════════ */}
        <div className="vs-card overflow-hidden">
          <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)] flex items-center justify-between">
            <h3 className="text-[14px] font-semibold text-[var(--ink)]">Performa Tim Customer Success</h3>
            <button className="vs-btn vs-btn--secondary px-2.5 py-1.5"><Download className="w-3.5 h-3.5" /></button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-2)] border-b border-[var(--line)]">
                  {['Staff', 'Total Assigned', 'Selesai (Bulan Ini)', 'Success Rate', 'Workload', 'Performa'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)] bg-[var(--surface)]">
                {mockStaffPerformance.map(s => (
                  <tr key={s.id} className="hover:bg-[var(--bg)] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center text-[11px] font-semibold text-[var(--muted)] uppercase">
                          {s.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                        </div>
                        <span className="text-[13px] font-medium text-[var(--ink)]">{s.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[var(--muted)] tabular-nums">{s.assigned} tiket</td>
                    <td className="px-5 py-3.5 text-[13px] font-semibold text-[var(--ink)] tabular-nums">{s.resolved_month} tiket</td>
                    <td className="px-5 py-3.5 min-w-[140px]">
                      <div className="flex items-center gap-3">
                        <span className="text-[12px] font-semibold tabular-nums w-8 text-[var(--ink)] text-right">{s.success_rate}%</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--line-soft)] overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--brand)] transition-all duration-500" style={{ width: `${s.success_rate}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[var(--muted)] tabular-nums">{s.workload_pct}%</td>
                    <td className="px-5 py-3.5">
                      <span className={`vs-tag ${
                        s.performance === 'Sangat Baik' ? 'bg-emerald-50 text-emerald-600 border-emerald-100'
                        : s.performance === 'Baik' ? 'bg-[var(--bg-2)] text-[var(--muted)] border-[var(--line)]'
                        : 'bg-amber-50 text-amber-600 border-amber-100'
                      }`}>
                        {s.performance}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}