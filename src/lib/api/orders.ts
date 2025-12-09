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

export async function fetchLatestOrderId() {
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  return { latestId: data?.id ?? null, error };
}

export function generateNextOrderId(latestId: string | null) {
  if (!latestId) return 'RKR001';
  const match = latestId.match(/RKR(\d+)/i);
  const next = match ? parseInt(match[1], 10) + 1 : 1;
  return `RKR${String(next).padStart(3, '0')}`;
}

export async function createOrder(order: OrderInsert) {
  return supabase.from('orders').insert(order).select().single();
}

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
    .select('*')
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

