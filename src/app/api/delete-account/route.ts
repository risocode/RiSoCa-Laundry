import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function DELETE(request: NextRequest) {
  try {
    // Get the authorization token from header
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Unauthorized - No authorization token provided' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify the token and get user
    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(token);

    if (userError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized - Invalid or expired session' },
        { status: 401 }
      );
    }

    const userId = user.id;

    // Delete order status history for all user orders first
    // Get all order IDs for this user
    const { data: userOrders } = await supabaseAdmin
      .from('orders')
      .select('id')
      .eq('customer_id', userId);

    if (userOrders && userOrders.length > 0) {
      const orderIds = userOrders.map(o => o.id);
      const { error: historyError } = await supabaseAdmin
        .from('order_status_history')
        .delete()
        .in('order_id', orderIds);

      if (historyError) {
        console.error('Error deleting order history:', historyError);
        // Continue even if history deletion fails
      }
    }

    // Delete orders associated with the user
    const { error: ordersError } = await supabaseAdmin
      .from('orders')
      .delete()
      .eq('customer_id', userId);

    if (ordersError) {
      console.error('Error deleting orders:', ordersError);
      // Continue even if orders deletion fails
    }

    // Delete from public.profiles
    const { error: profileError } = await supabaseAdmin
      .from('profiles')
      .delete()
      .eq('id', userId);

    if (profileError) {
      console.error('Error deleting profile:', profileError);
      // Continue even if profile deletion fails, as auth user deletion is more important
    }

    // Finally, delete the auth user (this is the most important step)
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error('Error deleting auth user:', deleteError);
      return NextResponse.json(
        { error: 'Failed to delete user account' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Account deleted successfully' },
      { status: 200 }
    );
  } catch (error: any) {
    console.error('Error in delete-account route:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
