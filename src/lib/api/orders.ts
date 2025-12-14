import { supabase } from '../supabase-client';

export type OrderInsert = {
  id: string;
  customer_id: string;
  customer_name: string;
  contact_number: string;
  service_package: 'package1' | 'package2' | 'package3';
  weight: number;
  loads: number;
  distance?: number | null;
  delivery_option?: string | null;
  status: string;
  total: number;
  is_paid?: boolean;
  branch_id?: string | null;
};

/**
 * Fetches the latest order ID from the database.
 * This ensures all orders (manual admin orders and customer orders) use the same sequential numbering.
 * Uses a database function to bypass RLS restrictions.
 */
export async function fetchLatestOrderId() {
  // Use RPC call to the database function which bypasses RLS
  const { data, error } = await supabase.rpc('get_latest_order_id');
  
  if (error) {
    // Fallback to direct query if function doesn't exist (for backwards compatibility)
    const { data: fallbackData, error: fallbackError } = await supabase
      .from('orders')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    
    if (fallbackError) {
      return { latestId: null, error: fallbackError };
    }
    
    return { latestId: fallbackData?.id ?? null, error: null };
  }
  
  return { latestId: data ?? null, error: null };
}

/**
 * Generates the next sequential order ID based on the latest order ID.
 * This function is used by both admin manual orders and customer-created orders
 * to ensure a unified, sequential order ID system (RKR001, RKR002, RKR003, etc.)
 * 
 * @param latestId - The most recent order ID from the database (e.g., "RKR001")
 * @returns The next sequential order ID (e.g., "RKR002")
 */
export function generateNextOrderId(latestId: string | null): string {
  if (!latestId) {
    // No orders exist yet, start with RKR001
    return 'RKR001';
  }
  
  // Extract the numeric part from the order ID (e.g., "RKR001" -> 1)
  const match = latestId.match(/RKR(\d+)/i);
  if (!match) {
    // If the format is unexpected, start fresh
    console.warn(`Unexpected order ID format: ${latestId}. Starting from RKR001.`);
    return 'RKR001';
  }
  
  const currentNumber = parseInt(match[1], 10);
  if (isNaN(currentNumber)) {
    console.warn(`Could not parse order number from: ${latestId}. Starting from RKR001.`);
    return 'RKR001';
  }
  
  // Increment and format with leading zeros (e.g., 2 -> "002")
  const nextNumber = currentNumber + 1;
  return `RKR${String(nextNumber).padStart(3, '0')}`;
}

export async function createOrder(order: OrderInsert) {
  return supabase.from('orders').insert(order).select().single();
}

/**
 * Creates an order with its initial status history entry.
 * This function ensures that every order has a status history record.
 * 
 * IMPORTANT: Order IDs must be generated using fetchLatestOrderId() and generateNextOrderId()
 * to ensure sequential numbering across all order creation methods (admin manual and customer).
 */
export async function createOrderWithHistory(order: OrderInsert) {
  const { data, error } = await createOrder(order);
  if (!error && data) {
    await supabase.from('order_status_history').insert({
      order_id: order.id,
      status: order.status,
      note: 'Order created',
    });
  }
  return { data, error };
}

export async function fetchMyOrders() {
  return supabase
    .from('orders')
    .select('*, order_status_history(*)')
    .order('created_at', { ascending: false });
}

export async function fetchOrderWithHistory(orderId: string) {
  return supabase
    .from('orders')
    .select('*, order_status_history(*)')
    .eq('id', orderId)
    .maybeSingle();
}

/**
 * Fetches an order by ID and customer name.
 * This function uses an RPC call to bypass RLS restrictions,
 * allowing anyone (logged in or not) to search for orders by ID and name.
 * This is necessary for the order status page where customers need to
 * search for orders created by admins.
 */
