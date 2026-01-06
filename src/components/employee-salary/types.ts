import type { Order } from '@/components/order-list';

export const SALARY_PER_LOAD = 30;

export const ELIGIBLE_STATUSES = [
  'Ready for Pick Up',
  'Out for Delivery',
  'Delivered',
  'Success',
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

export type DailyPaymentStatus = {
  [employeeId: string]: {
    is_paid: boolean;
    amount: number;
  };
};
