import { NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

function getScoreLevel(score) {
  if (score >= 70) return { label: 'High',   color: '#EF4444', bg: '#FEF2F2', border: '#FECACA' };
  if (score >= 30) return { label: 'Medium', color: '#F59E0B', bg: '#FFFBEB', border: '#FDE68A' };
  return            { label: 'Low',    color: '#10B981', bg: '#ECFDF5', border: '#A7F3D0' };
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === 'true',
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

export async function POST(request) {
  try {
    const body = await request.json();
    const { email, staffName, count, customers, assignType, adminName } = body;

    if (!email || !count) {
      return NextResponse.json({ success: false, error: 'email dan count wajib diisi' }, { status: 400 });
    }

    const grouped = { High: [], Medium: [], Low: [] };
    if (Array.isArray(customers) && customers.length) {
      for (const c of customers) {
        const s = c.churn_score ?? 0;
        if (s >= 70) grouped.High.push(c);
        else if (s >= 30) grouped.Medium.push(c);
        else grouped.Low.push(c);
      }
    }

    const hasDetail = Array.isArray(customers) && customers.length > 0;
    const now = new Date().toLocaleString('id-ID', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      hour: '2-digit', minute: '2-digit', timeZoneName: 'short',
    });
    const initials = (staffName ?? 'ST').split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
    const adminInitials = adminName ? adminName.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() : 'AD';

    const buildRows = (list) =>
      list.map((c, i) => {
        const lvl = getScoreLevel(c.churn_score ?? 0);
        const bg = i % 2 === 0 ? '#FFFFFF' : '#F8FAFC';
        return `
        <tr style="background:${bg};">
          <td style="padding:11px 14px;border-bottom:1px solid #F1F5F9;">
            <div style="font-size:13px;font-weight:600;color:#0F172A;">${c.company_name ?? '-'}</div>
            <div style="font-size:10px;color:#94A3B8;margin-top:1px;font-family:'Courier New',monospace;">${c.customer_id ?? '-'}</div>
          </td>
          <td style="padding:11px 14px;text-align:center;border-bottom:1px solid #F1F5F9;">
            <span style="padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;background:${lvl.bg};color:${lvl.color};border:1px solid ${lvl.border};">${lvl.label.toUpperCase()}</span>
          </td>
          <td style="padding:11px 14px;text-align:center;border-bottom:1px solid #F1F5F9;">
            <span style="font-size:15px;font-weight:800;color:${lvl.color};">${c.churn_score ?? 0}<span style="font-size:10px;opacity:.7;">%</span></span>
          </td>
          <td style="padding:11px 14px;border-bottom:1px solid #F1F5F9;">
            <span style="font-size:11px;color:#64748B;">${c.plan_type ?? '-'}</span>
          </td>
        </tr>`;
      }).join('');

    const sectionHeader = (label, color, bg, cnt) => `
      <tr><td colspan="4" style="padding:9px 14px 5px;background:${bg};">
        <span style="font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.08em;color:${color};">${label} (${cnt})</span>
      </td></tr>`;

    const tableRows = [
      grouped.High.length   ? sectionHeader('High Risk',    '#EF4444', '#FEF2F2', grouped.High.length)   + buildRows(grouped.High)   : '',
      grouped.Medium.length ? sectionHeader('Medium Risk',  '#F59E0B', '#FFFBEB', grouped.Medium.length) + buildRows(grouped.Medium) : '',
      grouped.Low.length    ? sectionHeader('Low Risk',     '#10B981', '#ECFDF5', grouped.Low.length)    + buildRows(grouped.Low)    : '',
    ].join('');

    const statCell = (label, value, color, bg) =>
      `<td style="padding:0 5px;"><div style="background:${bg};border-radius:10px;padding:12px;text-align:center;min-width:68px;"><div style="font-size:20px;font-weight:900;color:${color};line-height:1;">${value}</div><div style="font-size:9px;font-weight:600;color:${color};opacity:.7;margin-top:3px;text-transform:uppercase;letter-spacing:.05em;">${label}</div></div></td>`;

    const tableSection = hasDetail ? `
      <tr><td style="padding:0 28px;"><div style="height:1px;background:#F1F5F9;"></div></td></tr>
      <tr><td style="padding:18px 28px 10px;">
        <p style="margin:0 0 2px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;color:#94A3B8;">Daftar Pelanggan</p>
        <p style="margin:0;font-size:12px;color:#64748B;">Seluruh pelanggan yang ditugaskan kepada Anda.</p>
      </td></tr>
      <tr><td style="padding:0 28px 22px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;border-radius:10px;overflow:hidden;border:1px solid #E2E8F0;">
          <thead><tr style="background:#F8FAFC;">
            <th style="padding:9px 14px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94A3B8;border-bottom:1px solid #E2E8F0;">Perusahaan</th>
            <th style="padding:9px 14px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94A3B8;border-bottom:1px solid #E2E8F0;">Level</th>
            <th style="padding:9px 14px;text-align:center;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94A3B8;border-bottom:1px solid #E2E8F0;">Score</th>
            <th style="padding:9px 14px;text-align:left;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.07em;color:#94A3B8;border-bottom:1px solid #E2E8F0;">Plan</th>
          </tr></thead>
          <tbody>${tableRows}</tbody>
        </table>
      </td></tr>` : '';

    const html = `<!DOCTYPE html>
<html lang="id">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>Penugasan Pelanggan — ChurnShield</title></head>
<body style="margin:0;padding:0;background:#EEF2F7;font-family:'Segoe UI',Helvetica,Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#EEF2F7;">
<tr><td align="center" style="padding:28px 16px 44px;">
<table width="580" cellpadding="0" cellspacing="0" style="max-width:580px;width:100%;">

  <!-- Label atas -->
  <tr><td style="padding:0 0 10px;text-align:center;">
    <span style="font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.12em;color:#94A3B8;">ChurnShield &middot; Sistem Notifikasi</span>
  </td></tr>

  <!-- Card -->
  <tr><td style="background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 4px 20px rgba(15,23,42,.08);">
  <table width="100%" cellpadding="0" cellspacing="0">

    <!-- Header biru -->
    <tr><td style="background:linear-gradient(135deg,#1E40AF,#2563EB,#3B82F6);padding:24px 28px 20px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="vertical-align:middle;">
          <p style="margin:0 0 3px;font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.1em;color:rgba(255,255,255,.55);">&#128203; Penugasan Pelanggan</p>
          <h1 style="margin:0;font-size:20px;font-weight:800;color:#fff;letter-spacing:-.02em;">Anda Mendapat Tugas Baru</h1>
        </td>
        <td style="text-align:right;padding-left:12px;white-space:nowrap;">
          <span style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:.06em;padding:4px 10px;border-radius:20px;background:rgba(255,255,255,.15);color:rgba(255,255,255,.9);border:1px solid rgba(255,255,255,.25);">
            ${assignType === 'auto' ? '&#9889; Auto-Assign' : '&#9997; Manual Assign'}
          </span>
        </td>
      </tr></table>
    </td></tr>

    <!-- Dari admin -->
    ${adminName ? `
    <tr><td style="padding:16px 28px 0;">
      <table cellpadding="0" cellspacing="0">
        <tr>
          <td style="padding-right:10px;vertical-align:middle;">
            <div style="width:32px;height:32px;border-radius:50%;background:linear-gradient(135deg,#7C3AED,#A78BFA);text-align:center;line-height:32px;font-size:11px;font-weight:800;color:#fff;display:inline-block;">${adminInitials}</div>
          </td>
          <td style="vertical-align:middle;">
            <p style="margin:0;font-size:11px;color:#64748B;">Ditugaskan oleh</p>
            <p style="margin:1px 0 0;font-size:13px;font-weight:700;color:#0F172A;">${adminName}</p>
          </td>
          <td style="padding-left:14px;border-left:1px solid #E2E8F0;vertical-align:middle;">
            <p style="margin:0;font-size:11px;color:#64748B;">${now}</p>
          </td>
        </tr>
      </table>
    </td></tr>` : ''}

    <!-- Sapaan staff -->
    <tr><td style="padding:${adminName ? '14px' : '22px'} 28px 16px;">
      <table cellpadding="0" cellspacing="0"><tr>
        <td style="padding-right:10px;vertical-align:middle;">
          <div style="width:40px;height:40px;border-radius:50%;background:linear-gradient(135deg,#2563EB,#60A5FA);text-align:center;line-height:40px;font-size:13px;font-weight:800;color:#fff;display:inline-block;">${initials}</div>
        </td>
        <td style="vertical-align:middle;">
          <p style="margin:0 0 1px;font-size:15px;font-weight:700;color:#0F172A;">Halo, ${staffName ?? 'Staff'} &#128075;</p>
          <p style="margin:0;font-size:11px;color:#94A3B8;">${adminName ? '' : now}</p>
        </td>
      </tr></table>
      <p style="margin:12px 0 0;font-size:13px;color:#475569;line-height:1.7;">
        ${adminName ? `<strong style="color:#0F172A;">${adminName}</strong> telah` : 'Admin telah'} menugaskan
        <strong style="color:#1E40AF;">${count} pelanggan baru</strong> kepada Anda
        melalui ${assignType === 'auto' ? '<strong style="color:#2563EB;">auto-assign</strong> berdasarkan skor churn' : '<strong style="color:#2563EB;">assign manual</strong>'}.
        Mohon segera tindak lanjuti, khususnya pelanggan dengan risiko tinggi.
      </p>
    </td></tr>

    <!-- Stats -->
    ${hasDetail ? `<tr><td style="padding:0 28px 18px;">
      <table cellpadding="0" cellspacing="0" style="margin:0 -5px;"><tr>
        ${statCell('Total', count, '#2563EB', '#EFF6FF')}
        ${grouped.High.length   ? statCell('High',   grouped.High.length,   '#EF4444', '#FEF2F2') : ''}
        ${grouped.Medium.length ? statCell('Medium', grouped.Medium.length, '#F59E0B', '#FFFBEB') : ''}
        ${grouped.Low.length    ? statCell('Low',    grouped.Low.length,    '#10B981', '#ECFDF5') : ''}
      </tr></table>
    </td></tr>` : ''}

    ${tableSection}

    <!-- Panduan prioritas -->
    <tr><td style="padding:0 28px 24px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td style="background:#FFF7ED;border-left:3px solid #F59E0B;border-radius:0 8px 8px 0;padding:12px 14px;">
          <p style="margin:0;font-size:12px;color:#92400E;line-height:1.6;">
            <strong>&#128161; Panduan Prioritas:</strong> Tangani pelanggan <strong>High Risk (&ge;70%)</strong> terlebih dahulu,
            lalu <strong>Medium Risk (30&ndash;69%)</strong>, kemudian <strong>Low Risk (&lt;30%)</strong>.
            Login ke dashboard untuk detail dan mencatat aktivitas retensi.
          </p>
        </td>
      </tr></table>
    </td></tr>

    <!-- Footer dalam card -->
    <tr><td style="border-top:1px solid #F1F5F9;padding:16px 28px;">
      <table width="100%" cellpadding="0" cellspacing="0"><tr>
        <td><p style="margin:0;font-size:10px;color:#CBD5E1;line-height:1.5;">
          Email ini dikirim otomatis oleh sistem <strong style="color:#94A3B8;">ChurnShield</strong>.<br>Jangan membalas email ini.
        </p></td>
        <td style="text-align:right;padding-left:12px;white-space:nowrap;">
          <span style="font-size:11px;font-weight:800;color:#CBD5E1;letter-spacing:.05em;">CHURN<span style="color:#3B82F6;">SHIELD</span></span>
        </td>
      </tr></table>
    </td></tr>

  </table>
  </td></tr>

  <!-- Copyright -->
  <tr><td style="padding:12px 0 0;text-align:center;">
    <p style="margin:0;font-size:9px;color:#CBD5E1;">&copy; ${new Date().getFullYear()} ChurnShield. Semua hak dilindungi.</p>
  </td></tr>

</table>
</td></tr>
</table>
</body>
</html>`;

    await transporter.sendMail({
      from: `"ChurnShield Notifications" <${process.env.SMTP_USER}>`,
      to: email,
      subject: `\uD83D\uDCCB ${count} pelanggan baru ditugaskan kepada Anda \u2014 ChurnShield`,
      html,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[send-email] error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
