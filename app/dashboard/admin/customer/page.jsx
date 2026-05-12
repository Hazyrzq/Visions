'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Trash2, Users, Search, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp } from '@/lib/motion';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/hooks/useAuth';
import { mockCustomers } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import { supabase } from '@/lib/supabase';
import { useConfirm } from '@/components/ui/ConfirmProvider';
import DashboardShell from '@/components/dashboard/DashboardShell';
import CustomerDetailDrawer from '@/components/customer/CustomerDetailDrawer';
import { hrefWithCustomerDetail, hrefWithoutCustomerDetail } from '@/lib/customerDetailNav';

function AdminCustomerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { profile } = useAuth();
  const { toasts, toast, remove } = useToast();
  const confirm = useConfirm();

  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState([]);

  const idFromUrl = searchParams.get('detail');
  const [drawerCustomerId, setDrawerCustomerId] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (idFromUrl) {
      setDrawerCustomerId(idFromUrl);
      setDrawerOpen(true);
    } else {
      setDrawerOpen(false);
    }
  }, [idFromUrl]);

  useEffect(() => {
    if (!profile) return;
    const fetch = async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, staff:profiles!customers_assigned_to_fkey(full_name)')
        .order('churn_score', { ascending: false });
      setCustomers(error || !data?.length ? mockCustomers : data);
      setLoading(false);
    };
    fetch();
  }, [profile]);

  const filtered = customers.filter(
    (c) =>
      c.company_name?.toLowerCase().includes(search.toLowerCase()) ||
      c.customer_id?.toLowerCase().includes(search.toLowerCase())
  );

  const toggleAll = () =>
    setSelectedIds((prev) => (prev.length === filtered.length ? [] : filtered.map((c) => c.id)));
  const toggleOne = (id) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const openDetail = (id) => {
    router.replace(hrefWithCustomerDetail(pathname, searchParams, id), { scroll: false });
  };

  const closeDetail = () => {
    router.replace(hrefWithoutCustomerDetail(pathname, searchParams), { scroll: false });
  };

  const handleDelete = async (id, name) => {
    const ok = await confirm({
      title: 'Hapus Pelanggan',
      message: `Yakin hapus ${name}?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      variant: 'destructive',
    });
    if (!ok) return;
    const { error } = await supabase.from('customers').delete().eq('id', id);
    if (error) {
      toast('Gagal menghapus', 'error');
      return;
    }
    setCustomers((prev) => prev.filter((c) => c.id !== id));
    setSelectedIds((prev) => prev.filter((x) => x !== id));
    toast(`${name} berhasil dihapus`, 'success');
  };

  const handleBulkDelete = async () => {
    const ok = await confirm({
      title: 'Hapus Massal',
      message: `Hapus ${selectedIds.length} pelanggan?`,
      confirmText: 'Hapus',
      cancelText: 'Batal',
      variant: 'destructive',
    });
    if (!ok) return;
    const { error } = await supabase.from('customers').delete().in('id', selectedIds);
    if (error) {
      toast('Gagal menghapus', 'error');
      return;
    }
    setCustomers((prev) => prev.filter((c) => !selectedIds.includes(c.id)));
    toast(`${selectedIds.length} pelanggan dihapus`, 'success');
    setSelectedIds([]);
  };

  const riskTag = (lvl) => {
    if (lvl === 'Tinggi') return 'vs-tag vs-tag--high';
    if (lvl === 'Sedang') return 'vs-tag vs-tag--medium';
    return 'vs-tag vs-tag--low';
  };

  return (
    <DashboardShell
      title="Pelanggan"
      description="Pantau seluruh pelanggan dan kelola risiko churn mereka."
      icon={Users}
      actions={(
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="shrink-0 gap-2">
              <Trash2 className="h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
          <div className="relative w-full sm:w-[240px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vs-muted-3)]" />
            <Input
              placeholder="Cari nama atau ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-[var(--vs-line)] bg-[var(--vs-surface)] pl-9 focus:border-[var(--vs-brand-200)]"
            />
          </div>
        </div>
      )}
    >
      <motion.div variants={fadeUp}>
        {loading ? (
          <div className="flex items-center justify-center p-16">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vs-bg-2)]">
              <Search className="h-5 w-5 text-[var(--vs-muted-3)]" />
            </div>
            <div className="mb-1 text-[14px] font-semibold text-[var(--vs-ink)]">Tidak ada pelanggan</div>
            <div className="text-[12px] text-[var(--vs-muted-2)]">{search ? 'Tidak ada yang cocok.' : 'Belum ada data pelanggan.'}</div>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-[var(--vs-line)] bg-[var(--vs-bg)]">
                  <th className="w-10 px-5 py-3.5 text-center">
                    <input
                      type="checkbox"
                      className="h-4 w-4 cursor-pointer rounded accent-[var(--vs-brand)]"
                      checked={selectedIds.length > 0 && selectedIds.length === filtered.length}
                      onChange={toggleAll}
                    />
                  </th>
                  {['Pelanggan', 'Paket', 'Churn Score', 'Risk Level', 'Assigned', 'Aksi'].map((h) => (
                    <th key={h} className="whitespace-nowrap px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--vs-muted-2)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--vs-line-soft)]">
                {filtered.map((c) => {
                  const sel = selectedIds.includes(c.id);
                  return (
                    <motion.tr
                      key={c.id}
                      layout
                      onClick={() => openDetail(c.id)}
                      className={`cursor-pointer transition-colors ${sel ? 'bg-[var(--vs-brand-50)]' : 'hover:bg-[var(--vs-bg)]'}`}
                    >
                      <td className="px-5 py-3.5 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer accent-[var(--vs-brand)]"
                          checked={sel}
                          onChange={(e) => {
                            e.stopPropagation();
                            toggleOne(c.id);
                          }}
                        />
                      </td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--vs-line)] bg-[var(--vs-bg-2)] text-[11px] font-bold uppercase text-[var(--vs-muted)]">
                            {c.company_name?.substring(0, 2) || '??'}
                          </div>
                          <div>
                            <div className="text-[13px] font-semibold text-[var(--vs-ink)] transition-colors hover:text-[var(--vs-brand)]">
                              {c.company_name}
                            </div>
                            <div className="mt-0.5 font-mono text-[11px] text-[var(--vs-muted-3)]">{c.customer_id}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 py-3.5 text-[13px] text-[var(--vs-muted)]">{c.plan_type}</td>
                      <td className="px-3 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[13px] font-bold tabular-nums ${c.churn_score > 70 ? 'text-[var(--vs-danger)]' : c.churn_score > 40 ? 'text-[var(--vs-warn)]' : 'text-[var(--vs-success)]'}`}
                          >
                            {c.churn_score}
                          </span>
                          {c.churn_score > 70 && <AlertTriangle className="h-3.5 w-3.5 text-[var(--vs-danger)]" />}
                        </div>
                      </td>
                      <td className="px-3 py-3.5">
                        <span className={riskTag(c.risk_level)}>{c.risk_level}</span>
                      </td>
                      <td className="px-3 py-3.5 text-[13px] text-[var(--vs-muted)]">
                        {c.staff?.full_name ? (
                          <div className="flex items-center gap-1.5">
                            <div className="h-2 w-2 rounded-full bg-[var(--vs-brand)]" />
                            {c.staff.full_name}
                          </div>
                        ) : (
                          <span className="italic text-[var(--vs-muted-3)]">Belum di-assign</span>
                        )}
                      </td>
                      <td className="px-3 py-3.5">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(c.id, c.company_name);
                          }}
                          className="rounded-md p-1.5 text-[var(--vs-muted-3)] transition-colors hover:bg-red-50 hover:text-[var(--vs-danger)]"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      <ToastContainer toasts={toasts} onRemove={remove} />

      <CustomerDetailDrawer
        open={drawerOpen}
        customerId={drawerCustomerId}
        onClose={closeDetail}
        onExitComplete={() => setDrawerCustomerId(null)}
      />
    </DashboardShell>
  );
}

function AdminCustomerFallback() {
  return (
    <DashboardShell title="Pelanggan" description="Memuat…" icon={Users}>
      <div className="flex items-center justify-center p-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
      </div>
    </DashboardShell>
  );
}

export default function AdminCustomerPage() {
  return (
    <Suspense fallback={<AdminCustomerFallback />}>
      <AdminCustomerInner />
    </Suspense>
  );
}
