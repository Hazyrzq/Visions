// ─── Mock Profiles ────────────────────────────────────────────────
export const mockProfiles = [
  {
    id: 'uid-admin-001', email: 'admin@visions.id', full_name: 'Budi Santoso',
    role: 'admin', is_active: true, avatar_url: null,
    created_at: '2024-01-01T00:00:00Z', last_login: '2024-06-27T08:00:00Z', assigned_count: 0,
  },
  {
    id: 'uid-staff-001', email: 'rina@visions.id', full_name: 'Rina Handayani',
    role: 'staff', is_active: true, avatar_url: null,
    created_at: '2024-01-05T00:00:00Z', last_login: '2024-06-26T09:30:00Z', assigned_count: 7,
  },
  {
    id: 'uid-staff-002', email: 'dimas@visions.id', full_name: 'Dimas Pratama',
    role: 'staff', is_active: true, avatar_url: null,
    created_at: '2024-02-10T00:00:00Z', last_login: '2024-06-27T07:45:00Z', assigned_count: 6,
  },
  {
    id: 'uid-staff-003', email: 'sari@visions.id', full_name: 'Sari Dewi',
    role: 'staff', is_active: false, avatar_url: null,
    created_at: '2024-03-01T00:00:00Z', last_login: '2024-05-10T14:00:00Z', assigned_count: 5,
  },
];

