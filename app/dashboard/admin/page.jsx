'use client';

import { Users, TrendingDown, TrendingUp, AlertTriangle, Activity, ArrowUpRight, ArrowRight, ShieldAlert, Brain } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import {
  mockChurnTrend, mockRiskDistribution, mockCustomers,
  mockAlerts, mockModelHistory,
} from '@/lib/mockData';

// Catatan: Impor komponen custom di bawah tidak digunakan karena UI-nya di-inline 
// agar 100% sesuai dengan design system Vercel/Linear yang baru.
// import MetricCard from '@/components/dashboard/MetricCard';
// import AlertCard from '@/components/dashboard/AlertCard';
// import RiskBadge from '@/components/dashboard/RiskBadge';
// import ChurnScoreBar from '@/components/dashboard/ChurnScoreBar';

export default function AdminOverviewPage() {
  const highRisk    = mockCustomers.filter(c => c.risk_level === 'Tinggi');
  const avgScore    = Math.round(mockCustomers.reduce((s, c) => s + c.churn_score, 0) / mockCustomers.length);
  const activeModel = mockModelHistory.find(m => m.status === 'Aktif');

  return (
    <div className="vs-root space-y-6 max-w-[1200px] mx-auto pb-12">
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
          --brand-50:  #EEF2FF;
          --success:   #10B981;
          --warn:      #F59E0B;
          --danger:    #EF4444;

          --shadow-xs: 0 1px 2px rgba(16,24,40,0.04);
          --shadow-sm: 0 1px 3px rgba(16,24,40,0.06), 0 1px 2px rgba(16,24,40,0.04);
          
          font-family: 'Geist', 'Inter', -apple-system, sans-serif;
          color: var(--ink);
        }
        .vs-root .mono {
          font-family: 'Geist Mono', monospace;
        }
        .vs-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 14px;
          box-shadow: var(--shadow-xs);
        }
        .vs-tag {
          display: inline-flex; align-items: center; gap: 4px;
          padding: 3px 8px; border-radius: 6px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
          border: 1px solid transparent;
        }
        .vs-pulse-dot {
          width: 6px; height: 6px; border-radius: 999px; background: var(--success);
          box-shadow: 0 0 0 0 rgba(16,185,129,0.4); animation: vsPulse 2.4s infinite;
        }
        @keyframes vsPulse {
          0% { box-shadow: 0 0 0 0 rgba(16,185,129,.4); }
          70% { box-shadow: 0 0 0 6px rgba(16,185,129,0); }
          100% { box-shadow: 0 0 0 0 rgba(16,185,129,0); }
        }
      `}</style>

      {/* Header Halaman (Opsional - menyesuaikan tata letak dashboard) */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">Overview</h1>
          <p className="text-[14px] text-[var(--muted)] mt-1">Pantau performa retensi dan risiko pelanggan Anda.</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-sm">
          <div className="vs-pulse-dot" />
          <span className="text-[12px] font-medium text-[var(--muted)]">Sistem Aktif</span>
        </div>
      </div>

      {/* ═══════════════════════ METRIC CARDS ═══════════════════════ */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        {[
          { title: "Total Pelanggan", value: "247",   sub: "aktif bulan ini",       icon: Users,         trend: "+3.3%", up: true,  color: "var(--brand)" },
          { title: "Churn Rate",      value: "23.4%", sub: "rata-rata 6 bulan",     icon: TrendingDown,  trend: "+0.7%", up: false, color: "var(--danger)" },
          { title: "High Risk",       value: highRisk.length, sub: "tindakan segera", icon: AlertTriangle, trend: "-2",    up: true,  color: "var(--warn)" },
          { title: "Avg Risk Score",  value: avgScore, sub: "skala 0–100",          icon: Activity,      trend: "-1.2",  up: true,  color: "var(--success)" },
        ].map((m, i) => {
          const Icon = m.icon;
          return (
            <div key={i} className="vs-card p-5 transition-colors hover:border-[var(--line-2)]">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-md bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center">
                    <Icon className="w-3.5 h-3.5 text-[var(--ink)]" />
                  </div>
                  <span className="text-[13px] font-medium text-[var(--muted)]">{m.title}</span>
                </div>
              </div>
              <div className="flex items-baseline gap-3">
                <div className="text-[32px] font-semibold tracking-[-0.02em] tabular-nums text-[var(--ink)] leading-none">
                  {m.value}
                </div>
                <div className={`flex items-center gap-0.5 text-[11px] font-semibold px-1.5 py-0.5 rounded ${m.up ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                  {m.up ? <ArrowUpRight className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  {m.trend}
                </div>
              </div>
              <div className="mt-2 text-[12px] text-[var(--muted-3)]">{m.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ═══════════════════════ CHARTS ROW ═══════════════════════ */}
      <div className="grid xl:grid-cols-3 gap-5">
        {/* Line Chart */}
        <div className="xl:col-span-2 vs-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-[15px] font-semibold text-[var(--ink)]">Trend Churn Rate</h3>
              <p className="text-[12px] text-[var(--muted-2)] mt-0.5">Persentase churn 6 bulan terakhir</p>
            </div>
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

        {/* Pie Chart */}
        <div className="vs-card p-6 flex flex-col">
          <div className="mb-2">
            <h3 className="text-[15px] font-semibold text-[var(--ink)]">Distribusi Risiko</h3>
            <p className="text-[12px] text-[var(--muted-2)] mt-0.5">247 pelanggan aktif</p>
          </div>
          <div className="flex-1 min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={mockRiskDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={85} paddingAngle={2} dataKey="value" stroke="none">
                  {mockRiskDistribution.map((e, i) => (
                    <Cell key={i} fill={e.name === 'Tinggi' ? 'var(--danger)' : e.name === 'Sedang' ? 'var(--warn)' : 'var(--success)'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--ink-2)', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} itemStyle={{ color: '#fff' }} />
                <Legend iconType="circle" iconSize={6} wrapperStyle={{ fontSize: '12px', color: 'var(--muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ═══════════════════════ BOTTOM ROW ═══════════════════════ */}
      <div className="grid xl:grid-cols-3 gap-5">
        
        {/* Table High Risk */}
        <div className="xl:col-span-2 vs-card overflow-hidden flex flex-col">
          <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface)]">
            <h3 className="text-[14px] font-semibold text-[var(--ink)]">Pelanggan High Risk Terbaru</h3>
            <a href="/dashboard/admin/customer" className="text-[12px] font-medium text-[var(--muted)] hover:text-[var(--ink)] flex items-center gap-1 transition-colors">
              Lihat semua <ArrowRight className="w-3 h-3" />
            </a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-2)] border-b border-[var(--line)]">
                  {['Pelanggan','Plan','Churn Score','Risiko','Assigned'].map(h => (
                    <th key={h} className="px-5 py-3 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)]">
                {highRisk.slice(0, 5).map(c => (
                  <tr key={c.id} className="hover:bg-[var(--bg)] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="text-[13px] font-medium text-[var(--ink)]">{c.company_name}</div>
                      <div className="text-[11px] text-[var(--muted-3)] mono mt-0.5">{c.customer_id}</div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2 py-1 bg-[var(--bg-2)] border border-[var(--line)] text-[var(--muted)] rounded-md text-[11px] font-medium">
                        {c.plan_type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 min-w-[140px]">
                      <div className="flex items-center gap-3">
                        <span className="text-[13px] font-semibold tabular-nums w-6">{c.churn_score}</span>
                        <div className="flex-1 h-1.5 rounded-full bg-[var(--line-soft)] overflow-hidden">
                          <div className="h-full rounded-full bg-[var(--danger)]" style={{ width: `${c.churn_score}%` }} />
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="vs-tag bg-red-50 text-red-600 border-red-100/50">Tinggi</span>
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-[var(--muted)]">
                      {c.assigned_name ? (
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded bg-[var(--line-soft)] flex items-center justify-center text-[9px] font-bold text-[var(--muted)]">
                            {c.assigned_name.charAt(0)}
                          </div>
                          {c.assigned_name}
                        </div>
                      ) : (
                        <span className="text-[var(--danger)] font-medium">Unassigned</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Alerts & Model */}
        <div className="space-y-5 flex flex-col">
          {/* Alerts */}
          <div className="vs-card p-5">
            <div className="flex items-center gap-2 mb-4">
              <ShieldAlert className="w-4 h-4 text-[var(--ink)]" />
              <h3 className="text-[14px] font-semibold text-[var(--ink)]">Alert Sistem</h3>
            </div>
            <div className="space-y-3">
              {mockAlerts.map(a => (
                <div key={a.id} className="flex gap-3 p-3 rounded-lg border border-[var(--line-soft)] bg-[var(--bg-2)] hover:border-[var(--line)] transition-colors">
                  <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${a.type === 'Critical' ? 'bg-[var(--danger)]' : 'bg-[var(--warn)]'}`} />
                  <div>
                    <div className="text-[13px] font-medium text-[var(--ink)] leading-snug">{a.message}</div>
                    <div className="text-[11px] text-[var(--muted-3)] mt-1">{a.time}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Active Model */}
          {activeModel && (
            <div className="vs-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <Brain className="w-4 h-4 text-[var(--ink)]" />
                <h3 className="text-[14px] font-semibold text-[var(--ink)]">Model Machine Learning</h3>
              </div>
              <div className="divide-y divide-[var(--line-soft)]">
                {[
                  { label: 'Algoritma', value: activeModel.algoritma },
                  { label: 'Akurasi',   value: `${activeModel.akurasi}%` },
                  { label: 'AUC-ROC',  value: activeModel.auc_roc },
                  { label: 'F1-Score', value: activeModel.f1_score },
                ].map(r => (
                  <div key={r.label} className="flex justify-between items-center py-2.5">
                    <span className="text-[12px] text-[var(--muted)]">{r.label}</span>
                    <span className="text-[13px] font-medium text-[var(--ink)] mono">{r.value}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 mt-1 border-t border-[var(--line-soft)] flex justify-between items-center">
                <span className="text-[12px] text-[var(--muted-2)]">Status</span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-md">
                  <span className="w-1.5 h-1.5 bg-[var(--success)] rounded-full" /> Deployed
                </span>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}