export async function fetchOrderForCustomer(orderId: string, name: string) {
  const trimmedOrderId = orderId.trim();
  const trimmedName = name.trim();

  // Use RPC call to bypass RLS - allows searching admin-created orders
  // Convert name to lowercase for case-insensitive search
  // Order ID is kept as-is since it's typically stored in a specific case format
  const { data, error } = await supabase.rpc('search_order_by_id_and_name', {
    p_order_id: trimmedOrderId,
    p_customer_name: trimmedName.toLowerCase(),
  });

  if (error) {
    // Log the error for debugging
    console.error('RPC search_order_by_id_and_name failed:', error);
    console.error('This usually means the SQL function has not been created in Supabase.');
    console.error('Please run the SQL script from src/docs/fix-order-search-rls.sql in Supabase SQL Editor.');
    
    // Fallback to direct query if RPC function doesn't exist (for backwards compatibility)
    // NOTE: This will fail for non-logged-in users due to RLS restrictions
    // Use case-insensitive search for both order ID and name
    const orderIdLower = trimmedOrderId.toLowerCase();
    const { data: fallbackData, error: fallbackError } = await fetchOrderWithHistory(trimmedOrderId);
    if (fallbackError || !fallbackData) {
      // Try case-insensitive order ID search
      const { data: allOrdersData, error: allOrdersError } = await supabase
        .from('orders')
        .select('*, order_status_history(*)');
      
      if (allOrdersError) {
        console.error('Fallback query also failed:', allOrdersError);
        return { data: null, error: allOrdersError };
      }

      // Filter by case-insensitive order ID and name match
      const inputNameLower = trimmedName.toLowerCase();
      const matchedOrder = (allOrdersData || []).find(order => {
        const orderIdMatches = order.id.toLowerCase().includes(orderIdLower);
        const customerNameLower = (order.customer_name || '').toLowerCase();
        const nameMatches = customerNameLower.includes(inputNameLower);
        return orderIdMatches && nameMatches;
      });

      if (!matchedOrder) {
        return { data: null, error: null };
      }

      return { data: matchedOrder, error: null };
    }

    // Verify name matches (case-insensitive)
    const customerNameLower = (fallbackData.customer_name || '').toLowerCase();
    const inputNameLower = trimmedName.toLowerCase();
    const matches = customerNameLower.includes(inputNameLower);
    
    if (!matches) {
      console.warn('Name mismatch:', { 
        stored: fallbackData.customer_name, 
        searched: trimmedName 
      });
      return { data: null, error: null };
    }
    
    if (!matches) {
      console.warn('Name mismatch:', { 
        stored: fallbackData.customer_name, 
        searched: trimmedName 
      });
    }
    
    return { data: matches ? fallbackData : null, error: null };
  }

  // RPC returns array, get first result
  if (!data || data.length === 0) {
    console.warn('No order found with:', { orderId: trimmedOrderId, name: trimmedName });
    return { data: null, error: null };
  }

  const orderData = data[0];
  
  // Transform the RPC result to match the expected format
  return {
    data: {
      id: orderData.id,
      customer_id: orderData.customer_id,
      branch_id: orderData.branch_id,
      customer_name: orderData.customer_name,
      contact_number: orderData.contact_number,
      service_package: orderData.service_package,
      weight: orderData.weight,
      loads: orderData.loads,
      distance: orderData.distance,
      delivery_option: orderData.delivery_option,
      status: orderData.status,
      total: orderData.total,
      is_paid: orderData.is_paid,
      created_at: orderData.created_at,
      updated_at: orderData.updated_at,
      order_status_history: (orderData.order_status_history as any[]) || [],
    },
    error: null,
  };
}

export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status })
    .eq('id', orderId)
    .select()
    .single();

  if (!error) {
    await supabase.from('order_status_history').insert({ order_id: orderId, status, note });
  }
  return { data, error };
}

export async function updateOrderFields(orderId: string, patch: Partial<OrderInsert>) {
  return supabase.from('orders').update(patch).eq('id', orderId).select().single();
}

