'use client';
import { useState, useMemo } from 'react';
import { Search, Filter, Download, ChevronUp, ChevronDown } from 'lucide-react';
import RiskBadge from '@/components/dashboard/RiskBadge';
import ChurnScoreBar from '@/components/dashboard/ChurnScoreBar';
import CustomerModal from './CustomerModal';
import Button from '@/components/ui/Button';
import { TableSkeleton } from '@/components/ui/Skeleton';

const RISK_OPTIONS = ['Semua Risiko', 'Tinggi', 'Sedang', 'Rendah'];
const PLAN_OPTIONS = ['Semua Plan', 'Enterprise', 'Professional', 'Starter'];

export default function CustomerTable({ customers, loading }) {
  const [search, setSearch]           = useState('');
  const [riskFilter, setRiskFilter]   = useState('Semua Risiko');
  const [planFilter, setPlanFilter]   = useState('Semua Plan');
  const [sortKey, setSortKey]         = useState('churn_score');
  const [sortDir, setSortDir]         = useState('desc');
  const [selected, setSelected]       = useState(null);
  const [modalOpen, setModalOpen]     = useState(false);

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let data = [...customers];
    if (search)                           data = data.filter(c => c.company_name.toLowerCase().includes(search.toLowerCase()) || c.customer_id.toLowerCase().includes(search.toLowerCase()));
    if (riskFilter !== 'Semua Risiko')    data = data.filter(c => c.risk_level === riskFilter);
    if (planFilter !== 'Semua Plan')      data = data.filter(c => c.plan_type === planFilter);
    data.sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return data;
  }, [customers, search, riskFilter, planFilter, sortKey, sortDir]);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp className="w-3.5 h-3.5 text-gray-300" />;
    return sortDir === 'asc' ? <ChevronUp className="w-3.5 h-3.5 text-indigo-500" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-500" />;
  };

  const Th = ({ col, label, className = '' }) => (
    <th
      className={`px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide cursor-pointer hover:text-gray-800 select-none whitespace-nowrap ${className}`}
      onClick={() => col && handleSort(col)}
    >
      <div className="flex items-center gap-1">
        {label}
        {col && <SortIcon col={col} />}
      </div>
    </th>
  );

  return (
    <>
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari nama / ID pelanggan…"
            className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          />
        </div>

        <div className="flex gap-2">
          <div className="relative">
            <Filter className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select
              value={riskFilter}
              onChange={e => setRiskFilter(e.target.value)}
              className="pl-8 pr-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
            >
              {RISK_OPTIONS.map(o => <option key={o}>{o}</option>)}
            </select>
          </div>
          <select
            value={planFilter}
            onChange={e => setPlanFilter(e.target.value)}
            className="px-3 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white appearance-none cursor-pointer"
          >
            {PLAN_OPTIONS.map(o => <option key={o}>{o}</option>)}
          </select>
          <Button variant="secondary" size="md" className="gap-2 whitespace-nowrap">
            <Download className="w-4 h-4" /> Export
          </Button>
        </div>
      </div>

      {/* Count */}
      <div className="text-xs text-gray-400 mb-3">{filtered.length} pelanggan ditemukan</div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={6} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  <Th col="customer_id" label="ID" />
                  <Th col="company_name" label="Pelanggan" />
                  <Th col="plan_type" label="Plan" />
                  <Th col="churn_score" label="Churn Score" />
                  <Th col="risk_level" label="Risiko" />
                  <Th col="monthly_usage_hrs" label="Usage" />
                  <Th col="open_tickets" label="Tiket" />
                  <Th col="nps_latest" label="NPS" />
                  <Th col="days_since_login" label="Last Login" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-gray-400 text-sm">Tidak ada data ditemukan</td></tr>
                ) : filtered.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => { setSelected(c); setModalOpen(true); }}
                    className="hover:bg-indigo-50/40 cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{c.customer_id}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{c.company_name}</div>
                      <div className="text-[11px] text-gray-400">{c.assigned_name ?? 'Unassigned'}</div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded-lg text-xs font-medium">{c.plan_type}</span>
                    </td>
                    <td className="px-4 py-3 min-w-[130px]">
                      <ChurnScoreBar score={c.churn_score} />
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={c.risk_level} /></td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{c.monthly_usage_hrs} jam</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{c.open_tickets}</td>
                    <td className="px-4 py-3 text-gray-700 tabular-nums">{c.nps_latest}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs tabular-nums">{c.days_since_login}h lalu</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <CustomerModal customer={selected} isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
