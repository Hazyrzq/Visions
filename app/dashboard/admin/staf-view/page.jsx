'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Users, Briefcase, Activity, AlertCircle, LayoutGrid, List, UserPlus } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function AdminStaffPage() {
  const { toasts, toast, remove } = useToast();
  const confirm = useConfirm();

  const [staffList, setStaffList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [viewMode, setViewMode]   = useState('list');
  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualStaff, setManualStaff]       = useState('');
  const [isManualAssigning, setIsManualAssigning] = useState(false);

  const fetchData = async () => {
    try {
      const { data: sd } = await supabase.from('profiles').select('*');
      const { data: cd } = await supabase.from('customers').select('*');
      if (sd) setStaffList(sd);
      if (cd) setCustomers(cd);
    } catch { toast('Gagal mengambil data', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const workload = (id) => customers.filter(c => c.assigned_to === id || c.staff_id === id).length;
  const unassigned = () => customers.filter(c => !c.assigned_to && !c.staff_id);
  const unassignedCount = unassigned().length;

  const handleAutoAssign = async () => {
    if (unassignedCount === 0) { toast('Semua pelanggan sudah memiliki staf.', 'success'); return; }
    if (staffList.length === 0) { toast('Tidak ada data staf.', 'error'); return; }
    const ok = await confirm({ title: 'Auto-Assign', message: `Terdapat ${unassignedCount} pelanggan tanpa staf. Bagikan secara merata?`, confirmText: 'Jalankan', cancelText: 'Batal' });
    if (!ok) return;
    setIsAssigning(true);
    try {
      const unass = unassigned().sort((a, b) => b.churn_score - a.churn_score);
      const loads = staffList.map(s => ({ id: s.id, count: workload(s.id) }));
      for (const cust of unass) {
        loads.sort((a, b) => a.count - b.count);
        await supabase.from('customers').update({ assigned_to: loads[0].id, staff_id: loads[0].id }).eq('id', cust.id);
        loads[0].count += 1;
      }
      await fetchData();
      toast(`Berhasil membagikan ${unassignedCount} pelanggan!`, 'success');
    } catch { toast('Terjadi kesalahan', 'error'); }
    finally { setIsAssigning(false); }
  };

  const handleManualAssign = async (e) => {
    e.preventDefault();
    if (!manualCustomer || !manualStaff) return;
    setIsManualAssigning(true);
    try {
      await supabase.from('customers').update({ assigned_to: manualStaff, staff_id: manualStaff }).eq('id', manualCustomer);
      await fetchData();
      toast('Pelanggan berhasil ditugaskan!', 'success');
      setIsManualModalOpen(false);
      setManualCustomer(''); setManualStaff('');
    } catch { toast('Gagal menugaskan', 'error'); }
    finally { setIsManualAssigning(false); }
  };

  return (
    <DashboardShell
      title="Distribusi tugas staf"
      description="Pantau beban kerja staf dan bagikan pelanggan berisiko."
      icon={Briefcase}
      actions={(
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {unassignedCount > 0 && (
            <div className="flex items-center gap-2 rounded-lg border border-amber-100 bg-amber-50 px-3 py-1.5">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span className="text-[12px] font-semibold text-amber-700">{unassignedCount} belum di-assign</span>
            </div>
          )}

          <div className="flex items-center rounded-lg border border-[var(--vs-line)] bg-[var(--vs-bg-2)] p-1">
            {[{ mode: 'grid', Icon: LayoutGrid }, { mode: 'list', Icon: List }].map(({ mode, Icon }) => (
              <button
                key={mode}
                type="button"
                onClick={() => setViewMode(mode)}
                className={`rounded-md p-1.5 transition-all ${viewMode === mode ? 'bg-white text-[var(--vs-ink)] shadow-sm' : 'text-[var(--vs-muted-3)] hover:text-[var(--vs-muted)]'}`}
              >
                <Icon className="h-4 w-4" />
              </button>
            ))}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => setIsManualModalOpen(true)} disabled={loading || unassignedCount === 0} className="gap-2 border-[var(--vs-line)]">
              <UserPlus className="h-4 w-4" /> Assign manual
            </Button>
            <Button
              onClick={handleAutoAssign}
              disabled={isAssigning || loading || unassignedCount === 0}
              className="gap-2 border-none bg-[var(--vs-brand)] text-white shadow-sm hover:bg-blue-700"
            >
              {isAssigning ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <Sparkles className="h-4 w-4" />}
              {isAssigning ? 'Menyimpan…' : 'Auto-assign'}
            </Button>
          </div>
        </div>
      )}
    >

      {/* Content */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-[var(--vs-brand)] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : staffList.length === 0 ? (
        <div className="text-center py-20 border border-dashed border-[var(--vs-line)] rounded-2xl bg-[var(--vs-bg)]">
          <Users className="w-8 h-8 text-[var(--vs-muted-3)] mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-[var(--vs-ink)]">Belum ada data staf</h3>
          <p className="text-xs text-[var(--vs-muted-2)] mt-1">Tambahkan staf di Supabase untuk mulai mendistribusikan tugas.</p>
        </div>
      ) : viewMode === 'grid' ? (
        <motion.div variants={stagger} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
          {staffList.map((staff) => {
            const wl = workload(staff.id);
            const overloaded = wl > 5;
            return (
              <motion.div key={staff.id} variants={fadeUp} className="vs-card p-6 hover:shadow-[var(--vs-shadow-sm)] transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-4 opacity-[0.04] group-hover:opacity-[0.07] transition-opacity">
                  <Users className="w-20 h-20" />
                </div>
                <div className="relative">
                  <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[var(--vs-brand)] to-blue-400 flex items-center justify-center text-white font-bold text-sm mb-4 shadow-sm uppercase">
                    {staff.full_name ? staff.full_name.substring(0, 2) : 'ST'}
                  </div>
                  <h3 className="text-[14px] font-bold text-[var(--vs-ink)] capitalize mb-0.5">{staff.full_name || 'Staff'}</h3>
                  <p className="text-[12px] text-[var(--vs-muted)] capitalize mb-5">{staff.role || 'Staff'}</p>
                  <div className="pt-4 border-t border-[var(--vs-line-soft)] flex items-end justify-between">
                    <div>
                      <p className="text-[11px] font-semibold text-[var(--vs-muted-3)] uppercase tracking-wider mb-1">Beban Kerja</p>
                      <div className="flex items-baseline gap-1.5">
                        <span className="text-2xl font-black text-[var(--vs-ink)]">{wl}</span>
                        <span className="text-[12px] text-[var(--vs-muted)]">Pelanggan</span>
                      </div>
                    </div>
                    <span className={`vs-tag ${overloaded ? 'vs-tag--medium' : 'vs-tag--low'}`}>
                      <Activity className="w-3 h-3" /> {overloaded ? 'Tinggi' : 'Normal'}
                    </span>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      ) : (
        <motion.div variants={fadeUp} className="vs-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--vs-bg)] border-b border-[var(--vs-line)]">
                  {['Nama Staf', 'Peran', 'Beban Kerja', 'Status Kapasitas'].map(h => (
                    <th key={h} className="px-6 py-3.5 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--vs-line-soft)]">
                {staffList.map((staff) => {
                  const wl = workload(staff.id);
                  const overloaded = wl > 5;
                  return (
                    <tr key={staff.id} className="hover:bg-[var(--vs-bg)] transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--vs-brand)] to-blue-400 flex items-center justify-center text-white text-[12px] font-bold uppercase shadow-sm">
                            {staff.full_name ? staff.full_name.substring(0, 2) : 'ST'}
                          </div>
                          <div className="text-[13px] font-semibold text-[var(--vs-ink)] group-hover:text-[var(--vs-brand)] transition-colors capitalize">
                            {staff.full_name || 'Staff'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[var(--vs-muted)] capitalize">{staff.role || 'Staff'}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[14px] font-bold text-[var(--vs-ink)]">{wl}</span>
                          <span className="text-[12px] text-[var(--vs-muted-2)]">Pelanggan</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`vs-tag ${overloaded ? 'vs-tag--medium' : 'vs-tag--low'}`}>
                          <Activity className="w-3 h-3" /> {overloaded ? 'Kapasitas Tinggi' : 'Kapasitas Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </motion.div>
      )}

      {/* Manual Assign Modal */}
      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="sm:max-w-[420px]">
          <DialogHeader>
            <DialogTitle>Assign Manual</DialogTitle>
            <DialogDescription>Pilih pelanggan dan tugaskan ke staf pilihan Anda.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleManualAssign} className="space-y-4 pt-2">
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wide">Pilih Pelanggan</label>
              <select required value={manualCustomer} onChange={e => setManualCustomer(e.target.value)}
                className="vs-input px-3 py-2.5">
                <option value="">-- Pilih pelanggan --</option>
                {unassigned().map(c => <option key={c.id} value={c.id}>{c.company_name} (Skor: {c.churn_score})</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wide">Pilih Staf</label>
              <select required value={manualStaff} onChange={e => setManualStaff(e.target.value)}
                className="vs-input px-3 py-2.5">
                <option value="">-- Pilih staf --</option>
                {staffList.map(s => <option key={s.id} value={s.id}>{s.full_name} ({workload(s.id)} Pelanggan)</option>)}
              </select>
            </div>
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsManualModalOpen(false)}>Batal</Button>
              <Button type="submit" disabled={isManualAssigning || !manualCustomer || !manualStaff}
                className="bg-[var(--vs-brand)] hover:bg-blue-700 text-white border-none">
                {isManualAssigning ? 'Menyimpan...' : 'Simpan Tugas'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </DashboardShell>
  );
}
