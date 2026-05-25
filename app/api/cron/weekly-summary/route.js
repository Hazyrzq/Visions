/**
 * API: Cron endpoint untuk trigger weekly summary email
 * 
 * Gunakan curl atau external cron service (EasyCron, AWS Lambda, etc)
 * untuk call endpoint ini setiap hari Senin jam 8 pagi:
 * 
 * curl -X POST https://visions-app.com/api/cron/weekly-summary \
 *   -H "Content-Type: application/json" \
 *   -H "X-Cron-Secret: YOUR_SECRET_KEY" \
 *   -d '{"adminEmail":"admin@visions.id"}'
 */

import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export async function POST(request) {
  try {
    // Optional: Verify cron secret untuk security
    const cronSecret = request.headers.get('X-Cron-Secret');
    if (process.env.CRON_SECRET && cronSecret !== process.env.CRON_SECRET) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if today is Monday (0 = Sunday, 1 = Monday)
    const today = new Date();
    const isMonday = today.getDay() === 1;

    if (!isMonday && process.env.NODE_ENV === 'production') {
      return NextResponse.json(
        { message: 'Bukan hari Senin, skip.' },
        { status: 200 }
      );
    }

    const { adminEmail } = await request.json();

    if (!adminEmail) {
      // Get admin email dari database
      const { data: adminProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('role', 'admin')
        .single();

      if (!adminProfile?.email) {
        return NextResponse.json(
          { error: 'Admin email not found' },
          { status: 400 }
        );
      }

      // Call send-summary-email API
      const response = await fetch(
        `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-summary-email`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ adminEmail: adminProfile.email }),
        }
      );

      const result = await response.json();

      if (!response.ok) {
        console.error('Error sending summary email:', result);
        return NextResponse.json(
          { error: result.error || 'Failed to send email' },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Summary email sent to ${adminProfile.email}`,
        data: result.data,
      });
    }

    // If adminEmail provided in request
    const response = await fetch(
      `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/send-summary-email`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminEmail }),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      return NextResponse.json(
        { error: result.error || 'Failed to send email' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Summary email sent to ${adminEmail}`,
      data: result.data,
    });
  } catch (err) {
    console.error('[cron/weekly-summary]', err);
    return NextResponse.json(
      { error: 'Cron task failed: ' + err.message },
      { status: 500 }
    );
  }
}
