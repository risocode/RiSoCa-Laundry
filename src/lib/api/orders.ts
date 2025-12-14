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
  balance?: number;
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
  const orderIdLower = trimmedOrderId.toLowerCase();
  const nameLower = trimmedName.toLowerCase();

  // Always use case-insensitive search by fetching all orders and filtering
  // This ensures "RKR006" and "rKR006" both work, regardless of RPC function case sensitivity
  try {
    const { data: allOrdersData, error: allOrdersError } = await supabase
      .from('orders')
      .select('*, order_status_history(*)');
    
    if (allOrdersError) {
      console.error('Failed to fetch orders for case-insensitive search:', allOrdersError);
      return { data: null, error: allOrdersError };
    }

    // Filter by case-insensitive order ID (exact match) and name match
    const matchedOrder = (allOrdersData || []).find(order => {
      const storedOrderIdLower = (order.id || '').toLowerCase();
      const storedNameLower = (order.customer_name || '').toLowerCase();
      const orderIdMatches = storedOrderIdLower === orderIdLower;
      const nameMatches = storedNameLower.includes(nameLower);
      return orderIdMatches && nameMatches;
    });

    if (!matchedOrder) {
      return { data: null, error: null };
    }

    return {
      data: {
        id: matchedOrder.id,
        customer_id: matchedOrder.customer_id,
        branch_id: matchedOrder.branch_id,
        customer_name: matchedOrder.customer_name,
        contact_number: matchedOrder.contact_number,
        service_package: matchedOrder.service_package,
        weight: matchedOrder.weight,
        loads: matchedOrder.loads,
        distance: matchedOrder.distance,
        delivery_option: matchedOrder.delivery_option,
        status: matchedOrder.status,
        total: matchedOrder.total,
        is_paid: matchedOrder.is_paid,
        created_at: matchedOrder.created_at,
        updated_at: matchedOrder.updated_at,
        order_status_history: (matchedOrder.order_status_history as any[]) || [],
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error in case-insensitive search:', error);
    return { data: null, error };
  }
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

