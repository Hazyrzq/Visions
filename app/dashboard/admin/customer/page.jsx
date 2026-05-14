'use client';

import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Trash2, Users, Search, AlertTriangle, Activity, DollarSign, Filter, ChevronLeft, ChevronRight, TrendingDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion';
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

  // state untuk filter
  const [riskFilter, setRiskFilter] = useState('Semua');
  const [planFilter, setPlanFilter] = useState('Semua');

  // state untuk pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(100);

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
      // INI NARIK DATA ASLI DARI DATABASE SUPABASE
      const { data, error } = await supabase
        .from('customers')
        .select('*, staff:profiles!customers_assigned_to_fkey(full_name)')
        .order('customer_id', { ascending: true }); // urut dari C0001
      
      setCustomers(error || !data?.length ? mockCustomers : data);
      setLoading(false);
    };
    fetch();
  }, [profile]);

  // format currency ke dollar dengan 2 angka di belakang koma (contoh: $1,234.50)
  const formatCurrency = (val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return '$0.00';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(num);
  };

  const planOptions = ['Semua', ...Array.from(new Set(customers.map(c => c.plan_type).filter(Boolean)))];

  // logic filter data
  const filtered = customers.filter((c) => {
    const matchSearch = c.company_name?.toLowerCase().includes(search.toLowerCase()) || 
                        c.customer_id?.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'Semua' || c.risk_level === riskFilter;
    const matchPlan = planFilter === 'Semua' || c.plan_type === planFilter;
    
    return matchSearch && matchRisk && matchPlan;
  });

  // hitung pagination setelah filter
  const totalPages = Math.ceil(filtered.length / rowsPerPage);
  const startIndex = (currentPage - 1) * rowsPerPage;
  const paginatedData = filtered.slice(startIndex, startIndex + rowsPerPage);

  // reset ke halaman 1 kalau filter berubah
  useEffect(() => {
    setCurrentPage(1);
  }, [search, riskFilter, planFilter, rowsPerPage]);

  const toggleAll = () =>
    setSelectedIds((prev) => (prev.length === paginatedData.length ? [] : paginatedData.map((c) => c.id)));
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

  // style ekspresif buat tipe customer
  const getTypeStyle = (type) => {
    const t = (type || '').toLowerCase();
    if (t.includes('b2b') || t.includes('business')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (t.includes('b2c') || t.includes('consumer')) return 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200';
    if (t.includes('enterprise')) return 'bg-slate-800 text-slate-100 border-slate-700';
    return 'bg-slate-100 text-slate-600 border-slate-200';
  };

  // hitung kpi baru (revenue at risk = total mrr dari yang risk nya tinggi)
  const revenueAtRisk = filtered
    .filter(c => c.risk_level === 'Tinggi')
    .reduce((acc, c) => acc + (parseFloat(c.mrr) || 0), 0);

  const highRiskCount = filtered.filter(c => c.risk_level === 'Tinggi').length;
  const avgChurnScore = filtered.length 
    ? Math.round(filtered.reduce((acc, c) => acc + (c.churn_score || 0), 0) / filtered.length) 
    : 0;

  return (
    <DashboardShell
      title="Pelanggan"
      description="Pantau seluruh pelanggan, kelola risiko churn, dan awasi MRR mereka."
      icon={Users}
      actions={(
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="shrink-0 gap-2">
              <Trash2 className="h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
        </div>
      )}
    >
      <motion.div variants={stagger} className="space-y-6">
        
        {/* bagian kpi */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div variants={fadeUp} className="vs-card p-5 border-l-4 border-l-[var(--vs-brand)]">
            <div className="text-[12px] font-semibold text-[var(--vs-muted-2)] flex items-center gap-1.5 mb-2">
              <Users className="w-4 h-4 text-[var(--vs-brand)]" /> Total Pelanggan
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-[var(--vs-ink)]">
              {loading ? '-' : filtered.length}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="vs-card p-5 border-l-4 border-l-red-600 bg-red-50/30">
            <div className="text-[12px] font-semibold text-red-700 flex items-center gap-1.5 mb-2">
              <TrendingDown className="w-4 h-4 text-red-600" /> Revenue at Risk
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-red-700 truncate" title={formatCurrency(revenueAtRisk)}>
              {loading ? '-' : formatCurrency(revenueAtRisk)}
            </div>
            <div className="text-[10px] text-red-500 mt-1 font-medium">Dari pelanggan risiko tinggi</div>
          </motion.div>

          <motion.div variants={fadeUp} className="vs-card p-5 border-l-4 border-l-orange-500">
            <div className="text-[12px] font-semibold text-[var(--vs-muted-2)] flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-4 h-4 text-orange-500" /> Risiko Tinggi
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-orange-600">
              {loading ? '-' : highRiskCount}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} className="vs-card p-5 border-l-4 border-l-amber-500">
            <div className="text-[12px] font-semibold text-[var(--vs-muted-2)] flex items-center gap-1.5 mb-2">
              <Activity className="w-4 h-4 text-amber-500" /> Avg. Churn Score
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-amber-600">
              {loading ? '-' : `${avgChurnScore}%`}
            </div>
          </motion.div>
        </div>

        {/* control panel search & filter */}
        <motion.div variants={fadeUp} className="bg-white p-3.5 rounded-2xl border border-[var(--vs-line)] shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="relative w-full md:w-[300px]">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vs-muted-3)]" />
            <Input
              placeholder="Cari nama atau ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-[var(--vs-line)] bg-[var(--vs-bg)] pl-9 w-full focus:border-[var(--vs-brand-200)]"
            />
          </div>
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-500">
              <Filter className="w-4 h-4" /> Filter:
            </div>
            <select
              value={riskFilter}
              onChange={(e) => setRiskFilter(e.target.value)}
              className="border border-[var(--vs-line)] bg-[var(--vs-bg)] rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 focus:outline-none focus:border-[var(--vs-brand)] cursor-pointer"
            >
              <option value="Semua">Semua Risiko</option>
              <option value="Tinggi">Risiko Tinggi</option>
              <option value="Sedang">Risiko Sedang</option>
              <option value="Rendah">Risiko Rendah</option>
            </select>
            <select
              value={planFilter}
              onChange={(e) => setPlanFilter(e.target.value)}
              className="border border-[var(--vs-line)] bg-[var(--vs-bg)] rounded-xl px-3 py-2 text-[13px] font-medium text-slate-700 focus:outline-none focus:border-[var(--vs-brand)] cursor-pointer"
            >
              {planOptions.map(p => (
                <option key={p} value={p}>{p === 'Semua' ? 'Semua Paket' : p}</option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* tabel data pelanggan */}
        <motion.div variants={fadeUp} className="vs-card overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-16">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
            </div>
          ) : paginatedData.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-[var(--vs-bg-2)]">
                <Search className="h-5 w-5 text-[var(--vs-muted-3)]" />
              </div>
              <div className="mb-1 text-[14px] font-semibold text-[var(--vs-ink)]">Tidak ada pelanggan</div>
              <div className="text-[12px] text-[var(--vs-muted-2)]">Tidak ada data yang cocok.</div>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-[var(--vs-line)] bg-[var(--vs-bg)]">
                      <th className="w-10 px-5 py-3.5 text-center">
                        <input
                          type="checkbox"
                          className="h-4 w-4 cursor-pointer rounded accent-[var(--vs-brand)]"
                          checked={selectedIds.length > 0 && selectedIds.length === paginatedData.length}
                          onChange={toggleAll}
                        />
                      </th>
                      {['Pelanggan', 'Tipe', 'Paket', 'MRR', 'Churn Score', 'Risk Level', 'Assigned', 'Aksi'].map((h) => (
                        <th key={h} className="whitespace-nowrap px-3 py-3.5 text-[11px] font-semibold uppercase tracking-wider text-[var(--vs-muted-2)]">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--vs-line-soft)]">
                    {paginatedData.map((c) => {
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
                              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[var(--vs-line)] bg-[var(--vs-bg-2)] text-[11px] font-bold uppercase text-[var(--vs-muted)]">
                                {c.company_name?.substring(0, 2) || '??'}
                              </div>
                              <div className="min-w-0">
                                <div className="text-[13px] font-semibold text-[var(--vs-ink)] transition-colors hover:text-[var(--vs-brand)] truncate max-w-[140px]">
                                  {c.company_name}
                                </div>
                                <div className="mt-0.5 font-mono text-[11px] text-[var(--vs-muted-3)]">{c.customer_id}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className={`px-2 py-1 rounded border text-[10px] font-bold tracking-wide uppercase ${getTypeStyle(c.customer_type)}`}>
                              {c.customer_type || 'Unknown'}
                            </span>
                          </td>
                          <td className="px-3 py-3.5 text-[13px] text-[var(--vs-muted)] whitespace-nowrap">{c.plan_type}</td>
                          <td className="px-3 py-3.5 text-[12px] font-mono font-medium text-slate-700 whitespace-nowrap">
                            {formatCurrency(c.mrr)}
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <span className={`text-[13px] font-bold tabular-nums ${c.churn_score > 70 ? 'text-[var(--vs-danger)]' : c.churn_score > 40 ? 'text-[var(--vs-warn)]' : 'text-[var(--vs-success)]'}`}>
                                {c.churn_score}%
                              </span>
                              {c.churn_score > 70 && <AlertTriangle className="h-3.5 w-3.5 text-[var(--vs-danger)]" />}
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className={riskTag(c.risk_level)}>{c.risk_level}</span>
                          </td>
                          <td className="px-3 py-3.5 text-[12px] text-[var(--vs-muted)]">
                            {c.staff?.full_name ? (
                              <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-[var(--vs-brand)] shrink-0" />
                                <span className="truncate max-w-[90px]">{c.staff.full_name}</span>
                              </div>
                            ) : (
                              <span className="italic text-[var(--vs-muted-3)]">Unassigned</span>
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

              {/* pagination controls */}
              <div className="p-4 border-t border-[var(--vs-line)] bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <span className="text-[12px] text-[var(--vs-muted-2)] font-medium">Tampilkan:</span>
                  <select
                    value={rowsPerPage}
                    onChange={(e) => setRowsPerPage(Number(e.target.value))}
                    className="border border-[var(--vs-line)] bg-white rounded-lg px-2 py-1 text-[12px] font-bold focus:outline-none focus:border-[var(--vs-brand)]"
                  >
                    <option value={50}>50 Row</option>
                    <option value={100}>100 Row</option>
                    <option value={250}>250 Row</option>
                  </select>
                  <span className="text-[12px] text-[var(--vs-muted-2)] italic">
                    Menampilkan {startIndex + 1} - {Math.min(startIndex + rowsPerPage, filtered.length)} dari {filtered.length}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage(prev => prev - 1)}
                    className="h-8 px-2 gap-1"
                  >
                    <ChevronLeft className="w-4 h-4" /> Prev
                  </Button>
                  <div className="flex items-center gap-1">
                    <span className="text-[12px] font-semibold px-3 py-1 bg-white border border-[var(--vs-line)] rounded-lg">
                      Page {currentPage} / {totalPages}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage(prev => prev + 1)}
                    className="h-8 px-2 gap-1"
                  >
                    Next <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          )}
        </motion.div>
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