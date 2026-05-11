'use client';

import { useEffect, useState } from 'react';
import { Sparkles, Users, Briefcase, Activity, AlertCircle, LayoutGrid, List, UserPlus } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { useConfirm } from '@/components/ui/ConfirmProvider';

export default function AdminStaffPage() {
  const { toasts, toast, remove } = useToast();
  const confirm = useConfirm();
  
  const [staffList, setStaffList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAssigning, setIsAssigning] = useState(false);
  const [viewMode, setViewMode] = useState('list');

  const [isManualModalOpen, setIsManualModalOpen] = useState(false);
  const [manualCustomer, setManualCustomer] = useState('');
  const [manualStaff, setManualStaff] = useState('');
  const [isManualAssigning, setIsManualAssigning] = useState(false);

  const fetchData = async () => {
    try {
      const { data: staffData, error: staffError } = await supabase
        .from('profiles')
        .select('*');

      const { data: custData, error: custError } = await supabase
        .from('customers')
        .select('*');

      if (staffData) setStaffList(staffData);
      if (custData) setCustomers(custData);
    } catch (err) {
      console.error(err);
      toast('Gagal mengambil data dari database', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getStaffWorkload = (staffId) => {
    return customers.filter(c => c.assigned_to === staffId || c.staff_id === staffId).length;
  };

  const getUnassignedCustomers = () => {
    return customers.filter(c => !c.assigned_to && !c.staff_id);
  };

  const unassignedCount = getUnassignedCustomers().length;

  const handleAutoAssign = async () => {
    if (unassignedCount === 0) {
      toast('Semua pelanggan sudah memiliki staf penanggung jawab.', 'success');
      return;
    }

    if (staffList.length === 0) {
      toast('Tidak ada data staf untuk ditugaskan.', 'error');
      return;
    }

    const isConfirmed = await confirm({
      title: 'Auto-Assign Pelanggan',
      message: `Terdapat ${unassignedCount} pelanggan tanpa staf. Sistem akan membagikan mereka secara merata kepada staf dengan beban kerja terendah. Lanjutkan?`,
      confirmText: 'Jalankan Auto-Assign',
      cancelText: 'Batal',
      variant: 'default'
    });

    if (!isConfirmed) return;

    setIsAssigning(true);

    try {
      let unassignedCusts = getUnassignedCustomers();
      unassignedCusts.sort((a, b) => b.churn_score - a.churn_score);

      const staffWorkloads = staffList.map(s => ({
        id: s.id,
        count: getStaffWorkload(s.id)
      }));

      const updates = [];

      unassignedCusts.forEach(cust => {
        staffWorkloads.sort((a, b) => a.count - b.count);
        const chosenStaff = staffWorkloads[0];
        updates.push({ customerId: cust.id, staffId: chosenStaff.id });
        chosenStaff.count += 1; 
      });

      for (const update of updates) {
        await supabase
          .from('customers')
          .update({ assigned_to: update.staffId, staff_id: update.staffId })
          .eq('id', update.customerId);
      }

      await fetchData();
      toast(`Berhasil membagikan ${unassignedCount} pelanggan secara otomatis!`, 'success');
    } catch (error) {
      console.error(error);
      toast('Terjadi kesalahan saat membagikan tugas', 'error');
    } finally {
      setIsAssigning(false);
    }
  };

  const handleManualAssign = async (e) => {
    e.preventDefault();
    if (!manualCustomer || !manualStaff) return;

    setIsManualAssigning(true);
    try {
      await supabase
        .from('customers')
        .update({ assigned_to: manualStaff, staff_id: manualStaff })
        .eq('id', manualCustomer);

      await fetchData();
      toast('Pelanggan berhasil ditugaskan secara manual!', 'success');
      setIsManualModalOpen(false);
      setManualCustomer('');
      setManualStaff('');
    } catch (error) {
      console.error(error);
      toast('Gagal menugaskan pelanggan', 'error');
    } finally {
      setIsManualAssigning(false);
    }
  };

  return (
    <div className="vs-root">
      <style jsx global>{`
        .vs-root {
          --bg:        #FAFAFA;
          --bg-2:      #F4F4F5;
          --surface:   #FFFFFF;
          --ink:       #0A0A0A;
          --muted:     #52525B;
          --muted-2:   #71717A;
          --muted-3:   #A1A1AA;
          --line:      #E4E4E7;
          --line-2:    #EAEAEC;
          --line-soft: #F0F0F2;
          --brand:     #4F46E5;
          font-family: 'Geist', 'Inter', -apple-system, sans-serif;
        }
      `}</style>

      <div className="w-full px-8 space-y-6 pb-12">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center">
                <Briefcase className="w-4 h-4 text-[var(--ink)]" />
              </div>
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">Distribusi Tugas Staf</h1>
            </div>
            <p className="text-[14px] text-[var(--muted)] ml-11">Pantau beban kerja staf dan bagikan pelanggan berisiko dengan AI.</p>
          </div>
          
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-amber-50 border border-amber-100 rounded-lg">
              <AlertCircle className="w-4 h-4 text-amber-600"/>
              <span className="text-[12px] font-semibold text-amber-700">{unassignedCount} Pelanggan Menganggur</span>
            </div>

            <div className="flex items-center p-1 bg-[var(--bg-2)] rounded-lg border border-[var(--line)] ml-2 mr-2">
              <button 
                onClick={() => setViewMode('grid')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow-sm text-[var(--ink)]' : 'text-[var(--muted-3)] hover:text-[var(--muted)]'}`}
                title="Tampilan Grid"
              >
                <LayoutGrid className="w-4 h-4"/>
              </button>
              <button 
                onClick={() => setViewMode('list')} 
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow-sm text-[var(--ink)]' : 'text-[var(--muted-3)] hover:text-[var(--muted)]'}`}
                title="Tampilan List"
              >
                <List className="w-4 h-4"/>
              </button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="outline"
                onClick={() => setIsManualModalOpen(true)}
                disabled={loading || unassignedCount === 0}
                className="gap-2 bg-white hover:bg-gray-50 border-gray-200 text-gray-700 shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                Assign Manual
              </Button>
              <Button 
                onClick={handleAutoAssign}
                disabled={isAssigning || loading || unassignedCount === 0}
                className="gap-2 bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-all active:scale-95 border-none"
              >
                {isAssigning ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4" />
                )}
                {isAssigning ? 'Menyimpan...' : 'Auto-Assign'}
              </Button>
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-8 h-8 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : staffList.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-gray-300 rounded-2xl bg-[var(--bg)]">
            <Users className="w-8 h-8 text-[var(--muted-3)] mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-[var(--ink)]">Belum ada data staf</h3>
            <p className="text-xs text-[var(--muted)] mt-1">Tambahkan staf di database Supabase untuk mulai mendistribusikan tugas.</p>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
            {staffList.map((staff) => {
              const workload = getStaffWorkload(staff.id);
              const isOverloaded = workload > 5;
              
              return (
                <Card key={staff.id} className="p-6 border-[var(--line)] shadow-sm hover:shadow-md transition-all relative overflow-hidden group bg-[var(--surface)]">
                  <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                    <Users className="w-24 h-24" />
                  </div>
                  
                  <div className="relative z-10">
                    <div className="w-12 h-12 rounded-full bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center text-[var(--muted)] font-bold text-lg mb-4 shadow-sm uppercase">
                      {staff.full_name ? staff.full_name.substring(0, 2) : 'ST'}
                    </div>
                    
                    <h3 className="text-[15px] font-bold text-[var(--ink)] leading-tight mb-1 capitalize">{staff.full_name || 'Staff Tanpa Nama'}</h3>
                    <p className="text-[12px] font-medium text-[var(--muted)] mb-6 capitalize">{staff.role || 'Staff Tim Visions'}</p>
                    
                    <div className="pt-4 border-t border-[var(--line-soft)] flex items-end justify-between">
                      <div>
                        <p className="text-[11px] font-bold text-[var(--muted-3)] uppercase tracking-wider mb-1">Beban Kerja</p>
                        <div className="flex items-center gap-2">
                          <span className="text-2xl font-black text-[var(--ink)]">{workload}</span>
                          <span className="text-[12px] text-[var(--muted)]">Pelanggan</span>
                        </div>
                      </div>
                      
                      <div className={`px-2.5 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 border ${
                        isOverloaded ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                      }`}>
                        <Activity className="w-3 h-3" />
                        {isOverloaded ? 'Tinggi' : 'Normal'}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="p-0 border border-gray-200 shadow-sm overflow-hidden bg-white w-full rounded-xl">
            <div className="w-full overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[35%]">Nama Staf</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider w-[25%]">Peran (Role)</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-center w-[20%]">Beban Kerja</th>
                    <th className="px-6 py-4 text-[11px] font-semibold text-gray-500 uppercase tracking-wider text-right w-[20%]">Status Kapasitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staffList.map((staff) => {
                    const workload = getStaffWorkload(staff.id);
                    const isOverloaded = workload > 5;
                    
                    return (
                      <tr key={staff.id} className="hover:bg-gray-50/50 transition-colors group">
                        <td className="px-6 py-4 truncate">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 shrink-0 rounded-full bg-gray-100 border border-gray-200 flex items-center justify-center text-[12px] font-bold text-gray-500 uppercase shadow-sm">
                              {staff.full_name ? staff.full_name.substring(0, 2) : 'ST'}
                            </div>
                            <div className="text-[13px] font-semibold text-gray-900 group-hover:text-indigo-600 transition-colors capitalize truncate">
                              {staff.full_name || 'Staff Tanpa Nama'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-[13px] text-gray-500 capitalize truncate">
                          {staff.role || 'Staff Tim Visions'}
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <span className="text-[14px] font-bold text-gray-900">{workload}</span>
                            <span className="text-[12px] text-gray-400">Pelanggan</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className={`inline-flex px-3 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider items-center gap-1.5 border ${
                            isOverloaded ? 'bg-amber-50 text-amber-600 border-amber-100' : 'bg-emerald-50 text-emerald-600 border-emerald-100'
                          }`}>
                            <Activity className="w-3.5 h-3.5 shrink-0" />
                            {isOverloaded ? 'Kapasitas Tinggi' : 'Kapasitas Normal'}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </div>

      <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
        <DialogContent className="sm:max-w-[425px] bg-white rounded-xl border border-gray-200 shadow-2xl p-0 overflow-hidden">
          <div className="p-6 pb-4 border-b border-gray-100">
            <DialogTitle className="text-[18px] font-bold text-gray-900 tracking-tight">Assign Manual</DialogTitle>
            <DialogDescription className="text-[13px] text-gray-500 mt-1.5">
              Pilih satu pelanggan yang menganggur dan tugaskan secara spesifik kepada staf pilihan Anda.
            </DialogDescription>
          </div>
          
          <form onSubmit={handleManualAssign} className="p-6 space-y-5">
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Pilih Pelanggan</label>
              <select
                required
                value={manualCustomer}
                onChange={(e) => setManualCustomer(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                <option value="">-- Klik untuk memilih pelanggan --</option>
                {getUnassignedCustomers().map(c => (
                  <option key={c.id} value={c.id}>
                    {c.company_name} (Skor Churn: {c.churn_score})
                  </option>
                ))}
              </select>
            </div>
            
            <div className="space-y-2">
              <label className="text-[12px] font-semibold text-gray-500 uppercase tracking-wider">Pilih Staf</label>
              <select
                required
                value={manualStaff}
                onChange={(e) => setManualStaff(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-lg p-3 text-[13px] text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
              >
                <option value="">-- Klik untuk memilih staf --</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.full_name} ({getStaffWorkload(s.id)} Pelanggan)
                  </option>
                ))}
              </select>
            </div>
            
            <DialogFooter className="pt-2">
              <Button type="button" variant="ghost" onClick={() => setIsManualModalOpen(false)} className="text-gray-600 hover:bg-gray-100">
                Batal
              </Button>
              <Button type="submit" disabled={isManualAssigning || !manualCustomer || !manualStaff} className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {isManualAssigning ? 'Menyimpan...' : 'Simpan Tugas'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}