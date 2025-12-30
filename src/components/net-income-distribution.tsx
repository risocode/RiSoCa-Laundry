'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Users, PieChart as PieChartIcon, DollarSign, Share2, CheckCircle2, CheckSquare, Square, Calendar, FileText, Download, RefreshCw, AlertCircle, Info, X } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { fetchExpenses } from '@/lib/api/expenses';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachYearOfInterval, subDays, subWeeks, subYears } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  LineChart,
  Line,
} from 'recharts';

type OrderData = {
  id: string;
  total: number;
  is_paid: boolean;
  created_at: string;
};

type ExpenseData = {
  id: string;
  amount: number;
  expense_for: string;
  reimbursement_status: string | null;
  incurred_on: string;
};

type SalaryPaymentData = {
  id: string;
  employee_id: string;
  amount: number;
  is_paid: boolean;
  date: string;
};

const OWNERS = ['Racky', 'Karaya', 'Richard'] as const;
const COLORS = ['#0088FE', '#00C49F', '#FFBB28'];

type DistributionRecord = {
  id: string;
  owner_name: string;
  share_amount: number;
  net_share: number;
  is_claimed: boolean;
  claimed_at: string | null;
  period_start: string;
  period_end: string;
  period_type: string;
};

export function NetIncomeDistribution() {
  const { user } = useAuthSession();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributionPeriod, setDistributionPeriod] = useState<'monthly' | 'yearly' | 'all'>('monthly');
  const [bankSavingsHistory, setBankSavingsHistory] = useState<Array<{period_start: string, period_end: string, period_type: string, amount: number, created_at: string}>>([]);
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set(['Karaya', 'Richard'])); // Racky disabled
  const [existingDistributions, setExistingDistributions] = useState<DistributionRecord[]>([]);
  const [claimingDistribution, setClaimingDistribution] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [ownerToClaim, setOwnerToClaim] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [bankSavings, setBankSavings] = useState<number>(0);
  const [savingBankSavings, setSavingBankSavings] = useState(false);
  const [showCustomTransfer, setShowCustomTransfer] = useState(false);
  const [customTransferAmount, setCustomTransferAmount] = useState<string>('');

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    fetchBankSavings();
    fetchBankSavingsHistory();
  }, [distributionPeriod]);

  const fetchBankSavingsHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('bank_savings')
        .select('period_start, period_end, period_type, amount, created_at')
        .order('period_start', { ascending: false })
        .limit(50);

      if (!error && data) {
        setBankSavingsHistory(data);
      }
    } catch (error) {
      console.error('Error fetching bank savings history:', error);
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch all paid orders
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, is_paid, created_at')
        .eq('is_paid', true)
        .order('created_at', { ascending: true });

      if (ordersError) {
        console.error('Failed to load orders', ordersError);
      } else {
        setOrders(ordersData || []);
      }

      // Fetch expenses
      const expensesResult = await fetchExpenses();
      if (expensesResult.error) {
        console.error('Failed to load expenses', expensesResult.error);
      } else {
        setExpenses((expensesResult.data || []).map((e: any) => ({
          id: e.id,
          amount: e.amount,
          expense_for: e.expense_for,
          reimbursement_status: e.reimbursement_status,
          incurred_on: e.incurred_on || e.created_at,
        })));
      }

      // Fetch employee salary payments
      const { data: salaryData, error: salaryError } = await supabase
        .from('daily_salary_payments')
        .select('id, employee_id, amount, is_paid, date, created_at')
        .eq('is_paid', true);

      if (salaryError) {
        console.error('Failed to load salary payments', salaryError);
      } else {
        setSalaryPayments(salaryData || []);
      }

      // Fetch existing distributions
      await fetchDistributions();
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDistributions = async () => {
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
    } else {
      // For 'all', fetch all distributions
      const { data, error } = await supabase
        .from('income_distributions')
        .select('*')
        .order('period_start', { ascending: false });

      if (!error && data) {
        setExistingDistributions(data);
      }
      return;
    }

    const { data, error } = await supabase
      .from('income_distributions')
      .select('*')
      .eq('period_type', periodType)
      .gte('period_end', format(startDate, 'yyyy-MM-dd'))
      .lte('period_start', format(endDate, 'yyyy-MM-dd'))
      .order('period_start', { ascending: false });

    if (!error && data) {
      setExistingDistributions(data);
    }
  };

  const fetchBankSavings = async () => {
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
    } else {
      // For 'all', set bank savings to 0 (not applicable for all time)
      setBankSavings(0);
      return;
    }

    // Sum all deposits for this period (since each deposit is a separate record)
    const { data, error } = await supabase
      .from('bank_savings')
      .select('amount')
      .eq('period_type', periodType)
      .eq('period_start', format(startDate, 'yyyy-MM-dd'))
      .eq('period_end', format(endDate, 'yyyy-MM-dd'));

    if (!error && data && data.length > 0) {
      const totalAmount = data.reduce((sum, record) => sum + (record.amount || 0), 0);
      setBankSavings(totalAmount);
    } else {
      setBankSavings(0);
    }
  };

  const saveBankSavingsDeposit = async (depositAmount: number) => {
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
    } else {
      toast({
        variant: 'destructive',
        title: 'Cannot deposit',
        description: 'Bank savings can only be deposited for monthly or yearly periods.',
      });
      return;
    }

    if (isNaN(depositAmount) || depositAmount <= 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid amount',
        description: 'Please enter a valid positive number.',
      });
      return;
    }

    setSavingBankSavings(true);

    try {
      // Always create a new record for each deposit to maintain transaction history
      // Each deposit should be a separate entry, even for the same period
      const { error: insertError } = await supabase
        .from('bank_savings')
        .insert({
          period_start: format(startDate, 'yyyy-MM-dd'),
          period_end: format(endDate, 'yyyy-MM-dd'),
          period_type: periodType,
          amount: depositAmount, // Store the deposit amount, not cumulative
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
      } else {
        // Calculate total bank savings for this period by summing all deposits
        const { data: periodDeposits, error: sumError } = await supabase
          .from('bank_savings')
          .select('amount')
          .eq('period_type', periodType)
          .eq('period_start', format(startDate, 'yyyy-MM-dd'))
          .eq('period_end', format(endDate, 'yyyy-MM-dd'));

        if (!sumError && periodDeposits) {
          const totalAmount = periodDeposits.reduce((sum, record) => sum + (record.amount || 0), 0);
          setBankSavings(totalAmount);
        } else {
          setBankSavings(depositAmount);
        }

        fetchBankSavingsHistory(); // Refresh history
        toast({
          title: 'Deposit Successful',
          description: `₱${depositAmount.toFixed(2)} deposited to bank savings for ${distributionPeriod === 'monthly' ? format(now, 'MMMM yyyy') : format(now, 'yyyy')}.`,
        });
      }
    } catch (error: any) {
      console.error('Unexpected error saving bank savings:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: error.message || 'An unexpected error occurred.',
      });
    } finally {
      setSavingBankSavings(false);
    }
  };

  // Calculate net income distribution
  const distributionData = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    // Filter data based on period
    let filteredOrders = orders;
    let filteredExpenses = expenses;
    let filteredSalaries = salaryPayments;

    if (distributionPeriod === 'monthly') {
      startDate = startOfMonth(now);
      endDate = endOfMonth(now);
    } else if (distributionPeriod === 'yearly') {
      startDate = startOfYear(now);
      endDate = endOfYear(now);
    } else {
      // All time - no filtering needed
      startDate = orders.length > 0 ? new Date(orders[0].created_at) : now;
    }

    if (distributionPeriod !== 'all') {
      filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= startDate && orderDate <= endDate;
      });

      filteredExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.incurred_on);
        return expenseDate >= startDate && expenseDate <= endDate;
      });

      filteredSalaries = salaryPayments.filter(s => {
        const salaryDate = new Date(s.date);
        return salaryDate >= startDate && salaryDate <= endDate;
      });
    }

    // Calculate total revenue (from paid orders)
    const totalRevenue = filteredOrders.reduce((sum, o) => sum + (o.total || 0), 0);

    // Calculate expenses
    // Only count RKR expenses (business expenses + reimbursed expenses)
    const rkrExpenses = filteredExpenses.filter(e => 
      e.expense_for === 'RKR' || e.reimbursement_status === 'reimbursed'
    );
    const regularExpenses = rkrExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const employeeSalaries = filteredSalaries.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalExpenses = regularExpenses + employeeSalaries;

    // Net Income = Revenue - Expenses
    const netIncome = totalRevenue - totalExpenses;

    // Calculate personal expenses (pending reimbursements) for each owner
    const personalExpenses = filteredExpenses.filter(e => 
      e.reimbursement_status === 'pending' && OWNERS.includes(e.expense_for as typeof OWNERS[number])
    );

    const ownerExpenses: Record<string, number> = {
      Racky: 0,
      Karaya: 0,
      Richard: 0,
    };

    personalExpenses.forEach(e => {
      if (OWNERS.includes(e.expense_for as typeof OWNERS[number])) {
        ownerExpenses[e.expense_for] += e.amount || 0;
      }
    });

    // Net Income available for distribution (after deducting personal expenses that will be reimbursed)
    // Note: Personal expenses are already deducted from net income since they're not RKR expenses
    // But they will be reimbursed, so we need to account for them
    const totalPersonalExpenses = Object.values(ownerExpenses).reduce((sum, val) => sum + val, 0);
    
    // Available for distribution = Net Income - Bank Savings
    // Bank savings is deducted from net income before distribution
    const availableForDistribution = netIncome - bankSavings;

    // Equal distribution among selected owners
    const selectedCount = selectedOwners.size || 1;
    const distributionPercentage = selectedCount > 0 ? 100 / selectedCount : 0;
    const distributionAmount = selectedCount > 0 ? availableForDistribution / selectedCount : 0;

    const distribution = OWNERS.map((owner, index) => {
      // Racky is disabled - exclude from distribution
      const isDisabled = owner === 'Racky';
      const isSelected = !isDisabled && selectedOwners.has(owner);
      const existingDist = existingDistributions.find(
        d => d.owner_name === owner && 
        d.period_type === (distributionPeriod === 'all' ? 'custom' : distributionPeriod)
      );

      return {
        name: owner,
        share: isSelected ? distributionAmount : 0,
        percentage: isSelected ? distributionPercentage : 0,
        personalExpenses: ownerExpenses[owner],
        netShare: isSelected ? (distributionAmount - ownerExpenses[owner]) : 0, // After deducting their personal expenses
        color: COLORS[index],
        isSelected,
        isDisabled,
        isClaimed: existingDist?.is_claimed || false,
        claimedAt: existingDist?.claimed_at || null,
        distributionId: existingDist?.id || null,
      };
    });

    return {
      totalRevenue,
      totalExpenses,
      netIncome,
      totalPersonalExpenses,
      availableForDistribution,
      distribution,
      period: distributionPeriod === 'monthly' 
        ? format(now, 'MMMM yyyy')
        : distributionPeriod === 'yearly'
        ? format(now, 'yyyy')
        : 'All Time',
      startDate,
      endDate,
    };
  }, [orders, expenses, salaryPayments, distributionPeriod, selectedOwners, existingDistributions, bankSavings]);

  // Prepare chart data for distribution over time
  const timeSeriesData = useMemo(() => {
    if (orders.length === 0) return [];

    const now = new Date();
    let periods: Date[];
    let dateFormatter: (date: Date) => string;
    let periodStartFn: (date: Date) => Date;
    let periodEndFn: (date: Date) => Date;

    let startDate: Date;
    let endDate = now;

    if (distributionPeriod === 'monthly') {
      // Last 12 months
      startDate = startOfMonth(subMonths(now, 11));
      periods = eachMonthOfInterval({ start: startDate, end: endDate });
      dateFormatter = (d) => format(d, 'MMM yyyy');
      periodStartFn = startOfMonth;
      periodEndFn = endOfMonth;
    } else if (distributionPeriod === 'yearly') {
      // All years
      const orderDates = orders.map(o => new Date(o.created_at).getTime());
      if (orderDates.length === 0) return [];
      startDate = startOfYear(new Date(Math.min(...orderDates)));
      periods = eachYearOfInterval({ start: startDate, end: endDate });
      dateFormatter = (d) => format(d, 'yyyy');
      periodStartFn = startOfYear;
      periodEndFn = endOfYear;
    } else {
      // All time - show monthly breakdown
      const orderDates = orders.map(o => new Date(o.created_at).getTime());
      if (orderDates.length === 0) return [];
      startDate = startOfMonth(new Date(Math.min(...orderDates)));
      periods = eachMonthOfInterval({ start: startDate, end: endDate });
      dateFormatter = (d) => format(d, 'MMM yyyy');
      periodStartFn = startOfMonth;
      periodEndFn = endOfMonth;
    }

    return periods.map((period) => {
      const periodStart = periodStartFn(period);
      const periodEnd = periodEndFn(period);
      const periodKey = dateFormatter(period);

      const periodOrders = orders.filter(o => {
        const orderDate = new Date(o.created_at);
        return orderDate >= periodStart && orderDate <= periodEnd;
      });

      const periodExpenses = expenses.filter(e => {
        const expenseDate = new Date(e.incurred_on);
        return expenseDate >= periodStart && expenseDate <= periodEnd;
      });

      const periodSalaries = salaryPayments.filter(s => {
        const salaryDate = new Date(s.date);
        return salaryDate >= periodStart && salaryDate <= periodEnd;
      });

      const periodRevenue = periodOrders.reduce((sum, o) => sum + (o.total || 0), 0);
      const rkrExpenses = periodExpenses.filter(e => 
        e.expense_for === 'RKR' || e.reimbursement_status === 'reimbursed'
      );
      const periodRegularExpenses = rkrExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
      const periodEmployeeSalaries = periodSalaries.reduce((sum, s) => sum + (s.amount || 0), 0);
      const periodTotalExpenses = periodRegularExpenses + periodEmployeeSalaries;
      const periodNetIncome = periodRevenue - periodTotalExpenses;
      const periodDistribution = periodNetIncome / 3;

      return {
        period: periodKey,
        revenue: periodRevenue,
        expenses: periodTotalExpenses,
        netIncome: periodNetIncome,
        distribution: periodDistribution,
      };
    }).filter(d => d.revenue > 0 || d.expenses > 0);
  }, [orders, expenses, salaryPayments, distributionPeriod]);

  const handleToggleOwner = (owner: string) => {
    // Prevent Racky from being selected
    if (owner === 'Racky') {
      return;
    }
    const newSelected = new Set(selectedOwners);
    if (newSelected.has(owner)) {
      newSelected.delete(owner);
    } else {
      newSelected.add(owner);
    }
    setSelectedOwners(newSelected);
  };

  const handleClaimDistribution = async (owner: string) => {
    if (!user?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not found' });
      return;
    }

    const ownerData = distributionData.distribution.find(d => d.name === owner);
    if (!ownerData || ownerData.share <= 0) {
      toast({ variant: 'destructive', title: 'Error', description: 'No distribution available for this owner' });
      return;
    }

    setOwnerToClaim(owner);
    setClaimDialogOpen(true);
  };

  const confirmClaimDistribution = async () => {
    if (!user?.id || !ownerToClaim) return;

    const ownerData = distributionData.distribution.find(d => d.name === ownerToClaim);
    if (!ownerData) return;

    setClaimingDistribution(true);

    const now = new Date();
    let periodStart: Date;
    let periodEnd: Date = now;
    let periodType: string;

    if (distributionPeriod === 'monthly') {
      periodStart = startOfMonth(now);
      periodEnd = endOfMonth(now);
      periodType = 'monthly';
    } else if (distributionPeriod === 'yearly') {
      periodStart = startOfYear(now);
      periodEnd = endOfYear(now);
      periodType = 'yearly';
    } else {
      periodStart = orders.length > 0 ? new Date(orders[0].created_at) : now;
      periodType = 'custom';
    }

    // Check if distribution already exists
    const existingDist = existingDistributions.find(
      d => d.owner_name === ownerToClaim && 
      d.period_type === periodType
    );

    if (existingDist) {
      // Update existing distribution
      const { error } = await supabase
        .from('income_distributions')
        .update({
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          claimed_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingDist.id);

      if (error) {
        toast({ variant: 'destructive', title: 'Claim failed', description: error.message });
        setClaimingDistribution(false);
        return;
      }
    } else {
      // Create new distribution record
      const { error } = await supabase
        .from('income_distributions')
        .insert({
          period_start: format(periodStart, 'yyyy-MM-dd'),
          period_end: format(periodEnd, 'yyyy-MM-dd'),
          period_type: periodType,
          net_income: distributionData.netIncome,
          total_revenue: distributionData.totalRevenue,
          total_expenses: distributionData.totalExpenses,
          owner_name: ownerToClaim,
          share_amount: ownerData.share,
          personal_expenses: ownerData.personalExpenses,
          net_share: ownerData.netShare,
          is_claimed: true,
          claimed_at: new Date().toISOString(),
          claimed_by: user.id,
        });

      if (error) {
        toast({ variant: 'destructive', title: 'Claim failed', description: error.message });
        setClaimingDistribution(false);
        return;
      }
    }

    toast({ 
      title: 'Distribution Claimed', 
      description: `${ownerToClaim}'s share of ₱${ownerData.netShare.toFixed(2)} has been claimed.` 
    });

    setClaimingDistribution(false);
    setClaimDialogOpen(false);
    setOwnerToClaim(null);
    await fetchDistributions();
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
    toast({ title: 'Data Refreshed', description: 'Distribution data has been updated.' });
  };

  // Calculate summary statistics
  const summaryStats = useMemo(() => {
    const totalClaimed = existingDistributions.filter(d => d.is_claimed).length;
    const totalUnclaimed = existingDistributions.filter(d => !d.is_claimed).length;
    const totalClaimedAmount = existingDistributions
      .filter(d => d.is_claimed)
      .reduce((sum, d) => sum + (d.net_share || 0), 0);
    const totalUnclaimedAmount = existingDistributions
      .filter(d => !d.is_claimed)
      .reduce((sum, d) => sum + (d.net_share || 0), 0);

    return {
      totalClaimed,
      totalUnclaimed,
      totalClaimedAmount,
      totalUnclaimedAmount,
    };
  }, [existingDistributions]);

  useEffect(() => {
    if (distributionPeriod) {
      fetchDistributions();
    }
  }, [distributionPeriod]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
        <Loader2 className="h-12 w-12 mb-2 animate-spin" />
        <p>Loading distribution data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 transition-all duration-300">
      {/* Header with Refresh Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Income Distribution Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track net income distribution among owners
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>
      {/* Owner Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Owners for Distribution
            </CardTitle>
            <CardDescription>Choose which owners should receive the distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {OWNERS.map((owner, index) => {
                const isSelected = selectedOwners.has(owner);
                const ownerData = distributionData.distribution.find(d => d.name === owner);
                const isDisabled = owner === 'Racky';
                return (
                  <div
                    key={owner}
                    className={cn(
                      "flex items-center justify-between p-3 border rounded-lg transition-colors",
                      isDisabled 
                        ? "bg-muted/30 opacity-50 cursor-not-allowed" 
                        : "hover:bg-muted/50 cursor-pointer"
                    )}
                    onClick={() => !isDisabled && handleToggleOwner(owner)}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className={cn("h-5 w-5", isDisabled ? "text-muted-foreground" : "text-primary")} />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div
                        className={cn("w-4 h-4 rounded-full", isDisabled && "opacity-50")}
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className={cn("font-semibold", isDisabled && "text-muted-foreground line-through")}>
                        {owner}
                      </span>
                      {isDisabled && (
                        <Badge variant="outline" className="ml-2 text-xs">
                          Unavailable
                        </Badge>
                      )}
                    </div>
                    {ownerData && ownerData.share > 0 && !isDisabled && (
                      <Badge variant={isSelected ? "default" : "outline"}>
                        {isSelected ? `₱${ownerData.share.toFixed(2)}` : 'Excluded'}
                      </Badge>
                    )}
                  </div>
                );
              })}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Distribution will be split equally among {selectedOwners.size} selected owner{selectedOwners.size !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-green-600 dark:text-green-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              ₱{distributionData.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {distributionData.period}
            </p>
          </CardContent>
        </Card>

        <Card className="border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <div className="h-10 w-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <TrendingDown className="h-5 w-5 text-red-600 dark:text-red-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              ₱{distributionData.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Business expenses only
            </p>
          </CardContent>
        </Card>

        <Card className={`${distributionData.netIncome >= 0 ? 'border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-white dark:from-green-950/20' : 'border-red-200 dark:border-red-800 bg-gradient-to-br from-red-50 to-white dark:from-red-950/20'} dark:to-background`}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Net Income</CardTitle>
            <div className={`h-10 w-10 rounded-full ${distributionData.netIncome >= 0 ? 'bg-green-100 dark:bg-green-900/30' : 'bg-red-100 dark:bg-red-900/30'} flex items-center justify-center`}>
              <TrendingUp className={`h-5 w-5 ${distributionData.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${distributionData.netIncome >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
              ₱{distributionData.netIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Revenue - Expenses
            </p>
          </CardContent>
        </Card>

        <Card className="border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-white dark:from-blue-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Bank Savings</CardTitle>
            <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-blue-600 dark:text-blue-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                ₱{bankSavings.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                Deducted from net income
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-white dark:from-purple-950/20 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Available for Distribution</CardTitle>
            <div className="h-10 w-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Share2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              ₱{distributionData.availableForDistribution.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1 mb-3">
              Net Income - Bank Savings
            </p>
            {distributionData.availableForDistribution > 0 && (
              <div className="flex flex-col gap-2 pt-2 border-t">
                {showCustomTransfer ? (
                  <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        max={distributionData.availableForDistribution}
                        value={customTransferAmount}
                        onChange={(e) => setCustomTransferAmount(e.target.value)}
                        className="h-9 text-sm flex-1"
                        placeholder={`Enter amount (max: ₱${distributionData.availableForDistribution.toFixed(2)})`}
                        disabled={savingBankSavings || distributionPeriod === 'all'}
                      />
                      <Button
                        size="sm"
                        variant="default"
                        onClick={async () => {
                          if (distributionPeriod === 'all') {
                            toast({
                              variant: 'destructive',
                              title: 'Select a period',
                              description: 'Please select Monthly or Yearly period to deposit funds to bank savings.',
                            });
                            return;
                          }
                          const amount = parseFloat(customTransferAmount);
                          if (!isNaN(amount) && amount > 0 && amount <= distributionData.availableForDistribution) {
                            await saveBankSavingsDeposit(amount);
                            setShowCustomTransfer(false);
                            setCustomTransferAmount('');
                          } else {
                            toast({
                              variant: 'destructive',
                              title: 'Invalid amount',
                              description: `Please enter a valid amount between ₱0.01 and ₱${distributionData.availableForDistribution.toFixed(2)}.`,
                            });
                          }
                        }}
                        className="h-9 text-sm"
                        disabled={savingBankSavings || distributionPeriod === 'all'}
                      >
                        {savingBankSavings ? (
                          <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Depositing...
                          </>
                        ) : (
                          'Deposit'
                        )}
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
                          setShowCustomTransfer(false);
                          setCustomTransferAmount('');
                        }}
                        className="h-9 w-9 p-0"
                        disabled={savingBankSavings}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Available: ₱{distributionData.availableForDistribution.toFixed(2)}
                    </p>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="default"
                    onClick={() => {
                      if (distributionPeriod === 'all') {
                        toast({
                          variant: 'destructive',
                          title: 'Select a period',
                          description: 'Please select Monthly or Yearly period to deposit funds to bank savings.',
                        });
                      } else {
                        setShowCustomTransfer(true);
                      }
                    }}
                    className="h-9 text-sm"
                    disabled={savingBankSavings}
                  >
                    Deposit
                  </Button>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-white dark:from-primary/10 dark:to-background">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Per Owner Share</CardTitle>
            <div className="h-10 w-10 rounded-full bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ₱{selectedOwners.size > 0 ? (distributionData.availableForDistribution / selectedOwners.size).toFixed(2) : '0.00'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {selectedOwners.size > 0 ? `${(100 / selectedOwners.size).toFixed(2)}% each` : 'No owners selected'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Claim Status Summary */}
      {existingDistributions.length > 0 && (
        <Card className="border-blue-200 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="h-5 w-5 text-blue-600" />
              Distribution Status Summary
            </CardTitle>
            <CardDescription>Overview of claimed and unclaimed distributions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="p-4 bg-green-50 dark:bg-green-950/20 rounded-lg border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-900 dark:text-green-100">Claimed</span>
                </div>
                <div className="text-2xl font-bold text-green-600">{summaryStats.totalClaimed}</div>
                <div className="text-xs text-green-700 dark:text-green-300 mt-1">
                  ₱{summaryStats.totalClaimedAmount.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-orange-50 dark:bg-orange-950/20 rounded-lg border border-orange-200 dark:border-orange-800">
                <div className="flex items-center gap-2 mb-2">
                  <AlertCircle className="h-4 w-4 text-orange-600" />
                  <span className="text-sm font-medium text-orange-900 dark:text-orange-100">Unclaimed</span>
                </div>
                <div className="text-2xl font-bold text-orange-600">{summaryStats.totalUnclaimed}</div>
                <div className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                  ₱{summaryStats.totalUnclaimedAmount.toFixed(2)}
                </div>
              </div>
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900 dark:text-blue-100">Total Records</span>
                </div>
                <div className="text-2xl font-bold text-blue-600">{existingDistributions.length}</div>
                <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                  All periods
                </div>
              </div>
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="flex items-center gap-2 mb-2">
                  <DollarSign className="h-4 w-4 text-purple-600" />
                  <span className="text-sm font-medium text-purple-900 dark:text-purple-100">Total Distributed</span>
                </div>
                <div className="text-2xl font-bold text-purple-600">
                  ₱{(summaryStats.totalClaimedAmount + summaryStats.totalUnclaimedAmount).toFixed(2)}
                </div>
                <div className="text-xs text-purple-700 dark:text-purple-300 mt-1">
                  Combined amount
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Share</CardTitle>
            <CardDescription>Equal distribution among selected owners</CardDescription>
          </CardHeader>
          <CardContent>
            {distributionData.distribution.filter(d => d.isSelected && d.share > 0).length > 0 ? (
              <div className="space-y-4">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={distributionData.distribution.filter(d => d.isSelected && d.share > 0)}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage, value }) => `${name}\n${percentage.toFixed(1)}%\n₱${value.toFixed(2)}`}
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="share"
                      animationBegin={0}
                      animationDuration={800}
                    >
                      {distributionData.distribution.filter(d => d.isSelected && d.share > 0).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={entry.color} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: number, name: string, props: any) => [
                        `₱${value.toFixed(2)}`,
                        `${props.payload.name} (${props.payload.percentage.toFixed(2)}%)`
                      ]}
                      contentStyle={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        border: '1px solid #e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                    <Legend 
                      formatter={(value, entry: any) => (
                        <span style={{ color: entry.color }}>
                          {value} - ₱{entry.payload.share.toFixed(2)}
                        </span>
                      )}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  {distributionData.distribution.filter(d => d.isSelected && d.share > 0).map((owner) => (
                    <div key={owner.name} className="flex items-center gap-2 text-sm">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: owner.color }}
                      />
                      <span className="font-medium">{owner.name}:</span>
                      <span className="text-muted-foreground">₱{owner.share.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-[300px] text-muted-foreground">
                <AlertCircle className="h-12 w-12 mb-2 opacity-50" />
                <p>No owners selected for distribution</p>
                <p className="text-xs mt-1">Select owners above to see distribution breakdown</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Owner Distribution Details</CardTitle>
            <CardDescription>Breakdown per owner with personal expenses and claim status</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {distributionData.distribution.map((owner, index) => (
                <div
                  key={owner.name}
                  className={`border rounded-lg p-5 space-y-3 transition-all ${
                    !owner.isSelected ? 'opacity-50 bg-muted/30' : owner.isClaimed ? 'bg-green-50/50 dark:bg-green-950/10 border-green-200 dark:border-green-800' : 'bg-card hover:shadow-md'
                  }`}
                  style={{ borderLeftColor: owner.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-5 h-5 rounded-full shadow-sm"
                        style={{ backgroundColor: owner.color }}
                      />
                      <span className="font-semibold text-lg">{owner.name}</span>
                      {!owner.isSelected && (
                        <Badge variant="outline" className="ml-2">Excluded</Badge>
                      )}
                      {owner.isClaimed && (
                        <Badge variant="default" className="ml-2 bg-green-600 hover:bg-green-700">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Claimed
                        </Badge>
                      )}
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-semibold text-muted-foreground">
                        {owner.isSelected ? `${owner.percentage.toFixed(2)}%` : '0%'}
                      </span>
                      <div className="text-xs text-muted-foreground">Share</div>
                    </div>
                  </div>
                  {owner.isSelected && (
                    <>
                      <div className="space-y-2 text-sm bg-muted/50 dark:bg-muted/20 p-3 rounded-lg">
                        <div className="flex justify-between items-center">
                          <span className="text-muted-foreground">Gross Share:</span>
                          <span className="font-semibold text-base">₱{owner.share.toFixed(2)}</span>
                        </div>
                        {owner.personalExpenses > 0 && (
                          <div className="flex justify-between items-center text-orange-600 dark:text-orange-400">
                            <span>Personal Expenses:</span>
                            <span className="font-semibold">-₱{owner.personalExpenses.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between items-center pt-2 border-t border-border font-bold text-base">
                          <span>Net Share:</span>
                          <span className={owner.netShare >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}>
                            ₱{owner.netShare.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {!owner.isClaimed && owner.netShare > 0 && (
                        <div className="pt-2">
                          <Button
                            size="sm"
                            onClick={() => handleClaimDistribution(owner.name)}
                            className="w-full bg-primary hover:bg-primary/90"
                            variant="default"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Claim Distribution
                          </Button>
                        </div>
                      )}
                      {owner.isClaimed && owner.claimedAt && (
                        <div className="pt-2 border-t flex items-center gap-2 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          <span>Claimed on {format(new Date(owner.claimedAt), 'PPP p')}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Time Series Chart */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Distribution Over Time</CardTitle>
              <CardDescription>
                Net income distribution by {distributionPeriod === 'monthly' ? 'month' : distributionPeriod === 'yearly' ? 'year' : 'month'}
              </CardDescription>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowHistory(!showHistory)}
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              {showHistory ? 'Hide' : 'Show'} History
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                <XAxis 
                  dataKey="period" 
                  tick={{ fontSize: 12 }}
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis 
                  tick={{ fontSize: 12 }}
                  tickFormatter={(value) => `₱${(value / 1000).toFixed(0)}k`}
                />
                <Tooltip 
                  formatter={(value: number) => `₱${value.toFixed(2)}`}
                  contentStyle={{ 
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: '1px solid #e5e7eb',
                    borderRadius: '8px'
                  }}
                />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netIncome" fill="#3b82f6" name="Net Income" radius={[4, 4, 0, 0]} />
                <Bar dataKey="distribution" fill="#8b5cf6" name="Per Owner Share" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bank Savings History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Bank Savings History
          </CardTitle>
          <CardDescription>View all bank savings deposits by period</CardDescription>
        </CardHeader>
        <CardContent>
          {bankSavingsHistory.length > 0 ? (
            <div className="space-y-2">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Period</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                    <TableHead className="text-right">Date</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bankSavingsHistory.map((record, index) => {
                    const startDate = new Date(record.period_start);
                    const endDate = new Date(record.period_end);
                    const periodLabel = record.period_type === 'monthly'
                      ? format(startDate, 'MMMM yyyy')
                      : record.period_type === 'yearly'
                      ? format(startDate, 'yyyy')
                      : `${format(startDate, 'MMM dd')} - ${format(endDate, 'MMM dd, yyyy')}`;
                    
                    return (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{periodLabel}</TableCell>
                        <TableCell>
                          <Badge variant="outline">
                            {record.period_type === 'monthly' ? 'Monthly' : record.period_type === 'yearly' ? 'Yearly' : 'Custom'}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right font-semibold text-blue-600">
                          ₱{record.amount.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right text-muted-foreground text-sm">
                          {format(new Date(record.created_at), 'MMM dd, yyyy')}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
                <TableFooter>
                  <TableRow>
                    <TableCell colSpan={2} className="font-bold">Total Bank Savings</TableCell>
                    <TableCell className="text-right font-bold text-blue-600">
                      ₱{bankSavingsHistory.reduce((sum, r) => sum + r.amount, 0).toFixed(2)}
                    </TableCell>
                    <TableCell></TableCell>
                  </TableRow>
                </TableFooter>
              </Table>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
              <DollarSign className="h-12 w-12 mb-2 opacity-50" />
              <p className="text-sm">No bank savings records yet</p>
              <p className="text-xs mt-1">Deposits will appear here</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Distribution History Table */}
      {showHistory && existingDistributions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Distribution History
            </CardTitle>
            <CardDescription>Complete history of all distribution records</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-3 text-sm font-semibold">Period</th>
                    <th className="text-left p-3 text-sm font-semibold">Owner</th>
                    <th className="text-right p-3 text-sm font-semibold">Gross Share</th>
                    <th className="text-right p-3 text-sm font-semibold">Personal Expenses</th>
                    <th className="text-right p-3 text-sm font-semibold">Net Share</th>
                    <th className="text-center p-3 text-sm font-semibold">Status</th>
                    <th className="text-left p-3 text-sm font-semibold">Claimed Date</th>
                  </tr>
                </thead>
                <tbody>
                  {existingDistributions
                    .sort((a, b) => new Date(b.period_start).getTime() - new Date(a.period_start).getTime())
                    .map((dist) => (
                      <tr key={dist.id} className="border-b hover:bg-muted/50 transition-colors">
                        <td className="p-3 text-sm">
                          <div className="flex flex-col">
                            <span className="font-medium">
                              {format(new Date(dist.period_start), 'MMM d, yyyy')} - {format(new Date(dist.period_end), 'MMM d, yyyy')}
                            </span>
                            <span className="text-xs text-muted-foreground capitalize">{dist.period_type}</span>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-3 h-3 rounded-full"
                              style={{ backgroundColor: COLORS[OWNERS.indexOf(dist.owner_name as typeof OWNERS[number])] || '#888' }}
                            />
                            <span className="font-medium">{dist.owner_name}</span>
                          </div>
                        </td>
                        <td className="p-3 text-right text-sm font-medium">
                          ₱{dist.share_amount.toFixed(2)}
                        </td>
                        <td className="p-3 text-right text-sm text-orange-600">
                          {dist.personal_expenses > 0 ? `-₱${dist.personal_expenses.toFixed(2)}` : '₱0.00'}
                        </td>
                        <td className="p-3 text-right text-sm font-semibold">
                          <span className={dist.net_share >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ₱{dist.net_share.toFixed(2)}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          {dist.is_claimed ? (
                            <Badge variant="default" className="bg-green-600">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Claimed
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="border-orange-300 text-orange-700">
                              Pending
                            </Badge>
                          )}
                        </td>
                        <td className="p-3 text-sm text-muted-foreground">
                          {dist.claimed_at ? format(new Date(dist.claimed_at), 'MMM d, yyyy') : '—'}
                        </td>
                      </tr>
                    ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Claim Distribution Dialog */}
      <Dialog open={claimDialogOpen} onOpenChange={setClaimDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Claim Distribution</DialogTitle>
            <DialogDescription>
              Confirm claiming the distribution for {ownerToClaim}
            </DialogDescription>
          </DialogHeader>
          {ownerToClaim && (() => {
            const ownerData = distributionData.distribution.find(d => d.name === ownerToClaim);
            if (!ownerData) return null;
            return (
              <div className="space-y-4 py-4">
                <div className="bg-muted p-4 rounded-lg space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm font-medium">Gross Share:</span>
                    <span className="font-semibold">₱{ownerData.share.toFixed(2)}</span>
                  </div>
                  {ownerData.personalExpenses > 0 && (
                    <div className="flex justify-between text-orange-600">
                      <span className="text-sm">Personal Expenses:</span>
                      <span className="font-semibold">-₱{ownerData.personalExpenses.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t font-semibold text-lg">
                    <span>Net Share to Claim:</span>
                    <span className="text-green-600">₱{ownerData.netShare.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">
                  This will mark the distribution as claimed for {ownerToClaim} for the period: {distributionData.period}
                </p>
              </div>
            );
          })()}
          <DialogFooter>
            <Button variant="outline" onClick={() => setClaimDialogOpen(false)} disabled={claimingDistribution}>
              Cancel
            </Button>
            <Button onClick={confirmClaimDistribution} disabled={claimingDistribution}>
              {claimingDistribution ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Claiming...
                </>
              ) : (
                <>
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Confirm Claim
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

