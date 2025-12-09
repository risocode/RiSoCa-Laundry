import { supabase } from '../supabase-client';

export type SalaryInsert = {
  staff_id?: string | null;
  branch_id?: string | null;
  amount: number;
  period_start: string; // ISO date
  period_end: string;   // ISO date
  is_paid?: boolean;
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

