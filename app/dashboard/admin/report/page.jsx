'use client';

import { useState, useEffect, useRef } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';
import { Download, TrendingDown, Users, Star, Activity, FileText, Cpu, CheckCircle, Clock, Zap, BarChart2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion';
import { supabase } from '@/lib/supabase';
import DashboardShell from '@/components/dashboard/DashboardShell';

function printReport(element, title) {
  const style = document.createElement('style');
  style.setAttribute('data-print-report', '');
  style.textContent = `@media print{@page{margin:12mm}body *{visibility:hidden!important}#report-print-area,#report-print-area *{visibility:visible!important}#report-print-area{position:fixed!important;inset:0!important;padding:0!important;margin:0!important;background:#fff!important}}`;
  const wrapper = document.createElement('div');
  wrapper.id = 'report-print-area';
  wrapper.innerHTML = `<h2 style="font-size:16px;font-weight:700;margin-bottom:16px;color:#0f172a">${title}</h2>`;
  wrapper.appendChild(element.cloneNode(true));
  document.body.appendChild(wrapper);
  document.head.appendChild(style);
  window.print();
  document.body.removeChild(wrapper);
  document.head.removeChild(style);
}

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
function monthKey(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
}

const METRICS = [
  { key: 'akurasi',         label: 'Akurasi',   color: 'bg-blue-500',    track: 'bg-blue-100'    },
  { key: 'auc_roc',         label: 'AUC-ROC',   color: 'bg-violet-500',  track: 'bg-violet-100'  },
  { key: 'precision_churn', label: 'Precision', color: 'bg-amber-500',   track: 'bg-amber-100'   },
  { key: 'recall_churn',    label: 'Recall',    color: 'bg-orange-500',  track: 'bg-orange-100'  },
  { key: 'f1_score',        label: 'F1-Score',  color: 'bg-emerald-500', track: 'bg-emerald-100' },
];

const FLOW_STEPS = [
  { label: 'Input Data',           desc: '5 dataset: accounts, usage, billing, tickets, NPS' },
  { label: 'Feature Engineering',  desc: 'Agregasi & normalisasi 20+ fitur per pelanggan' },
  { label: 'Model ML',             desc: 'Prediksi probabilitas churn menggunakan algoritma terlatih' },
  { label: 'Churn Score',          desc: 'Skor 0–100% dihasilkan per pelanggan' },
  { label: 'Risk Level',           desc: 'Tinggi ≥70% · Sedang 30–69% · Rendah <30%' },
];

const TABS = [
  { id: 'laporan',  label: 'Laporan',  icon: FileText },
  { id: 'model',    label: 'Model ML', icon: Cpu      },
];

export default function AdminReportPage() {
  const [tab, setTab]               = useState('laporan');
  const [loading, setLoading]       = useState(true);
  const [customers, setCustomers]   = useState([]);
  const [staffList, setStaffList]   = useState([]);
  const [activities, setActivities] = useState([]);
  const [predictions, setPredictions] = useState([]);
  const [modelHistory, setModelHistory] = useState([]);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [features, setFeatures]     = useState([]);
  const [loadingFeat, setLoadingFeat] = useState(false);
  const contentRef = useRef(null);

  useEffect(() => {
    const fetchAll = async () => {
      const [{ data: c }, { data: s }, { data: a }, { data: p }, { data: m }] = await Promise.all([
        supabase.from('customers').select('*'),
        supabase.from('profiles').select('*').eq('role', 'staff'),
        supabase.from('activities').select('*').order('created_at'),
        supabase.from('prediction_history').select('churn_score,created_at').order('created_at'),
        supabase.from('model_history').select('*').order('tanggal', { ascending: false }),
      ]);
      setCustomers(c ?? []);
      setStaffList(s ?? []);
      setActivities(a ?? []);
      setPredictions(p ?? []);
      const models = m ?? [];
      setModelHistory(models);
      if (models.length) setSelectedModelId(models[0].id);
      setLoading(false);
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (!selectedModelId) return;
    setLoadingFeat(true);
    supabase.from('feature_importance')
      .select('feature_name, importance_score')
      .eq('model_history_id', selectedModelId)
      .order('importance_score', { ascending: false })
      .limit(10)
      .then(({ data }) => { setFeatures(data ?? []); setLoadingFeat(false); });
  }, [selectedModelId]);

  // ── Laporan metrics ──
  const total          = customers.length;
  const atRisk         = customers.filter(c => c.risk_level === 'Tinggi').length;
  const retained       = customers.filter(c => !c.churn_actual).length;
  const retentionRate  = total > 0 ? Math.round((retained / total) * 100) : 0;
  const totalActivities = activities.length;

  const retentionByMonth = (() => {
    const map = {};
    for (const c of customers) {
      if (!c.created_at) continue;
      const key = monthKey(c.created_at);
      const d = new Date(c.created_at);
      if (!map[key]) map[key] = { bulan: MONTH_NAMES[d.getMonth()], _key: key, berhasil: 0, gagal: 0 };
      c.churn_actual ? map[key].gagal++ : map[key].berhasil++;
    }
    return Object.values(map).sort((a, b) => a._key.localeCompare(b._key)).slice(-6);
  })();

  const churnTrend = (() => {
    const src = predictions.length > 0 ? predictions : customers;
    const map = {};
    for (const row of src) {
      if (!row.created_at || row.churn_score == null) continue;
      const key = monthKey(row.created_at);
      const d = new Date(row.created_at);
      if (!map[key]) map[key] = { bulan: MONTH_NAMES[d.getMonth()], _key: key, sum: 0, n: 0 };
      map[key].sum += Number(row.churn_score);
      map[key].n++;
    }
    return Object.values(map).sort((a, b) => a._key.localeCompare(b._key)).slice(-6)
      .map(m => ({ bulan: m.bulan, churn_rate: m.n > 0 ? Math.round((m.sum / m.n) * 10) / 10 : 0 }));
  })();

  const thisMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const staffPerformance = staffList.map(s => {
    const assigned      = customers.filter(c => c.assigned_to === s.id);
    const assignedCount = assigned.length;
    const retainedCount = assigned.filter(c => !c.churn_actual).length;
    const successRate   = assignedCount > 0 ? Math.round((retainedCount / assignedCount) * 100) : 0;
    const activitiesMonth = activities.filter(a => a.staff_id === s.id && new Date(a.created_at) >= thisMonthStart).length;
    const workloadPct   = Math.round(Math.min(100, (assignedCount / 10) * 100));
    const performance   = successRate >= 80 ? 'Sangat Baik' : successRate >= 60 ? 'Baik' : 'Perlu Perhatian';
    return { id: s.id, name: s.full_name, assigned: assignedCount, resolved_month: activitiesMonth, success_rate: successRate, workload_pct: workloadPct, performance };
  });

  const kpiCards = [
    { title: 'Pelanggan At-Risk',  value: atRisk,              icon: TrendingDown, color: 'var(--vs-danger)'  },
    { title: 'Berhasil Diretain',  value: retained,            icon: Users,        color: 'var(--vs-success)' },
    { title: 'Retention Rate',     value: `${retentionRate}%`, icon: Star,         color: 'var(--vs-brand)'   },
    { title: 'Total Aktivitas',    value: totalActivities,     icon: Activity,     color: 'var(--vs-warn)'    },
  ];

  const selectedModel = modelHistory.find(m => m.id === selectedModelId) ?? null;
  const maxFeat = features[0]?.importance_score ?? 1;

  return (
    <DashboardShell
      title="Laporan & analitik"
      description="Ringkasan performa retensi, tren churn, dan efektivitas tim."
      icon={FileText}
      actions={(
        <button type="button" onClick={() => contentRef.current && printReport(contentRef.current, 'Laporan & Analitik — ChurnShield')}
          disabled={loading} className="vs-btn vs-btn--secondary disabled:opacity-50">
          <Download className="h-3.5 w-3.5" /> Export (.pdf)
        </button>
      )}
    >
      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent" />
        </div>
      ) : (
        <div className="space-y-5">
          {/* ── Tab buttons ── */}
          <div className="flex items-center gap-2">
            {TABS.map(t => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button key={t.id} type="button" onClick={() => setTab(t.id)}
                  className={`flex items-center gap-2 rounded-full border px-4 py-2 text-[13px] font-semibold transition-all ${
                    active
                      ? 'border-blue-600 bg-blue-600 text-white shadow-sm'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-blue-300 hover:text-blue-600'
                  }`}>
                  <Icon className="h-3.5 w-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* ── Tab: Laporan ── */}
          <AnimatePresence mode="wait">
            {tab === 'laporan' && (
              <motion.div key="laporan" ref={contentRef}
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }} className="space-y-5">

                <motion.div variants={stagger} initial="hidden" animate="visible" className="grid grid-cols-2 xl:grid-cols-4 gap-4">
                  {kpiCards.map((m) => {
                    const Icon = m.icon;
                    return (
                      <motion.div key={m.title} variants={fadeUp} className="vs-card p-5 hover:border-[var(--vs-line-2)] transition-all">
                        <div className="flex items-center gap-2.5 mb-4">
                          <div className="w-8 h-8 rounded-lg bg-[var(--vs-brand-50)] border border-[var(--vs-brand-100)] flex items-center justify-center">
                            <Icon className="w-4 h-4" style={{ color: m.color }} />
                          </div>
                          <span className="text-[13px] font-medium text-[var(--vs-muted)]">{m.title}</span>
                        </div>
                        <div className="text-[30px] font-bold tabular-nums leading-none" style={{ color: m.color }}>{m.value}</div>
                      </motion.div>
                    );
                  })}
                </motion.div>

                <div className="grid xl:grid-cols-2 gap-5">
                  <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.1 }} className="vs-card p-6">
                    <h3 className="text-[15px] font-bold text-[var(--vs-ink)] mb-1">Hasil Intervensi Retensi</h3>
                    <p className="text-[12px] text-[var(--vs-muted-2)] mb-5">Diretain vs Churn per bulan</p>
                    <div className="h-[220px]">
                      {retentionByMonth.length === 0
                        ? <div className="flex h-full items-center justify-center text-[13px] text-[var(--vs-muted-3)]">Belum ada data</div>
                        : <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={retentionByMonth} barGap={4} margin={{ top:5,right:10,left:-20,bottom:0 }}>
                              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--vs-line-soft)" />
                              <XAxis dataKey="bulan" tick={{ fontSize:11, fill:'var(--vs-muted-3)' }} axisLine={false} tickLine={false} dy={8} />
                              <YAxis tick={{ fontSize:11, fill:'var(--vs-muted-3)' }} axisLine={false} tickLine={false} dx={-6} />
                              <Tooltip contentStyle={{ background:'#0F172A', border:'none', borderRadius:'10px', color:'#fff', fontSize:'12px' }} itemStyle={{ color:'#fff' }} cursor={{ fill:'var(--vs-bg)' }} />
                              <Bar dataKey="berhasil" fill="var(--vs-success)" radius={[4,4,0,0]} name="Diretain" maxBarSize={36} />
                              <Bar dataKey="gagal"    fill="var(--vs-danger)"  radius={[4,4,0,0]} name="Churn"    maxBarSize={36} />
                            </BarChart>
                          </ResponsiveContainer>}
                    </div>
                  </motion.div>

                  <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.18 }} className="vs-card p-6">
                    <h3 className="text-[15px] font-bold text-[var(--vs-ink)] mb-1">Trend Churn Score</h3>
                    <p className="text-[12px] text-[var(--vs-muted-2)] mb-5">Rata-rata skor churn per bulan</p>
                    <div className="h-[220px]">
                      {churnTrend.length === 0
                        ? <div className="flex h-full items-center justify-center text-[13px] text-[var(--vs-muted-3)]">Belum ada data</div>
                        : <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={churnTrend} margin={{ top:5,right:10,left:-20,bottom:0 }}>
                              <CartesianGrid strokeDasharray="4 4" vertical={false} stroke="var(--vs-line-soft)" />
                              <XAxis dataKey="bulan" tick={{ fontSize:11, fill:'var(--vs-muted-3)' }} axisLine={false} tickLine={false} dy={8} />
                              <YAxis tick={{ fontSize:11, fill:'var(--vs-muted-3)' }} axisLine={false} tickLine={false} tickFormatter={v=>`${v}%`} dx={-6} />
                              <Tooltip contentStyle={{ background:'#0F172A', border:'none', borderRadius:'10px', color:'#fff', fontSize:'12px' }} itemStyle={{ color:'#fff' }} formatter={v=>[`${v}%`,'Avg Churn Score']} />
                              <Line type="monotone" dataKey="churn_rate" stroke="var(--vs-brand)" strokeWidth={2.5}
                                dot={{ fill:'#fff', stroke:'var(--vs-brand)', strokeWidth:2, r:4 }}
                                activeDot={{ r:6, fill:'var(--vs-brand)', stroke:'#fff', strokeWidth:2 }} />
                            </LineChart>
                          </ResponsiveContainer>}
                    </div>
                  </motion.div>
                </div>

                <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.26 }} className="vs-card overflow-hidden">
                  <div className="px-5 py-4 border-b border-[var(--vs-line)]">
                    <h3 className="text-[14px] font-bold text-[var(--vs-ink)]">Performa Tim Customer Success</h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left">
                      <thead>
                        <tr className="bg-[var(--vs-bg)] border-b border-[var(--vs-line)]">
                          {['Staff','Total Assigned','Aktivitas Bulan Ini','Success Rate','Workload','Performa'].map(h => (
                            <th key={h} className="px-5 py-3 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[var(--vs-line-soft)]">
                        {staffPerformance.length === 0
                          ? <tr><td colSpan={6} className="py-12 text-center text-[13px] text-[var(--vs-muted-2)]">Belum ada data staf</td></tr>
                          : staffPerformance.map(s => (
                            <tr key={s.id} className="hover:bg-[var(--vs-bg)] transition-colors">
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 rounded-lg bg-[var(--vs-bg-2)] border border-[var(--vs-line)] flex items-center justify-center text-[11px] font-bold text-[var(--vs-muted)] uppercase">
                                    {(s.name ?? '?').split(' ').map(n => n[0]).join('').slice(0,2)}
                                  </div>
                                  <span className="text-[13px] font-semibold text-[var(--vs-ink)]">{s.name}</span>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-[13px] text-[var(--vs-muted)] tabular-nums">{s.assigned} pelanggan</td>
                              <td className="px-5 py-3.5 text-[13px] font-bold text-[var(--vs-ink)] tabular-nums">{s.resolved_month} aktivitas</td>
                              <td className="px-5 py-3.5">
                                <div className="flex items-center gap-3">
                                  <span className="text-[12px] font-bold tabular-nums w-8 text-[var(--vs-ink)] text-right">{s.success_rate}%</span>
                                  <div className="flex-1 h-1.5 rounded-full bg-[var(--vs-line-soft)] overflow-hidden">
                                    <div className="h-full rounded-full bg-[var(--vs-brand)]" style={{ width:`${s.success_rate}%` }} />
                                  </div>
                                </div>
                              </td>
                              <td className="px-5 py-3.5 text-[13px] text-[var(--vs-muted)] tabular-nums">{s.workload_pct}%</td>
                              <td className="px-5 py-3.5">
                                <span className={`vs-tag ${s.performance==='Sangat Baik'?'vs-tag--low':s.performance==='Baik'?'vs-tag--blue':'vs-tag--medium'}`}>
                                  {s.performance}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ── Tab: Model ML ── */}
            {tab === 'model' && (
              <motion.div key="model"
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }}
                transition={{ duration: 0.18 }} className="space-y-5">

                {modelHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center vs-card">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                      <Cpu className="h-7 w-7 text-slate-400" />
                    </div>
                    <p className="text-[14px] font-semibold text-slate-700">Belum ada model tersimpan</p>
                    <p className="mt-1 text-[12px] text-slate-400">Upload dataset dan proses di halaman Data & Model.</p>
                  </div>
                ) : (() => {
                  const activeModel = modelHistory.find(m => m.status === 'Aktif');
                  return (
                    <>
                      {/* Summary cards */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {[
                          { icon: Cpu,         bg: 'bg-blue-50',    iconColor: 'text-blue-600',    value: modelHistory.length,  label: 'Total Model',    valueColor: 'text-slate-900' },
                          { icon: CheckCircle, bg: 'bg-emerald-50', iconColor: 'text-emerald-600', value: activeModel?.algoritma?.split(' ')[0] ?? '—', label: 'Model Aktif', valueColor: 'text-emerald-600' },
                          { icon: BarChart2,   bg: 'bg-blue-50',    iconColor: 'text-blue-600',    value: activeModel?.akurasi != null ? `${Math.round(Number(activeModel.akurasi)*100)}%` : '—', label: 'Akurasi Aktif', valueColor: 'text-blue-600' },
                          { icon: Zap,         bg: 'bg-violet-50',  iconColor: 'text-violet-600',  value: activeModel?.f1_score != null ? `${Math.round(Number(activeModel.f1_score)*100)}%` : '—', label: 'F1-Score Aktif', valueColor: 'text-violet-600' },
                        ].map((card, i) => (
                          <motion.div key={card.label}
                            initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay: i * 0.07 }}
                            className="vs-card p-5">
                            <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${card.bg} mb-3`}>
                              <card.icon className={`h-4 w-4 ${card.iconColor}`} />
                            </div>
                            <div className={`text-2xl font-bold ${card.valueColor}`}>{card.value}</div>
                            <div className="text-[12px] font-medium text-slate-400 mt-1">{card.label}</div>
                          </motion.div>
                        ))}
                      </div>

                      {/* Model selector pills */}
                      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.3 }} className="vs-card p-5">
                        <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Pilih Model</p>
                        <div className="flex flex-wrap gap-2">
                          {modelHistory.map((m, idx) => {
                            const isSel = m.id === selectedModelId;
                            return (
                              <button key={m.id} onClick={() => setSelectedModelId(m.id)}
                                className={`flex flex-col items-start gap-0.5 rounded-xl border px-4 py-2.5 text-left transition-all ${
                                  isSel
                                    ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                                }`}>
                                <span className={`text-[10px] font-bold uppercase tracking-wide ${isSel ? 'text-blue-200' : 'text-slate-400'}`}>
                                  Model #{modelHistory.length - idx}
                                </span>
                                <span className="text-[13px] font-bold leading-tight">{m.algoritma}</span>
                                <div className="mt-1 flex items-center gap-1.5">
                                  <span className={`text-[10px] ${isSel ? 'text-blue-200' : 'text-slate-400'}`}>
                                    {new Date(m.tanggal).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                                  </span>
                                  <span className={`inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-[9px] font-bold ${
                                    m.status === 'Aktif'
                                      ? (isSel ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700')
                                      : (isSel ? 'bg-white/10 text-blue-200' : 'bg-slate-100 text-slate-500')
                                  }`}>
                                    {m.status === 'Aktif'
                                      ? <><CheckCircle className="h-2.5 w-2.5" /> Aktif</>
                                      : <><Clock className="h-2.5 w-2.5" /> Nonaktif</>}
                                  </span>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </motion.div>

                      {selectedModel && (
                        <div className="grid gap-5 md:grid-cols-2">
                          {/* Metrik evaluasi */}
                          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.38 }} className="vs-card p-5">
                            <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Metrik Evaluasi</p>
                            <div className="space-y-4">
                              {METRICS.map(({ key, label, color, track }) => {
                                const pct = selectedModel[key] != null ? Math.round(Number(selectedModel[key]) * 100) : null;
                                return (
                                  <div key={key}>
                                    <div className="mb-1.5 flex justify-between text-[13px]">
                                      <span className="font-semibold text-slate-700">{label}</span>
                                      <span className="font-bold tabular-nums text-slate-900">{pct != null ? `${pct}%` : '—'}</span>
                                    </div>
                                    <div className={`h-2.5 w-full overflow-hidden rounded-full ${track}`}>
                                      <div className={`h-full rounded-full transition-all duration-700 ${color}`}
                                        style={{ width: pct != null ? `${pct}%` : '0%' }} />
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                            <div className="mt-5 divide-y divide-slate-100 rounded-xl border border-slate-100 bg-slate-50/60 overflow-hidden text-[12px]">
                              {[
                                ['Algoritma',     selectedModel.algoritma],
                                ['Diproses oleh', selectedModel.processed_by ?? 'System'],
                                ['Tanggal',       new Date(selectedModel.tanggal).toLocaleString('id-ID', { dateStyle:'medium', timeStyle:'short' })],
                                ['Status',        selectedModel.status],
                              ].map(([k, v]) => (
                                <div key={k} className="flex justify-between gap-4 px-4 py-2.5">
                                  <span className="text-slate-500">{k}</span>
                                  <span className={`font-semibold text-right ${k==='Status' && v==='Aktif' ? 'text-emerald-600' : 'text-slate-800'}`}>{v}</span>
                                </div>
                              ))}
                            </div>
                          </motion.div>

                          {/* Feature importance + alur */}
                          <div className="space-y-5">
                            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.44 }} className="vs-card p-5">
                              <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Feature Importance (Top 10)</p>
                              {loadingFeat ? (
                                <div className="flex justify-center py-10">
                                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                                </div>
                              ) : features.length === 0 ? (
                                <div className="flex flex-col items-center justify-center py-10 text-center">
                                  <BarChart2 className="mb-2 h-8 w-8 text-slate-200" />
                                  <p className="text-[12px] text-slate-400">Tidak ada data feature importance</p>
                                </div>
                              ) : (
                                <div className="space-y-3">
                                  {features.map((f, i) => {
                                    const pct = maxFeat > 0 ? Math.round((f.importance_score / maxFeat) * 100) : 0;
                                    return (
                                      <div key={f.feature_name} className="flex items-center gap-3">
                                        <span className="w-5 shrink-0 text-center text-[10px] font-bold tabular-nums text-slate-400">{i+1}</span>
                                        <div className="min-w-0 flex-1">
                                          <div className="mb-1 flex justify-between gap-2">
                                            <span className="truncate text-[12px] font-semibold text-slate-700">{f.feature_name}</span>
                                            <span className="shrink-0 font-mono text-[11px] font-bold text-slate-500">{Number(f.importance_score).toFixed(4)}</span>
                                          </div>
                                          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                            <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{ width:`${pct}%` }} />
                                          </div>
                                        </div>
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </motion.div>

                            <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.5 }} className="vs-card p-5">
                              <p className="mb-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Alur Prediksi Churn</p>
                              <div className="space-y-2">
                                {FLOW_STEPS.map((step, i) => (
                                  <div key={step.label} className="flex items-start gap-3">
                                    <div className="flex flex-col items-center">
                                      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-blue-600 text-[10px] font-bold text-white">{i+1}</div>
                                      {i < FLOW_STEPS.length - 1 && <div className="mt-1 h-5 w-px bg-blue-200" />}
                                    </div>
                                    <div className="min-w-0 pb-2 pt-0.5">
                                      <p className="text-[13px] font-semibold text-slate-800">{step.label}</p>
                                      <p className="text-[11px] leading-relaxed text-slate-500">{step.desc}</p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                              <div className="mt-4 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                                <p className="text-[12px] font-semibold text-blue-700 mb-1">Tentang model ini</p>
                                <p className="text-[12px] leading-relaxed text-blue-600">
                                  {selectedModel.algoritma} dilatih menggunakan data historis pelanggan untuk memprediksi
                                  kemungkinan churn. Skor 0–100% dihasilkan per pelanggan berdasarkan pola usage,
                                  pembayaran, tiket, dan NPS.
                                </p>
                              </div>
                            </motion.div>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}
    </DashboardShell>
  );
}
