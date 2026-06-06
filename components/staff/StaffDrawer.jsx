'use client';

import { useLang } from '@/lib/i18n/LanguageContext';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Users, Activity, Search, CheckSquare, Square,
  UserMinus, UserPlus, Sparkles, ChevronRight, Shuffle, Trash2,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { addNotifikasi } from '@/lib/churnshield';

function riskDot(level) {
  if (level === 'Tinggi') return 'bg-red-500';
  if (level === 'Sedang') return 'bg-amber-500';
  return 'bg-emerald-500';
}
function riskText(level) {
  if (level === 'Tinggi') return 'text-red-600';
  if (level === 'Sedang') return 'text-amber-600';
  return 'text-emerald-600';
}

function sortByScoreLevel(customers) {
  const high   = customers.filter(c => (c.churn_score ?? 0) >= 70).sort((a, b) => b.churn_score - a.churn_score);
  const medium = customers.filter(c => (c.churn_score ?? 0) >= 30 && (c.churn_score ?? 0) < 70).sort((a, b) => b.churn_score - a.churn_score);
  const low    = customers.filter(c => (c.churn_score ?? 0) < 30).sort((a, b) => b.churn_score - a.churn_score);
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

// Distribusi round-robin dengan penghormatan max_load per-staff
async function distributeToStaff(customerList, targetStaff, currentLoads, adminName = '', tFn = (k) => k) {
  const loads = targetStaff.map(s => ({
    id: s.id,
    email: s.email,
    fullName: s.full_name,
    maxLoad: s.max_load ?? 10,   // ← per-staff limit
    count: currentLoads[s.id] ?? 0,
    customerIds: [],
    customerDetails: [],
  }));

  const sorted = sortByScoreLevel(customerList);
  let skipped = 0;

  for (const customer of sorted) {
    loads.sort((a, b) => a.count - b.count);
    if (loads[0].count >= loads[0].maxLoad) {
      skipped++;
      continue;
    }
    loads[0].customerIds.push(customer.id);
    loads[0].customerDetails.push(customer);
    loads[0].count += 1;
  }

  for (const s of loads) {
    if (!s.customerIds.length) continue;

    await supabase
      .from('customers')
      .update({ assigned_to: s.id })
      .in('id', s.customerIds);

    addNotifikasi({
      title: tFn('staffDrawer.notifTitle', { count: s.customerIds.length }),
      message: adminName
        ? tFn('staffDrawer.notifMsgAdmin', { adminName: adminName, count: s.customerIds.length })
        : tFn('staffDrawer.notifMsgSystem', { count: s.customerIds.length }),
      type: 'assign',
      recipient_id: s.id,
    }).catch(() => {});

    sendAssignEmail({
      email: s.email,
      staffName: s.fullName,
      customers: s.customerDetails,
      assignType: 'auto',
      adminName,
    });
  }

  return { assigned: sorted.length - skipped, skipped };
}

export default function StaffDrawer({
  open,
  staff,
  bulkTargets,
  customers,
  allStaff = [],
  onClose,
  onRefresh,
  toast,
  adminName = '',
}) {
  const { t, lang }                                 = useLang();
  const [mounted, setMounted]                       = useState(false);
  const [tab, setTab]                               = useState('assigned');
  const [search, setSearch]                         = useState('');
  const [selectedCustomers, setSelectedCustomers]   = useState([]);
  const [unassignMode, setUnassignMode]             = useState(false);
  const [selectedUnassign, setSelectedUnassign]     = useState([]);
  const [unassigning, setUnassigning]               = useState(false);
  const [saving, setSaving]                         = useState(false);
  const [autoAssigning, setAutoAssigning]           = useState(false);
  const [activeTargetId, setActiveTargetId]         = useState(null);
  const [riskFilterAssigned, setRiskFilterAssigned] = useState('All');
  const [sortByAssigned, setSortByAssigned]         = useState('churn_score');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setTab(bulkTargets?.length > 1 ? 'assign' : 'assigned');
      setSearch('');
      setSelectedCustomers([]);
      setUnassignMode(false);
      setSelectedUnassign([]);
      setActiveTargetId(bulkTargets?.[0]?.id ?? null);
      setRiskFilterAssigned('All');
      setSortByAssigned('churn_score');
    }
  }, [open, staff?.id, bulkTargets]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  if (!mounted || !staff) return null;

  const isBulk = bulkTargets && bulkTargets.length > 1;
  const targets = isBulk ? bulkTargets : [staff];

  // Limit dari data staff, bukan konstanta global
  const staffMaxLoad = staff.max_load ?? 10;

  const assignedCustomers  = customers.filter(c => c.assigned_to === staff.id);
  const unassignedCustomers = customers.filter(c => !c.assigned_to);
  const filteredUnassigned  = unassignedCustomers.filter(c =>
    (c.company_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.customer_id  ?? '').toLowerCase().includes(search.toLowerCase())
  );

  // Filter & Sort for "Ditugaskan" tab
  const normalizeRisk = (lvl) => {
    if (!lvl) return 'Low';
    const v = lvl.trim();
    if (v === 'Tinggi' || v === 'High')   return 'High';
    if (v === 'Sedang' || v === 'Medium') return 'Medium';
    return 'Low';
  };

  let filteredAssigned = assignedCustomers;
  if (riskFilterAssigned !== 'All') {
    filteredAssigned = filteredAssigned.filter(c => normalizeRisk(c.risk_level) === riskFilterAssigned);
  }

  // Sort
  if (sortByAssigned === 'churn_score') {
    filteredAssigned = [...filteredAssigned].sort((a, b) => (b.churn_score ?? 0) - (a.churn_score ?? 0));
  } else if (sortByAssigned === 'risk_level') {
    const riskOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
    filteredAssigned = [...filteredAssigned].sort((a, b) => {
      const aRisk = riskOrder[normalizeRisk(a.risk_level)] ?? 2;
      const bRisk = riskOrder[normalizeRisk(b.risk_level)] ?? 2;
      return aRisk - bRisk;
    });
  }

  const wl        = assignedCustomers.length;
  const overloaded = wl >= staffMaxLoad;
  const remaining  = Math.max(0, staffMaxLoad - wl);

  const currentLoads = Object.fromEntries(
    allStaff.map(s => [s.id, customers.filter(c => c.assigned_to === s.id).length])
  );

  // ── Toggles ──
  const toggleCustomer = (id) =>
    setSelectedCustomers(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAllFiltered = () => {
    const ids = filteredUnassigned.map(c => c.id);
    const allSel = ids.every(id => selectedCustomers.includes(id));
    setSelectedCustomers(prev => allSel ? prev.filter(x => !ids.includes(x)) : [...new Set([...prev, ...ids])]);
  };

  const toggleUnassign = (id) =>
    setSelectedUnassign(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAllUnassign = () => {
    const ids = filteredAssigned.map(c => c.id);
    const allSel = ids.every(id => selectedUnassign.includes(id));
    setSelectedUnassign(allSel ? [] : ids);
  };

  // ── Manual assign ──
  const handleManualAssign = async () => {
    if (!selectedCustomers.length) return;
    setSaving(true);
    try {
      const targetStaff   = isBulk ? targets.find(s => s.id === activeTargetId) : staff;
      const targetMaxLoad = targetStaff?.max_load ?? 10;
      const targetLoad    = currentLoads[targetStaff?.id] ?? 0;
      const canAssign     = Math.max(0, targetMaxLoad - targetLoad);

      if (canAssign <= 0) {
        toast(lang === 'en' ? `${targetStaff?.full_name} is full (max ${targetMaxLoad}).` : `${targetStaff?.full_name} sudah penuh (maks ${targetMaxLoad}).`, 'error');
        setSaving(false);
        return;
      }

      const selectedDetails = customers.filter(c => selectedCustomers.includes(c.id));
      const toAssign        = selectedDetails.slice(0, canAssign);
      const skippedCount    = selectedDetails.length - toAssign.length;

      await supabase
        .from('customers')
        .update({ assigned_to: targetStaff.id })
        .in('id', toAssign.map(c => c.id));

      addNotifikasi({
        title: t('staffDrawer.notifTitle', { count: toAssign.length }),
        message: adminName
          ? t('staffDrawer.notifMsgAdmin', { adminName, count: toAssign.length })
          : t('staffDrawer.notifMsgSystem', { count: toAssign.length }),
        type: 'assign',
        recipient_id: targetStaff.id,
      }).catch(() => {});

      sendAssignEmail({
        email: targetStaff?.email,
        staffName: targetStaff?.full_name,
        customers: toAssign,
        assignType: 'manual',
        adminName,
      });

      const msg = skippedCount > 0
        ? lang === 'en'
          ? `${toAssign.length} assigned. ${skippedCount} skipped (capacity full).`
          : `${toAssign.length} ditugaskan. ${skippedCount} dilewati (kapasitas penuh).`
        : lang === 'en'
          ? `${toAssign.length} customers assigned to ${targetStaff?.full_name}.`
          : `${toAssign.length} pelanggan ditugaskan ke ${targetStaff?.full_name}.`;
      toast(msg, 'success');
      setSelectedCustomers([]);
      if (!isBulk) setTab('assigned');
      onRefresh();
    } catch {
      toast(lang === 'en' ? 'Failed to save assignment.' : 'Gagal menyimpan tugas', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Auto-assign ──
  const handleAutoAssign = async () => {
    if (!unassignedCustomers.length) {
      toast(lang === 'en' ? 'No customers to assign.' : 'Tidak ada pelanggan yang perlu di-assign.', 'success');
      return;
    }
    setAutoAssigning(true);
    try {
      const { assigned, skipped } = await distributeToStaff(
        unassignedCustomers, targets, currentLoads, adminName, t
      );
      const msg = skipped > 0
        ? lang === 'en'
          ? `${assigned} customers assigned. ${skipped} skipped (all staff at capacity).`
          : `${assigned} pelanggan di-assign. ${skipped} dilewati karena semua staf sudah penuh.`
        : isBulk
          ? lang === 'en'
            ? `${assigned} customers distributed to ${targets.length} staff.`
            : `${assigned} pelanggan otomatis dibagi ke ${targets.length} staf.`
          : lang === 'en'
            ? `${assigned} customers assigned to ${staff.full_name}.`
            : `${assigned} pelanggan di-assign ke ${staff.full_name}.`;
      toast(msg, 'success');
      setTab('assigned');
      onRefresh();
    } catch {
      toast(lang === 'en' ? 'Auto-assign failed.' : 'Gagal auto-assign', 'error');
    } finally {
      setAutoAssigning(false);
    }
  };

  // ── Unassign ──
  const handleUnassignOne = async (customerId) => {
    try {
      await supabase.from('customers').update({ assigned_to: null }).eq('id', customerId);
      toast(lang === 'en' ? 'Customer unassigned.' : 'Pelanggan berhasil di-unassign.', 'success');
      onRefresh();
    } catch { toast(lang === 'en' ? 'Failed to unassign.' : 'Gagal unassign', 'error'); }
  };

  const handleUnassignBatch = async () => {
    if (!selectedUnassign.length) return;
    setUnassigning(true);
    try {
      await supabase.from('customers').update({ assigned_to: null }).in('id', selectedUnassign);
      toast(lang === 'en' ? `${selectedUnassign.length} customers unassigned.` : `${selectedUnassign.length} pelanggan berhasil di-unassign.`, 'success');
      setSelectedUnassign([]);
      setUnassignMode(false);
      onRefresh();
    } catch { toast(lang === 'en' ? 'Failed to unassign.' : 'Gagal unassign', 'error'); }
    finally { setUnassigning(false); }
  };

  const handleUnassignAll = async () => {
    if (!assignedCustomers.length) return;
    setUnassigning(true);
    try {
      await supabase.from('customers').update({ assigned_to: null }).in('id', assignedCustomers.map(c => c.id));
      toast(lang === 'en' ? `All ${assignedCustomers.length} customers unassigned.` : `Semua ${assignedCustomers.length} pelanggan berhasil di-unassign.`, 'success');
      setSelectedUnassign([]);
      setUnassignMode(false);
      onRefresh();
    } catch { toast(lang === 'en' ? 'Failed to unassign all.' : 'Gagal unassign semua', 'error'); }
    finally { setUnassigning(false); }
  };

  const allFilteredSelected  = filteredUnassigned.length > 0 && filteredUnassigned.every(c => selectedCustomers.includes(c.id));
  const allUnassignSelected  = filteredAssigned.length > 0 && filteredAssigned.every(c => selectedUnassign.includes(c.id));
  const activeTargetStaff    = isBulk ? targets.find(s => s.id === activeTargetId) : null;
  const activeTargetMaxLoad  = activeTargetStaff?.max_load ?? 10;
  const activeTargetLoad     = activeTargetId ? (currentLoads[activeTargetId] ?? 0) : 0;
  const activeTargetRemaining = Math.max(0, activeTargetMaxLoad - activeTargetLoad);

  const assignLabel = isBulk
    ? (activeTargetStaff
        ? lang === 'en' ? `Assign to ${activeTargetStaff.full_name.split(' ')[0]}` : `Assign ke ${activeTargetStaff.full_name.split(' ')[0]}`
        : lang === 'en' ? 'Select staff first ↑' : 'Pilih staf dulu ↑')
    : lang === 'en' ? `Assign to ${staff.full_name}` : `Assign ke ${staff.full_name}`;

  const autoAssignLabel = isBulk
    ? lang === 'en' ? `Auto Distribute (${unassignedCustomers.length})` : `Distribusi Otomatis (${unassignedCustomers.length})`
    : lang === 'en' ? `Auto-assign All (${unassignedCustomers.length})` : `Auto-assign Semua (${unassignedCustomers.length})`;

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end" style={{ pointerEvents: open ? 'auto' : 'none' }}>
      <motion.div
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
        initial={false} animate={{ opacity: open ? 1 : 0 }} transition={{ duration: 0.2 }}
        onClick={onClose}
      />
      <motion.aside
        className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-[0_0_40px_-12px_rgba(15,23,42,0.35)]"
        initial={{ x: '100%' }} animate={{ x: open ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 34, stiffness: 380 }}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isBulk ? (lang === 'en' ? `Assign to ${targets.length} Staff` : `Assign ke ${targets.length} Staf`) : (lang === 'en' ? 'Staff Detail' : 'Detail Staf')}
          </p>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Profile / Bulk header */}
        {isBulk ? (
          <div className="shrink-0 border-b border-slate-100 px-5 py-4">
            <p className="mb-1 text-[13px] font-bold text-slate-900">{lang === 'en' ? 'Assign to Staff' : 'Assign ke Staf'}</p>
            <p className="mb-3 text-[11px] text-slate-500">{lang === 'en' ? 'Select target staff, then check customers to assign.' : 'Pilih staf tujuan, lalu centang pelanggan untuk di-assign.'}</p>
            <div className="flex flex-wrap gap-2">
              {targets.map(s => {
                const isActive = activeTargetId === s.id;
                const load     = currentLoads[s.id] ?? 0;
                const maxLoad  = s.max_load ?? 10;
                const full     = load >= maxLoad;
                return (
                  <button key={s.id} type="button"
                    onClick={() => { setActiveTargetId(s.id); setSelectedCustomers([]); setSearch(''); }}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${
                      isActive ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : full ? 'border-slate-200 bg-slate-100 text-slate-400 cursor-not-allowed'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                    }`}>
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold uppercase ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                      {(s.full_name ?? 'ST').substring(0, 2)}
                    </div>
                    {s.full_name.split(' ')[0]}
                    <span className={`text-[10px] ${isActive ? 'text-blue-200' : full ? 'text-red-400' : 'text-slate-400'}`}>
                      {load}/{maxLoad}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="shrink-0 border-b border-slate-100 px-5 py-5">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 text-[15px] font-bold uppercase text-white shadow-md">
                {(staff.full_name ?? 'ST').substring(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="truncate text-[16px] font-bold capitalize text-slate-900">{staff.full_name ?? 'Staff'}</h2>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-[11px] font-semibold capitalize text-blue-700">
                    {staff.role ?? 'staff'}
                  </span>
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${overloaded ? 'bg-red-50 text-red-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    <Activity className="mr-1 inline h-3 w-3" />
                    {overloaded ? t('staffView.full') : t('staffView.normal')}
                  </span>
                  {staff.email && <span className="text-[11px] text-slate-400">{staff.email}</span>}
                </div>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>{t('staffView.workload')}</span>
                <span className={wl >= staffMaxLoad ? 'font-semibold text-red-500' : ''}>
                  {wl} / {staffMaxLoad} {t('staffView.capacity')}
                  {remaining > 0 && <span className="ml-1 text-emerald-600">({lang === 'en' ? 'remaining' : 'sisa'} {remaining})</span>}
                </span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{
                    width: `${Math.min(100, (wl / staffMaxLoad) * 100)}%`,
                    background: wl >= staffMaxLoad ? '#EF4444' : wl >= staffMaxLoad * 0.8 ? '#F59E0B' : '#3B82F6',
                  }} />
              </div>
            </div>
          </div>
        )}

        {/* Tabs */}
        {!isBulk && (
          <div className="flex shrink-0 border-b border-slate-100 px-5">
            {[
              { key: 'assigned', label: `${t('staffView.assigned')} (${wl})` },
              { key: 'assign',   label: `${t('staffView.assignCustomer')} ${unassignedCustomers.length > 0 ? ` · ${unassignedCustomers.length} ${t('staffView.unassigned')}` : ''}` },
            ].map(({ key, label }) => (
              <button key={key} type="button"
                onClick={() => { setTab(key); setUnassignMode(false); setSelectedUnassign([]); }}
                className={`relative py-3 pr-5 text-[12px] font-semibold transition-colors ${tab === key ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                {label}
                {tab === key && <span className="absolute bottom-0 left-0 right-4 h-0.5 rounded-full bg-blue-600" />}
              </button>
            ))}
          </div>
        )}

        {/* Scrollable content */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">

          {/* ── Tab: Ditugaskan ── */}
          {!isBulk && tab === 'assigned' && (
            <div className="flex h-full flex-col">
              {assignedCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-[13px] font-medium text-slate-400">{lang === 'en' ? 'No customers assigned yet' : 'Belum ada pelanggan ditugaskan'}</p>
                  <button type="button" onClick={() => setTab('assign')}
                    className="mt-3 text-[12px] font-semibold text-blue-600 hover:underline">
{lang === 'en' ? 'Assign now' : 'Assign sekarang'} <ChevronRight className="inline h-3 w-3" />
                  </button>
                </div>
              ) : (
                <>
                  {/* Toolbar */}
                  <div className="shrink-0 flex items-center justify-between border-b border-slate-100 px-5 py-3">
                    {unassignMode ? (
                      <>
                        <button type="button" onClick={toggleAllUnassign}
                          className="flex items-center gap-2 text-[12px] font-semibold text-slate-600 hover:text-red-600">
                          {allUnassignSelected ? <CheckSquare className="h-4 w-4 text-red-500" /> : <Square className="h-4 w-4" />}
{lang === 'en' ? 'Select All' : 'Pilih Semua'} ({assignedCustomers.length})
                        </button>
                        <div className="flex items-center gap-2">
                          {selectedUnassign.length > 0 && (
<span className="text-[11px] font-semibold text-red-600">{selectedUnassign.length} {lang === 'en' ? 'selected' : 'dipilih'}</span>
                          )}
                          <button type="button" onClick={() => { setUnassignMode(false); setSelectedUnassign([]); }}
                            className="rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-500 hover:bg-slate-50">
{lang === 'en' ? 'Cancel' : 'Batal'}
                          </button>
                        </div>
                      </>
                    ) : (
                      <>
                        <span className="text-[12px] text-slate-400">{wl} {lang === 'en' ? 'customers assigned' : 'pelanggan ditugaskan'}</span>
                        <button type="button" onClick={() => setUnassignMode(true)}
                          className="flex items-center gap-1.5 rounded-lg border border-slate-200 px-3 py-1.5 text-[11px] font-semibold text-slate-600 hover:border-red-200 hover:bg-red-50 hover:text-red-600 transition-colors">
                          <UserMinus className="h-3.5 w-3.5" /> Unassign
                        </button>
                      </>
                    )}
                  </div>

                  {/* Filter & Sort Bar */}
                  {!unassignMode && (
                    <div className="shrink-0 border-b border-slate-100 px-5 py-3 space-y-2">
                      {/* Risk Filter */}
                      <div className="flex items-center gap-2 flex-wrap">
<span className="text-[11px] font-semibold text-slate-400 uppercase">{lang === 'en' ? 'Risk:' : 'Risiko:'}</span>
{['All', 'High', 'Medium', 'Low'].map(risk => (
                          <button key={risk}
                            onClick={() => setRiskFilterAssigned(risk)}
                            className={`rounded-full px-3 py-1 text-[11px] font-semibold transition-all border ${
                              riskFilterAssigned === risk
                                ? 'bg-slate-900 text-white border-slate-900'
                                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400'
                            }`}>
{risk === 'High' ? '🔴' : risk === 'Medium' ? '🟡' : risk === 'Low' ? '🟢' : ''}
                            {risk === 'All' ? (lang === 'en' ? 'All' : 'Semua') : risk}
                          </button>
                        ))}
                      </div>

                      {/* Sort Dropdown */}
                      <div className="flex items-center gap-2">
<span className="text-[11px] font-semibold text-slate-400 uppercase">{lang === 'en' ? 'Sort:' : 'Urut:'}</span>
                        <select 
                          value={sortByAssigned}
                          onChange={(e) => setSortByAssigned(e.target.value)}
                          className="rounded-lg border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-600 hover:border-slate-400 cursor-pointer">
                          <option value="churn_score">Churn Score (↓)</option>
                          <option value="risk_level">Risk Level</option>
                        </select>
                      </div>

                      {/* Result count */}
                      <div className="text-[11px] text-slate-400">
{lang === 'en' ? `${filteredAssigned.length} of ${assignedCustomers.length} shown` : `${filteredAssigned.length} dari ${assignedCustomers.length} ditampilkan`}
                      </div>
                    </div>
                  )}

                  {/* List */}
                  <ul className="flex-1 divide-y divide-slate-50 overflow-y-auto px-3 py-2">
                    {filteredAssigned.map(c => (
                      <li key={c.id}
                        onClick={() => unassignMode && toggleUnassign(c.id)}
                        className={`flex items-center gap-3 rounded-xl px-2 py-3 transition-colors ${unassignMode ? 'cursor-pointer hover:bg-red-50/40' : ''} ${selectedUnassign.includes(c.id) ? 'bg-red-50/60' : ''}`}>
                        {unassignMode && (
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${selectedUnassign.includes(c.id) ? 'border-red-500 bg-red-500' : 'border-slate-300'}`}>
                            {selectedUnassign.includes(c.id) && <span className="text-[9px] font-bold text-white">✓</span>}
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[13px] font-semibold text-slate-800">{c.company_name}</p>
                          <p className="text-[11px] text-slate-400">{c.customer_id} · {c.plan_type}</p>
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          <span className={`h-2 w-2 rounded-full ${riskDot(c.risk_level)}`} />
                          <span className={`text-[12px] font-bold tabular-nums ${riskText(c.risk_level)}`}>{c.churn_score}%</span>
                        </div>
                        {!unassignMode && (
                          <button type="button" title="Unassign" onClick={() => handleUnassignOne(c.id)}
                            className="shrink-0 rounded-lg p-1.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-colors">
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>

                  {/* Unassign action bar */}
                  <AnimatePresence>
                    {unassignMode && (
                      <motion.div
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 12 }}
                        className="shrink-0 space-y-2 border-t border-slate-100 bg-white px-5 py-4"
                      >
                        {selectedUnassign.length > 0 && (
                          <button type="button" onClick={handleUnassignBatch} disabled={unassigning}
                            className="flex w-full items-center justify-center gap-2 rounded-xl bg-red-600 py-2.5 text-[13px] font-semibold text-white transition hover:bg-red-700 disabled:opacity-40">
                            {unassigning ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" /> : <UserMinus className="h-4 w-4" />}
{lang === 'en' ? `Unassign ${selectedUnassign.length} Selected` : `Unassign ${selectedUnassign.length} Pelanggan Terpilih`}
                          </button>
                        )}
                        <button type="button" onClick={handleUnassignAll} disabled={unassigning}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 py-2.5 text-[13px] font-semibold text-red-700 transition hover:bg-red-100 disabled:opacity-40">
                          {unassigning ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-red-400/30 border-t-red-500" /> : <Trash2 className="h-4 w-4" />}
{lang === 'en' ? `Unassign All (${filteredAssigned.length})` : `Unassign Semua (${filteredAssigned.length})`}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </>
              )}
            </div>
          )}

          {/* ── Tab: Assign Pelanggan ── */}
          {(isBulk || tab === 'assign') && (
            <div className="flex h-full flex-col">
              {unassignedCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckSquare className="mb-3 h-10 w-10 text-emerald-300" />
<p className="text-[13px] font-medium text-slate-400">{lang === 'en' ? 'All customers are assigned' : 'Semua pelanggan sudah di-assign'}</p>
                </div>
              ) : (
                <>
                  {/* Warning kapasitas penuh */}
                  {!isBulk && overloaded && (
                    <div className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                      <p className="text-[12px] font-semibold text-red-700">
{lang === 'en' ? `⚠️ ${staff.full_name} has reached max capacity (${staffMaxLoad}). Please unassign first.` : `⚠️ ${staff.full_name} sudah mencapai kapasitas maksimum (${staffMaxLoad}). Lakukan unassign terlebih dahulu.`}
                      </p>
                    </div>
                  )}
                  {isBulk && activeTargetId && activeTargetRemaining === 0 && (
                    <div className="mx-5 mt-3 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5">
                      <p className="text-[12px] font-semibold text-red-700">
{lang === 'en' ? `⚠️ This staff is full (${activeTargetMaxLoad}/${activeTargetMaxLoad}). Select another staff.` : `⚠️ Staf ini sudah penuh (${activeTargetMaxLoad}/${activeTargetMaxLoad}). Pilih staf lain.`}
                      </p>
                    </div>
                  )}

                  {/* Search + select all */}
                  <div className="space-y-2.5 border-b border-slate-100 px-5 py-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder={t('staffView.searchCustomer')} value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] outline-none focus:border-blue-400 focus:bg-white" />
                    </div>
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={toggleAllFiltered}
                        className="flex items-center gap-2 text-[12px] font-semibold text-slate-600 hover:text-blue-600">
                        {allFilteredSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
{lang === 'en' ? 'Select All' : 'Pilih Semua'} ({filteredUnassigned.length})
                      </button>
                      {selectedCustomers.length > 0 && (
                        <span className="text-[11px] font-semibold text-blue-600">
                          {selectedCustomers.length} {lang === 'en' ? 'selected' : 'dipilih'}
                          {!isBulk && remaining > 0 && (
                            <span className="ml-1 text-slate-400">({lang === 'en' ? `remaining capacity: ${remaining}` : `sisa kapasitas: ${remaining}`})</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* List pelanggan */}
                  <ul className="flex-1 divide-y divide-slate-50 overflow-y-auto px-3 py-2">
                    {filteredUnassigned.map(c => {
                      const checked = selectedCustomers.includes(c.id);
                      return (
                        <li key={c.id} onClick={() => toggleCustomer(c.id)}
                          className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-slate-50 ${checked ? 'bg-blue-50/50' : ''}`}>
                          <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                            {checked && <span className="text-[9px] font-bold text-white">✓</span>}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[13px] font-semibold text-slate-800">{c.company_name}</p>
                            <p className="text-[11px] text-slate-400">{c.customer_id} · {c.plan_type}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-1.5">
                            <span className={`h-2 w-2 rounded-full ${riskDot(c.risk_level)}`} />
                            <span className={`text-[12px] font-bold tabular-nums ${riskText(c.risk_level)}`}>{c.churn_score}%</span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {/* Action buttons */}
                  <div className="shrink-0 space-y-2 border-t border-slate-100 bg-white px-5 py-4">
                    <p className="text-center text-[11px] text-slate-400">
                      Auto-assign: <span className="text-red-500 font-semibold">🔴 {lang === 'en' ? 'High' : 'Tinggi'} (≥70)</span> →{' '}
                      <span className="text-amber-500 font-semibold">🟡 {lang === 'en' ? 'Medium' : 'Sedang'} (30–69)</span> →{' '}
                      <span className="text-emerald-500 font-semibold">🟢 {lang === 'en' ? 'Low' : 'Rendah'} (&lt;30)</span>
                      {!isBulk && <span className="ml-1 text-slate-400">· {lang === 'en' ? `max ${staffMaxLoad}/staff` : `maks ${staffMaxLoad}/staf`}</span>}
                    </p>

                    <button type="button" onClick={handleManualAssign}
                      disabled={!selectedCustomers.length || saving || (isBulk && !activeTargetId) || (!isBulk && overloaded)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-[13px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40">
                      {saving ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        : (isBulk ? <Shuffle className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />)}
                      {selectedCustomers.length > 0
                        ? `${isBulk ? (lang === 'en' ? 'Distribute' : 'Distribusikan') : 'Assign'} ${selectedCustomers.length} ${lang === 'en' ? 'Customers' : 'Pelanggan'}`
                        : assignLabel}
                    </button>

                    <button type="button" onClick={handleAutoAssign} disabled={autoAssigning}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40">
                      {autoAssigning ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-500" />
                        : <Sparkles className="h-4 w-4 text-amber-500" />}
                      {autoAssignLabel}
                    </button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </motion.aside>
    </div>,
    document.body
  );
}
