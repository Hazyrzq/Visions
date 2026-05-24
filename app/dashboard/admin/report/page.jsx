'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart2, Download, RefreshCw, TrendingDown, Activity,
  CheckCircle2, AlertTriangle, X, ChevronRight, Info,
  ArrowUpRight, ArrowDownRight, Minus, Phone, Mail, CalendarDays,
  FileEdit, Cpu, Clock, CheckCircle,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from 'recharts';
import { supabase } from '@/lib/supabase';
import DashboardShell from '@/components/dashboard/DashboardShell';
import MetricCard from '@/components/dashboard/MetricCard';
import RiskBadge from '@/components/dashboard/RiskBadge';
import { fadeUp, stagger, pageVariants, scaleIn } from '@/lib/motion';

// ─── helpers ──────────────────────────────────────────────────────────
const ini = (n) =>
  !n ? '?' : n.split(' ').filter(Boolean).slice(0,2).map(w=>w[0]).join('').toUpperCase();

const fdt = (iso) =>
  !iso ? '—' : new Date(iso).toLocaleString('id-ID',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'});

const fdDate = (iso) =>
  !iso ? '—' : new Date(iso).toLocaleDateString('id-ID',{day:'numeric',month:'long',year:'numeric'});

const MONTHS = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'];
const MONTHS_FULL = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

// Smart metric: handles 0.94 (decimal) and 94.2 (percent) formats
const fmtMetric = (val) => {
  if (val == null) return null;
  const n = Number(val);
  if (isNaN(n)) return null;
  return n > 1 ? Math.round(n * 10) / 10 : Math.round(n * 1000) / 10;
};

const ACT = {
  call:    { label:'Telepon',  Icon:Phone,        color:'text-emerald-600', bg:'bg-emerald-50', border:'border-emerald-200' },
  email:   { label:'Email',    Icon:Mail,         color:'text-blue-600',    bg:'bg-blue-50',    border:'border-blue-200'    },
  meeting: { label:'Meeting',  Icon:CalendarDays, color:'text-purple-600',  bg:'bg-purple-50',  border:'border-purple-200'  },
  note:    { label:'Catatan',  Icon:FileEdit,     color:'text-amber-600',   bg:'bg-amber-50',   border:'border-amber-200'   },
  other:   { label:'Lainnya',  Icon:Activity,     color:'text-slate-500',   bg:'bg-slate-100',  border:'border-slate-200'   },
};

const perfLabel = (r) =>
  r>=80 ? {text:'Sangat Baik',    cls:'bg-emerald-100 text-emerald-700'}
: r>=60 ? {text:'Baik',           cls:'bg-blue-100 text-blue-700'}
: r>=40 ? {text:'Cukup',          cls:'bg-amber-100 text-amber-700'}
:         {text:'Perlu Perhatian',cls:'bg-red-100 text-red-700'};

// ─── Custom dark tooltip ───────────────────────────────────────────────
const DkTip = ({ active, payload, label, suffix='' }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-2xl bg-slate-900 px-4 py-3 shadow-2xl ring-1 ring-white/10">
      <p className="mb-2 text-[11px] font-bold uppercase tracking-wide text-slate-400">{label}</p>
      {payload.map((p,i) => (
        <div key={i} className="flex items-center gap-2 py-0.5 text-[12px] text-white">
          <span className="h-2 w-2 shrink-0 rounded-full" style={{background:p.color}}/>
          <span className="text-slate-300">{p.name}</span>
          <span className="ml-2 font-bold tabular-nums">
            {typeof p.value==='number' ? p.value.toLocaleString('id-ID') : p.value}{suffix}
          </span>
        </div>
      ))}
    </div>
  );
};

// ─── WorkloadBar ──────────────────────────────────────────────────────
function WorkloadBar({ pct }) {
  const c = pct>=80?'bg-red-500':pct>=50?'bg-amber-500':'bg-emerald-500';
  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-slate-100">
        <div className={`h-full rounded-full transition-all duration-700 ${c}`} style={{width:`${Math.min(pct,100)}%`}}/>
      </div>
      <span className="w-8 text-right text-[12px] font-semibold tabular-nums text-slate-600">{pct}%</span>
    </div>
  );
}

