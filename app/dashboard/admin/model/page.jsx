'use client';

import { useState, useEffect } from 'react';
import { Cpu, CheckCircle, Clock, BarChart2, Zap } from 'lucide-react';
import { motion } from 'framer-motion';
import { supabase } from '@/lib/supabase';
import DashboardShell from '@/components/dashboard/DashboardShell';

const METRICS = [
  { key: 'akurasi',         label: 'Akurasi',   color: 'bg-blue-500',    track: 'bg-blue-100'    },
  { key: 'auc_roc',         label: 'AUC-ROC',   color: 'bg-violet-500',  track: 'bg-violet-100'  },
  { key: 'precision_churn', label: 'Precision', color: 'bg-amber-500',   track: 'bg-amber-100'   },
  { key: 'recall_churn',    label: 'Recall',    color: 'bg-orange-500',  track: 'bg-orange-100'  },
  { key: 'f1_score',        label: 'F1-Score',  color: 'bg-emerald-500', track: 'bg-emerald-100' },
];

export default function AdminModelPage() {
  const [modelHistory, setModelHistory] = useState([]);
  const [selectedId, setSelectedId]     = useState(null);
  const [features, setFeatures]         = useState([]);
  const [loadingPage, setLoadingPage]   = useState(true);
  const [loadingFeat, setLoadingFeat]   = useState(false);

  useEffect(() => {
    supabase.from('model_history').select('*').order('tanggal', { ascending: false })
      .then(({ data }) => {
        const list = data ?? [];
        setModelHistory(list);
        if (list.length) setSelectedId(list[0].id);
        setLoadingPage(false);
      });
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoadingFeat(true);
    supabase.from('feature_importance')
      .select('feature_name, importance_score')
      .eq('model_history_id', selectedId)
      .order('importance_score', { ascending: false })
      .limit(10)
      .then(({ data }) => { setFeatures(data ?? []); setLoadingFeat(false); });
  }, [selectedId]);

  const selected = modelHistory.find(m => m.id === selectedId) ?? null;
  const activeModel = modelHistory.find(m => m.status === 'Aktif');
  const maxFeat = features[0]?.importance_score ?? 1;

  return (
    <DashboardShell
      title="Performa Model ML"
      description="Detail metrik evaluasi, perbandingan model, dan feature importance."
      icon={Cpu}
    >
      {loadingPage ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
        </div>
      ) : modelHistory.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100">
            <Cpu className="h-7 w-7 text-slate-400" />
          </div>
          <p className="text-[14px] font-semibold text-slate-700">Belum ada model tersimpan</p>
          <p className="mt-1 text-[12px] text-slate-400">Upload dataset dan proses di halaman Data & Model.</p>
        </div>
      ) : (
        <div className="space-y-5">

          {/* Summary cards */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.05, ease:[0.16,1,0.3,1] }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="vs-card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 mb-3">
                <Cpu className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-slate-900">{modelHistory.length}</div>
              <div className="text-[12px] font-medium text-slate-400 mt-1">Total Model</div>
            </div>
            <div className="vs-card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 mb-3">
                <CheckCircle className="h-4 w-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-bold text-emerald-600">
                {activeModel ? activeModel.algoritma.split(' ')[0] : '—'}
              </div>
              <div className="text-[12px] font-medium text-slate-400 mt-1">Model Aktif</div>
            </div>
            <div className="vs-card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50 mb-3">
                <BarChart2 className="h-4 w-4 text-blue-600" />
              </div>
              <div className="text-2xl font-bold text-blue-600">
                {activeModel?.akurasi != null ? `${Math.round(Number(activeModel.akurasi) * 100)}%` : '—'}
              </div>
              <div className="text-[12px] font-medium text-slate-400 mt-1">Akurasi Aktif</div>
            </div>
            <div className="vs-card p-5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-violet-50 mb-3">
                <Zap className="h-4 w-4 text-violet-600" />
              </div>
              <div className="text-2xl font-bold text-violet-600">
                {activeModel?.f1_score != null ? `${Math.round(Number(activeModel.f1_score) * 100)}%` : '—'}
              </div>
              <div className="text-[12px] font-medium text-slate-400 mt-1">F1-Score Aktif</div>
            </div>
          </motion.div>

          {/* Model selector + detail */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.12, ease:[0.16,1,0.3,1] }} className="vs-card overflow-hidden">
            {/* Model pills */}
            <div className="border-b border-[var(--vs-line)] bg-slate-50/60 px-5 py-4">
              <p className="mb-3 text-[11px] font-bold uppercase tracking-wider text-slate-400">Pilih Model</p>
              <div className="flex flex-wrap gap-2">
                {modelHistory.map((m, idx) => {
                  const isActive = m.id === selectedId;
                  return (
                    <button key={m.id} onClick={() => setSelectedId(m.id)}
                      className={`flex flex-col items-start gap-0.5 rounded-xl border px-4 py-2.5 text-left transition-all ${
                        isActive
                          ? 'border-blue-500 bg-blue-600 text-white shadow-sm'
                          : 'border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50'
                      }`}>
                      <span className={`text-[10px] font-bold uppercase tracking-wide ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                        Model #{modelHistory.length - idx}
                      </span>
                      <span className="text-[13px] font-bold leading-tight">{m.algoritma}</span>
                      <div className="mt-1 flex items-center gap-2">
                        <span className={`text-[10px] ${isActive ? 'text-blue-200' : 'text-slate-400'}`}>
                          {new Date(m.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </span>
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[9px] font-bold ${
                          m.status === 'Aktif'
                            ? (isActive ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-700')
                            : (isActive ? 'bg-white/10 text-blue-200' : 'bg-slate-100 text-slate-500')
                        }`}>
                          {m.status === 'Aktif'
                            ? <><CheckCircle className="h-2.5 w-2.5" />Aktif</>
                            : <><Clock className="h-2.5 w-2.5" />Nonaktif</>}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {selected && (
              <div className="grid gap-6 p-6 md:grid-cols-2">
                {/* Metric bars */}
                <div>
                  <p className="mb-4 text-[12px] font-bold uppercase tracking-wider text-slate-400">Metrik Evaluasi</p>
                  <div className="space-y-4">
                    {METRICS.map(({ key, label, color, track }) => {
                      const raw = selected[key];
                      const pct = raw != null ? Math.round(Number(raw) * 100) : null;
                      return (
                        <div key={key}>
                          <div className="mb-1.5 flex items-center justify-between">
                            <span className="text-[13px] font-semibold text-slate-700">{label}</span>
                            <span className="text-[13px] font-bold tabular-nums text-slate-900">
                              {pct != null ? `${pct}%` : '—'}
                            </span>
                          </div>
                          <div className={`h-2.5 w-full overflow-hidden rounded-full ${track}`}>
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${color}`}
                              style={{ width: pct != null ? `${pct}%` : '0%' }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Info baris */}
                  <div className="mt-5 rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-2">
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-500">Algoritma</span>
                      <span className="font-semibold text-slate-800">{selected.algoritma}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-500">Diproses oleh</span>
                      <span className="font-semibold text-slate-800">{selected.processed_by ?? 'System'}</span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-500">Tanggal</span>
                      <span className="font-semibold text-slate-800">
                        {new Date(selected.tanggal).toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })}
                      </span>
                    </div>
                    <div className="flex justify-between text-[12px]">
                      <span className="text-slate-500">Status</span>
                      <span className={`font-bold ${selected.status === 'Aktif' ? 'text-emerald-600' : 'text-slate-500'}`}>
                        {selected.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Feature importance */}
                <div>
                  <p className="mb-4 text-[12px] font-bold uppercase tracking-wider text-slate-400">Feature Importance (Top 10)</p>
                  {loadingFeat ? (
                    <div className="flex items-center justify-center py-16">
                      <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
                    </div>
                  ) : features.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-center">
                      <BarChart2 className="mb-2 h-8 w-8 text-slate-200" />
                      <p className="text-[12px] text-slate-400">Tidak ada data feature importance untuk model ini</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {features.map((f, i) => {
                        const pct = maxFeat > 0 ? Math.round((f.importance_score / maxFeat) * 100) : 0;
                        return (
                          <div key={f.feature_name} className="flex items-center gap-3">
                            <span className="w-5 shrink-0 text-center text-[10px] font-bold tabular-nums text-slate-400">{i + 1}</span>
                            <div className="min-w-0 flex-1">
                              <div className="mb-1 flex items-center justify-between gap-2">
                                <span className="truncate text-[12px] font-semibold text-slate-700">{f.feature_name}</span>
                                <span className="shrink-0 font-mono text-[11px] font-bold text-slate-500">
                                  {Number(f.importance_score).toFixed(4)}
                                </span>
                              </div>
                              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                                <div
                                  className="h-full rounded-full bg-blue-500 transition-all duration-700"
                                  style={{ width: `${pct}%` }}
                                />
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
        </div>
      )}
    </DashboardShell>
  );
}
