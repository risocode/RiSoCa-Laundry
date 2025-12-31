export type OrderData = {
  id: string;
  total: number;
  is_paid: boolean;
  created_at: string;
  loads: number;
  weight: number;
};

export type ExpenseData = {
  id: string;
  amount: number;
  category: string | null;
  incurred_on: string;
  created_at: string;
};

export type SalaryPaymentData = {
  id: string;
  employee_id: string;
  amount: number;
  is_paid: boolean;
  date: string;
  created_at: string;
};

export type ChartPeriod = 'daily' | 'weekly' | 'monthly' | 'yearly';

export type ChartDataPoint = {
  period: string;
  revenue: number;
  expenses: number;
  net: number;
};

export type ExpenseCategoryData = {
  name: string;
  value: number;
};

export const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];
