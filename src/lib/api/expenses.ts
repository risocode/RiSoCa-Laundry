import { supabase } from '../supabase-client';

export type ExpenseInsert = {
  title: string;
  amount: number;
  category?: string | null;
  incurred_on?: string; // ISO date
  branch_id?: string | null;
};

export async function fetchExpenses() {
  return supabase
    .from('expenses')
    .select('*')
    .order('incurred_on', { ascending: false })
    .order('created_at', { ascending: false });
}

export async function addExpense(expense: ExpenseInsert) {
  return supabase
    .from('expenses')
    .insert({
      title: expense.title,
      amount: expense.amount,
      category: expense.category ?? null,
      incurred_on: expense.incurred_on ?? new Date().toISOString().slice(0, 10),
      branch_id: expense.branch_id ?? null,
    })
    .select()
    .single();
}

export async function deleteExpense(id: string) {
  return supabase.from('expenses').delete().eq('id', id);
}

