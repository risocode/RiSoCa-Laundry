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
  canceled_by?: string | null;
  canceled_at?: string | null;
  cancel_reason?: string | null;
  order_type?: 'customer' | 'internal';
  assigned_employee_id?: string | null; // For backward compatibility (single employee)
  assigned_employee_ids?: string[]; // Array of employee IDs (JSON array in database)
  load_pieces?: number[] | null; // Array of piece counts per load (JSONB array in database)
  created_at?: string; // Optional custom creation date (ISO string)
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
  // Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { data: null, error: { message: 'User not authenticated' } };
  }

  // Filter orders by the current user's ID (customer_id)
  // Include "Order Created" orders so customers can see their newly submitted orders
  return supabase
    .from('orders')
    .select('*, order_status_history(*)')
    .eq('customer_id', user.id)
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
 * Uses case-insensitive matching for both order ID and customer name.
 * First tries to use an RPC function (if available) to bypass RLS,
 * then falls back to direct query if RPC is not available.
 */
export async function fetchOrderForCustomer(orderId: string, name: string) {
  const trimmedOrderId = orderId.trim();
  const trimmedName = name.trim();

  if (!trimmedOrderId || !trimmedName) {
    return { data: null, error: null };
  }

  try {
    // Try RPC function first (bypasses RLS) - only if function exists
    // If RPC function doesn't exist or fails, fall through to direct query
    try {
      const { data: rpcData, error: rpcError } = await supabase.rpc(
        'get_order_by_id_and_name',
        {
          p_order_id: trimmedOrderId,
          p_customer_name: trimmedName,
        }
      );

      // Check for errors (including 400 Bad Request)
      if (rpcError) {
        // If it's a 400 error or function doesn't exist, fall through to direct query
        // Don't log or throw - just continue to fallback
        throw new Error('RPC error, using fallback');
      }

      // If RPC function exists and returns data, use it
      // Handle both TABLE return (array) and JSON return (single object)
      if (rpcData) {
        let order: any;
        
        // If it's an array (TABLE return type), get first element
        if (Array.isArray(rpcData)) {
          if (rpcData.length === 0) {
            // No results, continue to fallback
            throw new Error('No results from RPC, using fallback');
          } else {
            order = rpcData[0];
          }
        } else if (rpcData && typeof rpcData === 'object' && Object.keys(rpcData).length > 0) {
          // Single JSON object return (check it's not empty/null)
          order = rpcData;
        } else {
          // Empty or null result, continue to fallback
          throw new Error('Empty RPC result, using fallback');
        }
        
        if (order && order.id) {
          // Parse order_status_history if it's a JSONB string
          let statusHistory: any[] = [];
          if (order.order_status_history) {
            if (typeof order.order_status_history === 'string') {
              try {
                statusHistory = JSON.parse(order.order_status_history);
              } catch {
                statusHistory = [];
              }
            } else if (Array.isArray(order.order_status_history)) {
              statusHistory = order.order_status_history;
            }
          }
          
          return {
            data: {
              id: order.id,
              customer_id: order.customer_id,
              branch_id: order.branch_id,
              customer_name: order.customer_name,
              contact_number: order.contact_number,
              service_package: order.service_package,
              weight: order.weight,
              loads: order.loads,
              distance: order.distance,
              delivery_option: order.delivery_option,
              status: order.status,
              total: order.total,
              is_paid: order.is_paid,
              created_at: order.created_at,
              updated_at: order.updated_at,
              order_status_history: statusHistory,
              order_type: order.order_type || 'customer',
              assigned_employee_id: order.assigned_employee_id ?? null,
            },
            error: null,
          };
        }
      }
      // If RPC returns no data, continue to fallback
    } catch (rpcErr) {
      // RPC function doesn't exist, failed, or returned no data - continue to direct query fallback
      // Silently fall through to direct query
    }

    // Fallback: Try direct query (requires RLS to allow SELECT)
    let { data: ordersData, error: ordersError } = await supabase
      .from('orders')
      .select('*, order_status_history(*)')
      .eq('id', trimmedOrderId);
    
    // If exact match fails, try case-insensitive search by fetching all and filtering
    if (ordersError || !ordersData || ordersData.length === 0) {
      const { data: allOrders, error: allError } = await supabase
        .from('orders')
        .select('*, order_status_history(*)');
      
      if (allError) {
        console.error('Failed to fetch orders:', allError);
        return { data: null, error: allError };
      }

      // Case-insensitive matching
      const orderIdLower = trimmedOrderId.toLowerCase();
      const nameLower = trimmedName.toLowerCase();
      
      ordersData = (allOrders || []).filter(order => {
        const storedOrderIdLower = (order.id || '').toLowerCase();
        const storedNameLower = (order.customer_name || '').toLowerCase();
        return storedOrderIdLower === orderIdLower && storedNameLower.includes(nameLower);
      });
    } else {
      // Exact match found, now filter by name (case-insensitive)
      const nameLower = trimmedName.toLowerCase();
      ordersData = ordersData.filter(order => {
        const storedNameLower = (order.customer_name || '').toLowerCase();
        return storedNameLower.includes(nameLower);
      });
    }

    if (!ordersData || ordersData.length === 0) {
      return { data: null, error: null };
    }

    const matchedOrder = ordersData[0];

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
        order_type: matchedOrder.order_type || 'customer',
        assigned_employee_id: matchedOrder.assigned_employee_id ?? null,
      },
      error: null,
    };
  } catch (error: any) {
    console.error('Error in order search:', error);
    return { data: null, error };
  }
}

