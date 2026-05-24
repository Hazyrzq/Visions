'use client';

import { useEffect, useState } from 'react';
import {
  Sparkles, Users, Briefcase, Activity, AlertCircle,
  UserPlus, X, CheckSquare, Square, ChevronRight, TrendingUp, Zap,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { addNotifikasi } from '@/lib/churnshield';
import DashboardShell from '@/components/dashboard/DashboardShell';
import MetricCard from '@/components/dashboard/MetricCard';
import StaffDrawer from '@/components/staff/StaffDrawer';
import { calculateStaffMetrics } from '@/lib/staffMetrics';

function sortByScoreLevel(list) {
  const high   = list.filter(c => (c.churn_score ?? 0) >= 70).sort((a, b) => b.churn_score - a.churn_score);
  const medium = list.filter(c => (c.churn_score ?? 0) >= 30 && (c.churn_score ?? 0) < 70).sort((a, b) => b.churn_score - a.churn_score);
  const low    = list.filter(c => (c.churn_score ?? 0) < 30).sort((a, b) => b.churn_score - a.churn_score);
  return [...high, ...medium, ...low];
}

async function sendAssignEmail({ email, staffName, customers, assignType, adminName }) {
  if (!email) return;
  try {
    await fetch('/api/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, staffName, count: customers.length, customers, assignType, adminName }),
    });
  } catch (err) {
    console.warn('[sendAssignEmail] gagal:', err.message);
  }
}

// Batch auto-assign — limit per-staff dari staff.max_load
async function batchAssign(unassignedList, targetStaff, currentLoads, adminName = '') {
  const loads = targetStaff.map(s => ({
    id: s.id,
    email: s.email,
    fullName: s.full_name,
    maxLoad: s.max_load ?? 10,   // ← per-staff limit
    count: currentLoads[s.id] ?? 0,
    customerIds: [],
    customerDetails: [],
  }));

  const sorted = sortByScoreLevel(unassignedList);
  let skipped = 0;

  for (const customer of sorted) {
    loads.sort((a, b) => a.count - b.count);
    if (loads[0].count >= loads[0].maxLoad) { skipped++; continue; }
    loads[0].customerIds.push(customer.id);
    loads[0].customerDetails.push(customer);
    loads[0].count += 1;
  }

  for (const staff of loads) {
    if (!staff.customerIds.length) continue;

    await supabase.from('customers').update({ assigned_to: staff.id }).in('id', staff.customerIds);

    addNotifikasi({
      title: `${staff.customerIds.length} pelanggan baru di-assign ke Anda`,
      message: `${adminName ? adminName + ' telah' : 'Admin'} menugaskan ${staff.customerIds.length} pelanggan kepada Anda via auto-assign.`,
      type: 'assign',
      recipient_id: staff.id,
    }).catch(() => {});

    sendAssignEmail({
      email: staff.email,
      staffName: staff.fullName,
      customers: staff.customerDetails,
      assignType: 'auto',
      adminName,
    });
  }

  return { assigned: sorted.length - skipped, skipped };
}

