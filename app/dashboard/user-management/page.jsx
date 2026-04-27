'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { UserPlus, Edit2, ToggleLeft, ToggleRight } from 'lucide-react';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useAuth } from '@/lib/hooks/useAuth';
import { mockProfiles } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';

export default function UserManagementPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const { toasts, toast, remove } = useToast();

  const [profiles, setProfiles] = useState([]);
  const [addModal, setAddModal] = useState(false);
  const [editModal, setEditModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ full_name: '', email: '', role: 'staff', password: '' });

  useEffect(() => { if (!loading && !isAdmin) router.replace('/dashboard'); }, [isAdmin, loading, router]);

  useEffect(() => {
    supabase.from('profiles').select('*').order('role').order('full_name')
      .then(({ data }) => setProfiles(data?.length ? data : mockProfiles));
  }, []);

  if (loading || !isAdmin) return null;

  const openEdit = (user) => { setSelectedUser(user); setForm({ full_name: user.full_name, email: user.email, role: user.role, password: '' }); setEditModal(true); };
  const openAdd  = () => { setSelectedUser(null); setForm({ full_name: '', email: '', role: 'staff', password: '' }); setAddModal(true); };

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

  const FormFields = () => (
    <div className="p-5 space-y-4">
      {[
        { label: 'Nama Lengkap', key: 'full_name', type: 'text', placeholder: 'Nama lengkap' },
        { label: 'Email', key: 'email', type: 'email', placeholder: 'email@perusahaan.com' },
      ].map(f => (
        <div key={f.key}>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">{f.label}</label>
          <input
            type={f.type}
            value={form[f.key]}
            onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
            placeholder={f.placeholder}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      ))}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Role</label>
        <select
          value={form.role}
          onChange={e => setForm(prev => ({ ...prev, role: e.target.value }))}
          className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
        >
          <option value="staff">Staff</option>
          <option value="admin">Admin</option>
        </select>
      </div>
      {!selectedUser && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Password</label>
          <input
            type="password"
            value={form.password}
            onChange={e => setForm(prev => ({ ...prev, password: e.target.value }))}
            placeholder="Min. 8 karakter"
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      )}
      <div className="flex gap-3 pt-2">
        <Button variant="secondary" size="md" className="flex-1" onClick={() => { setAddModal(false); setEditModal(false); }}>Batal</Button>
        <Button variant="primary" size="md" className="flex-1" loading={saving} onClick={handleSave}>
          {selectedUser ? 'Simpan' : 'Tambah'}
        </Button>
      </div>
    </div>
  );

  return (
    <>
      <div className="max-w-[1100px] space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-gray-900">User Management</h2>
            <p className="text-sm text-gray-400 mt-0.5">Kelola akun admin dan staff</p>
          </div>
          <Button variant="primary" size="md" onClick={openAdd}>
            <UserPlus className="w-4 h-4" /> Tambah Pengguna
          </Button>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Nama','Email','Role','Ditugaskan','Terakhir Login','Status','Aksi'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {profiles.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                          {u.full_name.split(' ').map(n=>n[0]).join('').slice(0,2)}
                        </div>
                        <span className="font-medium text-gray-900">{u.full_name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3.5 text-gray-500">{u.email}</td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.role === 'admin' ? 'admin' : 'staff'} className="capitalize">{u.role}</Badge>
                    </td>
                    <td className="px-4 py-3.5 text-gray-600 tabular-nums">{u.assigned_count ?? 0}</td>
                    <td className="px-4 py-3.5 text-gray-500 text-xs tabular-nums">
                      {u.last_login ? new Date(u.last_login).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3.5">
                      <Badge variant={u.is_active ? 'active' : 'inactive'}>{u.is_active ? 'Aktif' : 'Nonaktif'}</Badge>
                    </td>
                    <td className="px-4 py-3.5">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => openEdit(u)}
                          className="p-1.5 rounded-lg hover:bg-indigo-50 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Edit"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleToggleActive(u)}
                          className={`p-1.5 rounded-lg transition-colors ${u.is_active ? 'hover:bg-red-50 text-gray-400 hover:text-red-500' : 'hover:bg-emerald-50 text-gray-400 hover:text-emerald-500'}`}
                          title={u.is_active ? 'Nonaktifkan' : 'Aktifkan'}
                        >
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

      <Modal isOpen={addModal}  onClose={() => setAddModal(false)}  title="Tambah Pengguna Baru" size="sm"><FormFields /></Modal>
      <Modal isOpen={editModal} onClose={() => setEditModal(false)} title="Edit Pengguna"         size="sm"><FormFields /></Modal>
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
