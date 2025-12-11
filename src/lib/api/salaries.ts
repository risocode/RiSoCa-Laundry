import { supabase } from '../supabase-client';

export type SalaryInsert = {
  staff_id?: string | null;
  branch_id?: string | null;
  amount: number;
  period_start: string; // ISO date
  period_end: string;   // ISO date
  is_paid?: boolean;
};

export type DailySalaryPayment = {
  id?: string;
  employee_id: string;
  date: string; // ISO date (YYYY-MM-DD)
  amount: number;
  is_paid: boolean;
  created_at?: string;
  updated_at?: string;
};

export async function fetchSalaries() {
  return supabase
    .from('salaries')
    .select('*')
    .order('period_end', { ascending: false });
}

export async function recordSalaryPayout(salary: SalaryInsert) {
  return supabase
    .from('salaries')
    .insert({
      staff_id: salary.staff_id ?? null,
      branch_id: salary.branch_id ?? null,
      amount: salary.amount,
      period_start: salary.period_start,
      period_end: salary.period_end,
      is_paid: salary.is_paid ?? false,
    })
    .select()
    .single();
}

export async function markSalaryPaid(id: string, paid: boolean) {
  return supabase
    .from('salaries')
    .update({ is_paid: paid })
    .eq('id', id)
    .select()
    .single();
}

// Daily Salary Payment functions
export async function fetchDailySalaryPayment(employeeId: string, date: string) {
  return supabase
    .from('daily_salary_payments')
    .select('*')
    .eq('employee_id', employeeId)
    .eq('date', date)
    .maybeSingle();
}

export async function fetchDailySalaryPaymentsByDate(date: string) {
  return supabase
    .from('daily_salary_payments')
    .select('*')
    .eq('date', date);
}

export async function upsertDailySalaryPayment(payment: DailySalaryPayment) {
  return supabase
    .from('daily_salary_payments')
    .upsert({
      employee_id: payment.employee_id,
      date: payment.date,
      amount: payment.amount,
      is_paid: payment.is_paid,
      updated_at: new Date().toISOString(),
    }, {
      onConflict: 'employee_id,date',
    })
    .select()
    .single();
}

export async function markDailySalaryPaid(employeeId: string, date: string, isPaid: boolean) {
  return supabase
    .from('daily_salary_payments')
    .update({ is_paid: isPaid, updated_at: new Date().toISOString() })
    .eq('employee_id', employeeId)
    .eq('date', date)
    .select()
    .single();
}

