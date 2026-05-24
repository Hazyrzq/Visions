import { supabase } from '@/lib/supabase';

/**
 * API: Deactivate staff dan auto-unassign pelanggan mereka
 * POST /api/deactivate-staff
 * Body: { staffId: string }
 */
export async function POST(request) {
  try {
    const { staffId } = await request.json();

    if (!staffId) {
      return Response.json({ error: 'staffId required' }, { status: 400 });
    }

    // 1. Deactivate staff
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ is_active: false })
      .eq('id', staffId);

    if (updateError) {
      return Response.json({ error: updateError.message }, { status: 500 });
    }

    // 2. Get all customers assigned to this staff
    const { data: assignedCustomers, error: fetchError } = await supabase
      .from('customers')
      .select('id, customer_id, company_name')
      .eq('assigned_to', staffId);

    if (fetchError) {
      return Response.json({ error: fetchError.message }, { status: 500 });
    }

    const unassignedCount = assignedCustomers?.length ?? 0;

    // 3. Unassign all customers
    if (unassignedCount > 0) {
      const { error: unassignError } = await supabase
        .from('customers')
        .update({ assigned_to: null })
        .eq('assigned_to', staffId);

      if (unassignError) {
        return Response.json({ error: unassignError.message }, { status: 500 });
      }
    }

    // 4. Optional: Notify admin or log this action
    // Could add notification here later if needed

    return Response.json({
      success: true,
      message: `Staff dinonaktifkan. ${unassignedCount} pelanggan di-unassign.`,
      unassignedCount,
    });
  } catch (err) {
    console.error('[deactivate-staff]', err);
    return Response.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
