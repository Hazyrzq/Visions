'use client';
import { useState, useEffect } from 'react';
import { Users, TrendingDown, AlertTriangle, Activity, CheckSquare, Star, ClipboardList } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { useAuth } from '@/lib/hooks/useAuth';
import MetricCard from '@/components/dashboard/MetricCard';
import AlertCard from '@/components/dashboard/AlertCard';
import RiskBadge from '@/components/dashboard/RiskBadge';
import ChurnScoreBar from '@/components/dashboard/ChurnScoreBar';
import { CardSkeleton } from '@/components/ui/Skeleton';
import {
  mockChurnTrend, mockRiskDistribution, mockCustomers,
  mockAlerts, mockModelHistory, mockActivities, mockStaffPerformance,
} from '@/lib/mockData';

// ─── Admin Dashboard ───────────────────────────────────────────────
function AdminDashboard() {
  const highRisk = mockCustomers.filter(c => c.risk_level === 'Tinggi');
  const avgScore = Math.round(mockCustomers.reduce((s, c) => s + c.churn_score, 0) / mockCustomers.length);
  const activeModel = mockModelHistory.find(m => m.status === 'Aktif');

  return (
    <div className="space-y-6 max-w-[1400px]">
      {/* Metric Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Total Pelanggan"     value="247"        subtitle="aktif bulan ini"          icon={Users}         color="indigo"  trend="up"   trendValue="+3.3%" />
        <MetricCard title="Churn Rate"           value="23.4%"      subtitle="rata-rata 6 bulan"        icon={TrendingDown}  color="red"     trend="up"   trendValue="+0.7%" />
        <MetricCard title="High Risk"            value={highRisk.length} subtitle="perlu tindakan segera" icon={AlertTriangle} color="amber"   trend="down" trendValue="-2" />
        <MetricCard title="Avg Risk Score"       value={avgScore}   subtitle="dari skala 0–100"         icon={Activity}      color="emerald" trend="down" trendValue="-1.2" />
      </div>

      {/* Charts Row */}
      <div className="grid xl:grid-cols-3 gap-5">
        {/* Line Chart */}
        <div className="xl:col-span-2 bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-5">
            <h3 className="font-semibold text-gray-900">Trend Churn Rate</h3>
            <p className="text-xs text-gray-400 mt-0.5">6 bulan terakhir (%)</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockChurnTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip
                contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }}
                formatter={v => [`${v}%`, 'Churn Rate']}
              />
              <Line type="monotone" dataKey="churn_rate" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: '#4F46E5', r: 4 }} activeDot={{ r: 6 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Donut Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="mb-5">
            <h3 className="font-semibold text-gray-900">Risk Distribution</h3>
            <p className="text-xs text-gray-400 mt-0.5">247 pelanggan aktif</p>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie data={mockRiskDistribution} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                {mockRiskDistribution.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }} />
              <Legend iconType="circle" iconSize={8} formatter={(v) => <span className="text-xs text-gray-600">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="grid xl:grid-cols-3 gap-5">
        {/* High Risk Table */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50 flex items-center justify-between">
            <h3 className="font-semibold text-gray-900">Pelanggan High Risk Terbaru</h3>
            <a href="/dashboard/customer" className="text-xs text-indigo-600 hover:underline font-medium">Lihat semua →</a>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50">
                <tr>
                  {['Pelanggan','Plan','Churn Score','Risiko','Assigned'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {highRisk.slice(0, 5).map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900 text-sm">{c.company_name}</div>
                      <div className="text-[11px] text-gray-400">{c.customer_id}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs">{c.plan_type}</span>
                    </td>
                    <td className="px-4 py-3 min-w-[130px]"><ChurnScoreBar score={c.churn_score} /></td>
                    <td className="px-4 py-3"><RiskBadge level={c.risk_level} /></td>
                    <td className="px-4 py-3 text-xs text-gray-500">{c.assigned_name ?? <span className="text-red-500">Unassigned</span>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Alerts + Model */}
        <div className="space-y-5">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-900 mb-3">Alert Sistem</h3>
            <div className="space-y-2.5">
              {mockAlerts.map(a => <AlertCard key={a.id} alert={a} />)}
            </div>
          </div>

          {activeModel && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-3">Model Aktif</h3>
              <div className="space-y-2">
                {[
                  { label: 'Algoritma',  value: activeModel.algoritma },
                  { label: 'Akurasi',    value: `${activeModel.akurasi}%` },
                  { label: 'AUC-ROC',   value: activeModel.auc_roc },
                  { label: 'F1-Score',  value: activeModel.f1_score },
                ].map(r => (
                  <div key={r.label} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                    <span className="text-xs text-gray-500">{r.label}</span>
                    <span className="text-xs font-semibold text-gray-800">{r.value}</span>
                  </div>
                ))}
                <div className="pt-2">
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                    <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" /> Aktif
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Staff Dashboard ───────────────────────────────────────────────
function StaffDashboard({ profile }) {
  const myCustomers = mockCustomers.filter(c => c.assigned_to === profile?.id);
  const highPriority = myCustomers.filter(c => c.risk_level === 'Tinggi');
  const myActivities = mockActivities.filter(a => a.staff_id === profile?.id);
  const myPerf = mockStaffPerformance.find(s => s.id === profile?.id);

  const actionIcons = { call: '📞', email: '✉️', meeting: '🤝', note: '📝' };

  return (
    <div className="space-y-6 max-w-[1200px]">
      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Tugas Prioritas"      value={highPriority.length} subtitle="pelanggan high risk"   icon={AlertTriangle} color="red"     />
        <MetricCard title="Selesai Minggu Ini"   value={myPerf?.resolved_month ?? 0} subtitle="tindakan berhasil" icon={CheckSquare}  color="emerald" />
        <MetricCard title="Success Rate"         value={`${myPerf?.success_rate ?? 0}%`} subtitle="retensi bulan ini" icon={Star}    color="indigo"  />
      </div>

      <div className="grid xl:grid-cols-5 gap-5">
        {/* Priority List */}
        <div className="xl:col-span-3 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Prioritas Hari Ini</h3>
            <p className="text-xs text-gray-400 mt-0.5">Pelanggan yang perlu tindakan segera</p>
          </div>
          {highPriority.length === 0 ? (
            <div className="py-16 text-center text-gray-400 text-sm">
              <CheckSquare className="w-10 h-10 mx-auto mb-3 text-emerald-300" />
              Tidak ada pelanggan prioritas hari ini
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {highPriority.map(c => (
                <div key={c.id} className="px-5 py-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="font-semibold text-gray-900 text-sm">{c.company_name}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{c.customer_id} · {c.plan_type}</div>
                    </div>
                    <RiskBadge level={c.risk_level} />
                  </div>
                  <div className="mt-2.5">
                    <ChurnScoreBar score={c.churn_score} />
                  </div>
                  {c.rekomendasi && (
                    <div className="mt-2.5 text-xs text-indigo-600 bg-indigo-50 rounded-lg px-3 py-2 leading-relaxed">
                      💡 {c.rekomendasi}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activity Log */}
        <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="px-5 py-4 border-b border-gray-50">
            <h3 className="font-semibold text-gray-900">Log Aktivitas Saya</h3>
          </div>
          <div className="divide-y divide-gray-50">
            {myActivities.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <ClipboardList className="w-8 h-8 mx-auto mb-2 text-gray-200" />
                Belum ada aktivitas
              </div>
            ) : myActivities.map(a => (
              <div key={a.id} className="px-5 py-3.5">
                <div className="flex items-start gap-2.5">
                  <span className="text-base flex-shrink-0">{actionIcons[a.action_type] ?? '📌'}</span>
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800">{a.company_name}</div>
                    <div className="text-xs text-gray-500 mt-0.5 leading-relaxed">{a.description}</div>
                    <div className="text-[11px] text-gray-300 mt-1">
                      {new Date(a.created_at).toLocaleDateString('id-ID', { day:'numeric', month:'short', hour:'2-digit', minute:'2-digit' })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────────────────
export default function DashboardPage() {
  const { profile, isAdmin } = useAuth();
  return isAdmin ? <AdminDashboard /> : <StaffDashboard profile={profile} />;
}
