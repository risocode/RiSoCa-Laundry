import { supabase } from '@/lib/supabase-client';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import type { DistributionPeriod } from './types';
import type { User } from '@supabase/supabase-js';

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
    // For all-time deposits, use today's date for both start and end with 'custom' type
    // This allows multiple deposits on the same day and maintains transaction history
    startDate = now;
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
      console.error('Error inserting bank savings deposit:', {
        error: insertError,
        insertData: {
          period_start: format(startDate, 'yyyy-MM-dd'),
          period_end: format(endDate, 'yyyy-MM-dd'),
          period_type: periodType,
          amount: depositAmount,
        },
      });
      
      // Check if error is due to unique constraint (if migration hasn't been run)
      if (insertError.code === '23505' || insertError.message?.includes('unique') || insertError.message?.includes('duplicate')) {
        toast({
          variant: 'destructive',
          title: 'Database Migration Required',
          description: 'Please run the migration script to remove the unique constraint on bank_savings table. See src/docs/remove-bank-savings-unique-constraint.sql',
        });
      } else {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: insertError.message || 'Failed to save bank savings deposit. Please check the console for details.',
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
      description: `₱${formatCurrency(depositAmount)} deposited to bank savings for ${depositDescription}.`,
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

export async function saveBankSavingsClaim(
  claimAmount: number,
  distributionPeriod: DistributionPeriod,
  ownerName: string,
  periodLabel: string,
  user: User | null,
  toast: (props: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void
): Promise<{ success: boolean }> {
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
    startDate = now;
    endDate = now;
    periodType = 'custom';
  } else {
    toast({
      variant: 'destructive',
      title: 'Cannot claim',
      description: 'Invalid period type for bank savings claim.',
    });
    return { success: false };
  }

  if (isNaN(claimAmount) || claimAmount <= 0) {
    toast({
      variant: 'destructive',
      title: 'Invalid amount',
      description: 'Please enter a valid positive number.',
    });
    return { success: false };
  }

  const negativeAmount = -Math.abs(claimAmount);

  try {
    const { error } = await supabase
      .from('bank_savings')
      .insert({
        period_start: format(startDate, 'yyyy-MM-dd'),
        period_end: format(endDate, 'yyyy-MM-dd'),
        period_type: periodType,
        amount: negativeAmount,
        notes: `Claim: ${ownerName} (${periodLabel})`,
        created_by: user?.id,
      });

    if (error) {
      console.error('Error inserting bank savings claim:', error);
      toast({
        variant: 'destructive',
        title: 'Claim failed',
        description: error.message || 'Failed to deduct from bank savings.',
      });
      return { success: false };
    }

    toast({
      title: 'Bank Savings Updated',
      description: `₱${formatCurrency(claimAmount)} deducted from bank savings.`,
    });

    return { success: true };
  } catch (error: any) {
    console.error('Unexpected error saving bank savings claim:', error);
    toast({
      variant: 'destructive',
      title: 'Claim failed',
      description: error.message || 'An unexpected error occurred.',
    });
    return { success: false };
  }
}
