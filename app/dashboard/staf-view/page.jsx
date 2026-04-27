'use client';
import { useState } from 'react';
import { useAuth } from '@/lib/hooks/useAuth';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Users, UserCheck, AlertTriangle } from 'lucide-react';
import Button from '@/components/ui/Button';
import Modal from '@/components/ui/Modal';
import RiskBadge from '@/components/dashboard/RiskBadge';
import { mockStaffPerformance, mockCustomers, mockProfiles } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';

const performanceColor = { 'Sangat Baik': 'emerald', 'Baik': 'sky', 'Cukup': 'amber' };
const performanceBadge = {
  'Sangat Baik': 'bg-emerald-100 text-emerald-700',
  'Baik': 'bg-sky-100 text-sky-700',
  'Cukup': 'bg-amber-100 text-amber-700',
};

export default function StafViewPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const { toasts, toast, remove } = useToast();
  const [assignModal, setAssignModal] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState('');
  const [assigning, setAssigning] = useState(false);

  const staffOnly = mockProfiles.filter(p => p.role === 'staff' && p.is_active);
  const unassigned = mockCustomers.filter(c => !c.assigned_to && c.risk_level === 'Tinggi');

  useEffect(() => {
    if (!loading && !isAdmin) router.replace('/dashboard');
  }, [isAdmin, loading, router]);

  if (loading || !isAdmin) return null;

  const handleAssign = async () => {
    if (!selectedStaff) return;
    setAssigning(true);
    await new Promise(r => setTimeout(r, 800));
    toast(`${selectedCustomer?.company_name} berhasil di-assign ke ${mockProfiles.find(p => p.id === selectedStaff)?.full_name}`, 'success');
    setAssignModal(false);
    setSelectedStaff('');
    setAssigning(false);
  };

  return (
    <>
      <div className="max-w-[1300px] space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Staf View</h2>
          <p className="text-sm text-gray-400 mt-0.5">Pantau beban kerja tim dan assign pelanggan berisiko</p>
        </div>

        <div className="grid xl:grid-cols-3 gap-5">
          {/* Staff Table */}
          <div className="xl:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              <h3 className="font-semibold text-gray-900">Tim Customer Success</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    {['Nama Staff','Beban Kerja','Selesai / Bulan','Performa','Aksi'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {mockStaffPerformance.map(s => (
                    <tr key={s.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {s.name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                          </div>
                          <div>
                            <div className="font-medium text-gray-900">{s.name}</div>
                            <div className="text-[11px] text-gray-400">{s.assigned} assigned</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-100 rounded-full h-1.5 min-w-[80px]">
                            <div
                              className={`h-full rounded-full ${s.workload_pct > 80 ? 'bg-red-500' : s.workload_pct > 60 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                              style={{ width: `${s.workload_pct}%` }}
                            />
                          </div>
                          <span className="text-xs font-semibold text-gray-600 w-8">{s.workload_pct}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-4 font-semibold text-gray-700">{s.resolved_month}</td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${performanceBadge[s.performance]}`}>
                          {s.performance}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => { setSelectedCustomer(null); setSelectedStaff(s.id); setAssignModal(true); }}
                        >
                          Assign
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Unassigned Panel */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="font-semibold text-gray-900">Belum Di-assign</h3>
              <span className="ml-auto bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full">{unassigned.length}</span>
            </div>
            <div className="p-4 space-y-3">
              {unassigned.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-sm">
                  <UserCheck className="w-8 h-8 mx-auto mb-2 text-emerald-300" />
                  Semua pelanggan sudah di-assign
                </div>
              ) : unassigned.map(c => (
                <div key={c.id} className="bg-red-50 border border-red-100 rounded-xl p-3.5">
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="font-semibold text-sm text-gray-900">{c.company_name}</div>
                      <div className="text-[11px] text-gray-400">{c.customer_id} · {c.plan_type}</div>
                    </div>
                    <RiskBadge level={c.risk_level} />
                  </div>
                  <div className="text-xs text-gray-500 mb-3">Score: <span className="font-bold text-red-600">{c.churn_score}</span></div>
                  <Button
                    variant="danger"
                    size="sm"
                    className="w-full text-xs"
                    onClick={() => { setSelectedCustomer(c); setSelectedStaff(''); setAssignModal(true); }}
                  >
                    Assign Sekarang
                  </Button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Assign Modal */}
      <Modal isOpen={assignModal} onClose={() => setAssignModal(false)} title="Assign Pelanggan ke Staff" size="sm">
        <div className="p-5 space-y-4">
          {selectedCustomer && (
            <div className="bg-gray-50 rounded-xl p-3">
              <div className="text-sm font-semibold text-gray-800">{selectedCustomer.company_name}</div>
              <div className="text-xs text-gray-400">{selectedCustomer.customer_id} · Churn Score: {selectedCustomer.churn_score}</div>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Staff</label>
            <select
              value={selectedStaff}
              onChange={e => setSelectedStaff(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">— Pilih staff —</option>
              {staffOnly.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" size="md" className="flex-1" onClick={() => setAssignModal(false)}>Batal</Button>
            <Button variant="primary" size="md" className="flex-1" loading={assigning} disabled={!selectedStaff} onClick={handleAssign}>
              Assign
            </Button>
          </div>
        </div>
      </Modal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
