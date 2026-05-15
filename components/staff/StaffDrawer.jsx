'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';
import {
  X, Users, Activity, Search, CheckSquare, Square,
  UserMinus, UserPlus, Sparkles, ChevronRight, Shuffle,
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

// distribusi round-robin berdasarkan beban kerja paling sedikit
async function distributeToStaff(customerIds, targetStaff, currentLoads) {
  const loads = targetStaff.map(s => ({
    id: s.id,
    count: currentLoads[s.id] ?? 0,
    assigned: [],
  }));

  for (const cId of customerIds) {
    loads.sort((a, b) => a.count - b.count);
    loads[0].assigned.push(cId);
    loads[0].count += 1;
  }

  // batch per staff (1 query per staff, bukan per pelanggan)
  for (const s of loads) {
    if (!s.assigned.length) continue;
    await supabase
      .from('customers')
      .update({ assigned_to: s.id })
      .in('id', s.assigned);

    // notifikasi ke staff yang bersangkutan
    addNotifikasi({
      title: `${s.assigned.length} pelanggan baru di-assign ke Anda`,
      message: `Admin menugaskan ${s.assigned.length} pelanggan kepada Anda. Segera tindak lanjuti.`,
      type: 'assign',
      recipient_id: s.id,
    }).catch(() => {});
  }
}

export default function StaffDrawer({
  open,
  staff,          // staff yang dibuka drawer-nya (single)
  bulkTargets,    // array staff saat bulk assign (opsional)
  customers,
  allStaff = [],
  onClose,
  onRefresh,
  toast,
}) {
  const [mounted, setMounted]               = useState(false);
  const [tab, setTab]                       = useState('assigned');
  const [search, setSearch]                 = useState('');
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [saving, setSaving]                 = useState(false);
  const [autoAssigning, setAutoAssigning]   = useState(false);
  const [activeTargetId, setActiveTargetId] = useState(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setTab(bulkTargets?.length > 1 ? 'assign' : 'assigned');
      setSearch('');
      setSelectedCustomers([]);
      setActiveTargetId(bulkTargets?.[0]?.id ?? null);
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

  // apakah mode bulk (multiple staff terpilih)?
  const isBulk = bulkTargets && bulkTargets.length > 1;
  const targets = isBulk ? bulkTargets : [staff];

  const assignedCustomers = customers.filter(
    c => c.assigned_to === staff.id
  );
  const unassignedCustomers = customers.filter(
    c => !c.assigned_to
  );
  const filteredUnassigned = unassignedCustomers.filter(c =>
    (c.company_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.customer_id ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const wl = assignedCustomers.length;
  const overloaded = wl > 5;

  const currentLoads = Object.fromEntries(
    allStaff.map(s => [s.id, customers.filter(c => c.assigned_to === s.id).length])
  );

  const toggleCustomer = (id) =>
    setSelectedCustomers(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );

  const toggleAllFiltered = () => {
    const ids = filteredUnassigned.map(c => c.id);
    const allSel = ids.every(id => selectedCustomers.includes(id));
    setSelectedCustomers(prev =>
      allSel ? prev.filter(x => !ids.includes(x)) : [...new Set([...prev, ...ids])]
    );
  };

  // ── Manual assign ──
  const handleManualAssign = async () => {
    if (!selectedCustomers.length) return;
    setSaving(true);
    try {
      if (isBulk && activeTargetId) {
        // assign spesifik ke staff yang dipilih
        await supabase.from('customers').update({ assigned_to: activeTargetId }).in('id', selectedCustomers);
        const targetStaff = targets.find(s => s.id === activeTargetId);
        addNotifikasi({
          title: `${selectedCustomers.length} pelanggan baru di-assign ke Anda`,
          message: `Admin menugaskan ${selectedCustomers.length} pelanggan kepada Anda. Segera tindak lanjuti.`,
          type: 'assign',
          recipient_id: activeTargetId,
        }).catch(() => {});
        toast(`${selectedCustomers.length} pelanggan ditugaskan ke ${targetStaff?.full_name}.`, 'success');
      } else {
        await distributeToStaff(selectedCustomers, targets, currentLoads);
        toast(`${selectedCustomers.length} pelanggan ditugaskan ke ${staff.full_name}.`, 'success');
      }
      setSelectedCustomers([]);
      if (!isBulk) setTab('assigned');
      onRefresh();
    } catch {
      toast('Gagal menyimpan tugas', 'error');
    } finally {
      setSaving(false);
    }
  };

  // ── Auto-assign semua unassigned ke targets (round-robin) ──
  const handleAutoAssign = async () => {
    if (!unassignedCustomers.length) {
      toast('Tidak ada pelanggan yang perlu di-assign.', 'success');
      return;
    }
    setAutoAssigning(true);
    try {
      const sorted = [...unassignedCustomers]
        .sort((a, b) => b.churn_score - a.churn_score)
        .map(c => c.id);
      await distributeToStaff(sorted, targets, currentLoads);
      const msg = isBulk
        ? `${sorted.length} pelanggan otomatis dibagi ke ${targets.length} staf.`
        : `${sorted.length} pelanggan di-assign ke ${staff.full_name}.`;
      toast(msg, 'success');
      setTab('assigned');
      onRefresh();
    } catch {
      toast('Gagal auto-assign', 'error');
    } finally {
      setAutoAssigning(false);
    }
  };

  const handleUnassign = async (customerId) => {
    try {
      await supabase.from('customers').update({ assigned_to: null }).eq('id', customerId);
      toast('Pelanggan berhasil di-unassign.', 'success');
      onRefresh();
    } catch { toast('Gagal unassign', 'error'); }
  };

  const allFilteredSelected =
    filteredUnassigned.length > 0 &&
    filteredUnassigned.every(c => selectedCustomers.includes(c.id));

  const activeTargetStaff = isBulk ? targets.find(s => s.id === activeTargetId) : null;

  // label tombol assign
  const assignLabel = isBulk
    ? (activeTargetStaff ? `Assign ke ${activeTargetStaff.full_name.split(' ')[0]}` : 'Pilih staf dulu ↑')
    : `Assign ke ${staff.full_name}`;

  const autoAssignLabel = isBulk
    ? `Distribusi Otomatis (${unassignedCustomers.length})`
    : `Auto-assign Semua (${unassignedCustomers.length})`;

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex justify-end"
      style={{ pointerEvents: open ? 'auto' : 'none' }}
    >
      {/* backdrop */}
      <motion.div
        className="absolute inset-0 bg-slate-950/30 backdrop-blur-[2px]"
        initial={false}
        animate={{ opacity: open ? 1 : 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
      />

      {/* panel */}
      <motion.aside
        className="relative flex h-full w-full max-w-xl flex-col border-l border-slate-200 bg-white shadow-[0_0_40px_-12px_rgba(15,23,42,0.35)]"
        initial={{ x: '100%' }}
        animate={{ x: open ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 34, stiffness: 380 }}
      >
        {/* ── Header ── */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isBulk ? `Assign ke ${targets.length} Staf` : 'Detail Staf'}
          </p>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* ── Profile / Bulk header ── */}
        {isBulk ? (
          // bulk mode: staff pills yang bisa diklik untuk pilih target
          <div className="shrink-0 border-b border-slate-100 px-5 py-4">
            <p className="mb-1 text-[13px] font-bold text-slate-900">Assign ke Staf</p>
            <p className="mb-3 text-[11px] text-slate-500">Pilih staf tujuan, lalu centang pelanggan untuk di-assign ke staf tersebut.</p>
            <div className="flex flex-wrap gap-2">
              {targets.map(s => {
                const isActive = activeTargetId === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => { setActiveTargetId(s.id); setSelectedCustomers([]); setSearch(''); }}
                    className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[12px] font-semibold transition-all ${
                      isActive
                        ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                        : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                    }`}
                  >
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full text-[8px] font-bold uppercase ${isActive ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-700'}`}>
                      {(s.full_name ?? 'ST').substring(0, 2)}
                    </div>
                    {s.full_name.split(' ')[0]}
                    <span className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>{currentLoads[s.id] ?? 0}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          // single mode: profil staf
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
                  <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${overloaded ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'}`}>
                    <Activity className="mr-1 inline h-3 w-3" />
                    {overloaded ? 'Kapasitas Tinggi' : 'Kapasitas Normal'}
                  </span>
                </div>
              </div>
              <div className="shrink-0 text-right">
                <p className="text-2xl font-black text-slate-900">{wl}</p>
                <p className="text-[11px] text-slate-400">Pelanggan</p>
              </div>
            </div>
            <div className="mt-4">
              <div className="mb-1 flex justify-between text-[11px] text-slate-400">
                <span>Beban kerja</span><span>{wl} / 10 kapasitas</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div className="h-full rounded-full transition-all duration-700"
                  style={{ width: `${Math.min(100, (wl / 10) * 100)}%`, background: overloaded ? '#F59E0B' : '#3B82F6' }} />
              </div>
            </div>
          </div>
        )}

        {/* ── Tabs (hanya untuk single mode) ── */}
        {!isBulk && (
          <div className="flex shrink-0 border-b border-slate-100 px-5">
            {[
              { key: 'assigned', label: `Ditugaskan (${wl})` },
              { key: 'assign', label: `Assign Pelanggan${unassignedCustomers.length > 0 ? ` · ${unassignedCustomers.length} belum` : ''}` },
            ].map(({ key, label }) => (
              <button key={key} type="button" onClick={() => setTab(key)}
                className={`relative py-3 pr-5 text-[12px] font-semibold transition-colors ${tab === key ? 'text-blue-600' : 'text-slate-500 hover:text-slate-700'}`}>
                {label}
                {tab === key && <span className="absolute bottom-0 left-0 right-4 h-0.5 rounded-full bg-blue-600" />}
              </button>
            ))}
          </div>
        )}

        {/* ── Scrollable content ── */}
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">

          {/* Tab: Ditugaskan (single mode only) */}
          {!isBulk && tab === 'assigned' && (
            <div className="p-5">
              {assignedCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Users className="mb-3 h-10 w-10 text-slate-200" />
                  <p className="text-[13px] font-medium text-slate-400">Belum ada pelanggan ditugaskan</p>
                  <button type="button" onClick={() => setTab('assign')}
                    className="mt-3 text-[12px] font-semibold text-blue-600 hover:underline">
                    Assign sekarang <ChevronRight className="inline h-3 w-3" />
                  </button>
                </div>
              ) : (
                <ul className="space-y-2">
                  {assignedCustomers.map(c => (
                    <li key={c.id} className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50/60 p-3">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-800">{c.company_name}</p>
                        <p className="text-[11px] text-slate-400">{c.customer_id} · {c.plan_type}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-2">
                        <span className={`h-2 w-2 rounded-full ${riskDot(c.risk_level)}`} />
                        <span className={`text-[12px] font-bold tabular-nums ${riskText(c.risk_level)}`}>{c.churn_score}%</span>
                      </div>
                      <button type="button" title="Unassign" onClick={() => handleUnassign(c.id)}
                        className="shrink-0 rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-500">
                        <UserMinus className="h-4 w-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {/* Tab: Assign Pelanggan (single & bulk) */}
          {(isBulk || tab === 'assign') && (
            <div className="flex h-full flex-col">
              {unassignedCustomers.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <CheckSquare className="mb-3 h-10 w-10 text-emerald-300" />
                  <p className="text-[13px] font-medium text-slate-400">Semua pelanggan sudah di-assign</p>
                </div>
              ) : (
                <>
                  {/* search + select all */}
                  <div className="space-y-2.5 border-b border-slate-100 px-5 py-3">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input type="text" placeholder="Cari pelanggan…" value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] outline-none focus:border-blue-400 focus:bg-white" />
                    </div>
                    <div className="flex items-center justify-between">
                      <button type="button" onClick={toggleAllFiltered}
                        className="flex items-center gap-2 text-[12px] font-semibold text-slate-600 hover:text-blue-600">
                        {allFilteredSelected
                          ? <CheckSquare className="h-4 w-4 text-blue-600" />
                          : <Square className="h-4 w-4" />}
                        Pilih Semua ({filteredUnassigned.length})
                      </button>
                      {selectedCustomers.length > 0 && (
                        <span className="text-[11px] font-semibold text-blue-600">
                          {selectedCustomers.length} dipilih
                          {isBulk && ` → dibagi ke ${targets.length} staf`}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* list pelanggan */}
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

                  {/* action buttons */}
                  <div className="shrink-0 space-y-2 border-t border-slate-100 bg-white px-5 py-4">
                    <button type="button" onClick={handleManualAssign}
                      disabled={!selectedCustomers.length || saving || (isBulk && !activeTargetId)}
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-[13px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40">
                      {saving
                        ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                        : (isBulk ? <Shuffle className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />)}
                      {selectedCustomers.length > 0
                        ? `${isBulk ? 'Distribusikan' : 'Assign'} ${selectedCustomers.length} Pelanggan ${isBulk ? `ke ${targets.length} Staf` : `ke ${staff.full_name}`}`
                        : assignLabel}
                    </button>

                    <button type="button" onClick={handleAutoAssign} disabled={autoAssigning}
                      className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-2.5 text-[13px] font-semibold text-slate-700 transition hover:bg-slate-100 disabled:opacity-40">
                      {autoAssigning
                        ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-slate-400/30 border-t-slate-500" />
                        : <Sparkles className="h-4 w-4 text-amber-500" />}
                      {autoAssignLabel}
                    </button>

                    {/* distribusi preview saat bulk */}
                    {isBulk && selectedCustomers.length > 0 && (
                      <p className="text-center text-[11px] text-slate-400">
                        ±{Math.ceil(selectedCustomers.length / targets.length)} pelanggan/staf
                        · prioritas ke beban kerja paling sedikit
                      </p>
                    )}
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
