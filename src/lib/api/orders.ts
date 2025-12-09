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
 */
export async function fetchLatestOrderId() {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error) {
    return { latestId: null, error };
  }
  
  return { latestId: data?.id ?? null, error: null };
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

export async function fetchOrderForCustomer(orderId: string, name: string) {
  const { data, error } = await fetchOrderWithHistory(orderId);
  if (error || !data) return { data: null, error };

  const customerNameLower = data.customer_name.toLowerCase();
  const inputNameLower = name.trim().toLowerCase();
  const matches = customerNameLower.includes(inputNameLower);
  return { data: matches ? data : null, error: null };
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

