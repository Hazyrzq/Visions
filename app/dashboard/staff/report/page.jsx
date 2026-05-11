'use client';
import { useAuth } from '@/lib/hooks/useAuth';
import { Download, TrendingDown, Users, Star } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import RiskBadge from '@/components/dashboard/RiskBadge';
import { mockCustomers } from '@/lib/mockData';

// --- PERBAIKAN DI SINI (Ganti import Button) ---
import { Button } from '@/components/ui/button';

export default function StaffReportPage() {
  const { profile } = useAuth();
  const myCustomers = mockCustomers.filter(c => c.assigned_to === profile?.id);
  const highRisk    = myCustomers.filter(c => c.risk_level === 'Tinggi');
  const avgScore    = myCustomers.length
    ? Math.round(myCustomers.reduce((s, c) => s + c.churn_score, 0) / myCustomers.length)
    : 0;

  return (
    // UBAH DI SINI: max-w-[900px] diganti jadi w-full agar fit 100%
    <div className="w-full space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900">Report</h2>
        <p className="text-sm text-gray-400 mt-0.5">Laporan performa pelanggan yang Anda tangani</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <MetricCard title="Total Pelanggan Saya" value={myCustomers.length} icon={Users}        color="indigo" />
        <MetricCard title="High Risk"            value={highRisk.length}    icon={TrendingDown} color="red"    />
        <MetricCard title="Avg Churn Score"      value={avgScore}           icon={Star}         color="amber"  />
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="font-semibold text-gray-900">Laporan Pelanggan Saya</h3>
          <Button variant="secondary" size="sm" className="gap-2">
            <Download className="w-3.5 h-3.5" /> Export PDF
          </Button>
        </div>
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50">
              <tr>
                {['ID','Pelanggan','Plan','Churn Score','Risiko','NPS','Last Login'].map(h => (
                  <th key={h} className="px-4 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {myCustomers.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-12 text-gray-400 text-sm">Tidak ada data pelanggan</td></tr>
              ) : myCustomers.map(c => (
                <tr key={c.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{c.customer_id}</td>
                  <td className="px-4 py-3 font-medium text-gray-900">{c.company_name}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs">{c.plan_type}</span>
                  </td>
                  <td className="px-4 py-3 font-bold tabular-nums" style={{ color: c.churn_score > 65 ? '#EF4444' : c.churn_score > 30 ? '#F59E0B' : '#10B981' }}>
                    {c.churn_score}
                  </td>
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