export default function AdminStaffPage() {
  const { toasts, toast, remove } = useToast();
  const { profile } = useAuth();
  const adminName = profile?.full_name ?? '';

  const [staffList, setStaffList] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading]     = useState(true);

  const [drawerStaff, setDrawerStaff]             = useState(null);
  const [drawerBulkTargets, setDrawerBulkTargets] = useState(null);
  const [drawerOpen, setDrawerOpen]               = useState(false);

  const [selectedStaffIds, setSelectedStaffIds] = useState([]);
  const [confirmMode, setConfirmMode]           = useState(null);
  const [assigning, setAssigning]               = useState(false);
  // Filter level untuk auto-assign: 'all' | 'High' | 'Medium' | 'Low'
  const [assignLevel, setAssignLevel]           = useState('all');

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

  const workload      = (id) => customers.filter(c => c.assigned_to === id).length;
  const unassigned    = ()   => customers.filter(c => !c.assigned_to);
  const unassignedCount = unassigned().length;

  // Calculate staff metrics
  const metrics = calculateStaffMetrics(staffList, customers);

  const toggleStaff = (id) =>
    setSelectedStaffIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const openDrawer = (staff, bulkTargets = null) => {
    setDrawerStaff(staff);
    setDrawerBulkTargets(bulkTargets);
    setDrawerOpen(true);
  };
  const closeDrawer = () => setDrawerOpen(false);

  const currentLoads = Object.fromEntries(staffList.map(s => [s.id, workload(s.id)]));

  // Total kapasitas tersisa di semua staf target
  const totalRemaining = (targets) =>
    targets.reduce((sum, s) => sum + Math.max(0, (s.max_load ?? 10) - (currentLoads[s.id] ?? 0)), 0);

  const runAssign = async () => {
    if (!unassignedCount) { toast('Tidak ada pelanggan yang perlu di-assign.', 'success'); return; }
    setAssigning(true);
    try {
      const targets = confirmMode === 'bulk'
        ? staffList.filter(s => selectedStaffIds.includes(s.id))
        : staffList;

      // Normalize risk_level dari DB (Tinggi/High, Sedang/Medium, Rendah/Low)
      const normRisk = (lvl) => {
        if (!lvl) return 'Low';
        if (lvl === 'Tinggi' || lvl === 'High')   return 'High';
        if (lvl === 'Sedang' || lvl === 'Medium') return 'Medium';
        return 'Low';
      };

      // Filter pelanggan berdasarkan level yang dipilih
      // Prioritaskan risk_level dari DB, fallback ke churn_score
      let toAssign = unassigned();
      if (assignLevel === 'High')
        toAssign = toAssign.filter(c => normRisk(c.risk_level) === 'High' || (!c.risk_level && c.churn_score >= 70));
      else if (assignLevel === 'Medium')
        toAssign = toAssign.filter(c => normRisk(c.risk_level) === 'Medium' || (!c.risk_level && c.churn_score >= 30 && c.churn_score < 70));
      else if (assignLevel === 'Low')
        toAssign = toAssign.filter(c => normRisk(c.risk_level) === 'Low' || (!c.risk_level && c.churn_score < 30));

      if (!toAssign.length) {
        toast(`Tidak ada pelanggan dengan risiko ${assignLevel} yang belum di-assign.`, 'success');
        setAssigning(false);
        setConfirmMode(null);
        return;
      }

      const { assigned, skipped } = await batchAssign(toAssign, targets, currentLoads, adminName);
      await fetchData();

      const levelLabel = assignLevel === 'all' ? '' : ` risiko ${assignLevel}`;
      const msg = skipped > 0
        ? `${assigned} pelanggan${levelLabel} dibagikan. ${skipped} dilewati (semua staf sudah penuh).`
        : `${assigned} pelanggan${levelLabel} berhasil dibagikan ke ${targets.length} staf.`;
      toast(msg, 'success');
      if (confirmMode === 'bulk') setSelectedStaffIds([]);
    } catch { toast('Terjadi kesalahan', 'error'); }
    finally { setAssigning(false); setConfirmMode(null); setAssignLevel('all'); }
  };

  const allSelected = staffList.length > 0 && selectedStaffIds.length === staffList.length;

  const confirmTargets = confirmMode === 'bulk'
    ? staffList.filter(s => selectedStaffIds.includes(s.id))
    : staffList;
  const confirmRemaining = totalRemaining(confirmTargets);

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
      {/* Metrics Cards */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.05 }}>
          <MetricCard
            title="Staff Aktif"
            value={metrics.totalActiveStaff}
            icon={Users}
            color="blue"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.12 }}>
          <MetricCard
            title="Pelanggan Assigned"
            value={metrics.totalAssignedCustomers}
            icon={Briefcase}
            color="indigo"
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.19 }}>
          <MetricCard
            title="Kapasitas Penuh"
            value={metrics.staffAtCapacity}
            subtitle={`dari ${metrics.totalActiveStaff} staff`}
            icon={AlertCircle}
            color={metrics.staffAtCapacity > 0 ? 'red' : 'emerald'}
          />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.26 }}>
          <MetricCard
            title="Avg. Beban Kerja"
            value={`${metrics.averageWorkload} / 10`}
            subtitle={metrics.highestWorkloadStaff ? `Max: ${metrics.highestWorkloadStaff.name}` : '—'}
            icon={TrendingUp}
            color="amber"
          />
        </motion.div>
      </div>

      {/* Confirm banner */}
      <AnimatePresence>
        {confirmMode && (
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }}
            className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-4 space-y-3"
          >
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[13px] font-bold text-blue-900">
                  {confirmMode === 'bulk'
                    ? `Bagikan pelanggan ke ${selectedStaffIds.length} staf terpilih?`
                    : `Bagikan pelanggan ke semua staf (${staffList.length})?`}
                </p>
                <p className="mt-0.5 text-[12px] text-blue-700">
                  Diurutkan Tinggi → Sedang → Rendah. Limit sesuai kapasitas masing-masing staf.
                  {confirmRemaining < unassignedCount && assignLevel === 'all' && (
                    <span className="ml-1 font-semibold text-amber-700">
                      ⚠️ Total kapasitas ({confirmRemaining}) kurang dari pelanggan unassigned ({unassignedCount}).
                    </span>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <button type="button" onClick={() => setConfirmMode(null)} disabled={assigning}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50">
                  Batal
                </button>
                <button type="button" onClick={runAssign} disabled={assigning}
                  className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-[13px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
                  {assigning
                    ? <><div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> Memproses…</>
                    : <><Sparkles className="h-4 w-4" /> Jalankan</>}
                </button>
              </div>
            </div>

            {/* Filter level risiko */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-semibold text-blue-700">Assign level:</span>
              {[
                { value: 'all',    label: 'Semua',            color: 'bg-blue-600 text-white',    inactive: 'border border-blue-200 bg-white text-blue-700 hover:bg-blue-100' },
                { value: 'High',   label: '🔴 High (≥70%)',   color: 'bg-red-500 text-white',     inactive: 'border border-red-200 bg-white text-red-600 hover:bg-red-50' },
                { value: 'Medium', label: '🟡 Medium (30–69%)', color: 'bg-amber-500 text-white',   inactive: 'border border-amber-200 bg-white text-amber-600 hover:bg-amber-50' },
                { value: 'Low',    label: '🟢 Low (<30%)',    color: 'bg-emerald-500 text-white', inactive: 'border border-emerald-200 bg-white text-emerald-700 hover:bg-emerald-50' },
              ].map(opt => (
                <button key={opt.value} type="button"
                  onClick={() => setAssignLevel(opt.value)}
                  className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all ${assignLevel === opt.value ? opt.color : opt.inactive}`}>
                  {opt.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedStaffIds.length > 0 && !confirmMode && (
          <motion.div
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
            className="mb-4 flex items-center justify-between gap-4 rounded-2xl border border-blue-200 bg-blue-50 px-5 py-3"
          >
            <div className="flex items-center gap-3">
              <CheckSquare className="h-4 w-4 text-blue-600" />
              <span className="text-[13px] font-semibold text-blue-800">{selectedStaffIds.length} staf dipilih</span>
            </div>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => setConfirmMode('bulk')} disabled={unassignedCount === 0}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-[12px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50">
                <Sparkles className="h-3.5 w-3.5" /> Auto-assign ke {selectedStaffIds.length} staf
              </button>
              <button type="button"
                onClick={() => {
                  const targets = staffList.filter(s => selectedStaffIds.includes(s.id));
                  if (targets.length) openDrawer(targets[0], targets);
                }}
                className="inline-flex items-center gap-2 rounded-xl border border-blue-200 bg-white px-4 py-2 text-[12px] font-semibold text-blue-700 transition hover:border-blue-400">
                <UserPlus className="h-3.5 w-3.5" /> Assign manual
              </button>
              <button type="button" onClick={() => setSelectedStaffIds([])}
                className="rounded-lg p-1.5 text-blue-400 hover:bg-blue-100">
                <X className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Tabel staf */}
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
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.05 }} className="vs-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--vs-bg)] border-b border-[var(--vs-line)]">
                  <th className="w-10 px-5 py-3.5 text-center">
                    <button type="button" onClick={() => setSelectedStaffIds(allSelected ? [] : staffList.map(s => s.id))}>
                      {allSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4 text-slate-400" />}
                    </button>
                  </th>
                  {['Nama Staf', 'Peran', 'Beban Kerja', 'Status', ''].map((h, i) => (
                    <th key={i} className="px-6 py-3.5 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--vs-line-soft)]">
                {staffList.map((staff) => {
                  const wl      = workload(staff.id);
                  const maxLoad = staff.max_load ?? 10;
                  const full    = wl >= maxLoad;
                  const nearFull = wl >= maxLoad * 0.8;
                  const selected = selectedStaffIds.includes(staff.id);
                  const pct     = Math.min(100, (wl / maxLoad) * 100);
                  const barColor = full ? '#EF4444' : nearFull ? '#F59E0B' : '#3B82F6';
                  return (
                    <tr key={staff.id} onClick={() => openDrawer(staff)}
                      className={`cursor-pointer transition-colors group ${selected ? 'bg-blue-50/40' : 'hover:bg-[var(--vs-bg)]'}`}>
                      <td className="px-5 py-4 text-center"
                        onClick={(e) => { e.stopPropagation(); toggleStaff(staff.id); }}>
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
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className={`text-[12px] font-bold tabular-nums ${full ? 'text-red-500' : 'text-[var(--vs-ink)]'}`}>
                            {wl}<span className="font-normal text-[var(--vs-muted-2)]">/{maxLoad}</span>
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`vs-tag ${full ? 'vs-tag--high' : nearFull ? 'vs-tag--medium' : 'vs-tag--low'}`}>
                          <Activity className="w-3 h-3" />
                          {full ? 'Penuh' : nearFull ? 'Hampir Penuh' : 'Normal'}
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
        adminName={adminName}
      />
    </DashboardShell>
  );
}
