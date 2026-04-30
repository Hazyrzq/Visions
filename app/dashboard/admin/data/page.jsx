'use client';

import { useState } from 'react';
import { Upload, Play, CheckCircle, BarChart2, Database, Settings2 } from 'lucide-react';
import { mockModelHistory, mockFeatureImportance } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';

// Catatan: Impor komponen UI Button bawaan dinonaktifkan sementara karena 
// UI-nya di-inline langsung agar presisi dengan design system yang baru.
// import Button from '@/components/ui/Button';

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
      ? <span className="vs-tag bg-emerald-50 text-emerald-600 border-emerald-100">Aktif</span>
      : <span className="vs-tag bg-[var(--bg-2)] text-[var(--muted)] border-[var(--line)]">Tidak Aktif</span>;

  const maxImportance = Math.max(...mockFeatureImportance.map(f => f.importance_score));

  return (
    <div className="vs-root">
      {/* ─── CSS Global (Design System Visions) ─── */}
      <style jsx global>{`
        .vs-root {
          --bg:        #FAFAFA;
          --bg-2:      #F4F4F5;
          --surface:   #FFFFFF;
          --ink:       #0A0A0A;
          --ink-2:     #18181B;
          --muted:     #52525B;
          --muted-2:   #71717A;
          --muted-3:   #A1A1AA;
          --line:      #E4E4E7;
          --line-2:    #EAEAEC;
          --line-soft: #F0F0F2;

          --brand:     #4F46E5;
          --success:   #10B981;
          --warn:      #F59E0B;
          --danger:    #EF4444;

          --shadow-xs: 0 1px 2px rgba(16,24,40,0.04);
          
          font-family: 'Geist', 'Inter', -apple-system, sans-serif;
          color: var(--ink);
        }
        .vs-root .mono { font-family: 'Geist Mono', monospace; }
        .vs-card {
          background: var(--surface);
          border: 1px solid var(--line);
          border-radius: 12px;
          box-shadow: var(--shadow-xs);
        }
        .vs-tag {
          display: inline-flex; align-items: center; justify-content: center; gap: 4px;
          padding: 4px 10px; border-radius: 6px;
          font-size: 11px; font-weight: 600; letter-spacing: 0.02em;
          border: 1px solid transparent;
        }
        
        /* Buttons */
        .vs-btn {
          display:inline-flex; align-items:center; justify-content:center; gap:8px;
          font-size: 13px; font-weight: 500;
          padding: 8px 16px; border-radius: 8px;
          transition: all .2s ease; cursor: pointer;
        }
        .vs-btn:disabled { opacity: 0.65; cursor: not-allowed; }
        .vs-btn--primary {
          color: #fff; background: var(--ink); border: 1px solid var(--ink);
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
        }
        .vs-btn--primary:hover:not(:disabled) { background: var(--ink-2); transform: translateY(-0.5px); }

        /* Custom Toggle Switch */
        .vs-toggle {
          position: relative; width: 36px; height: 20px; border-radius: 999px;
          transition: background 0.2s ease; cursor: pointer; flex-shrink: 0;
        }
        .vs-toggle[data-state="true"] { background: var(--ink); }
        .vs-toggle[data-state="false"] { background: var(--line); }
        .vs-toggle-thumb {
          position: absolute; top: 2px; left: 2px; width: 16px; height: 16px;
          background: #fff; border-radius: 999px; box-shadow: 0 1px 2px rgba(0,0,0,0.1);
          transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .vs-toggle[data-state="true"] .vs-toggle-thumb { transform: translateX(16px); }
      `}</style>

      <div className="max-w-[1200px] mx-auto space-y-6 pb-12">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-8 h-8 rounded-lg bg-[var(--bg-2)] border border-[var(--line)] flex items-center justify-center">
                <Database className="w-4 h-4 text-[var(--ink)]" />
              </div>
              <h1 className="text-[24px] font-semibold tracking-[-0.02em] text-[var(--ink)]">Data & Model ML</h1>
            </div>
            <p className="text-[14px] text-[var(--muted)] ml-11">Kelola dataset, rekayasa fitur, dan latih model prediksi churn Anda.</p>
          </div>
        </div>

        <div className="grid xl:grid-cols-3 gap-5">
          
          <div className="xl:col-span-2 space-y-5">
            
            {/* ═══════════════════════ UPLOAD DATASET ═══════════════════════ */}
            <div className="vs-card p-6">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-[14px] font-semibold text-[var(--ink)] flex items-center gap-2">
                  <Upload className="w-4 h-4 text-[var(--muted)]" /> Upload Dataset
                </h3>
              </div>
              
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'customers_dataset.csv', desc: 'Data profil & perilaku', key: 'customer', file: customerFile, set: setCustomerFile },
                  { label: 'tickets_dataset.csv',   desc: 'Data tiket & keluhan',   key: 'ticket',   file: ticketFile,   set: setTicketFile },
                ].map(f => (
                  <label key={f.key} className="flex flex-col items-center justify-center border border-dashed border-[var(--line)] bg-[var(--bg-2)] hover:bg-[var(--surface)] hover:border-[var(--ink)] rounded-xl p-6 cursor-pointer transition-all group">
                    <input type="file" accept=".csv" className="hidden" onChange={e => f.set(e.target.files[0])} />
                    {f.file ? (
                      <div className="text-center">
                        <CheckCircle className="w-7 h-7 text-[var(--ink)] mx-auto mb-2" strokeWidth={2} />
                        <div className="text-[13px] font-semibold text-[var(--ink)]">{f.file.name}</div>
                        <div className="text-[11px] text-[var(--muted)] mt-1 mono">{(f.file.size / 1024).toFixed(1)} KB</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="w-8 h-8 rounded-full bg-[var(--surface)] border border-[var(--line)] flex items-center justify-center mx-auto mb-3 shadow-sm group-hover:border-[var(--ink)] transition-colors">
                          <Upload className="w-3.5 h-3.5 text-[var(--muted)] group-hover:text-[var(--ink)] transition-colors" />
                        </div>
                        <div className="text-[13px] font-semibold text-[var(--ink)]">{f.label}</div>
                        <div className="text-[12px] text-[var(--muted)] mt-0.5">{f.desc}</div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* ═══════════════════════ KONFIGURASI TRAINING ═══════════════════════ */}
            <div className="vs-card p-6">
              <div className="flex items-center mb-5 gap-2">
                <Settings2 className="w-4 h-4 text-[var(--muted)]" />
                <h3 className="text-[14px] font-semibold text-[var(--ink)]">Konfigurasi Training</h3>
              </div>
              
              <div className="space-y-2">
                {[
                  { label: 'SMOTE (Balancing Kelas)',      desc: 'Tangani ketidakseimbangan kelas target churn.',      val: smote,      set: setSmote },
                  { label: 'Feature Engineering',          desc: 'Kalkulasi fitur turunan untuk meningkatkan presisi.',  val: featureEng, set: setFeatureEng },
                  { label: 'Hyperparameter Tuning (Grid)', desc: 'Cari parameter model terbaik (menambah waktu latih).', val: hyperParam, set: setHyperParam },
                ].map(opt => (
                  <label key={opt.label} className="flex items-center justify-between p-3.5 border border-[var(--line)] bg-[var(--surface)] rounded-lg hover:bg-[var(--bg-2)] cursor-pointer transition-colors">
                    <div>
                      <div className="text-[13px] font-medium text-[var(--ink)]">{opt.label}</div>
                      <div className="text-[12px] text-[var(--muted)] mt-0.5">{opt.desc}</div>
                    </div>
                    <div className="vs-toggle" data-state={opt.val} onClick={() => opt.set(v => !v)}>
                      <div className="vs-toggle-thumb" />
                    </div>
                  </label>
                ))}
              </div>

              {training && (
                <div className="mt-5 p-4 rounded-lg bg-[var(--bg-2)] border border-[var(--line)]">
                  <div className="flex justify-between items-center text-[12px] font-medium text-[var(--ink)] mb-2.5">
                    <span className="flex items-center gap-2">
                      <div className="w-3 h-3 border-2 border-[var(--ink)] border-t-transparent rounded-full animate-spin" />
                      Training model...
                    </span>
                    <span className="mono">{progress}%</span>
                  </div>
                  <div className="w-full bg-[var(--line)] rounded-full h-1.5 overflow-hidden">
                    <div className="bg-[var(--ink)] h-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <div className="mt-5 pt-5 border-t border-[var(--line-soft)]">
                <button className="vs-btn vs-btn--primary w-full" disabled={training} onClick={handleTrain}>
                  <Play className="w-4 h-4 fill-white" />
                  {training ? 'Mengeksekusi Pipeline...' : 'Mulai Training'}
                </button>
              </div>
            </div>

            {/* ═══════════════════════ RIWAYAT TRAINING ═══════════════════════ */}
            <div className="vs-card overflow-hidden">
              <div className="px-5 py-4 border-b border-[var(--line)] bg-[var(--surface)]">
                <h3 className="text-[14px] font-semibold text-[var(--ink)]">Riwayat Training</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[var(--bg-2)] border-b border-[var(--line)]">
                      {['Tanggal', 'Algoritma', 'Akurasi', 'AUC-ROC', 'F1-Score', 'Status'].map(h => (
                        <th key={h} className="px-5 py-3.5 text-[11px] font-semibold text-[var(--muted)] uppercase tracking-wider whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--line-soft)] bg-[var(--surface)]">
                    {mockModelHistory.map(m => (
                      <tr key={m.id} className="hover:bg-[var(--bg)] transition-colors">
                        <td className="px-5 py-3.5 text-[12px] text-[var(--muted)] mono whitespace-nowrap">{m.tanggal}</td>
                        <td className="px-5 py-3.5 text-[13px] font-medium text-[var(--ink)]">{m.algoritma}</td>
                        <td className="px-5 py-3.5 text-[13px] font-semibold text-[var(--ink)] tabular-nums">{m.akurasi}%</td>
                        <td className="px-5 py-3.5 text-[13px] text-[var(--muted)] tabular-nums">{m.auc_roc}</td>
                        <td className="px-5 py-3.5 text-[13px] text-[var(--muted)] tabular-nums">{m.f1_score}</td>
                        <td className="px-5 py-3.5">{statusBadge(m.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ═══════════════════════ SIDEBAR KANAN ═══════════════════════ */}
          <div className="space-y-5 flex flex-col">
            
            {/* Model Aktif */}
            <div className="vs-card p-5">
              <div className="flex items-center gap-2 mb-4">
                <BarChart2 className="w-4 h-4 text-[var(--muted)]" />
                <h3 className="text-[14px] font-semibold text-[var(--ink)]">Overview Model Aktif</h3>
              </div>
              
              {mockModelHistory.filter(m => m.status === 'Aktif').map(m => (
                <div key={m.id} className="space-y-0.5">
                  {[
                    ['Algoritma', m.algoritma], ['Akurasi', `${m.akurasi}%`],
                    ['AUC-ROC', m.auc_roc], ['Precision', `${m.precision_churn}%`],
                    ['Recall', `${m.recall_churn}%`], ['F1-Score', m.f1_score],
                    ['Tanggal Deploy', m.tanggal],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between items-center py-2 border-b border-[var(--line-soft)] last:border-0">
                      <span className="text-[12px] text-[var(--muted)]">{k}</span>
                      <span className="text-[13px] font-medium text-[var(--ink)] mono">{v}</span>
                    </div>
                  ))}
                  
                  <div className="pt-4 mt-1 flex justify-between items-center">
                    <span className="text-[12px] text-[var(--muted-2)]">Status Sistem</span>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 border border-emerald-100 text-emerald-700 text-[11px] font-semibold rounded-md">
                      <span className="w-1.5 h-1.5 bg-[var(--success)] rounded-full animate-pulse" /> Operasional
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Feature Importance */}
            <div className="vs-card p-5">
              <h3 className="text-[14px] font-semibold text-[var(--ink)] mb-1">Feature Importance</h3>
              <p className="text-[12px] text-[var(--muted-2)] mb-5">5 variabel paling berpengaruh (XGBoost)</p>
              
              <div className="space-y-4">
                {mockFeatureImportance.map(f => (
                  <div key={f.feature_name}>
                    <div className="flex justify-between items-center text-[12px] mb-1.5">
                      <span className="font-medium text-[var(--ink)] capitalize">
                        {f.feature_name.replace(/_/g, ' ')}
                      </span>
                      <span className="text-[var(--muted)] tabular-nums font-medium">
                        {(f.importance_score * 100).toFixed(0)}%
                      </span>
                    </div>
                    <div className="w-full bg-[var(--line)] rounded-full h-1.5 overflow-hidden">
                      <div 
                        className="h-full rounded-full bg-[var(--ink)] transition-all duration-1000" 
                        style={{ width: `${(f.importance_score / maxImportance) * 100}%` }} 
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>
      
      {/* Toast System dipertahankan */}
      <ToastContainer toasts={toasts} onRemove={remove} />
    </div>
  );
}