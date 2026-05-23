'use client';

import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  UserPlus, X, Shield, ChevronDown, Check,
  ToggleLeft, ToggleRight, Mail, CalendarDays,
  Users, ShieldCheck, UserCog, Save, Gauge,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { mockProfiles } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import DashboardShell from '@/components/dashboard/DashboardShell';

/* ── Custom Select ── */
const ModernSelect = ({ value, onChange, options, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div className="relative" ref={ref}>
      <div
        onClick={() => !disabled && setIsOpen(!isOpen)}
        className={`vs-input px-3 py-2.5 flex items-center justify-between select-none ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} ${isOpen ? 'border-[var(--vs-brand-200)] shadow-[0_0_0_2px_var(--vs-brand-light)]' : ''}`}
      >
        <span className="text-[13px] text-[var(--vs-ink)]">{selected?.label ?? 'Pilih...'}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--vs-muted-3)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute top-full left-0 w-full mt-1.5 bg-[var(--vs-surface)] border border-[var(--vs-line)] rounded-xl shadow-[var(--vs-shadow-md)] z-[200] overflow-hidden">
            <div className="p-1">
              {options.map(opt => {
                const sel = value === opt.value;
                return (
                  <div key={opt.value} onClick={() => { onChange(opt.value); setIsOpen(false); }}
                    className={`flex items-center justify-between px-2.5 py-2 text-[13px] cursor-pointer rounded-lg transition-colors ${sel ? 'bg-[var(--vs-brand-50)] text-[var(--vs-brand)] font-medium' : 'text-[var(--vs-muted)] hover:bg-[var(--vs-bg)] hover:text-[var(--vs-ink)]'}`}>
                    <span>{opt.label}</span>
                    {sel && <Check className="w-3.5 h-3.5 text-[var(--vs-brand)]" />}
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ── Right Drawer ── */
function UserDrawer({ open, mode, user, form, setForm, saving, onSave, onClose, onToggleActive }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
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

  if (!mounted) return null;

  const isEdit = mode === 'edit';
  const isStaff = form.role === 'staff';
  const initials = (form.full_name || user?.full_name || '?')
    .split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase();

  return createPortal(
    <div className="fixed inset-0 z-[100] flex justify-end" style={{ pointerEvents: open ? 'auto' : 'none' }}>
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
        className="relative flex h-full w-full max-w-md flex-col border-l border-slate-200 bg-white shadow-[0_0_40px_-12px_rgba(15,23,42,0.35)]"
        initial={{ x: '100%' }}
        animate={{ x: open ? 0 : '100%' }}
        transition={{ type: 'spring', damping: 34, stiffness: 380 }}
      >
        {/* header strip */}
        <div className="flex shrink-0 items-center justify-between border-b border-slate-100 px-5 py-4">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
            {isEdit ? 'Detail Pengguna' : 'Tambah Pengguna Baru'}
          </p>
          <button type="button" onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain">

          {/* profile card (edit mode only) */}
          {isEdit && user && (
            <div className="border-b border-slate-100 px-5 py-5">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-600 to-blue-400 text-[16px] font-bold text-white shadow-md">
                  {initials}
                </div>
                <div className="flex-1 min-w-0">
                  <h2 className="truncate text-[16px] font-bold text-slate-900">{user.full_name}</h2>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${user.role === 'admin' ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-600'}`}>
                      {user.role === 'admin' ? <><ShieldCheck className="mr-1 inline h-3 w-3" />Admin</> : <><UserCog className="mr-1 inline h-3 w-3" />Staff</>}
                    </span>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${user.is_active ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-400'}`}>
                      {user.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </div>
                </div>
                <button type="button" onClick={() => onToggleActive(user)}
                  title={user.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                  className={`shrink-0 rounded-xl p-2 transition-colors ${user.is_active ? 'text-emerald-500 hover:bg-red-50 hover:text-red-500' : 'text-slate-400 hover:bg-emerald-50 hover:text-emerald-600'}`}>
                  {user.is_active ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                </button>
              </div>

              {/* stats row */}
              <div className="mt-4 grid grid-cols-3 gap-3">
                {[
                  { icon: Mail, label: 'Email', value: user.email ?? '—', mono: true },
                  { icon: Users, label: 'Ditugaskan', value: user.role === 'admin' ? '—' : (user.assigned_count ?? 0) },
                  {
                    icon: CalendarDays, label: 'Terakhir Login',
                    value: user.last_login
                      ? new Date(user.last_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
                      : 'Belum',
                  },
                ].map(({ icon: Icon, label, value, mono }) => (
                  <div key={label} className="rounded-xl border border-slate-100 bg-slate-50 p-3">
                    <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <Icon className="h-3 w-3" /> {label}
                    </p>
                    <p className={`mt-1 truncate text-[12px] font-semibold text-slate-700 ${mono ? 'font-mono text-[11px]' : ''}`}>{String(value)}</p>
                  </div>
                ))}
              </div>

              {/* Kapasitas bar (staff edit mode) */}
              {user.role === 'staff' && (
                <div className="mt-3 rounded-xl border border-slate-100 bg-slate-50 p-3">
                  <div className="flex items-center justify-between mb-1.5">
                    <p className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                      <Gauge className="h-3 w-3" /> Kapasitas
                    </p>
                    <span className="text-[11px] font-bold text-slate-600">
                      {user.assigned_count ?? 0} / {user.max_load ?? 10}
                    </span>
                  </div>
                  <div className="h-1.5 overflow-hidden rounded-full bg-slate-200">
                    <div className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, ((user.assigned_count ?? 0) / (user.max_load ?? 10)) * 100)}%`,
                        background: (user.assigned_count ?? 0) >= (user.max_load ?? 10) ? '#EF4444'
                          : (user.assigned_count ?? 0) >= (user.max_load ?? 10) * 0.8 ? '#F59E0B'
                          : '#3B82F6',
                      }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* form */}
          <div className="px-5 py-5 space-y-4">
            <p className="text-[12px] font-bold uppercase tracking-wider text-slate-400">
              {isEdit ? 'Edit Profil' : 'Informasi Pengguna'}
            </p>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-500">Nama Lengkap</label>
              <input type="text" value={form.full_name}
                onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
                placeholder="John Doe" className="vs-input px-3 py-2.5" />
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-500">Email</label>
              <input type="email" value={form.email}
                onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                placeholder="john@perusahaan.com"
                disabled={isEdit}
                className={`vs-input px-3 py-2.5 ${isEdit ? 'opacity-50 cursor-not-allowed' : ''}`} />
              {isEdit && <p className="text-[11px] text-slate-400">Email tidak dapat diubah.</p>}
            </div>

            <div className="space-y-1.5">
              <label className="text-[12px] font-semibold text-slate-500">Role</label>
              <ModernSelect
                value={form.role}
                onChange={val => setForm(p => ({ ...p, role: val }))}
                options={[{ value: 'staff', label: 'Staff' }, { value: 'admin', label: 'Admin' }]}
              />
            </div>

            {/* Kapasitas Maks — hanya tampil jika role staff */}
            <AnimatePresence>
              {isStaff && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="flex items-center gap-1.5 text-[12px] font-semibold text-slate-500">
                      <Gauge className="h-3.5 w-3.5" /> Kapasitas Maks Pelanggan
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="number"
                        min={1}
                        max={10000}
                        value={form.max_load}
                        onChange={e => {
                          const v = Math.max(1, Math.min(100, Number(e.target.value) || 1));
                          setForm(p => ({ ...p, max_load: v }));
                        }}
                        className="vs-input w-24 px-3 py-2.5 text-center text-[14px] font-bold tabular-nums"
                      />
                      <div className="flex gap-1.5">
                        {[50, 100, 500, 1000].map(n => (
                          <button key={n} type="button"
                            onClick={() => setForm(p => ({ ...p, max_load: n }))}
                            className={`rounded-lg px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
                              form.max_load === n
                                ? 'bg-blue-600 text-white'
                                : 'border border-slate-200 bg-slate-50 text-slate-600 hover:border-blue-300 hover:text-blue-700'
                            }`}>
                            {n}
                          </button>
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-400">
                      Jumlah maksimum pelanggan yang bisa di-assign ke staff ini. Default: 10.
                    </p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {!isEdit && (
              <div className="space-y-1.5">
                <label className="text-[12px] font-semibold text-slate-500">Password Awal</label>
                <input type="password" value={form.password}
                  onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
                  placeholder="Minimal 6 karakter" className="vs-input px-3 py-2.5" />
              </div>
            )}
          </div>
        </div>

        {/* sticky footer */}
        <div className="shrink-0 border-t border-slate-100 bg-white px-5 py-4 flex gap-3">
          <button type="button" onClick={onClose}
            className="flex-1 rounded-xl border border-slate-200 py-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-50">
            Batal
          </button>
          <button type="button" onClick={onSave} disabled={saving}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-[13px] font-semibold text-white transition hover:bg-blue-700 disabled:opacity-60">
            {saving
              ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              : <Save className="h-4 w-4" />}
            {saving ? 'Menyimpan…' : isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}
          </button>
        </div>
      </motion.aside>
    </div>,
    document.body
  );
}

/* ── Main Page ── */
export default function UserManagementPage() {
  const { toasts, toast, remove } = useToast();
  const [profiles, setProfiles] = useState([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState('add');
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'staff', password: '', max_load: 10 });

  const loadProfiles = async () => {
    // Ambil profiles + hitung assigned_count real dari tabel customers
    const [{ data: profileData }, { data: customerData }] = await Promise.all([
      supabase.from('profiles').select('*').order('role').order('full_name'),
      supabase.from('customers').select('assigned_to').not('assigned_to', 'is', null),
    ]);

    if (!profileData?.length) { setProfiles(mockProfiles); return; }

    // Hitung jumlah pelanggan per staff dari data customers
    const countMap = {};
    for (const row of customerData ?? []) {
      if (row.assigned_to) countMap[row.assigned_to] = (countMap[row.assigned_to] ?? 0) + 1;
    }

    // Merge assigned_count real ke profile, last_login diambil dari Supabase auth
    const merged = profileData.map(p => ({
      ...p,
      assigned_count: p.role === 'staff' ? (countMap[p.id] ?? 0) : null,
    }));

    setProfiles(merged);
  };

  useEffect(() => { loadProfiles(); }, []);

  const openEdit = (u) => {
    setSelectedUser(u);
    setForm({ full_name: u.full_name, email: u.email ?? '', role: u.role, password: '', max_load: u.max_load ?? 10 });
    setDrawerMode('edit');
    setDrawerOpen(true);
  };

  const openAdd = () => {
    setSelectedUser(null);
    setForm({ full_name: '', email: '', role: 'staff', password: '', max_load: 10 });
    setDrawerMode('add');
    setDrawerOpen(true);
  };

  const closeDrawer = () => setDrawerOpen(false);

  const handleSave = async () => {
    if (!form.full_name || !form.email) { toast('Nama dan email wajib diisi', 'warning'); return; }
    setSaving(true);
    if (drawerMode === 'add') {
      if (!form.password || form.password.length < 6) { toast('Password minimal 6 karakter', 'warning'); setSaving(false); return; }
      try {
        const res = await fetch('/api/create-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            email: form.email,
            password: form.password,
            full_name: form.full_name,
            role: form.role,
            max_load: form.role === 'staff' ? (form.max_load ?? 10) : 0,
          }),
        });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
        toast('Pengguna baru berhasil ditambahkan!', 'success');
        await loadProfiles();
        closeDrawer();
      } catch (err) { toast(err.message || 'Gagal menambahkan pengguna', 'error'); }
    } else {
      const updatePayload = {
        full_name: form.full_name,
        role: form.role,
        // max_load: 0 untuk admin (NOT NULL constraint), nilai bermakna hanya untuk staff
        max_load: form.role === 'staff' ? (form.max_load ?? 10) : 0,
      };
      try {
        // 1. Update tabel profiles
        const { error: profileError } = await supabase
          .from('profiles')
          .update(updatePayload)
          .eq('id', selectedUser.id);
        if (profileError) throw new Error(profileError.message);

        // 2. Sync role ke auth.users user_metadata via API
        // (diperlukan agar middleware/role check berbasis token tetap konsisten)
        const metaRes = await fetch('/api/update-user-meta', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: selectedUser.id,
            full_name: form.full_name,
            role: form.role,
          }),
        });
        const metaResult = await metaRes.json();
        if (!metaResult.success) {
          // Tidak throw — profiles sudah tersimpan, metadata gagal tidak kritis
          console.warn('[update-meta] gagal:', metaResult.error);
        }

        setProfiles(prev => prev.map(p => p.id === selectedUser.id ? { ...p, ...updatePayload } : p));
        toast('Pengguna berhasil diperbarui', 'success');
        closeDrawer(); // No.4 — tutup drawer setelah berhasil
      } catch (err) {
        toast(err.message || 'Gagal memperbarui pengguna', 'error');
      }
    }
    setSaving(false);
  };

  const handleToggleActive = async (u) => {
    const newStatus = !u.is_active;
    const { error } = await supabase.from('profiles').update({ is_active: newStatus }).eq('id', u.id);
    if (error) { toast('Gagal mengubah status', 'error'); return; }
    setProfiles(prev => prev.map(p => p.id === u.id ? { ...p, is_active: newStatus } : p));
    setSelectedUser(prev => prev?.id === u.id ? { ...prev, is_active: newStatus } : prev);
    toast(`${u.full_name} ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
  };

  return (
    <DashboardShell
      title="Manajemen Pengguna"
      description="Kelola hak akses admin dan staf di platform secara terpusat."
      icon={Shield}
      actions={(
        <button type="button" className="vs-btn vs-btn--primary" onClick={openAdd}>
          <UserPlus className="h-4 w-4" /> Tambah Pengguna
        </button>
      )}
    >
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.05, ease:[0.16,1,0.3,1] }} className="vs-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--vs-bg)] border-b border-[var(--vs-line)]">
                {['Nama', 'Email', 'Role', 'Ditugaskan', 'Kapasitas', 'Terakhir Login', 'Status'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--vs-line-soft)]">
              {profiles.map(u => {
                const maxLoad = u.max_load ?? 10;
                const assigned = u.assigned_count ?? 0;
                const pct = Math.min(100, (assigned / maxLoad) * 100);
                const barColor = assigned >= maxLoad ? '#EF4444' : assigned >= maxLoad * 0.8 ? '#F59E0B' : '#3B82F6';
                return (
                  <tr key={u.id} onClick={() => openEdit(u)}
                    className="cursor-pointer hover:bg-[var(--vs-bg)] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-400 flex items-center justify-center text-[11px] font-bold text-white uppercase shadow-sm">
                          {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                        </div>
                        <span className="text-[13px] font-semibold text-[var(--vs-ink)] group-hover:text-[var(--vs-brand)] transition-colors">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[var(--vs-muted)] font-mono">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`vs-tag ${u.role === 'admin' ? 'vs-tag--blue' : ''}`}
                        style={u.role !== 'admin' ? { background: 'var(--vs-bg-2)', color: 'var(--vs-muted)', borderColor: 'var(--vs-line)' } : {}}>
                        {u.role === 'admin' ? <><ShieldCheck className="inline h-3 w-3 mr-1" />Admin</> : u.role.charAt(0).toUpperCase() + u.role.slice(1)}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] font-bold text-[var(--vs-ink)] tabular-nums">
                      {u.role === 'admin' ? '—' : assigned}
                    </td>
                    <td className="px-5 py-3.5">
                      {u.role === 'admin' ? (
                        <span className="text-[13px] text-[var(--vs-muted)]">—</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="w-16 h-1.5 overflow-hidden rounded-full bg-slate-100">
                            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: barColor }} />
                          </div>
                          <span className={`text-[11px] font-semibold tabular-nums ${assigned >= maxLoad ? 'text-red-500' : 'text-slate-500'}`}>
                            {assigned}/{maxLoad}
                          </span>
                        </div>
                      )}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-[var(--vs-muted)] font-mono">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum Pernah'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`vs-tag ${u.is_active ? 'vs-tag--low' : ''}`}
                        style={!u.is_active ? { background: 'var(--vs-bg-2)', color: 'var(--vs-muted-3)', borderColor: 'var(--vs-line-soft)' } : {}}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.div>

      <ToastContainer toasts={toasts} onRemove={remove} />

      <UserDrawer
        open={drawerOpen}
        mode={drawerMode}
        user={selectedUser}
        form={form}
        setForm={setForm}
        saving={saving}
        onSave={handleSave}
        onClose={closeDrawer}
        onToggleActive={handleToggleActive}
      />
    </DashboardShell>
  );
}