export async function updateOrderStatus(orderId: string, status: string, note?: string) {
  let finalOrderId = orderId;
  
  // If changing to "Order Placed" and order doesn't have a proper RKR ID yet, generate one
  if (status === 'Order Placed') {
    // Check if current ID is a UUID or temporary ID (doesn't start with RKR)
    const { data: currentOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('id', orderId)
      .maybeSingle();
    
    if (currentOrder && !currentOrder.id.match(/^RKR\d+$/i)) {
      // Generate new RKR ID
      const { latestId, error: idError } = await fetchLatestOrderId();
      
      if (idError) {
        console.error('Error fetching latest order ID:', idError);
        // Continue with status update but don't change ID - will retry on next status change
      } else {
        const newOrderId = generateNextOrderId(latestId);
        
        // Use database function to update ID and all foreign key references
        const { data: updateResult, error: updateIdError } = await supabase.rpc('update_order_id_on_placed', {
          p_order_id: orderId,
          p_new_order_id: newOrderId,
        });
        
        // Handle 406 errors from void functions - they don't mean the function failed
        // Verify the update actually succeeded by checking if new ID exists
        if (updateIdError && updateIdError.code !== '406') {
          // Non-406 error - function might have failed, try fallback
          console.warn('update_order_id_on_placed returned error:', updateIdError);
          
          // Verify if update actually succeeded despite the error
          const { data: verifyData } = await supabase
            .from('orders')
            .select('id')
            .eq('id', newOrderId)
            .maybeSingle();
          
          if (verifyData && verifyData.id === newOrderId) {
            // Update actually succeeded, use new ID
            finalOrderId = newOrderId;
          } else {
            // Update failed, try fallback manual update
            await supabase
              .from('order_status_history')
              .update({ order_id: newOrderId })
              .eq('order_id', orderId);
            
            const { error: updateError } = await supabase
              .from('orders')
              .update({ id: newOrderId })
              .eq('id', orderId);
            
            if (!updateError) {
              finalOrderId = newOrderId;
            } else {
              console.error('Failed to update order ID:', updateError);
              // Continue with status update using original ID
            }
          }
        } else {
          // No error or 406 error - check if function returned success
          if (updateResult === 'success') {
            // Function returned success status (TEXT 'success')
            finalOrderId = newOrderId;
          } else {
            // Verify the update succeeded by checking if new ID exists
            const { data: verifyData } = await supabase
              .from('orders')
              .select('id')
              .eq('id', newOrderId)
              .maybeSingle();
            
            if (verifyData && verifyData.id === newOrderId) {
              // Update succeeded (function worked but didn't return value properly)
              finalOrderId = newOrderId;
            } else {
              // Update didn't work, try fallback
              console.warn('ID update verification failed, using fallback');
              await supabase
                .from('order_status_history')
                .update({ order_id: newOrderId })
                .eq('order_id', orderId);
              
              const { error: updateError } = await supabase
                .from('orders')
                .update({ id: newOrderId })
                .eq('id', orderId);
              
              if (!updateError) {
                finalOrderId = newOrderId;
              } else {
                console.error('Failed to update order ID (fallback):', updateError);
                // Continue with status update using original ID
              }
            }
          }
        }
      }
    }
  }
  
  const { data, error } = await supabase
  .from('orders')  // ✅ Correct indentation
  .update({ status })
  .eq('id', finalOrderId)
  .select()
  .single();

// If there's an error (like 406 or coerce), verify if update actually succeeded
if (error) {
  const isCoerceOr406Error = error.message?.includes('coerce') || 
                              error.message?.includes('JSON object') ||
                              error.code === '406' ||
                              error.message?.includes('406');
  
  if (isCoerceOr406Error) {
    // Check if the update actually succeeded
    const { data: verifyData } = await supabase
      .from('orders')
      .select('*')
      .eq('id', finalOrderId)
      .maybeSingle();
    
    if (verifyData && verifyData.status === status) {
      // Update succeeded despite the error - return success
      await supabase.from('order_status_history').insert({ 
        order_id: finalOrderId, 
        status, 
        note: note || (status === 'Order Placed' ? 'Order approved and ID assigned' : undefined)
      });
      return { data: verifyData, error: null };
    }
  }
  // Real error - return it
  return { data, error };
}

// No error - proceed normally
await supabase.from('order_status_history').insert({ 
  order_id: finalOrderId, 
  status, 
  note: note || (status === 'Order Placed' ? 'Order approved and ID assigned' : undefined)
});
return { data, error };
}

export async function updateOrderFields(orderId: string, patch: Partial<OrderInsert>) {
  const result = await supabase.from('orders').update(patch).eq('id', orderId).select().single();
  
  // If single() fails, try without single() to see if update actually worked
  if (result.error && (
    result.error.message?.includes('coerce') || 
    result.error.message?.includes('JSON object') ||
    result.error.code === '406' ||
    result.error.message?.includes('406')
  )) {
    // Get full order data if update succeeded
    const { data: fullOrderData } = await supabase
    .from('orders')
    .select('*')
    .eq('id', orderId)
    .maybeSingle();

    if (fullOrderData) {
    return { data: fullOrderData, error: null };
    }
  }
  
  return result;
}

/**
 * Cancel an order by customer
 */
export async function cancelOrderByCustomer(orderId: string, customerId: string) {
  const { data, error } = await supabase
    .from('orders')
    .update({
      status: 'Canceled',
      canceled_by: 'customer',
      canceled_at: new Date().toISOString(),
    })
    .eq('id', orderId)
    .eq('customer_id', customerId) // Ensure customer can only cancel their own orders
    .eq('status', 'Order Created') // Only allow cancellation for "Order Created" status
    .select()
    .single();

  if (!error && data) {
    await supabase.from('order_status_history').insert({
      order_id: orderId,
      status: 'Canceled',
      note: 'Order canceled by customer',
    });
  }

  return { data, error };
}

/**
 * Count orders created by a customer today (including canceled orders)
 * Uses UTC for consistency with database timestamps
 */
export async function countCustomerOrdersToday(customerId: string): Promise<number> {
  // Use UTC for consistency with database timestamps
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0, 0));
  const tomorrow = new Date(today);
  tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

  const { count, error } = await supabase
    .from('orders')
    .select('*', { count: 'exact', head: true })
    .eq('customer_id', customerId)
    .gte('created_at', today.toISOString())
    .lt('created_at', tomorrow.toISOString());

  if (error) {
    console.error('Error counting customer orders:', error);
    return 0;
  }

  return count ?? 0;
}

/**
 * Generate a temporary ID for orders in "Order Created" status
 * Format: RKR-Pending-001, RKR-Pending-002, etc. (sequential)
 * This is customer-friendly and will be replaced with RKR### when status changes to "Order Placed"
 */
export async function generateTemporaryOrderId(): Promise<string> {
  // Get the latest RKR-Pending-### ID to generate the next sequential number
  const { data, error } = await supabase
    .from('orders')
    .select('id')
    .like('id', 'RKR-Pending-%')
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();
  
  if (error || !data || !data.id) {
    // No existing pending orders, start with 001
    return 'RKR-Pending-001';
  }
  
  // Extract the number from RKR-Pending-### format
  const match = data.id.match(/RKR-Pending-(\d+)/i);
  if (!match) {
    // If format is unexpected, start fresh
    return 'RKR-Pending-001';
  }
  
  const currentNumber = parseInt(match[1], 10);
  if (isNaN(currentNumber)) {
    return 'RKR-Pending-001';
  }
  
  // Increment and format with leading zeros (e.g., 2 -> "002")
  const nextNumber = currentNumber + 1;
  return `RKR-Pending-${String(nextNumber).padStart(3, '0')}`;
}

