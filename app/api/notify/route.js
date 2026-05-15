import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { title, message, type = 'activity', customer_id = null, recipient_id = null } = body;

    if (!message) {
      return NextResponse.json({ success: false, error: 'message wajib diisi' }, { status: 400 });
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const payload = { message, type, is_read: false };
    if (title)        payload.title       = title;
    if (customer_id)  payload.customer_id = customer_id;
    if (recipient_id) payload.recipient_id = recipient_id;

    const { error } = await supabaseAdmin.from('notifikasi').insert(payload);
    if (error) {
      console.error('[notify] insert error:', error);
      throw error;
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 400 });
  }
}
