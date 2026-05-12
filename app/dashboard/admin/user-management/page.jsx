'use client';

import { useState, useEffect, useRef } from 'react';
import { UserPlus, Edit2, ToggleLeft, ToggleRight, X, Shield, ChevronDown, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, scaleIn } from '@/lib/motion';
import { mockProfiles } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import DashboardShell from '@/components/dashboard/DashboardShell';

/* ── Custom Select ──────────────────────────────────────────────────── */
const ModernSelect = ({ value, onChange, options }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setIsOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);
  const selected = options.find(o => o.value === value);
  return (
    <div className="relative" ref={ref}>
      <div onClick={() => setIsOpen(!isOpen)}
        className={`vs-input px-3 py-2.5 flex items-center justify-between cursor-pointer select-none ${isOpen ? 'border-[var(--vs-brand-200)] shadow-[0_0_0_2px_var(--vs-brand-light)]' : ''}`}>
        <span className="text-[13px] text-[var(--vs-ink)]">{selected?.label ?? 'Pilih...'}</span>
        <ChevronDown className={`w-4 h-4 text-[var(--vs-muted-3)] transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.15 }}
            className="absolute top-full left-0 w-full mt-1.5 bg-[var(--vs-surface)] border border-[var(--vs-line)] rounded-xl shadow-[var(--vs-shadow-md)] z-[100] overflow-hidden">
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

/* ── Modal ──────────────────────────────────────────────────────────── */
const InlineModal = ({ isOpen, onClose, title, children }) => (
  <AnimatePresence>
    {isOpen && (
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[var(--vs-ink)]/40 backdrop-blur-sm" onClick={onClose} />
        <motion.div variants={scaleIn} initial="hidden" animate="visible" exit="hidden"
          className="vs-card relative w-full max-w-[420px] shadow-[var(--vs-shadow-md)] overflow-visible">
          <div className="px-5 py-4 border-b border-[var(--vs-line)] flex items-center justify-between">
            <h3 className="text-[15px] font-bold text-[var(--vs-ink)]">{title}</h3>
            <button onClick={onClose} className="text-[var(--vs-muted-3)] hover:text-[var(--vs-ink)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {children}
        </motion.div>
      </motion.div>
    )}
  </AnimatePresence>
);

/* ── Form ───────────────────────────────────────────────────────────── */
const FormFields = ({ form, setForm, saving, onSave, onCancel, isEdit }) => (
  <div>
    <div className="p-5 space-y-4">
      <div>
        <label className="block text-[12px] font-semibold text-[var(--vs-muted-2)] mb-1.5">Nama Lengkap</label>
        <input type="text" value={form.full_name} onChange={e => setForm(p => ({ ...p, full_name: e.target.value }))}
          placeholder="John Doe" className="vs-input px-3 py-2.5" />
      </div>
      <div>
        <label className="block text-[12px] font-semibold text-[var(--vs-muted-2)] mb-1.5">Email</label>
        <input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
          placeholder="john@perusahaan.com"
          className={`vs-input px-3 py-2.5 ${isEdit ? 'opacity-60 cursor-not-allowed' : ''}`}
          disabled={isEdit} />
        {isEdit && <p className="text-[10px] text-[var(--vs-muted-3)] mt-1">Email tidak dapat diubah.</p>}
      </div>
      <div>
        <label className="block text-[12px] font-semibold text-[var(--vs-muted-2)] mb-1.5">Role</label>
        <ModernSelect value={form.role} onChange={val => setForm(p => ({ ...p, role: val }))}
          options={[{ value: 'staff', label: 'Staff' }, { value: 'admin', label: 'Admin' }]} />
      </div>
      {!isEdit && (
        <div>
          <label className="block text-[12px] font-semibold text-[var(--vs-muted-2)] mb-1.5">Password Awal</label>
          <input type="password" value={form.password} onChange={e => setForm(p => ({ ...p, password: e.target.value }))}
            placeholder="Minimal 8 karakter" className="vs-input px-3 py-2.5" />
        </div>
      )}
    </div>
    <div className="px-5 py-4 border-t border-[var(--vs-line)] bg-[var(--vs-bg)] flex gap-3 rounded-b-xl">
      <button className="vs-btn vs-btn--ghost flex-1 justify-center" onClick={onCancel}>Batal</button>
      <button className="vs-btn vs-btn--primary flex-1 justify-center" disabled={saving} onClick={onSave}>
        {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
        {saving ? 'Menyimpan...' : isEdit ? 'Simpan Perubahan' : 'Tambah Pengguna'}
      </button>
    </div>
  </div>
);

/* ── Main Page ──────────────────────────────────────────────────────── */
export default function UserManagementPage() {
  const { toasts, toast, remove } = useToast();
  const [profiles, setProfiles]   = useState([]);
  const [addModal, setAddModal]   = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving]       = useState(false);
  const [form, setForm]           = useState({ full_name: '', email: '', role: 'staff', password: '' });

  const loadProfiles = async () => {
    const { data } = await supabase.from('profiles').select('*').order('role').order('full_name');
    setProfiles(data?.length ? data : mockProfiles);
  };

  useEffect(() => { loadProfiles(); }, []);

  const openEdit = (u) => { setSelectedUser(u); setForm({ full_name: u.full_name, email: u.email, role: u.role, password: '' }); setEditModal(true); };
  const openAdd  = ()  => { setSelectedUser(null); setForm({ full_name: '', email: '', role: 'staff', password: '' }); setAddModal(true); };

  const handleSave = async () => {
    if (!form.full_name || !form.email) { toast('Nama dan email wajib diisi', 'warning'); return; }
    setSaving(true);
    if (!selectedUser) {
      if (!form.password || form.password.length < 6) { toast('Password minimal 6 karakter', 'warning'); setSaving(false); return; }
      try {
        const res = await fetch('/api/create-user', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email: form.email, password: form.password, full_name: form.full_name, role: form.role }) });
        const result = await res.json();
        if (!result.success) throw new Error(result.error);
        toast('Pengguna baru berhasil ditambahkan!', 'success');
        await loadProfiles();
        setAddModal(false);
      } catch (err) { toast(err.message || 'Gagal menambahkan pengguna', 'error'); }
    } else {
      const { error } = await supabase.from('profiles').update({ full_name: form.full_name, role: form.role }).eq('id', selectedUser.id);
      if (error) { toast('Gagal memperbarui pengguna', 'error'); }
      else {
        setProfiles(prev => prev.map(p => p.id === selectedUser.id ? { ...p, full_name: form.full_name, role: form.role } : p));
        toast('Pengguna berhasil diperbarui', 'success');
        setEditModal(false);
      }
    }
    setSaving(false);
  };

  const handleToggleActive = async (u) => {
    const newStatus = !u.is_active;
    const { error } = await supabase.from('profiles').update({ is_active: newStatus }).eq('id', u.id);
    if (error) { toast('Gagal mengubah status', 'error'); return; }
    setProfiles(prev => prev.map(p => p.id === u.id ? { ...p, is_active: newStatus } : p));
    toast(`${u.full_name} ${newStatus ? 'diaktifkan' : 'dinonaktifkan'}`, 'success');
  };

  return (
    <DashboardShell
      title="User management"
      description="Kelola hak akses admin dan staf di platform."
      icon={Shield}
      actions={(
        <button type="button" className="vs-btn vs-btn--primary" onClick={openAdd}>
          <UserPlus className="h-4 w-4" /> Tambah pengguna
        </button>
      )}
    >

      {/* Table */}
      <motion.div variants={fadeUp} className="vs-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-[var(--vs-bg)] border-b border-[var(--vs-line)]">
                {['Nama', 'Email', 'Role', 'Ditugaskan', 'Terakhir Login', 'Status', 'Aksi'].map(h => (
                  <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--vs-line-soft)]">
              {profiles.map(u => (
                <tr key={u.id} className="hover:bg-[var(--vs-bg)] transition-colors group">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-[var(--vs-bg-2)] border border-[var(--vs-line)] flex items-center justify-center text-[11px] font-bold text-[var(--vs-muted)] uppercase">
                        {u.full_name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?'}
                      </div>
                      <span className="text-[13px] font-semibold text-[var(--vs-ink)]">{u.full_name}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] text-[var(--vs-muted)]">{u.email}</td>
                  <td className="px-5 py-3.5">
                    <span className={`vs-tag ${u.role === 'admin' ? 'vs-tag--blue' : ''}`}
                      style={u.role !== 'admin' ? { background: 'var(--vs-bg-2)', color: 'var(--vs-muted)', borderColor: 'var(--vs-line)' } : {}}>
                      {u.role}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-[13px] font-bold text-[var(--vs-ink)] tabular-nums">{u.role === 'admin' ? '—' : (u.assigned_count ?? 0)}</td>
                  <td className="px-5 py-3.5 text-[12px] text-[var(--vs-muted)] font-mono">
                    {u.last_login ? new Date(u.last_login).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Belum pernah'}
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`vs-tag ${u.is_active ? 'vs-tag--low' : ''}`}
                      style={!u.is_active ? { background: 'var(--vs-bg-2)', color: 'var(--vs-muted-3)', borderColor: 'var(--vs-line-soft)' } : {}}>
                      {u.is_active ? 'Aktif' : 'Nonaktif'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(u)} className="p-1.5 rounded-md hover:bg-[var(--vs-bg-2)] text-[var(--vs-muted-3)] hover:text-[var(--vs-brand)] transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleToggleActive(u)}
                        className={`p-1.5 rounded-md transition-colors ${u.is_active ? 'hover:bg-red-50 text-[var(--vs-success)] hover:text-[var(--vs-danger)]' : 'hover:bg-emerald-50 text-[var(--vs-muted-3)] hover:text-[var(--vs-success)]'}`}>
                        {u.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <InlineModal isOpen={addModal}  onClose={() => setAddModal(false)}  title="Tambah Pengguna Baru">
        <FormFields form={form} setForm={setForm} saving={saving} onSave={handleSave} onCancel={() => setAddModal(false)}  isEdit={false} />
      </InlineModal>
      <InlineModal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Profil Pengguna">
        <FormFields form={form} setForm={setForm} saving={saving} onSave={handleSave} onCancel={() => setEditModal(false)} isEdit={true}  />
      </InlineModal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </DashboardShell>
  );
}