// ─── Mock Customers ───────────────────────────────────────────────
export const mockCustomers = [
  {
    id: 1, customer_id: 'C-0001', company_name: 'PT Maju Bersama',
    plan_type: 'Enterprise', contract_type: 'Annual', tenure_months: 24,
    churn_score: 87, risk_level: 'Tinggi', prioritas: 1,
    alasan_churn: 'Penurunan penggunaan fitur utama drastis, banyak tiket terbuka tidak terselesaikan',
    rekomendasi: 'Jadwalkan QBR segera, tawarkan dedicated CSM, berikan diskon renewal 20%',
    monthly_usage_hrs: 12, feature_adoption_pct: 23, nps_latest: 4,
    dunning_count: 3, days_since_login: 45, open_tickets: 5,
    assigned_to: 'uid-staff-001', assigned_name: 'Rina Handayani',
    created_at: '2024-01-15T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 2, customer_id: 'C-0002', company_name: 'CV Teknologi Nusantara',
    plan_type: 'Professional', contract_type: 'Monthly', tenure_months: 8,
    churn_score: 72, risk_level: 'Tinggi', prioritas: 2,
    alasan_churn: 'Banyak komplain response time support, dunning 2x berturut-turut',
    rekomendasi: 'Hubungi dalam 24 jam, eskalasi ke manajer produk, tawarkan SLA guarantee',
    monthly_usage_hrs: 28, feature_adoption_pct: 41, nps_latest: 5,
    dunning_count: 2, days_since_login: 18, open_tickets: 3,
    assigned_to: 'uid-staff-001', assigned_name: 'Rina Handayani',
    created_at: '2024-03-10T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 3, customer_id: 'C-0003', company_name: 'PT Sinar Digital',
    plan_type: 'Enterprise', contract_type: 'Annual', tenure_months: 36,
    churn_score: 15, risk_level: 'Rendah', prioritas: 3,
    alasan_churn: null,
    rekomendasi: 'Tawarkan upgrade ke plan baru dengan fitur AI Analytics',
    monthly_usage_hrs: 156, feature_adoption_pct: 89, nps_latest: 9,
    dunning_count: 0, days_since_login: 2, open_tickets: 0,
    assigned_to: 'uid-staff-002', assigned_name: 'Dimas Pratama',
    created_at: '2023-06-01T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 4, customer_id: 'C-0004', company_name: 'UD Kreatif Indonesia',
    plan_type: 'Starter', contract_type: 'Monthly', tenure_months: 3,
    churn_score: 78, risk_level: 'Tinggi', prioritas: 1,
    alasan_churn: 'Churn early, tenure sangat pendek, onboarding belum selesai',
    rekomendasi: 'Lakukan onboarding call segera, assign dedicated onboarding specialist',
    monthly_usage_hrs: 5, feature_adoption_pct: 12, nps_latest: 6,
    dunning_count: 1, days_since_login: 30, open_tickets: 2,
    assigned_to: 'uid-staff-001', assigned_name: 'Rina Handayani',
    created_at: '2024-04-01T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 5, customer_id: 'C-0005', company_name: 'PT Global Solusi',
    plan_type: 'Professional', contract_type: 'Annual', tenure_months: 18,
    churn_score: 45, risk_level: 'Sedang', prioritas: 2,
    alasan_churn: 'Penggunaan fitur utama menurun 3 bulan berturut-turut',
    rekomendasi: 'Kirim newsletter fitur baru, undang webinar eksklusif Q3',
    monthly_usage_hrs: 67, feature_adoption_pct: 55, nps_latest: 7,
    dunning_count: 0, days_since_login: 10, open_tickets: 1,
    assigned_to: 'uid-staff-002', assigned_name: 'Dimas Pratama',
    created_at: '2023-12-01T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 6, customer_id: 'C-0006', company_name: 'PT Armada Logistik',
    plan_type: 'Enterprise', contract_type: 'Annual', tenure_months: 48,
    churn_score: 22, risk_level: 'Rendah', prioritas: 3,
    alasan_churn: null,
    rekomendasi: 'Maintain relationship, undang ke customer advisory board',
    monthly_usage_hrs: 203, feature_adoption_pct: 94, nps_latest: 10,
    dunning_count: 0, days_since_login: 1, open_tickets: 0,
    assigned_to: 'uid-staff-002', assigned_name: 'Dimas Pratama',
    created_at: '2023-01-10T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 7, customer_id: 'C-0007', company_name: 'CV Mandiri Sejahtera',
    plan_type: 'Professional', contract_type: 'Monthly', tenure_months: 12,
    churn_score: 63, risk_level: 'Sedang', prioritas: 2,
    alasan_churn: 'NPS rendah, ada komplain fitur billing berulang',
    rekomendasi: 'Tindak lanjuti komplain billing, tawarkan credit bulan depan',
    monthly_usage_hrs: 44, feature_adoption_pct: 48, nps_latest: 6,
    dunning_count: 1, days_since_login: 8, open_tickets: 2,
    assigned_to: 'uid-staff-001', assigned_name: 'Rina Handayani',
    created_at: '2024-06-01T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 8, customer_id: 'C-0008', company_name: 'PT Inovasi Bangsa',
    plan_type: 'Starter', contract_type: 'Monthly', tenure_months: 5,
    churn_score: 91, risk_level: 'Tinggi', prioritas: 1,
    alasan_churn: 'Hampir tidak menggunakan platform sama sekali, dunning 3x',
    rekomendasi: 'URGENT: call dalam 12 jam, tawarkan trial fitur Premium gratis 1 bulan',
    monthly_usage_hrs: 3, feature_adoption_pct: 8, nps_latest: 3,
    dunning_count: 3, days_since_login: 60, open_tickets: 1,
    assigned_to: null, assigned_name: null,
    created_at: '2024-02-01T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 9, customer_id: 'C-0009', company_name: 'PT Berkat Makmur',
    plan_type: 'Professional', contract_type: 'Annual', tenure_months: 15,
    churn_score: 38, risk_level: 'Sedang', prioritas: 3,
    alasan_churn: 'Kompetitor menawarkan harga lebih rendah',
    rekomendasi: 'Kirim proposal value comparison, highlight ROI yang sudah dicapai',
    monthly_usage_hrs: 89, feature_adoption_pct: 62, nps_latest: 7,
    dunning_count: 0, days_since_login: 5, open_tickets: 0,
    assigned_to: 'uid-staff-002', assigned_name: 'Dimas Pratama',
    created_at: '2024-04-10T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 10, customer_id: 'C-0010', company_name: 'PT Cipta Karya Abadi',
    plan_type: 'Enterprise', contract_type: 'Annual', tenure_months: 30,
    churn_score: 19, risk_level: 'Rendah', prioritas: 3,
    alasan_churn: null,
    rekomendasi: 'Identify upsell opportunity ke subsidiary mereka',
    monthly_usage_hrs: 178, feature_adoption_pct: 87, nps_latest: 9,
    dunning_count: 0, days_since_login: 1, open_tickets: 0,
    assigned_to: 'uid-staff-001', assigned_name: 'Rina Handayani',
    created_at: '2023-09-15T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 11, customer_id: 'C-0011', company_name: 'UD Cahaya Terang',
    plan_type: 'Starter', contract_type: 'Monthly', tenure_months: 2,
    churn_score: 82, risk_level: 'Tinggi', prioritas: 1,
    alasan_churn: 'Baru bergabung, engagement sangat rendah, tidak ada aktivitas setup',
    rekomendasi: 'Kirim onboarding checklist, jadwalkan demo 1-on-1 minggu ini',
    monthly_usage_hrs: 6, feature_adoption_pct: 15, nps_latest: 5,
    dunning_count: 1, days_since_login: 25, open_tickets: 1,
    assigned_to: null, assigned_name: null,
    created_at: '2024-04-25T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
  {
    id: 12, customer_id: 'C-0012', company_name: 'PT Nusantara Tech',
    plan_type: 'Professional', contract_type: 'Annual', tenure_months: 22,
    churn_score: 29, risk_level: 'Rendah', prioritas: 3,
    alasan_churn: null,
    rekomendasi: 'Maintain, dorong penggunaan fitur analytics lanjutan',
    monthly_usage_hrs: 112, feature_adoption_pct: 73, nps_latest: 8,
    dunning_count: 0, days_since_login: 3, open_tickets: 0,
    assigned_to: 'uid-staff-002', assigned_name: 'Dimas Pratama',
    created_at: '2023-09-01T00:00:00Z', updated_at: '2024-06-15T00:00:00Z',
  },
];

// ─── Unassigned High Risk ─────────────────────────────────────────
export const mockUnassigned = mockCustomers.filter(c => !c.assigned_to && c.risk_level === 'Tinggi');

// ─── Activities ───────────────────────────────────────────────────
export const mockActivities = [
  { id: 1, staff_id: 'uid-staff-001', staff_name: 'Rina Handayani', customer_id: 'C-0001', company_name: 'PT Maju Bersama', action_type: 'call', description: 'Follow-up call berhasil, pelanggan minta demo fitur baru bulan depan', created_at: '2024-06-27T09:30:00Z' },
  { id: 2, staff_id: 'uid-staff-001', staff_name: 'Rina Handayani', customer_id: 'C-0007', company_name: 'CV Mandiri Sejahtera', action_type: 'email', description: 'Mengirim proposal value report Q2 2024 beserta perbandingan ROI', created_at: '2024-06-27T08:15:00Z' },
  { id: 3, staff_id: 'uid-staff-002', staff_name: 'Dimas Pratama', customer_id: 'C-0005', company_name: 'PT Global Solusi', action_type: 'meeting', description: 'QBR meeting Q2 selesai, pelanggan sangat puas dengan roadmap produk', created_at: '2024-06-26T14:00:00Z' },
  { id: 4, staff_id: 'uid-staff-001', staff_name: 'Rina Handayani', customer_id: 'C-0002', company_name: 'CV Teknologi Nusantara', action_type: 'note', description: 'Eskalasi tiket #4521 ke tim support Level 2, ETA resolusi 2 hari kerja', created_at: '2024-06-26T11:00:00Z' },
  { id: 5, staff_id: 'uid-staff-002', staff_name: 'Dimas Pratama', customer_id: 'C-0009', company_name: 'PT Berkat Makmur', action_type: 'email', description: 'Mengirim comparison report vs kompetitor disertai ROI calculator', created_at: '2024-06-25T16:30:00Z' },
  { id: 6, staff_id: 'uid-staff-001', staff_name: 'Rina Handayani', customer_id: 'C-0004', company_name: 'UD Kreatif Indonesia', action_type: 'call', description: 'Onboarding call pertama, walkthrough fitur dasar berhasil dilakukan', created_at: '2024-06-25T10:00:00Z' },
];

// ─── Model History ────────────────────────────────────────────────
export const mockModelHistory = [
  { id: 1, tanggal: '2024-06-15', algoritma: 'Random Forest', akurasi: 94.2, auc_roc: 0.97, precision_churn: 91.5, recall_churn: 89.3, f1_score: 90.4, status: 'Aktif' },
  { id: 2, tanggal: '2024-05-20', algoritma: 'XGBoost', akurasi: 93.1, auc_roc: 0.96, precision_churn: 90.2, recall_churn: 88.7, f1_score: 89.4, status: 'Tidak Aktif' },
  { id: 3, tanggal: '2024-04-10', algoritma: 'Logistic Regression', akurasi: 87.4, auc_roc: 0.91, precision_churn: 84.1, recall_churn: 82.9, f1_score: 83.5, status: 'Tidak Aktif' },
  { id: 4, tanggal: '2024-03-05', algoritma: 'Random Forest', akurasi: 92.8, auc_roc: 0.95, precision_churn: 89.6, recall_churn: 87.4, f1_score: 88.5, status: 'Tidak Aktif' },
];

// ─── Feature Importance ───────────────────────────────────────────
export const mockFeatureImportance = [
  { feature_name: 'days_since_login', importance_score: 0.31 },
  { feature_name: 'monthly_usage_hrs', importance_score: 0.24 },
  { feature_name: 'dunning_count', importance_score: 0.18 },
  { feature_name: 'nps_latest', importance_score: 0.14 },
  { feature_name: 'feature_adoption_pct', importance_score: 0.09 },
];

// ─── Chart Data ───────────────────────────────────────────────────
export const mockChurnTrend = [
  { bulan: 'Jan', churn_rate: 18.2 },
  { bulan: 'Feb', churn_rate: 21.5 },
  { bulan: 'Mar', churn_rate: 19.8 },
  { bulan: 'Apr', churn_rate: 24.1 },
  { bulan: 'Mei', churn_rate: 22.7 },
  { bulan: 'Jun', churn_rate: 23.4 },
];

export const mockRiskDistribution = [
  { name: 'Rendah', value: 142, color: '#10B981' },
  { name: 'Sedang', value: 87, color: '#F59E0B' },
  { name: 'Tinggi', value: 18, color: '#EF4444' },
];

// ─── Alerts ───────────────────────────────────────────────────────
export const mockAlerts = [
  { id: 1, type: 'critical', title: '3 Pelanggan Enterprise Masuk High Risk', message: 'Model mendeteksi peningkatan risiko pada C-0001, C-0008, C-0011. Tindakan diperlukan dalam 24 jam.', time: '5 menit lalu' },
  { id: 2, type: 'warning', title: 'Akurasi Model Mendekati Threshold', message: 'Akurasi model turun ke 91.2% (threshold 90%). Pertimbangkan retrain dengan data bulan ini.', time: '2 jam lalu' },
  { id: 3, type: 'info', title: 'Laporan Bulanan Juni Tersedia', message: 'Laporan performa tim Customer Success bulan Juni sudah siap diunduh di menu Report.', time: '1 hari lalu' },
];

// ─── Staff Performance ────────────────────────────────────────────
export const mockStaffPerformance = [
  { id: 'uid-staff-001', name: 'Rina Handayani', assigned: 7, resolved_month: 12, success_rate: 85, workload_pct: 78, performance: 'Sangat Baik' },
  { id: 'uid-staff-002', name: 'Dimas Pratama', assigned: 6, resolved_month: 10, success_rate: 80, workload_pct: 67, performance: 'Baik' },
  { id: 'uid-staff-003', name: 'Sari Dewi', assigned: 5, resolved_month: 7, success_rate: 72, workload_pct: 55, performance: 'Cukup' },
];

// ─── Report Data ──────────────────────────────────────────────────
export const mockReportSummary = {
  total_at_risk: 18,
  retained_this_month: 12,
  retention_rate: 66.7,
  avg_response_time_hrs: 4.2,
  nps_avg: 7.1,
};
