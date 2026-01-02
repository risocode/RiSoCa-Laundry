import type { Order, StatusHistory } from '@/components/order-list/types';

export function mapOrder(o: any): Order {
  const totalNum =
    typeof o.total === 'string' ? parseFloat(o.total) : Number(o.total);

  // CRITICAL FIX: Handle balance more explicitly
  // Check if balance exists and is a valid number (including 0)
  let balanceNum: number;
  if (o.balance !== null && o.balance !== undefined && o.balance !== '') {
    // Balance exists - convert to number
    balanceNum =
      typeof o.balance === 'string' ? parseFloat(o.balance) : Number(o.balance);
    // Ensure it's a valid number (not NaN)
    if (isNaN(balanceNum)) {
      balanceNum = o.is_paid ? 0 : totalNum;
    }
  } else {
    // Balance is null/undefined/empty - use fallback logic
    balanceNum = o.is_paid ? 0 : totalNum;
  }

  const mapped = {
    id: o.id,
    userId: o.customer_id,
    customerName: o.customer_name,
    contactNumber: o.contact_number,
    load: o.loads,
    weight: o.weight,
    status: o.status,
    total: totalNum,
    orderDate: new Date(o.created_at),
    isPaid: o.is_paid,
    balance: balanceNum, // ALWAYS set balance, never undefined
    deliveryOption: o.delivery_option ?? undefined,
    servicePackage: o.service_package,
    distance: o.distance ?? 0,
    statusHistory: (o.order_status_history ?? []).map((sh: any) => ({
      status: sh.status,
      timestamp: new Date(sh.created_at),
    })) as StatusHistory[],
    branchId: o.branch_id ?? null,
    orderType: o.order_type || 'customer',
    assignedEmployeeId: o.assigned_employee_id ?? null, // For backward compatibility
    assignedEmployeeIds:
      Array.isArray(o.assigned_employee_ids) &&
      o.assigned_employee_ids.length > 0
        ? o.assigned_employee_ids
        : undefined,
    loadPieces:
      Array.isArray(o.load_pieces) && o.load_pieces.length > 0
        ? o.load_pieces
        : undefined,
    foundItems:
      Array.isArray(o.found_items) && o.found_items.length > 0
        ? o.found_items
        : undefined,
  };

  // CRITICAL: Ensure balance is never undefined
  if (mapped.balance === undefined) {
    mapped.balance = mapped.isPaid ? 0 : mapped.total;
  }

  return mapped;
}
