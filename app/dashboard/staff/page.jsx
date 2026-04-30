'use client';
import { useAuth } from '@/lib/hooks/useAuth';
import { AlertTriangle, CheckSquare, Star, ClipboardList } from 'lucide-react';
import MetricCard from '@/components/dashboard/MetricCard';
import RiskBadge from '@/components/dashboard/RiskBadge';
import ChurnScoreBar from '@/components/dashboard/ChurnScoreBar';
import { mockCustomers, mockActivities, mockStaffPerformance } from '@/lib/mockData';

const actionIcons = { call: '📞', email: '✉️', meeting: '🤝', note: '📝' };

export default function StaffOverviewPage() {
  const { profile } = useAuth();

  const myCustomers  = mockCustomers.filter(c => c.assigned_to === profile?.id);
  const highPriority = myCustomers.filter(c => c.risk_level === 'Tinggi');
  const myActivities = mockActivities.filter(a => a.staff_id === profile?.id);
  const myPerf       = mockStaffPerformance.find(s => s.id === profile?.id);

  return (
    <div className="space-y-6 max-w-[1200px]">
      <div>
        <h2 className="text-xl font-bold text-gray-900">
          Selamat datang, {profile?.full_name?.split(' ')[0]} 👋
        </h2>
        <p className="text-sm text-gray-400 mt-0.5">Berikut ringkasan tugas dan aktivitas Anda hari ini</p>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-3 gap-4">
        <MetricCard title="Tugas Prioritas"    value={highPriority.length}              subtitle="pelanggan high risk"   icon={AlertTriangle} color="red"     />
        <MetricCard title="Selesai Minggu Ini" value={myPerf?.resolved_month ?? 0}      subtitle="tindakan berhasil"     icon={CheckSquare}   color="emerald" />
        <MetricCard title="Success Rate"       value={`${myPerf?.success_rate ?? 0}%`}  subtitle="retensi bulan ini"     icon={Star}          color="indigo"  />
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
