import { supabase } from '@/lib/supabase-client';
import { fetchExpenses } from '@/lib/api/expenses';
import type { OrderData, ExpenseData, SalaryPaymentData } from './types';

export async function fetchFinanceData(): Promise<{
  orders: OrderData[];
  expenses: ExpenseData[];
  salaryPayments: SalaryPaymentData[];
  totalUsers: number;
  businessStartDate: Date | null;
}> {
  // Fetch all orders (for revenue, loads, and weight)
  const { data: ordersData, error: ordersError } = await supabase
    .from('orders')
    .select('id, total, is_paid, created_at, loads, weight')
    .order('created_at', { ascending: true });

  if (ordersError) {
    console.error('Failed to load orders', ordersError);
  }

  // Fetch expenses
  const expensesResult = await fetchExpenses();
  let expenses: ExpenseData[] = [];
  if (expensesResult.error) {
    console.error('Failed to load expenses', expensesResult.error);
  } else {
    expenses = (expensesResult.data || []).map((e: any) => ({
      id: e.id,
      amount: e.amount,
      category: e.category,
      incurred_on: e.incurred_on || e.created_at,
      created_at: e.created_at,
    }));
  }

  // Fetch employee salary payments (where is_paid = true)
  const { data: salaryData, error: salaryError } = await supabase
    .from('daily_salary_payments')
    .select('id, employee_id, amount, is_paid, date, created_at')
    .eq('is_paid', true);

  if (salaryError) {
    console.error('Failed to load salary payments', salaryError);
  }

  // Fetch total users count
  const { count, error: usersError } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true });

  if (usersError) {
    console.error('Failed to load users count', usersError);
  }

  // Set business start date to the earliest order date
  const businessStartDate = ordersData && ordersData.length > 0
    ? new Date(ordersData[0].created_at)
    : null;

  return {
    orders: ordersData || [],
    expenses,
    salaryPayments: salaryData || [],
    totalUsers: count || 0,
    businessStartDate,
  };
}
