import type { Order } from '@/components/order-list';

export const SALARY_PER_LOAD = 30;

export const ELIGIBLE_STATUSES = [
  'Ready for Pick Up',
  'Out for Delivery',
  'Delivered',
  'Success',
  'Partial Complete',
] as const;

export type DailySalary = {
  date: Date;
  orders: Order[];
  totalLoads: number;
  totalSalary: number;
};

export type Employee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

export type LoadCompletionData = {
  [orderId: string]: {
    completed_loads: number[];  // Array of load indices (1-based) that are completed
    incomplete_loads: number[];  // Array of load indices (1-based) that are not done
    next_day_employee_id?: string | null;  // Optional: employee assigned for next day
  };
};

export type DailyPaymentStatus = {
  [employeeId: string]: {
    is_paid: boolean;
    amount: number;
    load_completion?: LoadCompletionData;
  };
};
