'use client';

import { useState } from 'react';
import { Upload, Play, CheckCircle, BarChart2, Database, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { fadeUp, stagger } from '@/lib/motion';
import { mockModelHistory, mockFeatureImportance } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import DashboardShell from '@/components/dashboard/DashboardShell';

export default function AdminDataPage() {
  const { toasts, toast, remove } = useToast();
  const [customerFile, setCustomerFile] = useState(null);
  const [ticketFile, setTicketFile]     = useState(null);
  const [smote, setSmote]               = useState(true);
  const [featureEng, setFeatureEng]     = useState(true);
  const [hyperParam, setHyperParam]     = useState(false);
  const [training, setTraining]         = useState(false);
  const [progress, setProgress]         = useState(0);

  const handleTrain = async () => {
    if (!customerFile) { toast('Upload customers_dataset.csv terlebih dahulu', 'warning'); return; }
    setTraining(true); setProgress(0);
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(r => setTimeout(r, 300));
      setProgress(i);
    }
    setTraining(false);
    toast('Training selesai! Model baru berhasil disimpan', 'success');
  };

  const statusBadge = (s) =>
    s === 'Aktif'
      ? <span className="vs-tag vs-tag--low">Aktif</span>
      : <span className="vs-tag" style={{ background: 'var(--vs-bg-2)', color: 'var(--vs-muted)', borderColor: 'var(--vs-line)' }}>Tidak Aktif</span>;

  const maxImportance = Math.max(...mockFeatureImportance.map(f => f.importance_score));

  return (
    <DashboardShell
      title="Data & model ML"
      description="Kelola dataset, rekayasa fitur, dan latih model prediksi churn."
      icon={Database}
    >

      <motion.div variants={stagger} className="grid xl:grid-cols-3 gap-5">

        <div className="xl:col-span-2 space-y-5">

          {/* Upload Dataset */}
          <motion.div variants={fadeUp} className="vs-card p-6">
            <h3 className="text-[14px] font-bold text-[var(--vs-ink)] flex items-center gap-2 mb-5">
              <Upload className="w-4 h-4 text-[var(--vs-muted-2)]" /> Upload Dataset
            </h3>
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { label: 'customers_dataset.csv', desc: 'Data profil & perilaku', key: 'customer', file: customerFile, set: setCustomerFile },
                { label: 'tickets_dataset.csv',   desc: 'Data tiket & keluhan',   key: 'ticket',   file: ticketFile,   set: setTicketFile },
              ].map(f => (
                <label key={f.key} className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--vs-line)] bg-[var(--vs-bg)] hover:bg-[var(--vs-surface)] hover:border-[var(--vs-brand-200)] rounded-xl p-6 cursor-pointer transition-all group">
                  <input type="file" accept=".csv" className="hidden" onChange={e => f.set(e.target.files[0])} />
                  {f.file ? (
                    <div className="text-center">
                      <CheckCircle className="w-7 h-7 text-[var(--vs-success)] mx-auto mb-2" />
                      <div className="text-[13px] font-semibold text-[var(--vs-ink)]">{f.file.name}</div>
                      <div className="text-[11px] text-[var(--vs-muted-2)] mt-1 font-mono">{(f.file.size / 1024).toFixed(1)} KB</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--vs-surface)] border border-[var(--vs-line)] flex items-center justify-center mx-auto mb-3 group-hover:border-[var(--vs-brand)] transition-colors">
                        <Upload className="w-3.5 h-3.5 text-[var(--vs-muted-2)]" />
                      </div>
                      <div className="text-[13px] font-semibold text-[var(--vs-ink)]">{f.label}</div>
                      <div className="text-[12px] text-[var(--vs-muted-2)] mt-0.5">{f.desc}</div>
                    </div>
                  )}
                </label>
              ))}
            </div>
          </motion.div>

          {/* Config Training */}
          <motion.div variants={fadeUp} className="vs-card p-6">
            <h3 className="text-[14px] font-bold text-[var(--vs-ink)] flex items-center gap-2 mb-5">
              <Settings2 className="w-4 h-4 text-[var(--vs-muted-2)]" /> Konfigurasi Training
            </h3>
            <div className="space-y-2">
              {[
                { label: 'SMOTE (Balancing Kelas)',      desc: 'Tangani ketidakseimbangan kelas target churn.',      val: smote,      set: setSmote },
                { label: 'Feature Engineering',          desc: 'Kalkulasi fitur turunan untuk meningkatkan presisi.',  val: featureEng, set: setFeatureEng },
                { label: 'Hyperparameter Tuning (Grid)', desc: 'Cari parameter model terbaik (menambah waktu latih).', val: hyperParam, set: setHyperParam },
              ].map(opt => (
                <label key={opt.label} className="flex items-center justify-between p-3.5 border border-[var(--vs-line)] bg-[var(--vs-surface)] rounded-xl hover:bg-[var(--vs-bg)] cursor-pointer transition-colors">
                  <div>
                    <div className="text-[13px] font-medium text-[var(--vs-ink)]">{opt.label}</div>
                    <div className="text-[12px] text-[var(--vs-muted-2)] mt-0.5">{opt.desc}</div>
                  </div>
                  <div className="vs-toggle" data-state={String(opt.val)} onClick={() => opt.set(v => !v)}>
                    <div className="vs-toggle-thumb" />
                  </div>
                </label>
              ))}
            </div>

            {training && (
              <div className="mt-5 p-4 rounded-xl bg-[var(--vs-bg)] border border-[var(--vs-line)]">
                <div className="flex justify-between text-[12px] font-medium text-[var(--vs-ink)] mb-2.5">
                  <span className="flex items-center gap-2">
                    <div className="w-3 h-3 border-2 border-[var(--vs-brand)] border-t-transparent rounded-full animate-spin" />
                    Training model...
                  </span>
                  <span className="font-mono">{progress}%</span>
                </div>
                <div className="w-full bg-[var(--vs-line)] rounded-full h-1.5 overflow-hidden">
                  <motion.div className="h-full rounded-full bg-[var(--vs-brand)]" animate={{ width: `${progress}%` }} transition={{ duration: 0.3 }} />
                </div>
              </div>
            )}

            <div className="mt-5 pt-5 border-t border-[var(--vs-line-soft)]">
              <button className="vs-btn vs-btn--primary w-full justify-center" disabled={training} onClick={handleTrain}>
                <Play className="w-4 h-4 fill-white" />
                {training ? 'Mengeksekusi Pipeline...' : 'Mulai Training'}
              </button>
            </div>
          </motion.div>

          {/* Riwayat Training */}
          <motion.div variants={fadeUp} className="vs-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--vs-line)]">
              <h3 className="text-[14px] font-bold text-[var(--vs-ink)]">Riwayat Training</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--vs-bg)] border-b border-[var(--vs-line)]">
                    {['Tanggal', 'Algoritma', 'Akurasi', 'AUC-ROC', 'F1-Score', 'Status'].map(h => (
                      <th key={h} className="px-5 py-3 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--vs-line-soft)]">
                  {mockModelHistory.map(m => (
                    <tr key={m.id} className="hover:bg-[var(--vs-bg)] transition-colors">
                      <td className="px-5 py-3.5 text-[12px] text-[var(--vs-muted)] font-mono">{m.tanggal}</td>
                      <td className="px-5 py-3.5 text-[13px] font-medium text-[var(--vs-ink)]">{m.algoritma}</td>
                      <td className="px-5 py-3.5 text-[13px] font-bold text-[var(--vs-ink)] tabular-nums">{m.akurasi}%</td>
                      <td className="px-5 py-3.5 text-[13px] text-[var(--vs-muted)] tabular-nums">{m.auc_roc}</td>
                      <td className="px-5 py-3.5 text-[13px] text-[var(--vs-muted)] tabular-nums">{m.f1_score}</td>
                      <td className="px-5 py-3.5">{statusBadge(m.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* Right Sidebar */}
        <div className="space-y-5">

          <motion.div variants={fadeUp} className="vs-card p-5">
            <h3 className="text-[14px] font-bold text-[var(--vs-ink)] flex items-center gap-2 mb-4">
              <BarChart2 className="w-4 h-4 text-[var(--vs-brand)]" /> Overview Model Aktif
            </h3>
            {mockModelHistory.filter(m => m.status === 'Aktif').map(m => (
              <div key={m.id}>
                {[
                  ['Algoritma', m.algoritma], ['Akurasi', `${m.akurasi}%`],
                  ['AUC-ROC', m.auc_roc],    ['Precision', `${m.precision_churn}%`],
                  ['Recall', `${m.recall_churn}%`], ['F1-Score', m.f1_score],
                  ['Tanggal Deploy', m.tanggal],
                ].map(([k, v]) => (
                  <div key={k} className="flex justify-between items-center py-2.5 border-b border-[var(--vs-line-soft)] last:border-0">
                    <span className="text-[12px] text-[var(--vs-muted)]">{k}</span>
                    <span className="text-[13px] font-bold text-[var(--vs-ink)] font-mono">{v}</span>
                  </div>
                ))}
                <div className="pt-3 flex justify-between items-center">
                  <span className="text-[12px] text-[var(--vs-muted-2)]">Status Sistem</span>
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-bold rounded-md">
                    <span className="w-1.5 h-1.5 bg-[var(--vs-success)] rounded-full animate-pulse" /> Operasional
                  </span>
                </div>
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="vs-card p-5">
            <h3 className="text-[14px] font-bold text-[var(--vs-ink)] mb-1">Feature Importance</h3>
            <p className="text-[12px] text-[var(--vs-muted-2)] mb-5">5 variabel paling berpengaruh</p>
            <div className="space-y-4">
              {mockFeatureImportance.map(f => (
                <div key={f.feature_name}>
                  <div className="flex justify-between text-[12px] mb-1.5">
                    <span className="font-medium text-[var(--vs-ink)] capitalize">{f.feature_name.replace(/_/g, ' ')}</span>
                    <span className="text-[var(--vs-muted)] tabular-nums font-medium">{(f.importance_score * 100).toFixed(0)}%</span>
                  </div>
                  <div className="w-full bg-[var(--vs-line)] rounded-full h-1.5 overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-[var(--vs-brand)]"
                      initial={{ width: 0 }}
                      animate={{ width: `${(f.importance_score / maxImportance) * 100}%` }}
                      transition={{ duration: 0.8, delay: 0.2 }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </motion.div>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </DashboardShell>
  );
}
