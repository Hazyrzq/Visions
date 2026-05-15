'use client';

import { useEffect, useState } from 'react';
import {
  Sparkles, Users, Briefcase, Activity, AlertCircle,
  UserPlus, X, CheckSquare, Square, Zap, ChevronRight,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { addNotifikasi } from '@/lib/churnshield';
import DashboardShell from '@/components/dashboard/DashboardShell';
import StaffDrawer from '@/components/staff/StaffDrawer';

// batch assign: groupkan per-staff lalu 1 query per staff (bukan 1 query per pelanggan)
async function batchAssign(unassignedList, targetStaff, currentLoads) {
  const loads = targetStaff.map((s) => ({
    id: s.id,
    count: currentLoads[s.id] ?? 0,
    customerIds: [],
  }));

  const sorted = [...unassignedList].sort((a, b) => b.churn_score - a.churn_score);
  for (const c of sorted) {
    loads.sort((a, b) => a.count - b.count);
    loads[0].customerIds.push(c.id);
    loads[0].count += 1;
  }

  for (const staff of loads) {
    if (!staff.customerIds.length) continue;
    await supabase
      .from('customers')
      .update({ assigned_to: staff.id })
      .in('id', staff.customerIds);

    addNotifikasi({
      title: `${staff.customerIds.length} pelanggan baru di-assign ke Anda`,
      message: `Admin menugaskan ${staff.customerIds.length} pelanggan kepada Anda via auto-assign. Segera tindak lanjuti.`,
      type: 'assign',
      recipient_id: staff.id,
    }).catch(() => {});
  }

  return sorted.length;
}

export default function AdminStaffPage() {
  const { toasts, toast, remove } = useToast();

  const [staffList, setStaffList]   = useState([]);
  const [customers, setCustomers]   = useState([]);
  const [loading, setLoading]       = useState(true);

  // drawer
  const [drawerStaff, setDrawerStaff]             = useState(null);
  const [drawerBulkTargets, setDrawerBulkTargets] = useState(null);
  const [drawerOpen, setDrawerOpen]               = useState(false);

  // multi-select
  const [selectedStaffIds, setSelectedStaffIds] = useState([]);

  // inline confirm banner state
  // mode: null | 'all' | 'bulk'
  const [confirmMode, setConfirmMode] = useState(null);
  const [assigning, setAssigning]     = useState(false);

  const fetchData = async () => {
    try {
      const { data: sd } = await supabase.from('profiles').select('*').eq('role', 'staff');
      const { data: cd } = await supabase.from('customers').select('*');
      if (sd) setStaffList(sd);
      if (cd) setCustomers(cd);
    } catch { toast('Gagal mengambil data', 'error'); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const workload = (id) => customers.filter(c => c.assigned_to === id).length;
  const unassigned = () => customers.filter(c => !c.assigned_to);
  const unassignedCount = unassigned().length;

  const toggleStaff = (id) =>
    setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const openDrawer = (staff, bulkTargets = null) => {
    setDrawerStaff(staff);
    setDrawerBulkTargets(bulkTargets);
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);

  const currentLoads = Object.fromEntries(staffList.map(s => [s.id, workload(s.id)]));

  const runAssign = async () => {
    if (!unassignedCount) { toast('Tidak ada pelanggan yang perlu di-assign.', 'success'); return; }
    setAssigning(true);
    try {
      const targets = confirmMode === 'bulk'
        ? staffList.filter(s => selectedStaffIds.includes(s.id))
        : staffList;

      const count = await batchAssign(unassigned(), targets, currentLoads);
      await fetchData();
      toast(`${count} pelanggan berhasil dibagikan ke ${targets.length} staf.`, 'success');
      if (confirmMode === 'bulk') setSelectedStaffIds([]);
    } catch { toast('Terjadi kesalahan', 'error'); }
    finally { setAssigning(false); setConfirmMode(null); }
  };

  const allSelected = staffList.length > 0 && selectedStaffIds.length === staffList.length;

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
          <Button
            onClick={() => setConfirmMode('all')}
            disabled={assigning || loading || unassignedCount === 0 || confirmMode !== null}
            className="gap-2 border-none bg-[var(--vs-brand)] text-white shadow-sm hover:bg-blue-700"
          >
            <Sparkles className="h-4 w-4" /> Auto-assign
          </Button>
        </div>
      )}
    >

      {/* ── Inline confirm banner ── */}
      <AnimatePresence>
        {confirmMode && (
          <motion.div
            key="confirm-banner"
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="mb-5 overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50"
          >
            <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-600 text-white">
                  <Zap className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[14px] font-bold text-slate-900">
                    {confirmMode === 'bulk'
                      ? `Auto-assign ke ${selectedStaffIds.length} staf terpilih`
                      : 'Auto-assign ke semua staf'}
                  </p>
                  <p className="mt-0.5 text-[12px] text-slate-500">
                    <span className="font-semibold text-blue-700">{unassignedCount} pelanggan</span>
                    {' '}akan didistribusikan otomatis berdasarkan{' '}
                    <span className="font-semibold">beban kerja paling sedikit</span>
                    {confirmMode === 'bulk'
                      ? ` ke ${selectedStaffIds.length} staf yang dipilih.`
                      : ` ke ${staffList.length} staf.`}
                  </p>
                  {/* preview distribusi */}
                  <div className="mt-2 flex flex-wrap gap-2">
                    {(confirmMode === 'bulk' ? staffList.filter(s => selectedStaffIds.includes(s.id)) : staffList)
                      .sort((a, b) => (currentLoads[a.id] ?? 0) - (currentLoads[b.id] ?? 0))
                      .slice(0, 5)
                      .map(s => (
                        <span key={s.id} className="inline-flex items-center gap-1 rounded-full bg-white border border-blue-100 px-2 py-0.5 text-[11px] font-semibold text-slate-700">
                          {s.full_name}
                          <span className="text-blue-500">{currentLoads[s.id] ?? 0}</span>
                        </span>
                      ))}
                  </div>
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmMode(null)}
                  disabled={assigning}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={runAssign}
                  disabled={assigning}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60"
                >
                  {assigning
                    ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Memproses…</>
                    : <><Sparkles className="h-4 w-4" /> Jalankan</>}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bulk action bar (multi-select) ── */}
      <AnimatePresence>
        {selectedStaffIds.length > 0 && !confirmMode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <CheckSquare className="h-4 w-4 text-blue-600" />
              <span className="text-[13px] font-semibold text-blue-800">
                {selectedStaffIds.length} staf dipilih
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setConfirmMode('bulk')}
                disabled={unassignedCount === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                <Sparkles className="h-3.5 w-3.5" />
                Auto-assign ke {selectedStaffIds.length} staf
              </button>
              <button
                type="button"
                onClick={() => {
                  const targets = staffList.filter(s => selectedStaffIds.includes(s.id));
                  if (targets.length) openDrawer(targets[0], targets);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-[12px] font-semibold text-blue-700 transition hover:border-blue-400"
              >
                <UserPlus className="h-3.5 w-3.5" /> Assign manual
              </button>
              <button
                type="button"
                onClick={() => setSelectedStaffIds([])}
                className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-100"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Content ── */}
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
      ) : (
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.05, ease:[0.16,1,0.3,1] }} className="vs-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--vs-bg)] border-b border-[var(--vs-line)]">
                  <th className="w-10 px-5 py-3.5 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedStaffIds(allSelected ? [] : staffList.map(s => s.id))}
                    >
                      {allSelected
                        ? <CheckSquare className="h-4 w-4 text-blue-600" />
                        : <Square className="h-4 w-4 text-slate-400" />}
                    </button>
                  </th>
                  {['Nama Staf', 'Peran', 'Beban Kerja', 'Status Kapasitas', ''].map((h, i) => (
                    <th key={i} className="px-6 py-3.5 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--vs-line-soft)]">
                {staffList.map((staff) => {
                  const wl = workload(staff.id);
                  const overloaded = wl > 5;
                  const selected = selectedStaffIds.includes(staff.id);
                  return (
                    <tr
                      key={staff.id}
                      onClick={() => openDrawer(staff)}
                      className={`cursor-pointer transition-colors group ${selected ? 'bg-blue-50/40' : 'hover:bg-[var(--vs-bg)]'}`}
                    >
                      <td
                        className="px-5 py-4 text-center"
                        onClick={(e) => { e.stopPropagation(); toggleStaff(staff.id); }}
                      >
                        <div className={`mx-auto flex h-4 w-4 items-center justify-center rounded border-2 transition-colors ${selected ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                          {selected && <span className="text-[9px] font-bold text-white">✓</span>}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[var(--vs-brand)] to-blue-400 flex items-center justify-center text-white text-[12px] font-bold uppercase shadow-sm">
                            {(staff.full_name ?? 'ST').substring(0, 2)}
                          </div>
                          <div className="text-[13px] font-semibold text-[var(--vs-ink)] group-hover:text-[var(--vs-brand)] transition-colors capitalize">
                            {staff.full_name ?? 'Staff'}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-[13px] text-[var(--vs-muted)] capitalize">{staff.role ?? 'Staff'}</td>
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
                      <td className="px-6 py-4 text-right">
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-400 group-hover:text-blue-600 transition-colors">
                          Detail <ChevronRight className="h-3.5 w-3.5" />
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

      <ToastContainer toasts={toasts} onRemove={remove} />

      <StaffDrawer
        open={drawerOpen}
        staff={drawerStaff}
        bulkTargets={drawerBulkTargets}
        customers={customers}
        allStaff={staffList}
        onClose={closeDrawer}
        onRefresh={fetchData}
        toast={toast}
      />
    </DashboardShell>
  );
}
