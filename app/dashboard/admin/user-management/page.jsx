'use client';

import { useState, useEffect, useRef } from 'react';
import { UserPlus, Edit2, ToggleLeft, ToggleRight, X, Shield, ChevronDown, Check } from 'lucide-react';
import { useAuth } from '@/lib/hooks/useAuth';
import { mockProfiles } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';

export default function UserManagementPage() {
  const { toasts, toast, remove } = useToast();

  const [profiles, setProfiles] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'staff', password: '' });

  useEffect(() => {
    supabase.from('profiles').select('*').order('role').order('full_name')
      .then(({ data }) => setProfiles(data?.length ? data : mockProfiles));
  }, []);

  const openEdit = (user) => {
    setSelectedUser(user);
    setForm({ full_name: user.full_name, email: user.email, role: user.role, password: '' });
    setEditModal(true);
  };
  
  const openAdd = () => {
    setSelectedUser(null);
    setForm({ full_name: '', email: '', role: 'staff', password: '' });
    setAddModal(true);
  };

  const handleSave = async () => {
    if (!form.full_name || !form.email) { toast('Nama dan email wajib diisi', 'warning'); return; }
    setSaving(true);
    await new Promise(r => setTimeout(r, 700));
    toast(selectedUser ? 'Pengguna berhasil diperbarui' : 'Pengguna baru berhasil ditambahkan', 'success');
    setSaving(false);
    setAddModal(false);
    setEditModal(false);
  };

  const handleToggleActive = async (user) => {
    await new Promise(r => setTimeout(r, 400));
    setProfiles(prev => prev.map(p => p.id === user.id ? { ...p, is_active: !p.is_active } : p));
    toast(`${user.full_name} ${user.is_active ? 'dinonaktifkan' : 'diaktifkan'}`, 'success');
  };

  // ─── CUSTOM MODERN DROPDOWN COMPONENT ───
  const ModernSelect = ({ value, onChange, options }) => {
    const [isOpen, setIsOpen] = useState(false);
    const selectRef = useRef(null);

    // Menutup dropdown saat klik di luar area
    useEffect(() => {
      const handleClickOutside = (event) => {
        if (selectRef.current && !selectRef.current.contains(event.target)) setIsOpen(false);
      };
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
      <div className="relative" ref={selectRef}>
        <div 
          className={`vs-input px-3 py-2.5 w-full flex items-center justify-between cursor-pointer select-none transition-all ${isOpen ? 'border-[var(--muted-3)] shadow-[0_0_0_1px_var(--muted-3)]' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span className="text-[13px] text-[var(--ink)]">{selectedOption ? selectedOption.label : 'Pilih...'}</span>
          <ChevronDown className={`w-4 h-4 text-[var(--muted-3)] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </div>

        {isOpen && (
          <div className="absolute top-full left-0 w-full mt-1.5 bg-[var(--surface)] border border-[var(--line)] rounded-lg shadow-lg z-[100] overflow-hidden" style={{ animation: 'vsDropdown 0.15s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <div className="p-1">
              {options.map((opt) => {
                const isSelected = value === opt.value;
                return (
                  <div
                    key={opt.value}
                    className={`flex items-center justify-between px-2.5 py-2 text-[13px] cursor-pointer rounded-md transition-colors ${isSelected ? 'bg-[var(--bg-2)] text-[var(--ink)] font-medium' : 'text-[var(--muted)] hover:bg-[var(--bg)] hover:text-[var(--ink)]'}`}
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                    }}
                  >
                    <span>{opt.label}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[var(--ink)]" />}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  // ─── FORM FIELDS ───
  const FormFields = ({ onCancel }) => (
    <div className="flex flex-col h-full">
      <div className="p-5 space-y-4 bg-[var(--surface)]">
        {[
          { label: 'Nama Lengkap', key: 'full_name', type: 'text',  placeholder: 'John Doe' },
          { label: 'Email',        key: 'email',     type: 'email', placeholder: 'john@perusahaan.com' },
        ].map(f => (
          <div key={f.key}>
            <label className="block text-[12px] font-semibold text-[var(--ink)] mb-1.5">{f.label}</label>
            <input
              type={f.type}
              value={form[f.key]}
              onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
              placeholder={f.placeholder}
              className="vs-input px-3 py-2.5 w-full"
            />
          </div>
        ))}
        
        <div>
          <label className="block text-[12px] font-semibold text-[var(--ink)] mb-1.5">Role (Peran)</label>
          <ModernSelect 
            value={form.role}
            onChange={(val) => setForm(prev => ({ ...prev, role: val }))}
            options={[
              { value: 'staff', label: 'Staff' },
              { value: 'admin', label: 'Admin' }
            ]}
          />
        </div>

        {!selectedUser && (
          <div>
            <label className="block text-[12px] font-semibold text-[var(--ink)] mb-1.5">Password Awal</label>
            <input
              type="password"
              value={form.password}
              onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
              placeholder="Minimal 8 karakter"
              className="vs-input px-3 py-2.5 w-full"
            />
          </div>
        )}
      </div>

      <div className="px-5 py-4 border-t border-[var(--line)] bg-[var(--bg-2)] flex gap-3">
        <button className="vs-btn vs-btn--ghost flex-1 py-2" onClick={onCancel}>
          Batal
        </button>
        <button 
          className="vs-btn vs-btn--primary flex-1 py-2" 
          disabled={saving} 
          onClick={handleSave}
        >
          {saving && <div className="w-3.5 h-3.5 border-2 border-white/40 border-t-white rounded-full animate-spin" />}
          {saving ? 'Menyimpan...' : (selectedUser ? 'Simpan Perubahan' : 'Tambah Pengguna')}
        </button>
      </div>
    </div>
  );

  // ─── MODAL WRAPPER ───
  const InlineModal = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;
    return (
      <div className="fixed inset-0 z-[99] flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-[var(--ink)]/40 backdrop-blur-sm" onClick={onClose} />
        <div className="vs-card relative w-full max-w-[420px] shadow-[var(--shadow-xl)] flex flex-col overflow-visible" style={{ animation: 'vsReveal 0.2s cubic-bezier(0.16, 1, 0.3, 1)' }}>
          <div className="px-5 py-4 border-b border-[var(--line)] flex items-center justify-between bg-[var(--surface)] rounded-t-xl">
            <h3 className="text-[15px] font-semibold text-[var(--ink)]">{title}</h3>
            <button onClick={onClose} className="text-[var(--muted-3)] hover:text-[var(--ink)] transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>
          {children}
        </div>
      </div>
    );
  };

  return (
    <div className="vs-root">
      {/* ─── CSS Global (Design System Visions) ─── */}
      <style jsx global>{`
        .vs-root {
          --bg:        #FAFAFA;
          --bg-2:      #F4F4F5;
          --surface:   #FFFFFF;
          --ink:       #0A0A0A;
          --ink-2:     #18181B;
          --muted:     #52525B;
          --muted-2:   #71717A;
          --muted-3:   #A1A1AA;
          --line:      #E4E4E7;
          --line-2:    #EAEAEC;
          --line-soft: #F0F0F2;

          --brand:     #4F46E5;
          --success:   #10B981;
          --warn:      #F59E0B;
          --danger:    #EF4444;

          --shadow-xs: 0 1px 2px rgba(16,24,40,0.04);
          --shadow-xl: 0 20px 40px -8px rgba(0,0,0,0.15);
          
          font-family: 'Geist', 'Inter', -apple-system, sans-serif;
          color: var(--ink);
        }
        .vs-root .mono { font-family: 'Geist Mono', monospace; }
        
        .vs-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          box-shadow: var(--shadow-xs);
        }
        
        .vs-tag {
          display: inline-flex; align-items: center; justify-content: center; gap: 4px;
          padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
          border: 1px solid transparent; text-transform: capitalize;
        }

        .vs-input {
          width: 100%; background: var(--surface); border: 1px solid var(--line);
          border-radius: 8px; font-size: 13px; color: var(--ink);
          outline: none; transition: all 0.2s ease;
        }
        .vs-input:focus { border-color: var(--muted-3); box-shadow: 0 0 0 1px var(--muted-3); }
        .vs-input::placeholder { color: var(--muted-3); }

        .vs-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          font-size: 13px; font-weight: 500; padding: 8px 16px; border-radius: 8px;
          transition: all .2s ease; cursor: pointer;
        }
        .vs-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .vs-btn--primary {
          color: #fff; background: var(--ink); border: 1px solid var(--ink);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .vs-btn--primary:hover:not(:disabled) { background: var(--ink-2); transform: translateY(-0.5px); }
        .vs-btn--ghost {
          color: var(--ink); background: var(--surface); border: 1px solid var(--line);
        }
        .vs-btn--ghost:hover:not(:disabled) { background: var(--bg-2); border-color: var(--line-2); }

        @keyframes vsReveal { from { opacity:0; transform: scale(0.96) translateY(8px); } to { opacity:1; transform: none; } }
        @keyframes vsDropdown { from { opacity:0; transform: translateY(-4px) scale(0.98); } to { opacity:1; transform: none; } }
      `}</style>

      <div className="max-w-[1100px] mx-auto space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center">
                <Shield className="w-4 h-4 text-[var(--ink)]" />
              </div>
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">User Management</h1>
            </div>
            <p className="text-[14px] text-[var(--muted)] ml-11">Kelola hak akses untuk Admin dan Staff di platform ini.</p>
          </div>
          
          <button className="vs-btn vs-btn--primary" onClick={openAdd}>
            <UserPlus className="w-4 h-4" /> Tambah Pengguna
          </button>
        </div>

        {/* Tabel Data Pengguna */}
        <div className="vs-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[var(--bg-2)] border-b border-[var(--line)]">
                  {['Nama', 'Email', 'Role', 'Ditugaskan', 'Terakhir Login', 'Status', 'Aksi'].map(h => (
                    <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--line-soft)] bg-[var(--surface)]">
                {profiles.map(u => (
                  <tr key={u.id} className="hover:bg-[var(--bg)] transition-colors group">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center text-[11px] font-semibold text-[var(--muted)] uppercase">
                          {u.full_name.split(' ').map(n => n[0]).join('').slice(0,2)}
                        </div>
                        <span className="text-[13px] font-medium text-[var(--ink)]">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[var(--muted)]">{u.email}</td>
                    <td className="px-5 py-3.5">
                      <span className={`vs-tag ${u.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border-indigo-100' : 'bg-[var(--bg-2)] text-[var(--muted)] border-[var(--line)]'}`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-[13px] text-[var(--ink)] font-semibold tabular-nums">
                      {u.role === 'admin' ? '—' : (u.assigned_count ?? 0)}
                    </td>
                    <td className="px-5 py-3.5 text-[12px] text-[var(--muted)] mono">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : 'Belum pernah'}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`vs-tag ${u.is_active ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-[var(--bg-2)] text-[var(--muted-3)] border-[var(--line-soft)]'}`}>
                        {u.is_active ? 'Aktif' : 'Nonaktif'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1">
                        <button onClick={() => openEdit(u)} className="p-1.5 rounded-md hover:bg-[var(--bg-2)] text-[var(--muted-3)] hover:text-[var(--ink)] transition-colors" title="Edit">
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button onClick={() => handleToggleActive(u)} className={`p-1.5 rounded-md transition-colors ${u.is_active ? 'hover:bg-red-50 text-[var(--muted-3)] hover:text-[var(--danger)]' : 'hover:bg-emerald-50 text-[var(--muted-3)] hover:text-[var(--success)]'}`} title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}>
                          {u.is_active ? <ToggleRight className="w-4 h-4" /> : <ToggleLeft className="w-4 h-4" />}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <InlineModal isOpen={addModal} onClose={() => setAddModal(false)} title="Tambah Pengguna Baru">
        <FormFields onCancel={() => setAddModal(false)} />
      </InlineModal>

      <InlineModal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Profil Pengguna">
        <FormFields onCancel={() => setEditModal(false)} />
      </InlineModal>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}