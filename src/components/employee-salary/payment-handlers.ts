import { format } from 'date-fns';
import { supabase } from '@/lib/supabase-client';
import { formatCurrencyWhole } from '@/lib/utils';
import { fetchDailyPayments } from './fetch-data';
import type { LoadCompletionData } from './types';

export async function savePaymentAmount(
  employeeId: string,
  date: Date,
  amount: number,
  currentStatus: boolean,
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void,
  onSuccess: (dateStr: string, payments: any) => void
): Promise<void> {
  const dateStr = format(date, 'yyyy-MM-dd');

  if (isNaN(amount) || amount < 0) {
    toast({
      variant: 'destructive',
      title: 'Invalid Amount',
      description: 'Please enter a valid positive number.',
    });
    throw new Error('Invalid amount');
  }

  const { data: existingData, error: fetchError } = await supabase
    .from('daily_salary_payments')
    .select('id, load_completion')
    .eq('employee_id', employeeId)
    .eq('date', dateStr)
    .maybeSingle();

  let result;
  if (existingData && !fetchError) {
    result = await supabase
      .from('daily_salary_payments')
      .update({
        amount: amount,
        is_paid: currentStatus,
        load_completion: existingData.load_completion || {},
        updated_at: new Date().toISOString(),
      })
      .eq('employee_id', employeeId)
      .eq('date', dateStr)
      .select();
  } else {
    result = await supabase
      .from('daily_salary_payments')
      .insert({
        employee_id: employeeId,
        date: dateStr,
        amount: amount,
        is_paid: currentStatus,
        load_completion: {},
        updated_at: new Date().toISOString(),
      })
      .select();
  }

  if (result.error) {
    console.error('Database error:', result.error);
    throw result.error;
  }

  if (!result.data || (Array.isArray(result.data) && result.data.length === 0)) {
    throw new Error('Failed to save payment amount. No data returned from database.');
  }

  toast({
    title: 'Amount Updated',
    description: `Payment amount has been updated to ₱${formatCurrencyWhole(amount)}.`,
  });

  const payments = await fetchDailyPayments(dateStr);
  onSuccess(dateStr, payments);
}

export async function togglePaymentStatus(
  employeeId: string,
  date: Date,
  currentStatus: boolean,
  amount: number,
  toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void,
  onSuccess: (dateStr: string, payments: any) => void
): Promise<void> {
  const dateStr = format(date, 'yyyy-MM-dd');
  const newStatus = !currentStatus;
  
  const { data: existingData, error: fetchError } = await supabase
    .from('daily_salary_payments')
    .select('id, load_completion')
    .eq('employee_id', employeeId)
    .eq('date', dateStr)
    .maybeSingle();

  let result;
  if (existingData && !fetchError) {
    result = await supabase
      .from('daily_salary_payments')
      .update({
        is_paid: newStatus,
        amount: amount,
        load_completion: existingData.load_completion || {},
        updated_at: new Date().toISOString(),
      })
      .eq('employee_id', employeeId)
      .eq('date', dateStr);
  } else {
      result = await supabase
        .from('daily_salary_payments')
        .insert({
          employee_id: employeeId,
          date: dateStr,
          amount: amount,
          is_paid: newStatus,
          load_completion: {},
          updated_at: new Date().toISOString(),
        });
  }

  if (result.error) {
    console.error('Database error:', result.error);
    throw result.error;
  }

  toast({
    title: newStatus ? 'Marked as Paid' : 'Marked as Unpaid',
    description: `Employee salary for ${format(date, 'MMM dd, yyyy')} has been updated.`,
  });

  const payments = await fetchDailyPayments(dateStr);
  onSuccess(dateStr, payments);
}
