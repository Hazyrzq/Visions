'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, Play, CheckCircle, Clock, BarChart2 } from 'lucide-react';
import Button from '@/components/ui/Button';
import { useAuth } from '@/lib/hooks/useAuth';
import { mockModelHistory, mockFeatureImportance } from '@/lib/mockData';
import { useToast, ToastContainer } from '@/components/ui/Toast';

export default function DataPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const { toasts, toast, remove } = useToast();

  const [customerFile, setCustomerFile] = useState(null);
  const [ticketFile, setTicketFile]     = useState(null);
  const [smote, setSmote]               = useState(true);
  const [featureEng, setFeatureEng]     = useState(true);
  const [hyperParam, setHyperParam]     = useState(false);
  const [training, setTraining]         = useState(false);
  const [progress, setProgress]         = useState(0);

  useEffect(() => { if (!loading && !isAdmin) router.replace('/dashboard'); }, [isAdmin, loading, router]);
  if (loading || !isAdmin) return null;

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
      ? <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">Aktif</span>
      : <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs font-medium rounded-full">Tidak Aktif</span>;

  const maxImportance = Math.max(...mockFeatureImportance.map(f => f.importance_score));

  return (
    <>
      <div className="max-w-[1300px] space-y-5">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Data & Model ML</h2>
          <p className="text-sm text-gray-400 mt-0.5">Upload dataset dan kelola training model prediksi churn</p>
        </div>

        <div className="grid xl:grid-cols-3 gap-5">
          {/* Left: Upload + Config */}
          <div className="xl:col-span-2 space-y-5">
            {/* Upload */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Upload className="w-5 h-5 text-indigo-500" /> Upload Dataset
              </h3>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { label: 'customers_dataset.csv', desc: 'Data profil & perilaku pelanggan', key: 'customer', file: customerFile, set: setCustomerFile },
                  { label: 'tickets_dataset.csv', desc: 'Data tiket support pelanggan', key: 'ticket', file: ticketFile, set: setTicketFile },
                ].map(f => (
                  <label key={f.key} className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 hover:border-indigo-400 rounded-xl p-6 cursor-pointer transition-all group">
                    <input type="file" accept=".csv" className="hidden" onChange={e => f.set(e.target.files[0])} />
                    {f.file ? (
                      <div className="text-center">
                        <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                        <div className="text-sm font-semibold text-gray-800">{f.file.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{(f.file.size / 1024).toFixed(1)} KB</div>
                      </div>
                    ) : (
                      <div className="text-center">
                        <Upload className="w-8 h-8 text-gray-300 group-hover:text-indigo-400 mx-auto mb-2 transition-colors" />
                        <div className="text-sm font-semibold text-gray-700">{f.label}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{f.desc}</div>
                        <div className="text-xs text-indigo-500 mt-2">Klik untuk upload</div>
                      </div>
                    )}
                  </label>
                ))}
              </div>
            </div>

            {/* Config */}
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Konfigurasi Training</h3>
              <div className="space-y-3">
                {[
                  { label: 'SMOTE (Balancing Kelas)',      desc: 'Menangani ketidakseimbangan kelas churn vs non-churn',    val: smote,      set: setSmote },
                  { label: 'Feature Engineering',          desc: 'Membuat fitur turunan untuk meningkatkan akurasi model',  val: featureEng, set: setFeatureEng },
                  { label: 'Hyperparameter Tuning (Grid)', desc: 'Mencari parameter terbaik (memerlukan waktu lebih lama)', val: hyperParam,  set: setHyperParam },
                ].map(opt => (
                  <label key={opt.label} className="flex items-center justify-between p-4 border border-gray-100 rounded-xl hover:bg-gray-50 cursor-pointer transition-colors">
                    <div>
                      <div className="text-sm font-medium text-gray-800">{opt.label}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{opt.desc}</div>
                    </div>
                    <div
                      onClick={() => opt.set(v => !v)}
                      className={`relative w-10 h-5.5 rounded-full transition-colors flex-shrink-0 ${opt.val ? 'bg-indigo-600' : 'bg-gray-200'}`}
                      style={{ height: '22px', width: '40px' }}
                    >
                      <div className={`absolute top-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-all ${opt.val ? 'left-[18px]' : 'left-0.5'}`} style={{ width:'18px', height:'18px' }} />
                    </div>
                  </label>
                ))}
              </div>

              {training && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1.5">
                    <span>Training model...</span><span>{progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-indigo-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}

              <Button
                variant="primary"
                size="lg"
                className="w-full mt-4"
                loading={training}
                onClick={handleTrain}
              >
                <Play className="w-4 h-4" />
                {training ? 'Training Berlangsung…' : 'Mulai Training'}
              </Button>
            </div>

            {/* History Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-100">
                <h3 className="font-semibold text-gray-900">Riwayat Training</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      {['Tanggal','Algoritma','Akurasi','AUC-ROC','F1-Score','Status'].map(h => (
                        <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {mockModelHistory.map(m => (
                      <tr key={m.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="px-4 py-3 text-gray-600 text-xs tabular-nums">{m.tanggal}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{m.algoritma}</td>
                        <td className="px-4 py-3 font-semibold text-indigo-600 tabular-nums">{m.akurasi}%</td>
                        <td className="px-4 py-3 tabular-nums text-gray-700">{m.auc_roc}</td>
                        <td className="px-4 py-3 tabular-nums text-gray-700">{m.f1_score}</td>
                        <td className="px-4 py-3">{statusBadge(m.status)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Right: Active Model + Feature Importance */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-indigo-500" /> Model Aktif
              </h3>
              {mockModelHistory.filter(m => m.status === 'Aktif').map(m => (
                <div key={m.id} className="space-y-2">
                  {[
                    ['Algoritma', m.algoritma],
                    ['Akurasi', `${m.akurasi}%`],
                    ['AUC-ROC', m.auc_roc],
                    ['Precision', `${m.precision_churn}%`],
                    ['Recall', `${m.recall_churn}%`],
                    ['F1-Score', m.f1_score],
                    ['Tanggal Training', m.tanggal],
                  ].map(([k, v]) => (
                    <div key={k} className="flex justify-between py-1.5 border-b border-gray-50 last:border-0">
                      <span className="text-xs text-gray-500">{k}</span>
                      <span className="text-xs font-semibold text-gray-800">{v}</span>
                    </div>
                  ))}
                  <div className="pt-1">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-medium rounded-full">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" /> Aktif
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-900 mb-4">Feature Importance (Top 5)</h3>
              <div className="space-y-3">
                {mockFeatureImportance.map((f, i) => (
                  <div key={f.feature_name}>
                    <div className="flex justify-between text-xs mb-1">
                      <span className="font-medium text-gray-700">{f.feature_name.replace(/_/g, ' ')}</span>
                      <span className="text-gray-500 tabular-nums">{(f.importance_score * 100).toFixed(0)}%</span>
                    </div>
                    <div className="w-full bg-gray-100 rounded-full h-1.5">
                      <div
                        className="h-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500"
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
      <ToastContainer toasts={toasts} onRemove={remove} />
    </>
  );
}
