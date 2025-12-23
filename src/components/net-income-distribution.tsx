'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Loader2, TrendingUp, Users, PieChart as PieChartIcon, DollarSign, Share2, CheckCircle2, CheckSquare, Square } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { fetchExpenses } from '@/lib/api/expenses';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval, startOfDay, endOfDay, startOfWeek, endOfWeek, startOfYear, endOfYear, eachDayOfInterval, eachWeekOfInterval, eachYearOfInterval, subDays, subWeeks, subYears } from 'date-fns';
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
  const [distributionPeriod, setDistributionPeriod] = useState<'monthly' | 'yearly' | 'all'>('all');
  const [selectedOwners, setSelectedOwners] = useState<Set<string>>(new Set(OWNERS));
  const [existingDistributions, setExistingDistributions] = useState<DistributionRecord[]>([]);
  const [claimingDistribution, setClaimingDistribution] = useState(false);
  const [claimDialogOpen, setClaimDialogOpen] = useState(false);
  const [ownerToClaim, setOwnerToClaim] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

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
    
    // Available for distribution = Net Income (which already excludes personal expenses)
    // Personal expenses are pending reimbursement, so they're not part of RKR expenses
    const availableForDistribution = netIncome;

    // Equal distribution among selected owners
    const selectedCount = selectedOwners.size || 1;
    const distributionPercentage = selectedCount > 0 ? 100 / selectedCount : 0;
    const distributionAmount = selectedCount > 0 ? availableForDistribution / selectedCount : 0;

    const distribution = OWNERS.map((owner, index) => {
      const isSelected = selectedOwners.has(owner);
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
  }, [orders, expenses, salaryPayments, distributionPeriod, selectedOwners, existingDistributions]);

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
      {/* Period Selector & Owner Selection */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChartIcon className="h-5 w-5" />
              Distribution Period
            </CardTitle>
            <CardDescription>Select the time period for net income distribution</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {(['monthly', 'yearly', 'all'] as const).map((period) => (
                <button
                  key={period}
                  onClick={() => setDistributionPeriod(period)}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                    distributionPeriod === period
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted hover:bg-muted/80'
                  }`}
                >
                  {period === 'monthly' ? 'This Month' : period === 'yearly' ? 'This Year' : 'All Time'}
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

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
                return (
                  <div
                    key={owner}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer"
                    onClick={() => handleToggleOwner(owner)}
                  >
                    <div className="flex items-center gap-3">
                      {isSelected ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-muted-foreground" />
                      )}
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: COLORS[index] }}
                      />
                      <span className="font-semibold">{owner}</span>
                    </div>
                    {ownerData && ownerData.share > 0 && (
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
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              ₱{distributionData.totalRevenue.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {distributionData.period}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              ₱{distributionData.totalExpenses.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Business expenses only
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${distributionData.netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₱{distributionData.netIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Available for distribution
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Per Owner Share</CardTitle>
            <Share2 className="h-4 w-4 text-muted-foreground" />
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

      {/* Distribution Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Distribution Share</CardTitle>
            <CardDescription>Equal distribution among owners</CardDescription>
          </CardHeader>
          <CardContent>
            {distributionData.distribution.filter(d => d.isSelected && d.share > 0).length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={distributionData.distribution.filter(d => d.isSelected && d.share > 0)}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percentage }) => `${name} ${percentage.toFixed(1)}%`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="share"
                  >
                    {distributionData.distribution.filter(d => d.isSelected && d.share > 0).map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₱${value.toFixed(2)}`} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No owners selected for distribution
              </div>
            )}
          </CardContent>
        </Card>

        {/* Owner Details Table */}
        <Card>
          <CardHeader>
            <CardTitle>Owner Distribution Details</CardTitle>
            <CardDescription>Breakdown per owner with personal expenses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {distributionData.distribution.map((owner, index) => (
                <div
                  key={owner.name}
                  className={`border rounded-lg p-4 space-y-2 ${
                    !owner.isSelected ? 'opacity-50' : ''
                  }`}
                  style={{ borderLeftColor: owner.color, borderLeftWidth: '4px' }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: owner.color }}
                      />
                      <span className="font-semibold text-lg">{owner.name}</span>
                      {!owner.isSelected && (
                        <Badge variant="outline" className="ml-2">Excluded</Badge>
                      )}
                      {owner.isClaimed && (
                        <Badge variant="default" className="ml-2 bg-green-600">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Claimed
                        </Badge>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {owner.isSelected ? `${owner.percentage.toFixed(2)}%` : '0%'}
                    </span>
                  </div>
                  {owner.isSelected && (
                    <>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Gross Share:</span>
                          <span className="font-medium">₱{owner.share.toFixed(2)}</span>
                        </div>
                        {owner.personalExpenses > 0 && (
                          <div className="flex justify-between text-orange-600">
                            <span>Personal Expenses:</span>
                            <span className="font-medium">-₱{owner.personalExpenses.toFixed(2)}</span>
                          </div>
                        )}
                        <div className="flex justify-between pt-2 border-t font-semibold">
                          <span>Net Share:</span>
                          <span className={owner.netShare >= 0 ? 'text-green-600' : 'text-red-600'}>
                            ₱{owner.netShare.toFixed(2)}
                          </span>
                        </div>
                      </div>
                      {!owner.isClaimed && owner.netShare > 0 && (
                        <div className="pt-2 border-t">
                          <Button
                            size="sm"
                            onClick={() => handleClaimDistribution(owner.name)}
                            className="w-full"
                            variant="outline"
                          >
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Claim Distribution
                          </Button>
                        </div>
                      )}
                      {owner.isClaimed && owner.claimedAt && (
                        <div className="pt-2 border-t text-xs text-muted-foreground">
                          Claimed on {format(new Date(owner.claimedAt), 'PPP')}
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
          <CardTitle>Distribution Over Time</CardTitle>
          <CardDescription>
            Net income distribution by {distributionPeriod === 'monthly' ? 'month' : distributionPeriod === 'yearly' ? 'year' : 'month'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {timeSeriesData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={timeSeriesData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="period" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₱${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                <Bar dataKey="netIncome" fill="#3b82f6" name="Net Income" />
                <Bar dataKey="distribution" fill="#8b5cf6" name="Per Owner Share" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>

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

