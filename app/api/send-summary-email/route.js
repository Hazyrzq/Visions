import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';
import { supabase } from '@/lib/supabase';
import { generateWeeklySummary } from '@/lib/weeklySummary';

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(request) {
  try {
    const { adminEmail } = await request.json();

    if (!adminEmail) {
      return NextResponse.json(
        { error: 'adminEmail required' },
        { status: 400 }
      );
    }

    // Fetch data dari Supabase
    const { data: customers } = await supabase.from('customers').select('*');
    const { data: staffList } = await supabase.from('profiles').select('*');

    if (!customers || !staffList) {
      return NextResponse.json(
        { error: 'Failed to fetch data' },
        { status: 500 }
      );
    }

    // Generate summary
    const summary = generateWeeklySummary(customers, staffList);

    // Build email HTML
    const weekStartStr = summary.weekStartDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    const highRiskRows = summary.highRiskUnhandled
      .map((c) => `
        <tr style="background:#FFFFFF; border-bottom:1px solid #F1F5F9;">
          <td style="padding:11px 14px;">
            <div style="font-size:13px;font-weight:600;color:#0F172A;">${c.company_name ?? '-'}</div>
            <div style="font-size:10px;color:#94A3B8;margin-top:1px;">${c.customer_id}</div>
          </td>
          <td style="padding:11px 14px;text-align:center;">
            <span style="font-size:13px;font-weight:800;color:#EF4444;">${c.churn_score ?? 0}%</span>
          </td>
          <td style="padding:11px 14px;">
            <span style="font-size:11px;color:#64748B;">${c.plan_type ?? '-'}</span>
          </td>
        </tr>`)
      .join('');

    const staffRows = summary.staffPerformance
      .map((s) => `
        <tr style="background:#FFFFFF; border-bottom:1px solid #F1F5F9;">
          <td style="padding:11px 14px;">
            <div style="font-size:13px;font-weight:600;color:#0F172A;">${s.name}</div>
            <div style="font-size:10px;color:#94A3B8;margin-top:1px;">${s.email}</div>
          </td>
          <td style="padding:11px 14px;text-align:center;">
            <span style="font-size:13px;font-weight:700;color:#0F172A;">${s.totalAssigned} / ${s.maxCapacity}</span>
          </td>
          <td style="padding:11px 14px;text-align:center;">
            <div style="width:40px;height:20px;background:#E2E8F0;border-radius:10px;overflow:hidden;">
              <div style="height:100%;width:${s.capacityPercent}%;background:${s.capacityPercent >= 80 ? '#EF4444' : '#3B82F6'};"></div>
            </div>
          </td>
          <td style="padding:11px 14px;text-align:center;">
            <span style="font-size:13px;font-weight:700;color:${s.highRiskCount > 0 ? '#EF4444' : '#10B981'};>${s.highRiskCount}</span>
          </td>
        </tr>`)
      .join('');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif; background: #F8FAFC; margin: 0; padding: 20px; }
    .container { max-width: 700px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #0F172A 0%, #1e293b 100%); color: white; padding: 30px; text-align: center; }
    .header h1 { margin: 0; font-size: 24px; font-weight: 700; }
    .header p { margin: 8px 0 0; font-size: 13px; opacity: 0.9; }
    .content { padding: 24px; }
    .stat-row { display: flex; gap: 12px; margin-bottom: 20px; }
    .stat-card { flex: 1; background: #F8FAFC; padding: 16px; border-radius: 8px; border-left: 4px solid #3B82F6; }
    .stat-card.high-risk { border-left-color: #EF4444; }
    .stat-card .label { font-size: 11px; font-weight: 600; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-card .value { font-size: 28px; font-weight: 900; color: #0F172A; margin-top: 4px; }
    h2 { font-size: 16px; font-weight: 700; color: #0F172A; margin: 20px 0 12px; padding-bottom: 8px; border-bottom: 2px solid #E2E8F0; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #F1F5F9; padding: 10px 14px; text-align: left; font-size: 11px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.05em; border-bottom: 1px solid #E2E8F0; }
    .empty-state { text-align: center; padding: 20px; color: #94A3B8; font-size: 13px; }
    .footer { background: #F8FAFC; padding: 16px 24px; border-top: 1px solid #E2E8F0; text-align: center; font-size: 11px; color: #94A3B8; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>📊 Weekly Summary - Retention</h1>
      <p>Minggu dimulai: ${weekStartStr}</p>
    </div>

    <div class="content">
      <div class="stat-row">
        <div class="stat-card">
          <div class="label">Total Pelanggan</div>
          <div class="value">${summary.totalCustomers}</div>
        </div>
        <div class="stat-card">
          <div class="label">Sudah Assigned</div>
          <div class="value">${summary.assignedCount}</div>
        </div>
        <div class="stat-card high-risk">
          <div class="label">High Risk</div>
          <div class="value">${summary.highRiskCount}</div>
        </div>
      </div>

      <h2>🔴 High Risk - Belum Ditugaskan (${summary.highRiskUnhandled.length})</h2>
      ${summary.highRiskUnhandled.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Pelanggan</th>
              <th style="text-align:center;">Churn</th>
              <th>Plan</th>
            </tr>
          </thead>
          <tbody>
            ${highRiskRows}
          </tbody>
        </table>
      ` : `<div class="empty-state">✓ Semua high-risk customers sudah ditugaskan!</div>`}

      <h2>👥 Performa Tim (Top by High Risk)</h2>
      ${summary.staffPerformance.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Staf</th>
              <th style="text-align:center;">Beban</th>
              <th style="text-align:center;">Kapasitas</th>
              <th style="text-align:center;">High Risk</th>
            </tr>
          </thead>
          <tbody>
            ${staffRows}
          </tbody>
        </table>
      ` : `<div class="empty-state">Belum ada staf aktif</div>`}

      <h2>💡 Rekomendasi</h2>
      <ul style="color: #475569; font-size: 13px; line-height: 1.6; margin: 12px 0;">
        <li>Review ${summary.highRiskUnhandled.length} high-risk customers yang belum ditugaskan</li>
        <li>Monitor staf dengan kapasitas > 80% untuk mencegah overload</li>
        <li>Prioritaskan high-risk customers dengan churn score > 80%</li>
      </ul>
    </div>

    <div class="footer">
      <p style="margin: 0;">© 2026 Visions - ChurnShield | Laporan Mingguan Otomatis</p>
    </div>
  </div>
</body>
</html>`;

    // Send email
    const result = await transporter.sendMail({
      from: process.env.SMTP_USER,
      to: adminEmail,
      subject: `📊 Weekly ChurnShield Summary - ${weekStartStr}`,
      html,
    });

    return NextResponse.json({
      success: true,
      message: `Summary email sent to ${adminEmail}`,
      data: { messageId: result.messageId },
    });
  } catch (err) {
    console.error('[send-summary-email]', err);
    return NextResponse.json(
      { error: 'Failed to send email: ' + err.message },
      { status: 500 }
    );
  }
}
