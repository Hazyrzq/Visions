'use client';
import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';
import RiskBadge from '@/components/dashboard/RiskBadge';
import ChurnScoreBar from '@/components/dashboard/ChurnScoreBar';
import { TableSkeleton } from '@/components/ui/Skeleton';
import { useLang } from '@/lib/i18n/LanguageContext';

export default function CustomerTable({ customers, loading, onCustomerOpen }) {
  const { t, lang } = useLang();
  const router = useRouter();

  const [search, setSearch]       = useState('');
  const [riskFilter, setRiskFilter] = useState('Semua');
  const [planFilter, setPlanFilter] = useState('Semua');
  const [sortKey, setSortKey]     = useState('churn_score');
  const [sortDir, setSortDir]     = useState('desc');

  const riskOptions = [
    { value: 'Semua', label: t('customer.all') },
    { value: 'Tinggi', label: t('customer.high') },
    { value: 'Sedang', label: t('customer.medium') },
    { value: 'Rendah', label: t('customer.low') }
  ];

  const handleSort = (key) => {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let data = [...customers];
    if (search) data = data.filter(c => c.company_name.toLowerCase().includes(search.toLowerCase()) || c.customer_id.toLowerCase().includes(search.toLowerCase()));
    if (riskFilter !== 'Semua') data = data.filter(c => c.risk_level === riskFilter);
    if (planFilter !== 'Semua') data = data.filter(c => c.plan_type === planFilter);
    data.sort((a, b) => {
      const av = a[sortKey] ?? 0, bv = b[sortKey] ?? 0;
      return sortDir === 'asc' ? (av > bv ? 1 : -1) : (av < bv ? 1 : -1);
    });
    return data;
  }, [customers, search, riskFilter, planFilter, sortKey, sortDir]);

  const SortIcon = ({ col }) => {
    if (sortKey !== col) return <ChevronUp className="w-3.5 h-3.5 text-[var(--vs-muted-3)]" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-[var(--vs-brand)]" />
      : <ChevronDown className="w-3.5 h-3.5 text-[var(--vs-brand)]" />;
  };

  const Th = ({ col, label }) => (
    <th
      className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider cursor-pointer hover:text-[var(--vs-ink)] select-none whitespace-nowrap"
      onClick={() => col && handleSort(col)}
    >
      <div className="flex items-center gap-1">
        {label}
        {col && <SortIcon col={col} />}
      </div>
    </th>
  );

  const planOptions = useMemo(() => {
    const plans = [...new Set(customers.map(c => c.plan_type).filter(Boolean))];
    return ['Semua', ...plans];
  }, [customers]);

  const riskColor = { Tinggi: 'border-red-200 bg-red-50 text-red-700', Sedang: 'border-amber-200 bg-amber-50 text-amber-700', Rendah: 'border-emerald-200 bg-emerald-50 text-emerald-700' };

  return (
    <>
      {/* Search bar */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--vs-muted-3)]" />
        <input
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={t('customer.searchPlaceholder')}
          className="vs-input w-full pl-9 pr-4 py-2.5"
        />
      </div>

      {/* Filter pills */}
      <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vs-muted-3)]">{t('customer.riskLevel') ?? (lang === 'en' ? 'Risk' : 'Risiko')}</span>
          {riskOptions.map(o => (
            <button
              key={o.value}
              type="button"
              onClick={() => setRiskFilter(o.value)}
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition-all ${
                riskFilter === o.value
                  ? (o.value === 'Semua' ? 'border-[var(--vs-brand)] bg-[var(--vs-brand)] text-white' : riskColor[o.value])
                  : 'border-[var(--vs-line)] bg-white text-[var(--vs-muted)] hover:border-[var(--vs-line-2)]'
              }`}
            >
              {o.label}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-[var(--vs-line)] hidden sm:block" />

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] font-semibold uppercase tracking-wide text-[var(--vs-muted-3)]">{t('customer.plan')}</span>
          {planOptions.map(o => (
            <button
              key={o}
              type="button"
              onClick={() => setPlanFilter(o)}
              className={`rounded-full border px-3 py-1 text-[12px] font-semibold transition-all ${
                planFilter === o
                  ? 'border-[var(--vs-brand)] bg-[var(--vs-brand)] text-white'
                  : 'border-[var(--vs-line)] bg-white text-[var(--vs-muted)] hover:border-[var(--vs-line-2)]'
              }`}
            >
              {o === 'Semua' ? t('customer.all') : o}
            </button>
          ))}
        </div>
      </div>

      <div className="text-[12px] text-[var(--vs-muted-2)] mb-3">
        {lang === 'en' ? `${filtered.length} customers found` : `${filtered.length} pelanggan ditemukan`}
      </div>

      <div className="vs-card overflow-hidden">
        {loading ? (
          <div className="p-6"><TableSkeleton rows={6} /></div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[var(--vs-bg)] border-b border-[var(--vs-line)]">
                  <Th col="customer_id"       label="ID" />
                  <Th col="company_name"      label={t('customer.company')} />
                  <Th col="plan_type"         label={t('customer.plan')} />
                  <Th col="churn_score"       label={t('customer.churnScore')} />
                  <Th col="risk_level"        label={t('customer.riskLevel')} />
                  <Th col="avg_usage_hrs"     label={lang === 'en' ? 'Usage' : 'Penggunaan'} />
                  <Th col="total_tickets"     label={lang === 'en' ? 'Tickets' : 'Tiket'} />
                  <Th col="avg_nps_score"     label="NPS" />
                  <Th col="days_since_login"  label={lang === 'en' ? 'Last Login' : 'Login Terakhir'} />
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--vs-line-soft)]">
                {filtered.length === 0 ? (
                  <tr><td colSpan={9} className="text-center py-12 text-[13px] text-[var(--vs-muted-2)]">{t('customer.noData')}</td></tr>
                ) : filtered.map(c => (
                  <tr
                    key={c.id}
                    onClick={() => {
                      if (onCustomerOpen) onCustomerOpen(c);
                      else router.replace(`/dashboard/admin/customer?detail=${encodeURIComponent(c.id)}`, { scroll: false });
                    }}
                    className="hover:bg-[var(--vs-brand-50)] cursor-pointer transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-[12px] text-[var(--vs-muted-2)]">{c.customer_id}</td>
                    <td className="px-4 py-3">
                      <div className="text-[13px] font-semibold text-[var(--vs-ink)]">{c.company_name}</div>
                      {(c.staff?.full_name ?? c.assigned_name) && (
                        <div className="text-[11px] text-[var(--vs-muted-2)]">{c.staff?.full_name ?? c.assigned_name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className="vs-tag">{c.plan_type}</span>
                    </td>
                    <td className="px-4 py-3 min-w-[130px]">
                      <ChurnScoreBar score={c.churn_score} />
                    </td>
                    <td className="px-4 py-3"><RiskBadge level={c.risk_level} /></td>
                    <td className="px-4 py-3 text-[13px] text-[var(--vs-muted)] tabular-nums">
                      {c.avg_usage_hrs != null ? `${c.avg_usage_hrs}${lang === 'en' ? ' hrs' : ' jam'}` : '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[var(--vs-muted)] tabular-nums">
                      {c.total_tickets ?? '—'}
                    </td>
                    <td className="px-4 py-3 text-[13px] text-[var(--vs-muted)] tabular-nums">
                      {c.avg_nps_score != null ? c.avg_nps_score : '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[var(--vs-muted-2)] font-mono tabular-nums">{c.days_since_login}{lang === 'en' ? 'd ago' : 'h lalu'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}
