'use client';

import { useLang } from '@/lib/i18n/LanguageContext';
import { useState, useEffect, useRef } from 'react';
import { Upload, Play, CheckCircle, Database, PieChart, Users, AlertTriangle, Eye, X, Clock, User, Filter, RotateCcw, Loader2 } from 'lucide-react';
import { startRetensi, getRetensiStatus, getRetensiHasil, RISK_COLOR, RISK_LABEL } from '@/lib/churnshield';
import { motion, AnimatePresence } from 'framer-motion';
import { useToast, ToastContainer } from '@/components/ui/Toast';
import DashboardShell from '@/components/dashboard/DashboardShell';
import Papa from 'papaparse';
import { createClient } from '@supabase/supabase-js'; 
import { useAuth } from '@/lib/hooks/useAuth';

// pindahin koneksi database ke luar komponen agar tidak terputus saat pindah tab
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function AdminDataPage() {
  const { profile } = useAuth();
  const { t, lang } = useLang();
  const { toasts, toast, remove } = useToast();
  
  const [modelHistory, setModelHistory] = useState([]);
  const [selectedHistory, setSelectedHistory] = useState(null);
  const [historyDetails, setHistoryDetails] = useState([]);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [latestPredictions, setLatestPredictions] = useState([]);
  const [batchSummary, setBatchSummary] = useState(null);
  const [filterRisk, setFilterRisk] = useState('All'); 

  // tambahin state khusus buat nunggu data pas pindah tab
  const [isLoadingData, setIsLoadingData] = useState(true);

  const [files, setFiles] = useState({
    accounts: null, usage: null, billing: null, tickets: null, nps: null
  });

  const [training, setTraining] = useState(false);
  const [progress, setProgress] = useState(0);

  // Retensi Otomatis
  const [retensiStatus, setRetensiStatus] = useState('idle');
  const [retensiHasil, setRetensiHasil] = useState(null);
  const [retensiError, setRetensiError] = useState('');
  const [retensiStarting, setRetensiStarting] = useState(false);
  const retensiPollRef = useRef(null);

  const stopRetensiPoll = () => {
    if (retensiPollRef.current) { clearInterval(retensiPollRef.current); retensiPollRef.current = null; }
  };

  const fetchRetensiHasil = async () => {
    try {
      const res = await getRetensiHasil();
      setRetensiHasil(Array.isArray(res) ? res : (res?.hasil ?? res?.data ?? []));
    } catch {}
  };

  const pollRetensiStatus = async () => {
    try {
      const res = await getRetensiStatus();
      const s = res?.status ?? 'idle';
      setRetensiStatus(s);
      if (s === 'completed' || s === 'done') { stopRetensiPoll(); setRetensiStatus('completed'); fetchRetensiHasil(); }
      else if (s === 'error' || s === 'failed') { stopRetensiPoll(); setRetensiStatus('error'); setRetensiError(res?.message ?? 'Gagal'); }
    } catch (e) { stopRetensiPoll(); setRetensiStatus('error'); setRetensiError(e.message); }
  };

  const handleStartRetensi = async () => {
    setRetensiStarting(true);
    setRetensiError('');
    setRetensiHasil(null);
    try {
      await startRetensi();
      setRetensiStatus('running');
      retensiPollRef.current = setInterval(pollRetensiStatus, 3000);
    } catch (e) { setRetensiError(e.message); setRetensiStatus('error'); }
    finally { setRetensiStarting(false); }
  };

  useEffect(() => () => stopRetensiPoll(), []);

  const fetchAllHistory = async () => {
    const { data: models, error } = await supabase
      .from('model_history')
      .select('*')
      .order('id', { ascending: false });
    
    if (!error && models) setModelHistory(models);
  };

  const fetchLatestResults = async () => {
    const { data: latestBatch } = await supabase
      .from('model_history')
      .select('id, tanggal')
      .order('id', { ascending: false })
      .limit(1)
      .single();

    if (latestBatch) {
      const { data: preds } = await supabase
        .from('prediction_history')
        .select('customer_id, company_name, churn_score, risk_level')
        .eq('model_history_id', latestBatch.id)
        .order('churn_score', { ascending: false });

      if (preds) {
        setLatestPredictions(preds.slice(0, 5));
        setBatchSummary({
          total: preds.length,
          high: preds.filter(p => p.risk_level === 'Tinggi').length,
          medium: preds.filter(p => p.risk_level === 'Sedang').length,
          low: preds.filter(p => p.risk_level === 'Rendah').length,
          tanggal: latestBatch.tanggal
        });
      }
    }
  };

  // gabungin proses fetch biar jalan barengan pas halaman dibuka
  useEffect(() => {
    const loadAll = async () => {
      setIsLoadingData(true);
      await fetchAllHistory();
      await fetchLatestResults();
      setIsLoadingData(false);
    };
    loadAll();
  }, []);

  const handleViewHistoryDetail = async (history, displayIndex) => {
    setSelectedHistory({ ...history, displayIndex });
    setHistoryDetails([]);
    setFilterRisk('All'); 
    setLoadingDetail(true);
    
    const { data: details, error } = await supabase
      .from('prediction_history')
      .select('customer_id, company_name, churn_score, risk_level')
      .eq('model_history_id', history.id)
      .order('churn_score', { ascending: false });

    if (!error && details) setHistoryDetails(details);
    setLoadingDetail(false);
  };

  const handleFileChange = (key, file) => {
    setFiles(prev => ({ ...prev, [key]: file }));
  };

  const handlePredict = async () => {
    if (!files.accounts || !files.usage || !files.billing || !files.tickets || !files.nps) {
      toast('Mohon Upload Kelima File CSV Terlebih Dahulu', 'warning');
      return;
    }

    setTraining(true);
    setProgress(10);

    try {
      const formData = new FormData();
      formData.append('file_accounts', files.accounts);
      formData.append('file_usage', files.usage);
      formData.append('file_billing', files.billing);
      formData.append('file_tickets', files.tickets);
      formData.append('file_nps', files.nps);

      const response = await fetch('http://basic-8.alstore.space:23998/predict-batch', {
        method: 'POST', body: formData
      });

      if (!response.ok) throw new Error('Gagal Memproses Data di Server AI');

      const csvText = await response.text();

      Papa.parse(csvText, {
        header: true,
        skipEmptyLines: true,
        complete: async (results) => {
          const data = results.data;
          
          const { data: historyInsert, error: historyError } = await supabase
            .from('model_history')
            .insert([{
              tanggal: new Date().toISOString(),
              algoritma: 'LightGBM Classifier', 
              status: 'Aktif',
              processed_by: profile?.full_name || 'Admin System'
            }])
            .select('id').single();

          if (historyError) throw historyError;
          const newHistoryId = historyInsert.id;

          const mappedData = data.map(row => {
            let riskId = 'Rendah';
            let prio = 3;
            if (row.risk_level === 'High') { riskId = 'Tinggi'; prio = 1; }
            else if (row.risk_level === 'Medium') { riskId = 'Sedang'; prio = 2; }

            return {
              customer_id: row.customer_id,
              company_name: `Pelanggan ${row.customer_id.split('-')[1] || row.customer_id}`, 
              plan_type: row.plan_type,
              contract_type: row.contract_type,
              customer_type: row.customer_type,
              tenure_months: parseFloat(row.tenure_months) || 0,
              total_payment_value: parseFloat(row.total_payment_value) || 0,
              mrr: parseFloat(row.mrr) || 0,
              total_dunning: parseInt(row.total_dunning) || 0,
              avg_payment_delay: parseFloat(row.avg_payment_delay) || 0,
              days_since_login: parseInt(row.days_since_login) || 0,
              avg_nps_score: parseFloat(row.avg_nps_score) || 0,
              total_tickets: parseInt(row.total_tickets) || 0,
              avg_severity: parseFloat(row.avg_severity) || 0,
              severe_ticket_ratio: parseFloat(row.severe_ticket_ratio) || 0,
              avg_usage_hrs: parseFloat(row.avg_usage_hrs) || 0,
              usage_per_user: parseFloat(row.usage_per_user) || 0,
              avg_feature_adoption: parseFloat(row.avg_feature_adoption) || 0,
              churn_actual: row.churn === '1',
              churn_score: parseFloat(row.churn_score) || 0,
              risk_level: riskId,
              prioritas: prio
            };
          });

          await supabase.from('customers').upsert(mappedData, { onConflict: 'customer_id' });

          const historyMappedData = mappedData.map(item => ({
            ...item, 
            model_history_id: newHistoryId,
            processed_by: profile?.full_name || 'Admin System'
          }));

          await supabase.from('prediction_history').insert(historyMappedData);
          
          toast(`Sukses! ${data.length} Pelanggan Berhasil Diproses`, 'success');
          await fetchAllHistory();
          await fetchLatestResults();
          setTraining(false);
        }
      });
    } catch (error) {
      setTraining(false);
      toast(error.message, 'error');
    }
  };

  const fileInputsConfig = [
    { label: 'Customer Accounts', key: 'accounts', desc: 'Data Profil Pelanggan' },
    { label: 'Monthly Usage', key: 'usage', desc: 'Durasi Penggunaan App' },
    { label: 'Billing Data', key: 'billing', desc: 'Riwayat Tagihan & Dunning' },
    { label: 'Support Tickets', key: 'tickets', desc: 'Data Komplain / Severity' },
    { label: 'NPS Surveys', key: 'nps', desc: 'Skor Kepuasan Pelanggan' },
  ];

  const formatDateTime = (dateStr) => {
    if (!dateStr) return '-';
    const d = new Date(dateStr);
    return d.toLocaleString('id-ID', { 
      day: '2-digit', month: 'short', year: 'numeric', 
      hour: '2-digit', minute: '2-digit' 
    });
  };

  const filteredDetails = filterRisk === 'All' 
    ? historyDetails 
    : historyDetails.filter(d => d.risk_level === filterRisk);

  return (
    <DashboardShell
      title="Data & Model ML"
      description="Kelola Dataset Dan Pantau Riwayat Prediksi Log Aktivitas Admin Secara Transparan."
      icon={Database}
    >
      <div className="grid xl:grid-cols-3 gap-5">
        <div className="xl:col-span-2 space-y-5">
          {/* box upload */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.05, ease:[0.16,1,0.3,1] }} className="vs-card p-6">
            <h3 className="text-[14px] font-bold text-[var(--vs-ink)] flex items-center gap-2 mb-5">
              <Upload className="w-4 h-4 text-[var(--vs-muted-2)]" /> Upload 5 Dataset Mentah
            </h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {fileInputsConfig.map(f => (
                <label key={f.key} className="flex flex-col items-center justify-center border-2 border-dashed border-[var(--vs-line)] bg-[var(--vs-bg)] hover:bg-[var(--vs-surface)] hover:border-[var(--vs-brand-200)] rounded-xl p-4 cursor-pointer transition-all group">
                  <input type="file" accept=".csv" className="hidden" onChange={e => handleFileChange(f.key, e.target.files[0])} />
                  {files[f.key] ? (
                    <div className="text-center">
                      <CheckCircle className="w-6 h-6 text-[var(--vs-success)] mx-auto mb-2" />
                      <div className="text-[12px] font-semibold text-[var(--vs-ink)] truncate w-32">{files[f.key].name}</div>
                    </div>
                  ) : (
                    <div className="text-center">
                      <Upload className="w-5 h-5 text-[var(--vs-muted-2)] mx-auto mb-2" />
                      <div className="text-[12px] font-semibold text-[var(--vs-ink)]">{f.label}</div>
                    </div>
                  )}
                </label>
              ))}
            </div>
            <button className="vs-btn vs-btn--primary w-full mt-5 justify-center" disabled={training} onClick={handlePredict}>
              <Play className="w-4 h-4 fill-white" />
              {training ? 'Sedang Memproses...' : 'Proses Data & Simpan Ke Database'}
            </button>
          </motion.div>

          {/* tabel riwayat (dikembalikan pakai tombol aksi) */}
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.12, ease:[0.16,1,0.3,1] }} className="vs-card overflow-hidden">
            <div className="px-5 py-4 border-b border-[var(--vs-line)]">
              <h3 className="text-[14px] font-bold text-[var(--vs-ink)]">Riwayat Aktivitas Pemrosesan Data</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[var(--vs-bg)] border-b border-[var(--vs-line)]">
                    <th className="px-5 py-3 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase">No</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase">Waktu & Tanggal</th>
                    <th className="px-5 py-3 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase">Diproses Oleh</th>
                    {/* Kolom Aksi Dikembalikan */}
                    <th className="px-5 py-3 text-[11px] font-semibold text-[var(--vs-muted-2)] uppercase">Aksi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--vs-line-soft)]">
                  {isLoadingData ? (
                    <tr>
                      <td colSpan="4" className="px-5 py-8 text-center">
                        <div className="flex items-center justify-center gap-2 text-[12px] text-slate-500">
                          <div className="w-4 h-4 border-2 border-[var(--vs-brand)] border-t-transparent rounded-full animate-spin" />
                          Memuat Riwayat Data...
                        </div>
                      </td>
                    </tr>
                  ) : modelHistory.length > 0 ? (
                    modelHistory.map((m, index) => {
                      const displayNum = index + 1; // penomoran mulai dari 1 berurutan
                      return (
                        <tr key={m.id} className="hover:bg-slate-50 transition-colors group">
                          <td className="px-5 py-3.5 text-[12px] font-bold text-[var(--vs-brand)]">{displayNum}</td>
                          <td className="px-5 py-3.5 text-[12px] flex items-center gap-2">
                            <Clock className="w-3 h-3 text-slate-400 group-hover:text-[var(--vs-brand)] transition-colors" /> 
                            {formatDateTime(m.tanggal)}
                          </td>
                          <td className="px-5 py-3.5 text-[13px] font-medium">
                            <div className="flex items-center gap-2">
                              <User className="w-3.5 h-3.5 text-slate-400 group-hover:text-[var(--vs-brand)] transition-colors" /> 
                              {m.processed_by || 'System'}
                            </div>
                          </td>
                          {/* Tombol Lihat Detail */}
                          <td className="px-5 py-3.5">
                            <button 
                              onClick={() => handleViewHistoryDetail(m, displayNum)}
                              className="text-[var(--vs-brand)] bg-blue-50/50 hover:bg-blue-100 hover:text-blue-700 px-3 py-1.5 rounded-md flex items-center gap-1.5 text-[12px] font-bold transition-all cursor-pointer border border-transparent hover:border-blue-200"
                            >
                              <Eye className="w-3.5 h-3.5" /> Lihat Detail
                            </button>
                          </td>
                        </tr>
                      )
                    })
                  ) : (
                    <tr>
                      <td colSpan="4" className="px-5 py-6 text-center text-[12px] text-slate-500">Belum Ada Riwayat Aktivitas.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>
        </div>

        {/* ringkasan dashboard */}
        <div className="space-y-5">
          <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.19, ease:[0.16,1,0.3,1] }} className="vs-card p-5">
            <h3 className="text-[14px] font-bold text-[var(--vs-ink)] flex items-center gap-2 mb-4">
              <PieChart className="w-4 h-4 text-[var(--vs-brand)]" /> Ringkasan Prediksi Terakhir
            </h3>
            {isLoadingData ? (
              <div className="py-8 flex items-center justify-center gap-2 text-[12px] text-slate-500">
                <div className="w-4 h-4 border-2 border-[var(--vs-brand)] border-t-transparent rounded-full animate-spin" />
                Membaca Data...
              </div>
            ) : batchSummary ? (
              <div className="space-y-3 text-[13px]">
                <div className="flex justify-between border-b pb-2"><span>Total Pelanggan:</span><b className="text-slate-800">{batchSummary.total} Orang</b></div>
                <div className="flex justify-between text-red-600"><span>Risiko Tinggi:</span><b>{batchSummary.high}</b></div>
                <div className="flex justify-between text-amber-600"><span>Risiko Sedang:</span><b>{batchSummary.medium}</b></div>
                <div className="flex justify-between text-emerald-600"><span>Risiko Rendah:</span><b>{batchSummary.low}</b></div>
                <div className="pt-2 text-[11px] text-slate-400 italic">Data Per: {formatDateTime(batchSummary.tanggal)}</div>
              </div>
            ) : (
              <p className="text-xs text-center py-4 text-slate-400">Belum Ada Data Prediksi</p>
            )}
          </motion.div>
        </div>
      </div>

      {/* modal detail */}
      <AnimatePresence>
        {selectedHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-10 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white w-full max-w-5xl h-[80vh] rounded-3xl shadow-2xl flex flex-col overflow-hidden"
            >
              <div className="p-6 border-b flex justify-between items-center bg-slate-50">
                <div>
                  <h2 className="text-xl font-bold text-slate-800">Detail Hasil Prediksi</h2>
                  <p className="text-sm text-slate-500">Diproses Oleh {selectedHistory.processed_by || 'System'} Pada {formatDateTime(selectedHistory.tanggal)}</p>
                </div>
                <button onClick={() => setSelectedHistory(null)} className="p-2 hover:bg-slate-200 rounded-full transition-colors">
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              <div className="flex-1 overflow-auto p-6">
                {loadingDetail ? (
                  <div className="h-full flex flex-col items-center justify-center gap-3 text-slate-500 italic">
                    <div className="w-8 h-8 border-2 border-[var(--vs-brand)] border-t-transparent rounded-full animate-spin" />
                    Memuat Data Historis...
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* section filter */}
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-slate-700">
                        Daftar Pelanggan ({filteredDetails.length} Data)
                      </h3>
                      <div className="flex items-center gap-2">
                        <Filter className="w-4 h-4 text-slate-500" />
                        <select 
                          value={filterRisk} 
                          onChange={(e) => setFilterRisk(e.target.value)}
                          className="border border-slate-300 rounded-lg text-sm px-3 py-1.5 focus:outline-none focus:border-[var(--vs-brand)] bg-white text-slate-700 font-medium cursor-pointer"
                        >
                          <option value="All">Semua Risiko</option>
                          <option value="Tinggi">Risiko Tinggi</option>
                          <option value="Sedang">Risiko Sedang</option>
                          <option value="Rendah">Risiko Rendah</option>
                        </select>
                      </div>
                    </div>

                    <div className="border rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-[12px]">
                        <thead className="bg-slate-50 border-b">
                          <tr>
                            <th className="px-4 py-3 font-bold text-slate-600">No</th>
                            <th className="px-4 py-3 font-bold text-slate-600">ID Pelanggan</th>
                            <th className="px-4 py-3 font-bold text-slate-600">Nama Perusahaan</th>
                            <th className="px-4 py-3 font-bold text-slate-600">Skor Churn</th>
                            <th className="px-4 py-3 font-bold text-slate-600 text-center">Level Risiko</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {filteredDetails.length > 0 ? (
                            filteredDetails.map((d, idx) => (
                              <tr key={d.id} className="hover:bg-slate-50">
                                <td className="px-4 py-3 text-slate-400 font-mono">{idx + 1}</td>
                                <td className="px-4 py-3 font-mono font-semibold text-[var(--vs-brand)]">{d.customer_id}</td>
                                <td className="px-4 py-3 text-slate-700 font-medium uppercase">{d.company_name}</td>
                                <td className="px-4 py-3 font-bold text-slate-800 tabular-nums">{d.churn_score}%</td>
                                <td className="px-4 py-3 text-center">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    d.risk_level === 'Tinggi' ? 'bg-red-100 text-red-700' : 
                                    d.risk_level === 'Sedang' ? 'bg-amber-100 text-amber-700' : 
                                    'bg-emerald-100 text-emerald-700'
                                  }`}>
                                    {d.risk_level}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="px-4 py-8 text-center text-slate-500 italic">
                                Tidak ada data dengan filter {filterRisk}.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ── Retensi Otomatis ── */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.4, delay:0.26, ease:[0.16,1,0.3,1] }} className="mt-8">
        <div className="vs-card overflow-hidden">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 px-6 py-5"
            style={{ background: 'linear-gradient(135deg,#eff6ff 0%,#f8faff 100%)' }}>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600 shadow-sm shadow-blue-200">
                <RotateCcw className="h-5 w-5 text-white" />
              </div>
              <div>
                <h2 className="text-[15px] font-bold text-slate-900">Retensi Otomatis</h2>
                <p className="text-[12px] text-slate-500">Jalankan AI untuk mengirim aksi retensi ke pelanggan berisiko tinggi</p>
              </div>
            </div>

            {/* Status + Tombol */}
            <div className="flex items-center gap-3 shrink-0">
              <div className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-[12px] font-semibold border ${
                retensiStatus === 'running'   ? 'bg-blue-50 text-blue-600 border-blue-200'
                : retensiStatus === 'completed' ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                : retensiStatus === 'error'     ? 'bg-red-50 text-red-600 border-red-200'
                : 'bg-slate-100 text-slate-500 border-slate-200'
              }`}>
                {retensiStatus === 'running'   ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                 : retensiStatus === 'completed' ? <CheckCircle className="h-3.5 w-3.5" />
                 : retensiStatus === 'error'     ? <AlertTriangle className="h-3.5 w-3.5" />
                 : <Clock className="h-3.5 w-3.5" />}
                {retensiStatus === 'running'   ? 'Sedang berjalan…'
                 : retensiStatus === 'completed' ? 'Selesai'
                 : retensiStatus === 'error'     ? 'Gagal'
                 : 'Siap dijalankan'}
              </div>
              <button
                onClick={handleStartRetensi}
                disabled={retensiStatus === 'running' || retensiStarting}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2.5 text-[13px] font-semibold text-white shadow-sm shadow-blue-200 transition hover:bg-blue-700 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {retensiStatus === 'running' || retensiStarting
                  ? <Loader2 className="h-4 w-4 animate-spin" />
                  : <Play className="h-4 w-4 fill-white" />}
                {retensiStatus === 'running' || retensiStarting ? 'Memproses…' : 'Jalankan Retensi'}
              </button>
            </div>
          </div>

          {/* Error state */}
          {retensiError && (
            <div className="mx-6 mt-4 flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3">
              <AlertTriangle className="h-4 w-4 shrink-0 text-red-500" />
              <p className="text-[12px] font-medium text-red-600">{retensiError}</p>
            </div>
          )}

          {/* Idle empty state */}
          {retensiStatus === 'idle' && !retensiHasil && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <RotateCcw className="h-6 w-6 text-blue-400" />
              </div>
              <p className="text-[13px] font-semibold text-slate-700">Belum ada hasil retensi</p>
              <p className="mt-1 text-[12px] text-slate-400 max-w-xs">Klik "Jalankan Retensi" untuk memulai proses AI pada pelanggan berisiko tinggi.</p>
            </div>
          )}

          {/* Running state */}
          {retensiStatus === 'running' && (
            <div className="flex flex-col items-center justify-center py-14 text-center px-6">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-50">
                <Loader2 className="h-6 w-6 animate-spin text-blue-500" />
              </div>
              <p className="text-[13px] font-semibold text-slate-700">AI sedang memproses…</p>
              <p className="mt-1 text-[12px] text-slate-400">Menganalisis pelanggan berisiko tinggi dan menyusun aksi retensi.</p>
            </div>
          )}

          {/* Hasil */}
          {retensiHasil && retensiHasil.length > 0 && (
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  <span className="text-[13px] font-bold text-slate-900">
                    {retensiHasil.length} pelanggan diproses
                  </span>
                </div>
                <span className="text-[11px] text-slate-400">Menampilkan maks. 50 data</span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200">
                <div className="overflow-x-auto max-h-72">
                  <table className="min-w-full text-left">
                    <thead className="sticky top-0 z-10">
                      <tr className="border-b border-slate-200 bg-slate-50">
                        {['ID Pelanggan', 'Risiko', 'Skor Churn', 'Rekomendasi Aksi'].map(h => (
                          <th key={h} className="px-4 py-2.5 text-[11px] font-bold uppercase tracking-wide text-slate-500 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 bg-white">
                      {retensiHasil.slice(0, 50).map((h, i) => {
                        const lvl = h.risk_level ?? (h.churn_score >= 70 ? 'High' : h.churn_score >= 30 ? 'Medium' : 'Low');
                        const c = RISK_COLOR[lvl] ?? RISK_COLOR.Low;
                        return (
                          <tr key={h.customer_id ?? i} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-4 py-3 text-[12px] font-mono font-semibold text-blue-600">{h.customer_id ?? '—'}</td>
                            <td className="px-4 py-3">
                              <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${c.bg} ${c.text} ${c.border}`}>
                                <span className={`h-1.5 w-1.5 rounded-full ${c.dot}`} />
                                {RISK_LABEL[lvl] ?? lvl}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-[13px] font-bold tabular-nums text-slate-800">
                              {typeof h.churn_score === 'number' ? `${h.churn_score.toFixed(1)}%` : '—'}
                            </td>
                            <td className="px-4 py-3 text-[12px] text-slate-500 max-w-[240px] truncate">
                              {h.action ?? h.recommendation ?? '—'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <ToastContainer toasts={toasts} onRemove={remove} />
    </DashboardShell>
  );
}