'use client';

import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Search, CheckSquare, Square, Sparkles,
  UserPlus, ChevronRight, ArrowLeft, Users,
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { addNotifikasi } from '@/lib/churnshield';
import { useLang } from '@/lib/i18n/LanguageContext';

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
function initials(name) {
  return (name ?? 'ST').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
}

export default function BulkAssignModal({ open, staffList = [], customers = [], onClose, onRefresh, toast }) {
  const { t } = useLang();
  const [mounted, setMounted] = useState(false);
  const [activeStaff, setActiveStaff] = useState(null); // null = step 1 (pilih staff)
  const [assignments, setAssignments] = useState({});   // { staffId: [customerId, ...] }
  const [selected, setSelected] = useState([]);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (open) {
      setActiveStaff(null);
      setAssignments({});
      setSelected([]);
      setSearch('');
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => { if (e.key === 'Escape') { if (activeStaff) backToStaff(); else onClose(); } };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, activeStaff, onClose]);

  if (!mounted) return null;

  const unassigned = customers.filter(c => !c.assigned_to);
  const queued = Object.values(assignments).flat();
  const available = unassigned.filter(c => !queued.includes(c.id));

  const existingLoad = (staffId) => customers.filter(c => c.assigned_to === staffId).length;
  const pendingCount = (staffId) => (assignments[staffId] ?? []).length;
  const totalQueued = Object.values(assignments).reduce((sum, ids) => sum + ids.length, 0);

  // customer list saat step 2 (sudah difilter + search)
  const availableForActive = available.filter(c =>
    (c.company_name ?? '').toLowerCase().includes(search.toLowerCase()) ||
    (c.customer_id ?? '').toLowerCase().includes(search.toLowerCase())
  );
  const allSelected = availableForActive.length > 0 && availableForActive.every(c => selected.includes(c.id));

  const openStaff = (staff) => {
    setActiveStaff(staff);
    setSelected([]);
    setSearch('');
  };

  const backToStaff = () => {
    setActiveStaff(null);
    setSelected([]);
    setSearch('');
  };

  const toggleCustomer = (id) =>
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const toggleAll = () => {
    const ids = availableForActive.map(c => c.id);
    setSelected(prev => allSelected ? prev.filter(x => !ids.includes(x)) : [...new Set([...prev, ...ids])]);
  };

  const handleAssign = () => {
    if (!activeStaff || !selected.length) return;
    setAssignments(prev => ({
      ...prev,
      [activeStaff.id]: [...(prev[activeStaff.id] ?? []), ...selected],
    }));
    backToStaff();
  };

  const removeStaffQueue = (staffId) => {
    setAssignments(prev => { const next = { ...prev }; delete next[staffId]; return next; });
  };

  const handleAutoDistribute = () => {
    const loads = staffList.map(s => ({ id: s.id, count: existingLoad(s.id), assigned: [] }));
    const sorted = [...unassigned].sort((a, b) => (b.churn_score ?? 0) - (a.churn_score ?? 0));
    for (const c of sorted) {
      loads.sort((a, b) => a.count - b.count);
      loads[0].assigned.push(c.id);
      loads[0].count++;
    }
    const next = {};
    for (const s of loads) { if (s.assigned.length) next[s.id] = s.assigned; }
    setAssignments(next);
    setActiveStaff(null);
    setSelected([]);
  };

  const handleSave = async () => {
    if (!totalQueued) return;
    setSaving(true);
    try {
      for (const [staffId, customerIds] of Object.entries(assignments)) {
        if (!customerIds.length) continue;
        await supabase.from('customers').update({ assigned_to: staffId }).in('id', customerIds);
        const staff = staffList.find(s => s.id === staffId);
        addNotifikasi({
          title: `${customerIds.length} pelanggan baru di-assign ke Anda`,
          message: `Admin menugaskan ${customerIds.length} pelanggan kepada Anda. Segera tindak lanjuti.`,
          type: 'assign',
          recipient_id: staffId,
        }).catch(() => {});
      }
      toast(t('bulkAssign.successToast', { count: totalQueued }), 'success');
      onRefresh();
      onClose();
    } catch {
      toast(t('bulkAssign.errorToast'), 'error');
    } finally {
      setSaving(false);
    }
  };

  return createPortal(
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-slate-950/40 backdrop-blur-[2px]"
        onClick={() => { if (activeStaff) backToStaff(); else onClose(); }}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ type: 'spring', damping: 30, stiffness: 380 }}
        className="relative z-10 flex w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-slate-100 px-5 py-4">
          {activeStaff && (
            <button onClick={backToStaff}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </button>
          )}
          <div className="flex-1 min-w-0">
            <h2 className="text-[15px] font-bold text-slate-900">
              {activeStaff ? t('bulkAssign.titleStep2', { staffName: activeStaff.full_name }) : t('bulkAssign.titleStep1')}
            </h2>
            <p className="text-[11px] text-slate-500">
              {activeStaff
                ? t('bulkAssign.subtitleStep2', { availableCount: available.length })
                : t('bulkAssign.subtitleStep1', { staffCount: staffList.length, unassignedCount: unassigned.length })}
            </p>
          </div>
          <button onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <AnimatePresence mode="wait" initial={false}>
          {!activeStaff ? (
            /* ── Step 1: Daftar staf ── */
            <motion.div key="step-staff"
              initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col min-h-0"
            >
              <div className="flex-1 overflow-y-auto p-4 space-y-2">
                {staffList.map(s => {
                  const existing = existingLoad(s.id);
                  const pending = pendingCount(s.id);
                  return (
                    <button key={s.id} onClick={() => openStaff(s)}
                      className="group flex w-full items-center gap-4 rounded-xl border border-slate-100 bg-slate-50/60 p-4 text-left transition-all hover:border-blue-200 hover:bg-blue-50/40">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-blue-400 text-[12px] font-bold text-white shadow-sm">
                        {initials(s.full_name)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-slate-800 group-hover:text-blue-700 transition-colors">
                          {s.full_name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          {existing} {t('bulkAssign.activeCustomers')}
                          {pending > 0 && (
                            <span className="ml-1.5 font-semibold text-emerald-600">+ {pending} {t('bulkAssign.added')}</span>
                          )}
                        </p>
                      </div>
                      {pending > 0 && (
                        <button
                          onClick={e => { e.stopPropagation(); removeStaffQueue(s.id); }}
                          className="shrink-0 rounded-lg border border-red-100 bg-white px-2 py-1 text-[10px] font-semibold text-red-500 hover:bg-red-50 transition-colors"
                        >
                          {t('bulkAssign.remove')}
                        </button>
                      )}
                      <ChevronRight className="h-4 w-4 shrink-0 text-slate-300 group-hover:text-blue-400 transition-colors" />
                    </button>
                  );
                })}
              </div>

              {/* Footer step 1 */}
              <div className="shrink-0 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                <button onClick={handleAutoDistribute}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-100">
                  <Sparkles className="h-4 w-4 text-amber-500" />
                  {t('bulkAssign.autoDistribute')}
                </button>
                <div className="flex items-center gap-2">
                  <button onClick={onClose}
                    className="rounded-xl border border-slate-200 px-4 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50">
                    {t('bulkAssign.cancel')}
                  </button>
                  <button onClick={handleSave} disabled={!totalQueued || saving}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-[12px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40">
                    {saving
                      ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
                      : <UserPlus className="h-4 w-4" />}
                    {t('bulkAssign.save')} {totalQueued > 0 ? `(${totalQueued})` : ''}
                  </button>
                </div>
              </div>
            </motion.div>

          ) : (
            /* ── Step 2: Pilih customer untuk staff aktif ── */
            <motion.div key="step-customer"
              initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }}
              transition={{ duration: 0.18 }}
              className="flex flex-col min-h-0"
            >
              {/* search + select all */}
              <div className="shrink-0 space-y-2 border-b border-slate-100 px-4 py-3">
                <div className="relative">
                  <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input type="text" placeholder={t('bulkAssign.searchPlaceholder')} value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-9 pr-3 text-[13px] outline-none focus:border-blue-400 focus:bg-white" />
                </div>
                <button onClick={toggleAll}
                  className="flex items-center gap-2 text-[12px] font-semibold text-slate-600 hover:text-blue-600">
                  {allSelected ? <CheckSquare className="h-4 w-4 text-blue-600" /> : <Square className="h-4 w-4" />}
                  {t('bulkAssign.selectAll')} ({availableForActive.length})
                  {selected.length > 0 && (
                    <span className="ml-1 font-bold text-blue-600">· {selected.length} {t('bulkAssign.selected')}</span>
                  )}
                </button>
              </div>

              {/* list */}
              <ul className="flex-1 divide-y divide-slate-50 overflow-y-auto px-3 py-2" style={{ maxHeight: '45vh' }}>
                {availableForActive.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Users className="mb-2 h-9 w-9 text-slate-200" />
                    <p className="text-[12px] text-slate-400">
                      {available.length === 0 ? t('bulkAssign.allQueued') : t('bulkAssign.noResult', { search })}
                    </p>
                  </div>
                ) : availableForActive.map(c => {
                  const checked = selected.includes(c.id);
                  return (
                    <li key={c.id} onClick={() => toggleCustomer(c.id)}
                      className={`flex cursor-pointer items-center gap-3 rounded-xl px-2 py-2.5 transition-colors hover:bg-slate-50 ${checked ? 'bg-blue-50/60' : ''}`}>
                      <div className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 transition-colors ${checked ? 'border-blue-600 bg-blue-600' : 'border-slate-300'}`}>
                        {checked && <span className="text-[9px] font-bold text-white">✓</span>}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-[13px] font-semibold text-slate-800">{c.company_name}</p>
                        <p className="text-[11px] text-slate-400">{c.customer_id} · {c.plan_type}</p>
                      </div>
                      <div className="flex shrink-0 items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${riskDot(c.risk_level)}`} />
                        <span className={`text-[12px] font-bold tabular-nums ${riskText(c.risk_level)}`}>
                          {c.churn_score != null ? `${c.churn_score}%` : '—'}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>

              {/* Footer step 2 */}
              <div className="shrink-0 flex items-center justify-between border-t border-slate-100 bg-slate-50/50 px-5 py-3">
                <button onClick={backToStaff}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-[12px] font-semibold text-slate-600 transition hover:bg-slate-50">
                  <ArrowLeft className="h-4 w-4" /> {t('bulkAssign.back')}
                </button>
                <button onClick={handleAssign} disabled={!selected.length}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-[12px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40">
                  <UserPlus className="h-4 w-4" />
                  {selected.length > 0
                    ? t('bulkAssign.assignTo', { count: selected.length, staffName: activeStaff.full_name })
                    : t('bulkAssign.selectFirst')}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>,
    document.body
  );
}
