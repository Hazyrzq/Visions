const puppeteer = require('puppeteer-core');
const path = require('path');
const fs = require('fs');

const htmlContent = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8"/>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #1a1a2e; background: #fff; padding: 40px 50px; }

    .header { border-bottom: 3px solid #3b82f6; padding-bottom: 16px; margin-bottom: 28px; }
    .header h1 { font-size: 22px; color: #1e3a8a; }
    .header p  { font-size: 12px; color: #64748b; margin-top: 4px; }

    h2 { font-size: 15px; color: #1e3a8a; margin: 24px 0 10px; border-left: 4px solid #3b82f6; padding-left: 10px; }
    h3 { font-size: 13px; color: #334155; margin: 16px 0 8px; }

    p  { font-size: 12px; line-height: 1.7; color: #374151; }

    table { width: 100%; border-collapse: collapse; font-size: 11px; margin: 10px 0; }
    th { background: #1e3a8a; color: #fff; padding: 8px 10px; text-align: left; }
    td { padding: 7px 10px; border-bottom: 1px solid #e2e8f0; }
    tr:nth-child(even) td { background: #f8fafc; }

    .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 10px; font-weight: 600; }
    .badge-red   { background: #fee2e2; color: #b91c1c; }
    .badge-green { background: #dcfce7; color: #15803d; }
    .badge-blue  { background: #dbeafe; color: #1d4ed8; }

    .box { background: #f1f5f9; border-left: 4px solid #3b82f6; padding: 12px 16px; border-radius: 4px; margin: 10px 0; font-size: 12px; line-height: 1.6; }
    .box-green { border-left-color: #22c55e; background: #f0fdf4; }
    .box-yellow { border-left-color: #f59e0b; background: #fffbeb; }

    ul { padding-left: 18px; font-size: 12px; line-height: 1.8; color: #374151; }
    li { margin-bottom: 2px; }

    .footer { margin-top: 40px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 10px; color: #94a3b8; display: flex; justify-content: space-between; }
  </style>
</head>
<body>

  <div class="header">
    <h1>Analisis Kompatibilitas Skema Database — Visions ChurnShield</h1>
    <p>Dokumen: Perbandingan Skema Lama vs Baru &nbsp;|&nbsp; Tanggal: ${new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}</p>
  </div>

  <h2>1. Ringkasan Eksekutif</h2>
  <div class="box box-yellow">
    Skema baru yang diusulkan <strong>belum langsung kompatibel</strong> dengan kode frontend yang sudah ada.
    Migrasi diperlukan karena terjadi perubahan nama tabel, nama kolom, dan struktur query di hampir semua file.
  </div>

  <h2>2. Perbandingan Skema Lama vs Baru</h2>
  <table>
    <tr>
      <th>Aspek</th>
      <th>Skema Lama (schema.sql)</th>
      <th>Skema Baru (Usulan)</th>
    </tr>
    <tr><td>Tabel user</td><td><code>profiles</code></td><td><code>app_users</code></td></tr>
    <tr><td>Tabel customer</td><td><code>customers</code> (1 tabel all-in-one)</td><td><code>customer_features</code> + <code>churn_predictions</code> (dipisah)</td></tr>
    <tr><td>Tabel aktivitas</td><td><code>activities</code></td><td><code>retention_actions</code></td></tr>
    <tr><td>churn_score</td><td><code>INT</code> rentang 0–100</td><td><code>FLOAT</code> di tabel <code>churn_predictions</code></td></tr>
    <tr><td>risk_level</td><td>Tinggi / Sedang / Rendah</td><td>High / Medium / Low (Inggris)</td></tr>
    <tr><td>prioritas</td><td><code>INT</code> (1 / 2 / 3)</td><td><code>TEXT</code> (LOW / NORMAL / URGENT)</td></tr>
    <tr><td>Fitur ML</td><td>~8 kolom di <code>customers</code></td><td>40+ kolom terstruktur di <code>customer_features</code></td></tr>
  </table>

  <h2>3. Dampak ke Kode yang Ada</h2>

  <h3>3.1 lib/hooks/useCustomers.js</h3>
  <div class="box">
    Query <code>.from('customers')</code> akan <span class="badge badge-red">ERROR</span> — harus diganti ke
    <code>customer_features</code> dengan JOIN ke <code>churn_predictions</code>.
  </div>

  <h3>3.2 supabase/schema.sql</h3>
  <div class="box">
    Tabel <code>profiles</code> direferensi di banyak RLS policy dan trigger.
    Skema baru menggantinya dengan <code>app_users</code> — semua policy perlu ditulis ulang.
  </div>

  <h3>3.3 Seluruh Halaman Dashboard</h3>
  <div class="box">
    Halaman yang menggunakan <code>risk_level = 'Tinggi'</code> harus diubah ke <code>'High'</code>,
    dan kolom <code>prioritas</code> dari angka ke teks (LOW / NORMAL / URGENT).
  </div>

  <h2>4. Kesesuaian Skema Baru dengan ML</h2>
  <div class="box box-green">
    Skema baru <strong>jauh lebih baik</strong> untuk integrasi ML. Berikut alasannya:
  </div>
  <ul>
    <li><strong>customer_features</strong> — menyimpan semua feature input model secara terstruktur (billing, support, NPS, usage, sentiment)</li>
    <li><strong>churn_predictions</strong> — menyimpan output model terpisah, mendukung tracking history prediksi per customer</li>
    <li><strong>snapshot_features (JSONB)</strong> — menyimpan state fitur saat prediksi dibuat, berguna untuk audit dan explainability</li>
    <li><strong>retention_actions</strong> — lebih kaya: ada <code>outcome</code>, <code>prediction_id</code> sebagai foreign key ke prediksi</li>
    <li><strong>segment_label</strong> — 4 level segmentasi (High Risk → Low Risk) lebih granular dari 3 level sebelumnya</li>
    <li><strong>model_version &amp; threshold_used</strong> — mendukung versioning model (CatBoost-v1, dll.)</li>
  </ul>

  <h2>5. Rekomendasi Langkah Migrasi</h2>
  <table>
    <tr><th>#</th><th>Langkah</th><th>File Terdampak</th><th>Prioritas</th></tr>
    <tr>
      <td>1</td>
      <td>Buat schema SQL baru di Supabase</td>
      <td>supabase/schema.sql</td>
      <td><span class="badge badge-red">Tinggi</span></td>
    </tr>
    <tr>
      <td>2</td>
      <td>Update hook useCustomers → query customer_features + JOIN churn_predictions</td>
      <td>lib/hooks/useCustomers.js</td>
      <td><span class="badge badge-red">Tinggi</span></td>
    </tr>
    <tr>
      <td>3</td>
      <td>Ganti semua referensi profiles → app_users di RLS dan kode</td>
      <td>Semua halaman dashboard</td>
      <td><span class="badge badge-red">Tinggi</span></td>
    </tr>
    <tr>
      <td>4</td>
      <td>Update nilai risk_level & prioritas ke format baru</td>
      <td>Dashboard, Customer pages</td>
      <td><span class="badge badge-blue">Sedang</span></td>
    </tr>
    <tr>
      <td>5</td>
      <td>Sesuaikan halaman /dashboard/data untuk upload ke customer_features</td>
      <td>app/dashboard/data/</td>
      <td><span class="badge badge-blue">Sedang</span></td>
    </tr>
  </table>

  <h2>6. Kesimpulan</h2>
  <p>
    Skema baru yang diusulkan sudah dirancang dengan baik dan <strong>sangat cocok untuk pipeline ML</strong> (CatBoost/XGBoost).
    Pemisahan antara <em>feature store</em> (<code>customer_features</code>) dan <em>prediction store</em> (<code>churn_predictions</code>)
    adalah praktik industri yang benar. Namun karena perubahan nama tabel dan kolom cukup besar,
    kode frontend yang ada perlu dimigrasikan secara menyeluruh agar aplikasi tetap berjalan.
  </p>

  <div class="footer">
    <span>Visions — ChurnShield &nbsp;|&nbsp; Analisis Kompatibilitas Database</span>
    <span>Dibuat: ${new Date().toLocaleDateString('id-ID', { day:'2-digit', month:'long', year:'numeric' })}</span>
  </div>

</body>
</html>`;

async function generatePDF() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const outputPath = path.join(__dirname, '..', 'analisis-skema-churnshield.pdf');

  console.log('Launching Chrome...');
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

  console.log('Generating PDF...');
  await page.pdf({
    path: outputPath,
    format: 'A4',
    margin: { top: '10mm', right: '10mm', bottom: '10mm', left: '10mm' },
    printBackground: true
  });

  await browser.close();
  console.log('PDF saved to:', outputPath);
}

generatePDF().catch(console.error);