// ─── Staff Modal (via Portal to avoid hover card bug) ─────────────────
function StaffModal({ staff, onClose }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const esc = (e) => { if (e.key==='Escape') onClose(); };
    window.addEventListener('keydown', esc);
    return () => { document.body.style.overflow=''; window.removeEventListener('keydown', esc); };
  }, [onClose]);

  if (!mounted || typeof document === 'undefined') return null;
  const perf = perfLabel(staff.success);

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}
        className="fixed inset-0 z-[200] flex items-center justify-center p-4"
        onClick={(e) => { e.stopPropagation(); onClose(); }}
      >
        <motion.div
          variants={scaleIn} initial="hidden" animate="visible" exit="hidden"
          className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Backdrop blur layer */}
          <div className="absolute inset-0 -z-10 rounded-2xl bg-black/40 blur-none" style={{position:'fixed',inset:0,zIndex:-1}}/>

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-gray-100 px-6 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[var(--vs-brand)] to-blue-400 text-[12px] font-bold text-white shadow">
                {ini(staff.full_name)}
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{staff.full_name}</h3>
                <p className="text-[12px] text-gray-500">{staff.email}</p>
              </div>
            </div>
            <button onClick={onClose}
              className="rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600">
              <X className="h-5 w-5"/>
            </button>
          </div>

          <div className="flex-1 space-y-5 overflow-y-auto p-6">
            {/* Stats */}
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[
                {label:'Total Assigned', value:staff.mine.length,    color:'text-blue-600',   bg:'bg-blue-50'},
                {label:'Aktivitas Bln',  value:staff.myActs.length,  color:'text-purple-600', bg:'bg-purple-50'},
                {label:'Success Rate',   value:`${staff.success}%`,  color:staff.success>=60?'text-emerald-600':'text-red-500', bg:staff.success>=60?'bg-emerald-50':'bg-red-50'},
                {label:'Workload',       value:`${staff.workload}%`, color:'text-amber-600',  bg:'bg-amber-50'},
              ].map(s=>(
                <div key={s.label} className={`rounded-xl ${s.bg} p-3 text-center`}>
                  <p className={`text-[1.4rem] font-bold tabular-nums leading-none ${s.color}`}>{s.value}</p>
                  <p className="mt-1 text-[11px] font-medium text-gray-500">{s.label}</p>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[12px] text-gray-500">Performa:</span>
              <span className={`rounded-full px-3 py-0.5 text-[12px] font-bold ${perf.cls}`}>{perf.text}</span>
            </div>

            {/* Activity breakdown */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Rincian Aktivitas Bulan Ini</p>
              {!Object.keys(staff.byType).length ? (
                <p className="text-[12px] text-gray-400">Belum ada aktivitas bulan ini.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(staff.byType).map(([type,count])=>{
                    const m=ACT[type]??ACT.other; const Icon=m.Icon;
                    return (
                      <div key={type} className={`flex items-center gap-2 rounded-xl border ${m.border} ${m.bg} px-3 py-2`}>
                        <Icon className={`h-4 w-4 ${m.color}`}/>
                        <span className={`text-[12px] font-semibold ${m.color}`}>{m.label}</span>
                        <span className={`text-[14px] font-bold ${m.color}`}>{count}x</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Recent activities */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">Aktivitas Terbaru</p>
              {!staff.recentActs.length ? <p className="text-[12px] text-gray-400">Belum ada aktivitas.</p> : (
                <ul className="space-y-2">
                  {staff.recentActs.map(a=>{
                    const m=ACT[a.action_type]??ACT.other; const Icon=m.Icon;
                    const company=a.customers?.company_name??a.customer_id;
                    return (
                      <li key={a.id} className="flex items-start gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3">
                        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${m.bg}`}>
                          <Icon className={`h-3.5 w-3.5 ${m.color}`}/>
                        </span>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-[12px] font-semibold text-gray-800">{company}</span>
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${m.bg} ${m.color}`}>{m.label}</span>
                          </div>
                          <p className="mt-0.5 line-clamp-1 text-[12px] text-gray-500">{a.description}</p>
                        </div>
                        <span className="shrink-0 text-[11px] text-gray-400">{fdt(a.created_at)}</span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Customers */}
            <div>
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-gray-400">
                Pelanggan Ditangani ({staff.mine.length})
              </p>
              {!staff.mine.length ? <p className="text-[12px] text-gray-400">Belum ada pelanggan yang di-assign.</p> : (
                <div className="flex flex-wrap gap-2">
                  {staff.mine.map(c=>(
                    <div key={c.id} className="flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-3 py-1">
                      <span className={`h-1.5 w-1.5 rounded-full ${c.risk_level==='Tinggi'?'bg-red-500':c.risk_level==='Sedang'?'bg-amber-500':'bg-emerald-500'}`}/>
                      <span className="text-[11px] font-medium text-gray-700">{c.company_name}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}

// ─── Export PDF ────────────────────────────────────────────────────────
function buildPrintHtml({ metrics, staffPerf, customers, staffList, modelHistory, generated }) {
  const high  = customers.filter(c=>c.risk_level==='Tinggi'||c.risk_level==='High');
  const mid   = customers.filter(c=>c.risk_level==='Sedang'||c.risk_level==='Medium');
  const low   = customers.filter(c=>c.risk_level==='Rendah'||c.risk_level==='Low');
  const total = metrics.total;
  const pct   = (n) => total>0?Math.round((n/total)*100):0;
  const activeModel = modelHistory.find(m=>m.status==='Aktif');

  const th = (s) => `<th style="text-align:left;padding:8px 10px;border:1px solid #e2e8f0;background:#f1f5f9;font-size:11px">${s}</th>`;
  const tc = (s, center=false, extra='') => `<td style="padding:8px 10px;border:1px solid #e2e8f0;${center?'text-align:center;':''}${extra}font-size:12px">${s}</td>`;

  return `
<div style="font-family:system-ui,sans-serif;color:#0f172a;max-width:780px;margin:0 auto">
  <div style="border-bottom:3px solid #2563eb;padding-bottom:14px;margin-bottom:22px">
    <h1 style="font-size:22px;font-weight:800;margin:0 0 4px">Laporan ChurnShield</h1>
    <p style="color:#64748b;margin:0;font-size:12px">Dibuat: ${generated} | Visions Platform</p>
  </div>

  <!-- 1. Ringkasan -->
  <h2 style="font-size:14px;font-weight:700;border-left:4px solid #2563eb;padding-left:10px;margin:0 0 10px">1. Ringkasan Risiko Pelanggan</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead><tr>${['Kategori','Jumlah','Persentase','Keterangan'].map(th).join('')}</tr></thead>
    <tbody>
      <tr>${tc('High Risk (Tinggi)','',`font-weight:700;color:#dc2626;`)}${tc(String(high.length),true,'font-weight:700;font-size:14px')}${tc(`${pct(high.length)}%`,true)}${tc('Butuh tindakan segera')}</tr>
      <tr style="background:#f8fafc">${tc('Medium Risk (Sedang)','',`font-weight:700;color:#d97706;`)}${tc(String(mid.length),true,'font-weight:700;font-size:14px')}${tc(`${pct(mid.length)}%`,true)}${tc('Perlu dipantau berkala')}</tr>
      <tr>${tc('Low Risk (Rendah)','',`font-weight:700;color:#16a34a;`)}${tc(String(low.length),true,'font-weight:700;font-size:14px')}${tc(`${pct(low.length)}%`,true)}${tc('Aman, pertahankan engagement')}</tr>
      <tr style="background:#eff6ff">${tc('Berhasil Diretain','',`font-weight:700;color:#2563eb;`)}${tc(String(metrics.retained),true,'font-weight:700;font-size:14px')}${tc(`${metrics.retRate}%`,true)}${tc('Retention rate keseluruhan')}</tr>
      <tr style="background:#fff7ed">${tc('Total Churn','',`font-weight:700;color:#ea580c;`)}${tc(String(metrics.churned),true,'font-weight:700;font-size:14px')}${tc(`${pct(metrics.churned)}%`,true)}${tc('Pelanggan yang churn')}</tr>
      <tr style="background:#f0fdf4">${tc('Aktivitas Tim Bulan Ini','',`font-weight:700;`)}${tc(String(metrics.totalActs),true,'font-weight:700;font-size:14px')}${tc('—',true)}${tc('Bulan berjalan')}</tr>
    </tbody>
  </table>

  <!-- 2. Staff performance -->
  <h2 style="font-size:14px;font-weight:700;border-left:4px solid #2563eb;padding-left:10px;margin:0 0 10px">2. Performa Tim Customer Success</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead><tr style="background:#1e3a8a;color:#fff">
      ${['Nama Staff','Email','Assigned','Aktivitas','Success Rate','Workload','Performa'].map(h=>`<th style="text-align:left;padding:8px 10px;font-size:11px">${h}</th>`).join('')}
    </tr></thead>
    <tbody>
      ${staffPerf.map((s,i)=>{
        const p=perfLabel(s.success);
        return `<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-weight:600;font-size:12px">${s.full_name}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;font-size:11px;color:#64748b">${s.email}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;font-size:12px">${s.mine.length}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${s.myActs.length}</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700;font-size:12px;color:${s.success>=60?'#16a34a':'#dc2626'}">${s.success}%</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:12px">${s.workload}%</td>
          <td style="padding:8px 10px;border-bottom:1px solid #e2e8f0;text-align:center;font-size:11px;font-weight:700">${p.text}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>

  <!-- 3. High Risk customers -->
  <h2 style="font-size:14px;font-weight:700;border-left:4px solid #ef4444;padding-left:10px;margin:0 0 10px">3. Daftar Pelanggan High Risk (${high.length} pelanggan)</h2>
  <table style="width:100%;border-collapse:collapse;margin-bottom:24px">
    <thead><tr style="background:#fef2f2">
      ${['#','ID','Perusahaan','Plan','Churn Score','NPS','Last Login','PIC'].map(h=>`<th style="text-align:left;padding:8px;border:1px solid #fecaca;font-size:11px">${h}</th>`).join('')}
    </tr></thead>
    <tbody>
      ${high.sort((a,b)=>(b.churn_score??0)-(a.churn_score??0)).map((c,i)=>`
        <tr style="background:${i%2===0?'#fff':'#fff7f7'}">
          <td style="padding:7px 8px;border:1px solid #fecaca;text-align:center;color:#94a3b8;font-weight:600;font-size:11px">${i+1}</td>
          <td style="padding:7px 8px;border:1px solid #fecaca;font-family:monospace;font-size:10px;color:#64748b">${c.customer_id}</td>
          <td style="padding:7px 8px;border:1px solid #fecaca;font-weight:600;font-size:11px">${c.company_name}</td>
          <td style="padding:7px 8px;border:1px solid #fecaca;font-size:11px">${c.plan_type??'—'}</td>
          <td style="padding:7px 8px;border:1px solid #fecaca;text-align:center;font-weight:700;color:#dc2626;font-size:11px">${c.churn_score??'—'}%</td>
          <td style="padding:7px 8px;border:1px solid #fecaca;text-align:center;font-size:11px">${c.avg_nps_score!=null?`${c.avg_nps_score}/10`:'—'}</td>
          <td style="padding:7px 8px;border:1px solid #fecaca;text-align:center;font-size:11px">${c.days_since_login!=null?`${c.days_since_login}h lalu`:'—'}</td>
          <td style="padding:7px 8px;border:1px solid #fecaca;font-size:11px">${staffList.find(s=>s.id===c.assigned_to)?.full_name??'Belum diassign'}</td>
        </tr>`).join('')}
    </tbody>
  </table>

  <!-- 4. Model ML -->
  <h2 style="font-size:14px;font-weight:700;border-left:4px solid #7c3aed;padding-left:10px;margin:0 0 10px">4. Informasi Model ML</h2>
  ${activeModel ? `
  <table style="width:100%;border-collapse:collapse;margin-bottom:12px">
    <thead><tr>${['Algoritma','Status','Akurasi','AUC-ROC','Precision','Recall','F1-Score','Tanggal','Diproses Oleh'].map(th).join('')}</tr></thead>
    <tbody>
      ${modelHistory.map((m,i)=>{
        const fmt=(v)=>{ const r=fmtMetric(v); return r!=null?`${r}%`:'—'; };
        return `<tr style="background:${i%2===0?'#fff':'#f8fafc'}">
          <td style="padding:8px 10px;border:1px solid #e2e8f0;font-weight:600;font-size:12px">${m.algoritma}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:12px;font-weight:700;color:${m.status==='Aktif'?'#16a34a':'#64748b'}">${m.status}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:center;font-size:12px;font-weight:700;color:#2563eb">${fmt(m.akurasi)}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:center;font-size:12px">${fmt(m.auc_roc)}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:center;font-size:12px">${fmt(m.precision_churn)}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:center;font-size:12px">${fmt(m.recall_churn)}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;text-align:center;font-size:12px">${fmt(m.f1_score)}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px;color:#64748b">${new Date(m.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}</td>
          <td style="padding:8px 10px;border:1px solid #e2e8f0;font-size:11px">${m.processed_by??'System'}</td>
        </tr>`;
      }).join('')}
    </tbody>
  </table>
  ` : '<p style="font-size:12px;color:#94a3b8;margin-bottom:24px">Belum ada data model ML.</p>'}

  <div style="border-top:1px solid #e2e8f0;padding-top:12px;display:flex;justify-content:space-between;color:#94a3b8;font-size:10px;margin-top:8px">
    <span>Visions - ChurnShield | Laporan Customer Success</span>
    <span>Total: ${total} pelanggan | ${generated}</span>
  </div>
</div>`;
}

function triggerExport(data) {
  const style = document.createElement('style');
  style.textContent = `
    @media print {
      @page { margin: 15mm; size: A4; }
      body * { visibility: hidden !important; }
      #__exp, #__exp * { visibility: visible !important; }
      #__exp { position: fixed !important; inset: 0 !important; padding: 24px !important; background: #fff !important; overflow: visible !important; }
      table { page-break-inside: auto; border-collapse: collapse; }
      tr { page-break-inside: avoid; page-break-after: auto; }
      thead { display: table-header-group; }
      h2 { page-break-before: auto; page-break-after: avoid; }
    }
  `;
  const wrap = document.createElement('div');
  wrap.id = '__exp';
  wrap.innerHTML = buildPrintHtml(data);
  document.body.appendChild(wrap);
  document.head.appendChild(style);
  window.print();
  document.body.removeChild(wrap);
  document.head.removeChild(style);
}

// ═══════════════════════════════════════════════════════════════════════
const MODEL_METRICS = [
  { key:'akurasi',         label:'Akurasi',   color:'bg-blue-500',    track:'bg-blue-100'    },
  { key:'auc_roc',         label:'AUC-ROC',   color:'bg-violet-500',  track:'bg-violet-100'  },
  { key:'precision_churn', label:'Precision', color:'bg-amber-500',   track:'bg-amber-100'   },
  { key:'recall_churn',    label:'Recall',    color:'bg-orange-500',  track:'bg-orange-100'  },
  { key:'f1_score',        label:'F1-Score',  color:'bg-emerald-500', track:'bg-emerald-100' },
];

// Granularity: Tahunan | Bulanan (dalam satu tahun) | Harian (dalam satu bulan)
const GRAN_OPTIONS = [
  { id:'yearly',  label:'Tahunan',  hint:'Semua tahun tersedia' },
  { id:'monthly', label:'Bulanan',  hint:'Pilih tahun' },
  { id:'daily',   label:'Harian',   hint:'Pilih bulan' },
];

export default function AdminReportPage() {
  const [tab, setTab]                       = useState('Laporan');
  const [loading, setLoading]               = useState(true);
  const [customers, setCustomers]           = useState([]);
  const [staffList, setStaffList]           = useState([]);
  const [activities, setActivities]         = useState([]);
  const [predHistory, setPredHistory]       = useState([]);
  const [modelHistory, setModelHistory]     = useState([]);
  const [selectedStaff, setSelectedStaff]   = useState(null);
  const [selectedModelId, setSelectedModelId] = useState(null);
  const [modelFeatures, setModelFeatures]     = useState([]);
  const [loadingFeat, setLoadingFeat]         = useState(false);

  // Drill-down controls
  const [granType, setGranType]           = useState('yearly');
  const [selectedYear, setSelectedYear]   = useState(new Date().getFullYear());
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth()); // 0-11

  // ── fetch ─────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true);
    const [
      {data:cust},
      {data:staff},
      {data:acts},
      {data:preds},
      {data:models},
    ] = await Promise.all([
      supabase.from('customers').select('*'),
      supabase.from('profiles').select('*').eq('role','staff').eq('is_active',true),
      supabase.from('activities').select('*,staff:profiles(full_name),customers(company_name)').order('created_at',{ascending:false}),
      supabase.from('prediction_history').select('churn_score,created_at,risk_level').order('created_at'),
      supabase.from('model_history').select('*').order('tanggal',{ascending:false}),
    ]);
    setCustomers(cust??[]);
    setStaffList(staff??[]);
    setActivities(acts??[]);
    setPredHistory(preds??[]);
    setModelHistory(models??[]);
    if (models?.length) setSelectedModelId(models[0].id);
    setLoading(false);
  }, []);

  useEffect(()=>{fetchAll();},[fetchAll]);

  useEffect(()=>{
    if (!selectedModelId) return;
    setLoadingFeat(true);
    supabase.from('feature_importance')
      .select('feature_name,importance_score')
      .eq('model_history_id',selectedModelId)
      .order('importance_score',{ascending:false})
      .limit(10)
      .then(({data})=>{setModelFeatures(data??[]); setLoadingFeat(false);});
  },[selectedModelId]);

  // ── Metrics ───────────────────────────────────────────────────────
  const total    = customers.length;
  const atRisk   = customers.filter(c=>c.risk_level==='Tinggi'||c.risk_level==='High').length;
  const retained = customers.filter(c=>c.churn_actual===false).length;
  const churned  = customers.filter(c=>c.churn_actual===true).length;
  const retRate  = total>0?Math.round((retained/total)*100):0;
  const monthStart = useMemo(()=>{const n=new Date();return new Date(n.getFullYear(),n.getMonth(),1);},[]);
  const actsMonth  = useMemo(()=>activities.filter(a=>new Date(a.created_at)>=monthStart),[activities,monthStart]);

  // ── Available years from prediction_history ────────────────────────
  const availableYears = useMemo(()=>{
    const ys=[...new Set(predHistory.map(r=>new Date(r.created_at).getFullYear()))].sort((a,b)=>a-b);
    return ys.length ? ys : [new Date().getFullYear()];
  },[predHistory]);

  // Set default selectedYear to latest available
  useEffect(()=>{
    if (availableYears.length) setSelectedYear(availableYears[availableYears.length-1]);
  },[availableYears]);

  // ── Chart 1: Drill-down bar chart ─────────────────────────────────
  const chartData = useMemo(()=>{
    if (granType==='yearly') {
      // All years
      const map={};
      for (const r of predHistory) {
        const yr=new Date(r.created_at).getFullYear();
        if (!map[yr]) map[yr]={label:String(yr),Diretain:0,'Churn Risk':0};
        Number(r.churn_score??0)<50 ? map[yr].Diretain++ : map[yr]['Churn Risk']++;
      }
      return Object.values(map).sort((a,b)=>Number(a.label)-Number(b.label));
    }
    if (granType==='monthly') {
      // Months within selectedYear
      const rows=predHistory.filter(r=>new Date(r.created_at).getFullYear()===selectedYear);
      const map={};
      for (const r of rows) {
        const mo=new Date(r.created_at).getMonth();
        if (!map[mo]) map[mo]={label:MONTHS[mo],Diretain:0,'Churn Risk':0};
        Number(r.churn_score??0)<50 ? map[mo].Diretain++ : map[mo]['Churn Risk']++;
      }
      return Object.values(map).sort((a,b)=>MONTHS.indexOf(a.label)-MONTHS.indexOf(b.label));
    }
    // daily — days within selectedYear/selectedMonth
    const rows=predHistory.filter(r=>{
      const d=new Date(r.created_at);
      return d.getFullYear()===selectedYear && d.getMonth()===selectedMonth;
    });
    const map={};
    for (const r of rows) {
      const d=new Date(r.created_at);
      const day=d.getDate();
      const key=String(day).padStart(2,'0');
      const label=`${day}`;
      if (!map[key]) map[key]={label,Diretain:0,'Churn Risk':0};
      Number(r.churn_score??0)<50 ? map[key].Diretain++ : map[key]['Churn Risk']++;
    }
    return Object.values(map).sort((a,b)=>Number(a.label)-Number(b.label));
  },[predHistory,granType,selectedYear,selectedMonth]);

  const chartTitle = useMemo(()=>{
    if (granType==='yearly') return 'Semua Tahun';
    if (granType==='monthly') return `Bulanan — ${selectedYear}`;
    return `Harian — ${MONTHS_FULL[selectedMonth]} ${selectedYear}`;
  },[granType,selectedYear,selectedMonth]);

  const totalRetain = chartData.reduce((s,d)=>s+d.Diretain,0);
  const totalChurnC = chartData.reduce((s,d)=>s+d['Churn Risk'],0);

  // ── Chart 2: Risk distribution bar chart ─────────────────────────
  const riskBarData = useMemo(()=>{
    const map={};
    for (const r of predHistory){
      if (!r.created_at) continue;
      const d=new Date(r.created_at);
      const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`;
      const label=`${MONTHS[d.getMonth()]} '${String(d.getFullYear()).slice(2)}`;
      if (!map[key]) map[key]={key,label,'High Risk':0,'Medium Risk':0,'Low Risk':0};
      const lv=(r.risk_level??'').toLowerCase();
      if (lv==='tinggi'||lv==='high')        map[key]['High Risk']++;
      else if (lv==='sedang'||lv==='medium') map[key]['Medium Risk']++;
      else                                    map[key]['Low Risk']++;
    }
    return Object.values(map).sort((a,b)=>a.key.localeCompare(b.key)).slice(-12);
  },[predHistory]);

  const lastBar  = riskBarData.at(-1);
  const prevBar  = riskBarData.at(-2);
  const highDiff = lastBar&&prevBar ? lastBar['High Risk']-prevBar['High Risk'] : 0;

  // ── Staff performance ─────────────────────────────────────────────
  const staffPerf = useMemo(()=>{
    const maxA=Math.max(...staffList.map(s=>customers.filter(c=>c.assigned_to===s.id).length),1);
    return staffList.map(s=>{
      const mine=customers.filter(c=>c.assigned_to===s.id);
      const myActs=actsMonth.filter(a=>a.staff_id===s.id);
      const success=mine.length>0?Math.round((mine.filter(c=>!c.churn_actual).length/mine.length)*100):0;
      const workload=Math.round((mine.length/maxA)*100);
      const byType={};
      for (const a of myActs) byType[a.action_type]=(byType[a.action_type]??0)+1;
      const recentActs=activities.filter(a=>a.staff_id===s.id).slice(0,5);
      return {...s,mine,myActs,success,workload,byType,recentActs};
    }).sort((a,b)=>b.success-a.success);
  },[staffList,customers,actsMonth,activities]);

  const selectedModel = modelHistory.find(m=>m.id===selectedModelId)??null;
  const activeModel   = modelHistory.find(m=>m.status==='Aktif');
  const maxFeat       = modelFeatures[0]?.importance_score??1;

  // ═════════════════════════════════════════════════════════════════
  return (
    <DashboardShell
      title="Reports"
      description="Analisis performa tim, tren risiko churn, dan retensi pelanggan."
      icon={BarChart2}
      actions={
        <div className="flex items-center gap-2">
          <button onClick={fetchAll} className="vs-btn vs-btn--ghost gap-2 text-[12px]">
            <RefreshCw className="h-3.5 w-3.5"/> Refresh
          </button>
          <button
            onClick={()=>triggerExport({
              metrics:{total,atRisk,retained,churned,retRate,totalActs:actsMonth.length},
              staffPerf, customers, staffList, modelHistory,
              generated: fdDate(new Date().toISOString()),
            })}
            className="vs-btn vs-btn--primary gap-2 text-[12px]"
          >
            <Download className="h-3.5 w-3.5"/> Export PDF
          </button>
        </div>
      }
    >
      {/* Tabs */}
      <div className="mb-2 flex w-fit gap-1 rounded-xl border border-slate-200 bg-slate-50 p-1">
        {['Laporan','Model ML'].map(t=>(
          <button key={t} onClick={()=>setTab(t)}
            className={`flex items-center gap-2 rounded-lg px-4 py-2 text-[13px] font-semibold transition-all ${
              tab===t?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-800'
            }`}>
            {t==='Laporan'?<BarChart2 className="h-4 w-4"/>:<Cpu className="h-4 w-4"/>}
            {t}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-[var(--vs-brand)] border-t-transparent"/>
        </div>
      ) : tab==='Laporan' ? (

        /* ══ TAB LAPORAN ══════════════════════════════════════════════ */
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-6">

          {/* Metric cards */}
          <motion.div variants={stagger} className="grid grid-cols-2 gap-3 lg:grid-cols-4 lg:gap-4">
            {[
              {title:'Pelanggan At-Risk', value:atRisk,           icon:TrendingDown,  color:'red',     subtitle:`dari ${total} total pelanggan`},
              {title:'Berhasil Diretain', value:retained,         icon:CheckCircle2,  color:'emerald', subtitle:`${retRate}% retention rate`},
              {title:'Total Churn',       value:churned,          icon:AlertTriangle, color:'amber',   subtitle:`${total>0?Math.round((churned/total)*100):0}% dari total`},
              {title:'Aktivitas Tim',     value:actsMonth.length, icon:Activity,      color:'indigo',  subtitle:'Bulan berjalan'},
            ].map(m=>(
              <motion.div key={m.title} variants={fadeUp}><MetricCard {...m}/></motion.div>
            ))}
          </motion.div>

          {/* ── Chart 1: Drill-down Bar ───────────────────────────── */}
          <motion.div variants={fadeUp} className="vs-card overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Diretain vs Churn — {chartTitle}</h2>
                  <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-slate-500">
                    Bar <strong className="text-emerald-600">hijau</strong> = pelanggan aman (score &lt;50).
                    Bar <strong className="text-red-600">merah</strong> = berisiko churn (score ≥50).
                    Hijau harus selalu lebih tinggi dari merah.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-1 sm:items-end">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-700">
                    <span className="h-2 w-2 rounded-full bg-emerald-500"/> {totalRetain.toLocaleString('id-ID')} aman
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1 text-[12px] font-bold text-red-700">
                    <span className="h-2 w-2 rounded-full bg-red-500"/> {totalChurnC.toLocaleString('id-ID')} churn
                  </span>
                </div>
              </div>

              {/* Drill-down controls */}
              <div className="mt-4 flex flex-wrap items-center gap-3">
                {/* Granularity tabs */}
                <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-1">
                  {GRAN_OPTIONS.map(g=>(
                    <button key={g.id} onClick={()=>setGranType(g.id)} title={g.hint}
                      className={`rounded-lg px-3 py-1.5 text-[12px] font-semibold transition-all ${
                        granType===g.id?'bg-white text-slate-900 shadow-sm':'text-slate-500 hover:text-slate-700'
                      }`}>
                      {g.label}
                    </button>
                  ))}
                </div>

                {/* Year picker — show when Bulanan or Harian */}
                {(granType==='monthly'||granType==='daily') && (
                  <select value={selectedYear} onChange={e=>setSelectedYear(Number(e.target.value))}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-700 focus:border-blue-400 focus:outline-none">
                    {availableYears.map(y=>(
                      <option key={y} value={y}>{y}</option>
                    ))}
                  </select>
                )}

                {/* Month picker — show only when Harian */}
                {granType==='daily' && (
                  <select value={selectedMonth} onChange={e=>setSelectedMonth(Number(e.target.value))}
                    className="h-8 rounded-lg border border-slate-200 bg-white px-2 text-[12px] text-slate-700 focus:border-blue-400 focus:outline-none">
                    {MONTHS_FULL.map((m,i)=>(
                      <option key={i} value={i}>{m}</option>
                    ))}
                  </select>
                )}

                {/* Context hint */}
                <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-[11px] font-semibold text-slate-500">
                  {granType==='yearly' && 'Melihat semua tahun tersedia'}
                  {granType==='monthly' && `Melihat tiap bulan di tahun ${selectedYear}`}
                  {granType==='daily' && `Melihat tiap hari di ${MONTHS_FULL[selectedMonth]} ${selectedYear}`}
                </span>
              </div>
            </div>

            <div className="px-6 py-5">
              {chartData.length===0 ? (
                <div className="flex h-[260px] items-center justify-center text-[13px] text-slate-400">
                  Tidak ada data untuk periode yang dipilih.
                </div>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{top:8,right:8,left:-12,bottom:0}} barGap={4} barCategoryGap="30%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="label" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}
                        interval={chartData.length>20?Math.floor(chartData.length/10):0}/>
                      <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<DkTip suffix=" prediksi"/>}/>
                      <Legend wrapperStyle={{fontSize:12,paddingTop:12}}/>
                      <Bar dataKey="Diretain"   fill="#10B981" radius={[5,5,0,0]} maxBarSize={44}/>
                      <Bar dataKey="Churn Risk" fill="#EF4444" radius={[5,5,0,0]} maxBarSize={44}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Chart 2: Risk Distribution Bar ───────────────────── */}
          <motion.div variants={fadeUp} className="vs-card overflow-hidden">
            <div className="border-b border-slate-100 px-6 py-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-[15px] font-bold text-slate-900">Distribusi Risiko per Bulan</h2>
                  <p className="mt-1 max-w-lg text-[13px] leading-relaxed text-slate-500">
                    Jumlah pelanggan di tiap kategori risiko tiap bulan.
                    Idealnya bar <span className="font-semibold text-red-600">merah (High)</span> mengecil
                    dan <span className="font-semibold text-emerald-600">hijau (Low)</span> membesar dari bulan ke bulan.
                  </p>
                </div>
                {lastBar && (
                  <div className="shrink-0 flex flex-col items-end gap-1">
                    <span className="text-[11px] text-slate-400">High Risk bulan ini</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[22px] font-bold tabular-nums text-slate-900">{lastBar['High Risk']}</span>
                      {highDiff>0  && <span className="flex items-center gap-1 rounded-full bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600"><ArrowUpRight className="h-3 w-3"/>+{highDiff}</span>}
                      {highDiff<0  && <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-600"><ArrowDownRight className="h-3 w-3"/>{highDiff}</span>}
                      {highDiff===0 && <span className="flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-500"><Minus className="h-3 w-3"/>Stabil</span>}
                    </div>
                    <span className="text-[11px] text-slate-400">vs bulan sebelumnya</span>
                  </div>
                )}
              </div>
            </div>

            <div className="px-6 py-5">
              {riskBarData.length===0 ? (
                <div className="flex h-[260px] items-center justify-center text-[13px] text-slate-400">
                  Belum ada data distribusi risiko.
                </div>
              ) : (
                <div className="h-[260px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={riskBarData} margin={{top:8,right:8,left:-12,bottom:0}} barGap={3} barCategoryGap="25%">
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9"/>
                      <XAxis dataKey="label" tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                      <YAxis tick={{fontSize:11,fill:'#94a3b8'}} axisLine={false} tickLine={false}/>
                      <Tooltip content={<DkTip suffix=" pelanggan"/>}/>
                      <Legend wrapperStyle={{fontSize:12,paddingTop:12}}/>
                      <Bar dataKey="High Risk"   fill="#EF4444" radius={[4,4,0,0]} maxBarSize={28}/>
                      <Bar dataKey="Medium Risk" fill="#F59E0B" radius={[4,4,0,0]} maxBarSize={28}/>
                      <Bar dataKey="Low Risk"    fill="#10B981" radius={[4,4,0,0]} maxBarSize={28}/>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
              {highDiff!==0 && (
                <div className={`mt-4 flex items-start gap-2 rounded-xl px-4 py-3 ${highDiff>0?'bg-red-50':'bg-emerald-50'}`}>
                  <Info className={`mt-0.5 h-4 w-4 shrink-0 ${highDiff>0?'text-red-500':'text-emerald-500'}`}/>
                  <p className={`text-[12px] leading-relaxed ${highDiff>0?'text-red-700':'text-emerald-700'}`}>
                    {highDiff>0
                      ? `Pelanggan High Risk bertambah ${highDiff} dibanding bulan lalu. Tingkatkan tindak lanjut tim.`
                      : `Pelanggan High Risk berkurang ${Math.abs(highDiff)} dibanding bulan lalu. Upaya retensi efektif.`}
                  </p>
                </div>
              )}
            </div>
          </motion.div>

          {/* ── Staff Performance ─────────────────────────────────── */}
          <motion.div variants={fadeUp} className="vs-card overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/60 px-5 py-4">
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Performa Tim Customer Success</h2>
                <p className="mt-0.5 text-[12px] text-slate-400">Klik baris staff untuk melihat detail</p>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[11px] font-bold text-blue-600">
                {staffList.length} staf aktif
              </span>
            </div>

            {staffPerf.length===0 ? (
              <div className="py-16 text-center text-[13px] text-slate-400">Belum ada data staff.</div>
            ) : (
              <>
                <div className="hidden border-b border-slate-100 bg-slate-50/40 px-5 py-2.5 lg:grid"
                  style={{gridTemplateColumns:'2fr 1fr 1.5fr 1fr 1.5fr 1fr 20px'}}>
                  {['Staff','Assigned','Aktivitas Bln Ini','Success Rate','Workload','Performa',''].map((h,i)=>(
                    <span key={i} className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{h}</span>
                  ))}
                </div>
                <div className="divide-y divide-[var(--vs-line-soft)]">
                  {staffPerf.map(s=>{
                    const perf=perfLabel(s.success);
                    return (
                      <div key={s.id}
                        onClick={(e)=>{ e.stopPropagation(); setSelectedStaff(s); }}
                        className="grid cursor-pointer items-center gap-4 px-5 py-4 transition-colors hover:bg-slate-50/80"
                        style={{gridTemplateColumns:'2fr 1fr 1.5fr 1fr 1.5fr 1fr 20px'}}>
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--vs-brand)] to-blue-400 text-[11px] font-bold text-white shadow-sm">
                            {ini(s.full_name)}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate text-[13px] font-semibold text-slate-900">{s.full_name}</p>
                            <p className="truncate text-[11px] text-slate-400">{s.email}</p>
                          </div>
                        </div>
                        <div>
                          <span className="text-[15px] font-bold text-slate-800">{s.mine.length}</span>
                          <span className="ml-1 text-[11px] text-slate-400">pelanggan</span>
                        </div>
                        <div className="flex flex-col gap-1">
                          <span className="text-[13px] font-bold text-slate-800">{s.myActs.length} aktivitas</span>
                          <div className="flex flex-wrap gap-1">
                            {Object.entries(s.byType).slice(0,3).map(([type,count])=>{
                              const m=ACT[type]??ACT.other; const Icon=m.Icon;
                              return (
                                <span key={type} className={`inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-bold ${m.bg} ${m.color}`}>
                                  <Icon className="h-2.5 w-2.5"/>{count}
                                </span>
                              );
                            })}
                          </div>
                        </div>
                        <span className={`text-[15px] font-bold tabular-nums ${s.success>=60?'text-emerald-600':'text-red-500'}`}>
                          {s.success}%
                        </span>
                        <WorkloadBar pct={s.workload}/>
                        <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${perf.cls}`}>{perf.text}</span>
                        <ChevronRight className="h-4 w-4 text-slate-300"/>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </motion.div>
        </motion.div>

      ) : (
        /* ══ TAB MODEL ML ═════════════════════════════════════════════ */
        <motion.div variants={pageVariants} initial="hidden" animate="visible" className="space-y-5">
          {modelHistory.length===0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
                <Cpu className="h-7 w-7 text-slate-400"/>
              </div>
              <p className="text-[14px] font-semibold text-slate-700">Belum ada model tersimpan</p>
              <p className="mt-1 text-[12px] text-slate-400">Upload dataset dan proses di halaman Data &amp; Model.</p>
            </div>
          ) : (
            <>
              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4,ease:[0.16,1,0.3,1]}}
                className="grid grid-cols-2 gap-4 md:grid-cols-4">
                {[
                  {label:'Total Model', value:modelHistory.length,   Icon:Cpu,          cls:'text-blue-600',   bg:'bg-blue-50'},
                  {label:'Model Aktif', value:activeModel?.algoritma?.split(' ')[0]??'—', Icon:CheckCircle, cls:'text-emerald-600', bg:'bg-emerald-50'},
                  {label:'Akurasi',     value:(()=>{const v=fmtMetric(activeModel?.akurasi);return v!=null?`${v}%`:'—';})(), Icon:BarChart2, cls:'text-blue-600', bg:'bg-blue-50'},
                  {label:'F1-Score',    value:(()=>{const v=fmtMetric(activeModel?.f1_score);return v!=null?`${v}%`:'—';})(), Icon:Activity, cls:'text-violet-600', bg:'bg-violet-50'},
                ].map(m=>(
                  <div key={m.label} className="vs-card p-5">
                    <div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl ${m.bg}`}>
                      <m.Icon className={`h-4 w-4 ${m.cls}`}/>
                    </div>
                    <div className={`text-2xl font-bold ${m.cls}`}>{m.value}</div>
                    <div className="mt-1 text-[12px] text-slate-400">{m.label}</div>
                  </div>
                ))}
              </motion.div>

              <motion.div initial={{opacity:0,y:16}} animate={{opacity:1,y:0}} transition={{duration:0.4,delay:0.1,ease:[0.16,1,0.3,1]}}
                className="vs-card overflow-hidden">
                <div className="border-b border-[var(--vs-line)] bg-slate-50/60 px-5 py-4">
                  <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Pilih Model</p>
                  <div className="flex flex-wrap gap-2">
                    {modelHistory.map((m,idx)=>{
                      const isA=m.id===selectedModelId;
                      return (
                        <button key={m.id} onClick={()=>setSelectedModelId(m.id)}
                          className={`flex flex-col items-start gap-0.5 rounded-xl border px-4 py-2.5 text-left transition-all ${
                            isA?'border-blue-500 bg-blue-600 text-white shadow-sm'
                              :'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                          }`}>
                          <span className={`text-[10px] font-bold uppercase tracking-wide ${isA?'text-blue-200':'text-slate-400'}`}>
                            Model #{modelHistory.length-idx}
                          </span>
                          <span className="text-[13px] font-bold leading-tight">{m.algoritma}</span>
                          <div className="mt-1 flex items-center gap-2">
                            <span className={`text-[10px] ${isA?'text-blue-200':'text-slate-400'}`}>
                              {new Date(m.tanggal).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric'})}
                            </span>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                              m.status==='Aktif'?(isA?'bg-white/20 text-white':'bg-emerald-100 text-emerald-700')
                                              :(isA?'bg-white/10 text-blue-200':'bg-slate-100 text-slate-500')
                            }`}>
                              {m.status==='Aktif'?<><CheckCircle className="h-2.5 w-2.5"/>Aktif</>:<><Clock className="h-2.5 w-2.5"/>Nonaktif</>}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {selectedModel && (
                  <div className="grid gap-6 p-6 md:grid-cols-2">
                    <div>
                      <p className="mb-4 text-[12px] font-bold uppercase tracking-wider text-slate-400">Metrik Evaluasi</p>
                      <div className="space-y-4">
                        {MODEL_METRICS.map(({key,label,color,track})=>{
                          const pct=fmtMetric(selectedModel[key]);
                          if (pct===null) return (
                            <div key={key}>
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className="text-[13px] font-semibold text-slate-700">{label}</span>
                                <span className="text-[12px] italic text-slate-400">Data tidak tersedia</span>
                              </div>
                              <div className={`h-2.5 w-full rounded-full ${track}`}/>
                            </div>
                          );
                          return (
                            <div key={key}>
                              <div className="mb-1.5 flex items-center justify-between">
                                <span className="text-[13px] font-semibold text-slate-700">{label}</span>
                                <span className="text-[13px] font-bold tabular-nums text-slate-900">{pct}%</span>
                              </div>
                              <div className={`h-2.5 w-full overflow-hidden rounded-full ${track}`}>
                                <div className={`h-full rounded-full transition-all duration-700 ${color}`}
                                  style={{width:`${Math.min(pct,100)}%`}}/>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      <div className="mt-5 space-y-2 rounded-xl border border-slate-100 bg-slate-50 p-4">
                        {[
                          ['Algoritma',    selectedModel.algoritma],
                          ['Diproses oleh',selectedModel.processed_by??'System'],
                          ['Tanggal',      new Date(selectedModel.tanggal).toLocaleString('id-ID',{dateStyle:'medium',timeStyle:'short'})],
                          ['Status',       selectedModel.status],
                        ].map(([k,v])=>(
                          <div key={k} className="flex justify-between text-[12px]">
                            <span className="text-slate-500">{k}</span>
                            <span className={`font-semibold ${k==='Status'&&selectedModel.status==='Aktif'?'text-emerald-600':'text-slate-800'}`}>{v}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className="mb-4 text-[12px] font-bold uppercase tracking-wider text-slate-400">Feature Importance (Top 10)</p>
                      {loadingFeat ? (
                        <div className="flex items-center justify-center py-16">
                          <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent"/>
                        </div>
                      ) : !modelFeatures.length ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                          <BarChart2 className="mb-2 h-8 w-8 text-slate-200"/>
                          <p className="text-[12px] text-slate-400">Tidak ada data feature importance untuk model ini.</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {modelFeatures.map((f,i)=>{
                            const pct=maxFeat>0?Math.round((f.importance_score/maxFeat)*100):0;
                            return (
                              <div key={f.feature_name} className="flex items-center gap-3">
                                <span className="w-5 shrink-0 text-center text-[10px] font-bold tabular-nums text-slate-400">{i+1}</span>
                                <div className="min-w-0 flex-1">
                                  <div className="mb-1 flex items-center justify-between gap-2">
                                    <span className="truncate text-[12px] font-semibold text-slate-700">{f.feature_name}</span>
                                    <span className="shrink-0 font-mono text-[11px] font-bold text-slate-500">{Number(f.importance_score).toFixed(4)}</span>
                                  </div>
                                  <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                    <div className="h-full rounded-full bg-blue-500 transition-all duration-700" style={{width:`${pct}%`}}/>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </motion.div>
            </>
          )}
        </motion.div>
      )}

      {/* Staff Modal — rendered via portal, no event bubbling */}
      {selectedStaff && <StaffModal staff={selectedStaff} onClose={()=>setSelectedStaff(null)}/>}
    </DashboardShell>
  );
}