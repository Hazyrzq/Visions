'use client';
import { useAuth } from '@/lib/hooks/useAuth';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, TrendingDown, Users, Star, Clock } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import RiskBadge from '@/components/dashboard/RiskBadge';
import Button from '@/components/ui/Button';
import { mockChurnTrend, mockCustomers, mockStaffPerformance, mockReportSummary } from '@/lib/mockData';

const retentionData = [
  { bulan: 'Jan', berhasil: 8,  gagal: 4 },
  { bulan: 'Feb', berhasil: 10, gagal: 5 },
  { bulan: 'Mar', berhasil: 9,  gagal: 3 },
  { bulan: 'Apr', berhasil: 13, gagal: 6 },
  { bulan: 'Mei', berhasil: 11, gagal: 4 },
  { bulan: 'Jun', berhasil: 12, gagal: 3 },
];

function AdminReport() {
  return (
    <div className="space-y-5 max-w-[1300px]">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard title="Pelanggan At-Risk"    value={mockReportSummary.total_at_risk}                icon={TrendingDown} color="red"     />
        <MetricCard title="Berhasil Diretain"    value={mockReportSummary.retained_this_month}          icon={Users}        color="emerald" />
        <MetricCard title="Retention Rate"       value={`${mockReportSummary.retention_rate}%`}          icon={Star}         color="indigo"  />
        <MetricCard title="Avg Response Time"    value={`${mockReportSummary.avg_response_time_hrs} jam`} icon={Clock}        color="amber"   />
      </div>

      <div className="grid xl:grid-cols-2 gap-5">
        {/* Retention Chart */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">Hasil Intervensi Retensi</h3>
              <p className="text-xs text-gray-400 mt-0.5">Berhasil vs Gagal per bulan</p>
            </div>
            <Button variant="secondary" size="sm"><Download className="w-3.5 h-3.5" /> Export</Button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={retentionData} barGap={4}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }} />
              <Bar dataKey="berhasil" fill="#10B981" radius={[4,4,0,0]} name="Berhasil" />
              <Bar dataKey="gagal"    fill="#EF4444" radius={[4,4,0,0]} name="Gagal" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Churn Trend */}
        <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="font-semibold text-gray-900">Trend Churn Rate</h3>
              <p className="text-xs text-gray-400 mt-0.5">6 bulan terakhir (%)</p>
            </div>
            <Button variant="secondary" size="sm"><Download className="w-3.5 h-3.5" /> Export</Button>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={mockChurnTrend} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
              <XAxis dataKey="bulan" tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} axisLine={false} tickLine={false} tickFormatter={v => `${v}%`} />
              <Tooltip contentStyle={{ background: '#1F2937', border: 'none', borderRadius: 10, color: '#fff', fontSize: 12 }} formatter={v => [`${v}%`, 'Churn Rate']} />
              <Line type="monotone" dataKey="churn_rate" stroke="#4F46E5" strokeWidth={2.5} dot={{ fill: '#4F46E5', r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Staff Performance Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-900">Performa Tim</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['Staff','Assigned','Selesai','Success Rate','Workload','Performa'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {mockStaffPerformance.map(s => (
                <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-medium text-gray-900">{s.name}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{s.assigned}</td>
                  <td className="px-4 py-3 tabular-nums text-gray-700">{s.resolved_month}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-100 rounded-full h-1.5"><div className="bg-indigo-500 h-1.5 rounded-full" style={{ width: `${s.success_rate}%` }} /></div>
                      <span className="text-xs font-semibold text-gray-600 tabular-nums">{s.success_rate}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">{s.workload_pct}%</td>
                  <td className="px-4 py-3">
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${s.performance === 'Sangat Baik' ? 'bg-emerald-100 text-emerald-700' : s.performance === 'Baik' ? 'bg-sky-100 text-sky-700' : 'bg-amber-100 text-amber-700'}`}>
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
  );
}

function StaffReport({ profile }) {
  const myCustomers = mockCustomers.filter(c => c.assigned_to === profile?.id);
  const highRisk = myCustomers.filter(c => c.risk_level === 'Tinggi');
  const avgScore = myCustomers.length
    ? Math.round(myCustomers.reduce((s, c) => s + c.churn_score, 0) / myCustomers.length)
    : 0;

  return (
    <div className="space-y-5 max-w-[900px]">
      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Total Pelanggan Saya"  value={myCustomers.length}  icon={Users}        color="indigo" />
        <MetricCard title="High Risk"             value={highRisk.length}     icon={TrendingDown} color="red"    />
        <MetricCard title="Avg Churn Score"       value={avgScore}            icon={Star}         color="amber"  />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Laporan Pelanggan Saya</h3>
          <Button variant="secondary" size="sm"><Download className="w-3.5 h-3.5" /> Export PDF</Button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50">
              <tr>
                {['ID','Pelanggan','Plan','Churn Score','Risiko','NPS','Last Login'].map(h => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myCustomers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.customer_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.company_name}</td>
                  <td className="px-4 py-3"><span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs">{c.plan_type}</span></td>
                  <td className="px-4 py-3 font-bold tabular-nums" style={{ color: c.churn_score > 65 ? '#EF4444' : c.churn_score > 30 ? '#F59E0B' : '#10B981' }}>{c.churn_score}</td>
                  <td className="px-4 py-3"><RiskBadge level={c.risk_level} /></td>
                  <td className="px-4 py-3 tabular-nums text-gray-600">{c.nps_latest}/10</td>
                  <td className="px-4 py-3 text-xs text-gray-400 tabular-nums">{c.days_since_login}h lalu</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default function ReportPage() {
  const { profile, isAdmin } = useAuth();
  return isAdmin ? <AdminReport /> : <StaffReport profile={profile} />;
}
