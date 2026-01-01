import { supabase } from '@/lib/supabase-client';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import type { DistributionPeriod } from './types';
import type { User } from '@supabase/supabase-js';
import type { Toast } from '@/hooks/use-toast';

export async function saveBankSavingsDeposit(
  depositAmount: number,
  distributionPeriod: DistributionPeriod,
  user: User | null,
  toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void
): Promise<{ success: boolean; newTotal?: number }> {
  const now = new Date();
  let startDate: Date;
  let endDate = now;
  let periodType: string;

  if (distributionPeriod === 'monthly') {
    startDate = startOfMonth(now);
    endDate = endOfMonth(now);
    periodType = 'monthly';
  } else if (distributionPeriod === 'yearly') {
    startDate = startOfYear(now);
    endDate = endOfYear(now);
    periodType = 'yearly';
  } else if (distributionPeriod === 'all') {
    // For all-time deposits, use a very wide date range with 'custom' type
    startDate = new Date(2000, 0, 1); // Start from year 2000
    endDate = now;
    periodType = 'custom';
  } else {
    toast({
      variant: 'destructive',
      title: 'Cannot deposit',
      description: 'Invalid period type for bank savings deposit.',
    });
    return { success: false };
  }

  if (isNaN(depositAmount) || depositAmount <= 0) {
    toast({
      variant: 'destructive',
      title: 'Invalid amount',
      description: 'Please enter a valid positive number.',
    });
    return { success: false };
  }

  try {
    // Always create a new record for each deposit to maintain transaction history
    const { error: insertError } = await supabase
      .from('bank_savings')
      .insert({
        period_start: format(startDate, 'yyyy-MM-dd'),
        period_end: format(endDate, 'yyyy-MM-dd'),
        period_type: periodType,
        amount: depositAmount,
        created_by: user?.id,
      });

    if (insertError) {
      // Check if error is due to unique constraint (if migration hasn't been run)
      if (insertError.code === '23505' || insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
        console.error('Unique constraint error - database migration may be needed:', insertError);
        toast({
          variant: 'destructive',
          title: 'Database Migration Required',
          description: 'Please run the migration script to remove the unique constraint on bank_savings table. See src/docs/remove-bank-savings-unique-constraint.sql',
        });
      } else {
        console.error('Error inserting bank savings deposit:', insertError);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: insertError.message || 'Failed to save bank savings deposit.',
        });
      }
      return { success: false };
    }

    // Calculate total bank savings for this period by summing all deposits
    let periodDeposits;
    let sumError;
    
    if (periodType === 'custom') {
      // For custom (all-time) deposits, sum all custom deposits regardless of dates
      const { data, error } = await supabase
        .from('bank_savings')
        .select('amount')
        .eq('period_type', 'custom');
      periodDeposits = data;
      sumError = error;
    } else {
      // For monthly/yearly, filter by period_type, period_start, and period_end
      const { data, error } = await supabase
        .from('bank_savings')
        .select('amount')
        .eq('period_type', periodType)
        .eq('period_start', format(startDate, 'yyyy-MM-dd'))
        .eq('period_end', format(endDate, 'yyyy-MM-dd'));
      periodDeposits = data;
      sumError = error;
    }

    let totalAmount = depositAmount;
    if (!sumError && periodDeposits) {
      totalAmount = periodDeposits.reduce((sum, record) => {
        const amount = typeof record.amount === 'string' ? parseFloat(record.amount) : (record.amount || 0);
        return sum + amount;
      }, 0);
    }

    const depositDescription = distributionPeriod === 'all'
      ? 'all time'
      : distributionPeriod === 'monthly'
      ? format(now, 'MMMM yyyy')
      : format(now, 'yyyy');

    toast({
      title: 'Deposit Successful',
      description: `₱${depositAmount.toFixed(2)} deposited to bank savings for ${depositDescription}.`,
    });

    return { success: true, newTotal: totalAmount };
  } catch (error: any) {
    console.error('Unexpected error saving bank savings:', error);
    toast({
      variant: 'destructive',
      title: 'Error',
      description: error.message || 'An unexpected error occurred.',
    });
    return { success: false };
  }
}
