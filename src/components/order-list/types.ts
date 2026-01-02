export type StatusHistory = {
  status: string;
  timestamp: Date;
};

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  contactNumber: string;
  load: number;
  weight: number;
  status: string;
  total: number;
  orderDate: Date;
  isPaid: boolean;
  balance?: number; // Remaining balance for unpaid/partially paid orders
  deliveryOption?: string;
  servicePackage: string;
  distance: number;
  statusHistory: StatusHistory[];
  branchId?: string | null;
  orderType?: 'customer' | 'internal';
  assignedEmployeeId?: string | null; // For backward compatibility (single employee)
  assignedEmployeeIds?: string[]; // Array of employee IDs (multiple employees)
  loadPieces?: number[]; // Array of piece counts per load [30, 25] means Load 1: 30 pcs, Load 2: 25 pcs
  foundItems?: string[]; // Array of items found in customer laundry ["wallet", "keys", "phone"]
};

export type OrderListProps = {
  orders: Order[];
  onUpdateOrder: (order: Order) => Promise<void>;
  enablePagination?: boolean; // If false, show all orders without pagination
};

export type Employee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};
