'use client';

import { useLang } from '@/lib/i18n/LanguageContext';
import { Suspense, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Trash2, Users, Search, AlertTriangle, Activity, ChevronLeft, ChevronRight, TrendingDown, X, Download } from 'lucide-react';
import { motion } from 'framer-motion';
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
import { exportToCSV } from '@/lib/exportCsv';

function AdminCustomerInner() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const { profile } = useAuth();
  const { t, lang } = useLang();
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

  // Normalize risk_level — terima format lama (Tinggi/Sedang/Rendah)
  // maupun format baru (High/Medium/Low) dari database/ML model
  // Harus didefinisikan sebelum 'filtered' agar tidak ReferenceError
  const normalizeRisk = (lvl) => {
    if (!lvl) return 'Low';
    const v = lvl.trim();
    if (v === 'Tinggi' || v === 'High')   return 'High';
    if (v === 'Sedang' || v === 'Medium') return 'Medium';
    return 'Low';
  };

  const planOptions = ['Semua', ...Array.from(new Set(customers.map(c => c.plan_type).filter(Boolean)))];

  // logic filter data
  const filtered = customers.filter((c) => {
    const matchSearch = c.company_name?.toLowerCase().includes(search.toLowerCase()) || 
                        c.customer_id?.toLowerCase().includes(search.toLowerCase());
    const matchRisk = riskFilter === 'Semua' || normalizeRisk(c.risk_level) === riskFilter;
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

  const handleExport = () => {
    if (filtered.length === 0) {
      toast('Tidak ada data untuk di-export', 'warning');
      return;
    }
    exportToCSV(filtered, 'customers');
    toast(`${filtered.length} pelanggan berhasil di-export`, 'success');
  };

  const riskTag = (lvl) => {
    const n = normalizeRisk(lvl);
    if (n === 'High')   return 'vs-tag vs-tag--high';
    if (n === 'Medium') return 'vs-tag vs-tag--medium';
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

  // KPI: revenue at risk = total MRR dari semua pelanggan di list yang sedang ditampilkan (filtered)
  // Mengikuti filter search + plan + risk yang aktif
  const revenueAtRisk = filtered
    .reduce((acc, c) => acc + (parseFloat(c.mrr) || 0), 0);

  // highRiskCount tetap hitung hanya yang High dari filtered
  const highRiskCount = filtered.filter(c => normalizeRisk(c.risk_level) === 'High').length;
  const avgChurnScore = filtered.length 
    ? Math.round(filtered.reduce((acc, c) => acc + (c.churn_score || 0), 0) / filtered.length) 
    : 0;

  return (
    <DashboardShell
      title={t('data.title')}
      description="Pantau seluruh pelanggan, kelola risiko churn, dan awasi MRR mereka."
      icon={Users}
      actions={(
        <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
          <Button onClick={handleExport} variant="outline" className="shrink-0 gap-2">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
          {selectedIds.length > 0 && (
            <Button variant="destructive" onClick={handleBulkDelete} className="shrink-0 gap-2">
              <Trash2 className="h-4 w-4" /> Hapus ({selectedIds.length})
            </Button>
          )}
        </div>
      )}
    >
      <div className="space-y-6">

        {/* bagian kpi */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.05, ease:[0.16,1,0.3,1] }} className="vs-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
                <Users className="w-4 h-4 text-blue-600" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-[var(--vs-ink)]">
              {loading ? '-' : filtered.length}
            </div>
            <div className="text-[12px] font-medium text-[var(--vs-muted-2)] mt-1">Total Pelanggan</div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.12, ease:[0.16,1,0.3,1] }} className="vs-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-red-50">
                <TrendingDown className="w-4 h-4 text-red-500" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-red-600 truncate" title={formatCurrency(revenueAtRisk)}>
              {loading ? '-' : formatCurrency(revenueAtRisk)}
            </div>
            <div className="text-[12px] font-medium text-[var(--vs-muted-2)] mt-1">Pendapatan Berisiko</div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.19, ease:[0.16,1,0.3,1] }} className="vs-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-orange-50">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-orange-600">
              {loading ? '-' : highRiskCount}
            </div>
            <div className="text-[12px] font-medium text-[var(--vs-muted-2)] mt-1">Risiko Tinggi</div>
          </motion.div>

          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.26, ease:[0.16,1,0.3,1] }} className="vs-card p-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-50">
                <Activity className="w-4 h-4 text-amber-500" />
              </div>
            </div>
            <div className="text-2xl lg:text-3xl font-bold text-amber-600">
              {loading ? '-' : `${avgChurnScore}%`}
            </div>
            <div className="text-[12px] font-medium text-[var(--vs-muted-2)] mt-1">Rata-rata Skor Churn</div>
          </motion.div>
        </div>

        {/* control panel search & filter */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.33, ease:[0.16,1,0.3,1] }} className="bg-white p-3.5 rounded-2xl border border-[var(--vs-line)] shadow-sm flex flex-wrap items-center gap-3">
          {/* Search */}
          <div className="relative w-[220px] shrink-0">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--vs-muted-3)]" />
            <Input
              placeholder="Cari nama atau ID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="border-[var(--vs-line)] bg-[var(--vs-bg)] pl-9 w-full focus:border-[var(--vs-brand-200)]"
            />
          </div>

          <div className="h-6 w-px bg-slate-200 shrink-0" />

          {/* Risk pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Risiko</span>
            {['Semua', 'Tinggi', 'Sedang', 'Rendah'].map((r) => {
              const active = riskFilter === r;
              const dot = r === 'High' ? 'bg-red-500' : r === 'Medium' ? 'bg-amber-500' : r === 'Low' ? 'bg-emerald-500' : null;
              return (
                <button key={r} onClick={() => setRiskFilter(r)}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold transition-all border ${
                    active ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800'
                  }`}>
                  {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
                  {r}
                </button>
              );
            })}
          </div>

          <div className="h-6 w-px bg-slate-200 shrink-0" />

          {/* Plan pills */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider shrink-0">Paket</span>
            {planOptions.map((p) => (
              <button key={p} onClick={() => setPlanFilter(p)}
                className={`rounded-full px-3 py-1 text-[12px] font-semibold transition-all border ${
                  planFilter === p ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border-slate-200 hover:border-slate-400 hover:text-slate-800'
                }`}>
                {p}
              </button>
            ))}
          </div>

          {/* Reset */}
          {(riskFilter !== 'Semua' || planFilter !== 'Semua') && (
            <button onClick={() => { setRiskFilter('Semua'); setPlanFilter('Semua'); }}
              className="ml-auto flex items-center gap-1 text-[12px] font-medium text-slate-400 hover:text-slate-700 transition-colors shrink-0">
              <X className="w-3.5 h-3.5" /> Reset
            </button>
          )}
        </motion.div>

        {/* tabel data pelanggan */}
        <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.4, ease:[0.16,1,0.3,1] }} className="vs-card overflow-hidden">
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
                      {['Pelanggan', 'Tipe', 'Paket', 'MRR', 'Skor Churn', 'Tingkat Risiko', 'Ditugaskan', 'Aksi'].map((h) => (
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
                        <tr
                          key={c.id}
                          onClick={() => openDetail(c.id)}
                          className={`cursor-pointer transition-colors ${sel ? 'bg-[var(--vs-brand-50)]' : 'hover:bg-[var(--vs-bg)]'}`}
                        >
                          <td
                            className="px-5 py-3.5 text-center"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <input
                              type="checkbox"
                              className="h-4 w-4 cursor-pointer accent-[var(--vs-brand)]"
                              checked={sel}
                              onChange={() => toggleOne(c.id)}
                            />
                          </td>
                          <td className="px-3 py-3.5">
                            <div className="flex items-center gap-3">
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
                              <span className={`text-[13px] font-bold tabular-nums ${c.churn_score >= 70 ? 'text-[var(--vs-danger)]' : c.churn_score >= 30 ? 'text-[var(--vs-warn)]' : 'text-[var(--vs-success)]'}`}>
                                {c.churn_score}%
                              </span>
                              {c.churn_score >= 70 && <AlertTriangle className="h-3.5 w-3.5 text-[var(--vs-danger)]" />}
                            </div>
                          </td>
                          <td className="px-3 py-3.5">
                            <span className={riskTag(c.risk_level)}>{normalizeRisk(c.risk_level)}</span>
                          </td>
                          <td className="px-3 py-3.5 text-[12px] text-[var(--vs-muted)]">
                            {c.staff?.full_name ? (
                              <div className="flex items-center gap-1.5">
                                <div className="h-2 w-2 rounded-full bg-[var(--vs-brand)] shrink-0" />
                                <span className="truncate max-w-[90px]">{c.staff.full_name}</span>
                              </div>
                            ) : (
                              <span className="italic text-[var(--vs-muted-3)]">Belum Ditugaskan</span>
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
                        </tr>
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
      </div>

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