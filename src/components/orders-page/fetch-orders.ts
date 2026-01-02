import { supabase } from '@/lib/supabase-client';
import { mapOrder } from './map-order';
import type { Order } from '@/components/order-list/types';

const ORDER_SELECT_FIELDS = `
  id,
  customer_id,
  customer_name,
  contact_number,
  loads,
  weight,
  status,
  total,
  created_at,
  is_paid,
  balance,
  delivery_option,
  service_package,
  distance,
  branch_id,
  order_type,
  assigned_employee_id,
  assigned_employee_ids,
  load_pieces,
  found_items,
  order_status_history(*)
`;

const FALLBACK_ORDER_SELECT_FIELDS = `
  id,
  customer_id,
  customer_name,
  contact_number,
  loads,
  weight,
  status,
  total,
  created_at,
  is_paid,
  balance,
  delivery_option,
  service_package,
  distance,
  branch_id,
  order_type,
  assigned_employee_id,
  load_pieces,
  found_items,
  order_status_history(*)
`;

export async function fetchOrders(): Promise<{
  data: Order[] | null;
  error: Error | null;
}> {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(ORDER_SELECT_FIELDS)
      .order('id', { ascending: false });

    if (error) {
      // If error is about assigned_employee_ids column not existing, try without it
      // Error codes: 42703 = column doesn't exist, 400 = bad request (often column issues)
      const isColumnError =
        error.message?.includes('assigned_employee_ids') ||
        error.message?.includes('column') ||
        error.code === '42703' ||
        error.code === 'PGRST116' ||
        (error.code && error.code.toString().startsWith('42'));

      if (isColumnError) {
        console.warn(
          'assigned_employee_ids column may not exist, fetching without it:',
          error.message
        );
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('orders')
          .select(FALLBACK_ORDER_SELECT_FIELDS)
          .order('id', { ascending: false });

        if (fallbackError) {
          return {
            data: null,
            error: new Error(
              fallbackError.message ||
                'Failed to fetch orders. Please refresh the page.'
            ),
          };
        }

        const mappedOrders = (fallbackData ?? []).map(mapOrder);
        return { data: mappedOrders, error: null };
      }

      return {
        data: null,
        error: new Error(
          error.message || 'Failed to fetch orders. Please refresh the page.'
        ),
      };
    }

    const mappedOrders = (data ?? []).map(mapOrder);
    return { data: mappedOrders, error: null };
  } catch (err: any) {
    return {
      data: null,
      error: new Error(
        err.message || 'Unexpected error fetching orders. Please refresh the page.'
      ),
    };
  }
}
