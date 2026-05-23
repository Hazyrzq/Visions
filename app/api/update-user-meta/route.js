import { createClient } from '@supabase/supabase-js';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { userId, full_name, role } = await request.json();

    if (!userId || !role) {
      return NextResponse.json(
        { success: false, error: 'userId dan role wajib diisi' },
        { status: 400 }
      );
    }

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { error } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      user_metadata: { full_name, role },
    });

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[update-user-meta] error:', error);
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
