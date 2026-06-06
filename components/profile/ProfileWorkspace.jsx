'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { ArrowLeft, Mail, Pencil, Shield, User, X, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, pageVariants } from '@/lib/motion';
import { useAuth } from '@/lib/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Input } from '@/components/ui/input';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { useLang } from '@/lib/i18n/LanguageContext';

function initials(name) {
  if (!name) return '?';
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0])
    .join('')
    .toUpperCase();
}

// ✅ PERBAIKAN 1: Tambahkan parameter 't' di sini
function roleBadgeLabel(role, t) {
  if (role === 'admin') return t('role.admin');
  if (role === 'staff') return t('role.staff');
  return role ?? '—';
}

/**
 * @param {{ dashboardHome: string }} props
 */
function ProfileWorkspaceContent({ dashboardHome }) {
  const { t } = useLang();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user, profile, refreshProfile } = useAuth();
  const { toasts, toast, remove } = useToast();
  const [editing, setEditing] = useState(false);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const editQueryApplied = useRef(false);

  useEffect(() => {
    if (profile?.full_name != null) setFullName(profile.full_name);
  }, [profile?.full_name]);

  useEffect(() => {
    if (editQueryApplied.current) return;
    if (searchParams.get('edit') === '1') {
      setEditing(true);
      editQueryApplied.current = true;
    }
  }, [searchParams]);

  const clearEditQuery = () => {
    const p = new URLSearchParams(searchParams.toString());
    p.delete('edit');
    const q = p.toString();
    router.replace(q ? `${pathname}?${q}` : pathname, { scroll: false });
  };

  const handleSave = async () => {
    const name = fullName.trim();
    if (!name) {
      toast('Nama tidak boleh kosong', 'error');
      return;
    }
    if (!user?.id) return;
    setSaving(true);
    const { error } = await supabase.from('profiles').update({ full_name: name }).eq('id', user.id);
    setSaving(false);
    if (error) {
      toast(error.message || 'Gagal menyimpan', 'error');
      return;
    }
    await refreshProfile();
    setEditing(false);
    clearEditQuery();
    toast(t('profileWorkspace.updateSuccess'), t('common.success'));
  };

  const handleCancel = () => {
    setFullName(profile?.full_name ?? '');
    setEditing(false);
    clearEditQuery();
  };

  return (
    <motion.div variants={pageVariants} initial="hidden" animate="visible" className="mx-auto max-w-xl space-y-8 pb-8">
      <motion.div variants={fadeUp}>
        <Link
          href={dashboardHome}
          className="group mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200/90 bg-white px-3 py-2 text-[13px] font-semibold text-slate-600 shadow-sm transition-colors hover:border-[var(--vs-brand-200)] hover:text-[var(--vs-brand)]"
        >
          <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          Kembali ke dashboard
        </Link>

        <div className="vs-card overflow-hidden p-0">
          <div className="border-b border-[var(--vs-line-soft)] bg-gradient-to-br from-[var(--vs-brand-50)] via-white to-[var(--vs-bg-2)] px-6 py-8 text-center sm:px-8 sm:py-10">
            <div className="mx-auto flex h-[100px] w-[100px] items-center justify-center rounded-full bg-gradient-to-br from-[var(--vs-brand)] to-blue-600 text-3xl font-bold text-white shadow-lg shadow-blue-500/30 ring-4 ring-white/90">
              {initials(profile?.full_name)}
            </div>
            <h1 className="mt-5 text-2xl font-bold tracking-tight text-[var(--vs-ink)] sm:text-[1.65rem]">
              {profile?.full_name ?? 'Pengguna'}
            </h1>
            <p className="mt-1 truncate text-[14px] font-medium text-[var(--vs-muted)]">{user?.email}</p>
            <span className="mt-4 inline-flex items-center rounded-full border border-[var(--vs-brand-100)] bg-white/80 px-3 py-1 text-[12px] font-semibold text-[var(--vs-brand)] shadow-sm">
              <Shield className="mr-1.5 h-3.5 w-3.5 opacity-80" />
              {/* ✅ Mengirim 't' ke pemanggil fungsi */}
              {roleBadgeLabel(profile?.role, t)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3 border-b border-[var(--vs-line-soft)] px-5 py-4 sm:px-6">
            <h2 className="text-[13px] font-bold uppercase tracking-wider text-[var(--vs-muted-2)]">Informasi akun</h2>
            {!editing ? (
              <button
                type="button"
                onClick={() => setEditing(true)}
                className="inline-flex items-center gap-2 rounded-full border border-[var(--vs-line)] bg-white px-3 py-1.5 text-[12px] font-semibold text-[var(--vs-ink)] shadow-sm transition-colors hover:border-[var(--vs-brand-200)] hover:text-[var(--vs-brand)]"
              >
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </button>
            ) : (
              <div className="flex flex-wrap items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={handleCancel}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 px-3 py-1.5 text-[12px] font-semibold text-slate-600 transition-colors hover:bg-slate-50 disabled:opacity-50"
                >
                  <X className="h-3.5 w-3.5" />
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  className="inline-flex items-center gap-1.5 rounded-full bg-[var(--vs-brand)] px-3 py-1.5 text-[12px] font-semibold text-white shadow-sm transition-opacity hover:opacity-95 disabled:opacity-50"
                >
                  <Check className="h-3.5 w-3.5" />
                  {saving ? 'Menyimpan…' : t('common.save')}
                </button>
              </div>
            )}
          </div>

          <div className="divide-y divide-[var(--vs-line-soft)] px-5 py-2 sm:px-6">
            <div className="flex gap-4 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[var(--vs-brand-50)] text-[var(--vs-brand)]">
                <User className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--vs-muted-2)]">{t('profileWorkspace.fullName')}</p>
                {editing ? (
                  <Input
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    className="mt-2 h-10 border-[var(--vs-line)] bg-[var(--vs-surface)] text-[14px] focus-visible:border-[var(--vs-brand-200)]"
                    placeholder="Nama Anda"
                    autoComplete="name"
                  />
                ) : (
                  <p className="mt-1.5 text-[15px] font-semibold text-[var(--vs-ink)]">{profile?.full_name ?? '—'}</p>
                )}
              </div>
            </div>

            <div className="flex gap-4 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
                <Mail className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--vs-muted-2)]">Email</p>
                <p className="mt-1.5 break-all text-[14px] font-medium text-[var(--vs-ink)]">{user?.email ?? '—'}</p>
                <p className="mt-1 text-[11px] leading-relaxed text-[var(--vs-muted-3)]">
                  {t('profileWorkspace.emailInfo')}
                </p>
              </div>
            </div>

            <div className="flex gap-4 py-4">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-600">
                <Shield className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                {/* ✅ PERBAIKAN 2: Mengganti translasi 'emailInfo' menjadi kunci yang benar (misal: 'role' atau 'peran') */}
                <p className="text-[11px] font-semibold uppercase tracking-wider text-[var(--vs-muted-2)]">{t('profileWorkspace.role') ?? 'Role'}</p>
                {/* ✅ Mengirim 't' ke pemanggil fungsi */}
                <p className="mt-1.5 text-[14px] font-semibold text-[var(--vs-ink)]">{roleBadgeLabel(profile?.role, t)}</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </motion.div>
  );
}

function ProfileWorkspaceFallback() {
  return (
    <div className="mx-auto flex max-w-xl justify-center py-20">
      <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
    </div>
  );
}

export default function ProfileWorkspace({ dashboardHome }) {
  return (
    <Suspense fallback={<ProfileWorkspaceFallback />}>
      <ProfileWorkspaceContent dashboardHome={dashboardHome} />
    </Suspense>
  );
}