'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Loader2, RefreshCw, DollarSign, FileText, CheckCircle2, Calendar, AlertCircle, Info, Users, TrendingUp, TrendingDown, Share2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
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
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import { OWNERS, COLORS } from './net-income-distribution/types';
import { supabase } from '@/lib/supabase-client';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { format, startOfMonth, endOfMonth, startOfYear, endOfYear, parse, isSameMonth, isSameYear } from 'date-fns';
import {
  type OrderData,
  type ExpenseData,
  type SalaryPaymentData,
  type DistributionRecord,
  type DistributionPeriod,
} from './net-income-distribution/types';
import { fetchAllData, fetchDistributions, fetchBankSavings, fetchBankSavingsHistory } from './net-income-distribution/fetch-data';
import { calculateDistributionData } from './net-income-distribution/calculate-distribution';
import { calculateTimeSeriesData } from './net-income-distribution/calculate-time-series';
import { saveBankSavingsDeposit } from './net-income-distribution/save-bank-savings';
import { OwnerSelection } from './net-income-distribution/owner-selection';
import { SummaryCards } from './net-income-distribution/summary-cards';

export function NetIncomeDistribution() {
  const { user } = useAuthSession();
  const { toast } = useToast();
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [salaryPayments, setSalaryPayments] = useState<SalaryPaymentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [distributionPeriod] = useState<'monthly' | 'yearly' | 'all'>('all'); // Always 'all' for distributions
  const [bankSavingsHistoryFilter, setBankSavingsHistoryFilter] = useState<'monthly' | 'yearly' | 'all'>('all');
  const [bankSavingsHistory, setBankSavingsHistory] = useState<Array<{
    id: string;
    period_start: string;
    period_end: string;
    period_type: string;
    amount: number;
    notes: string | null;
    created_at: string;
  }>>([]);
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
    loadBankSavings();
    loadBankSavingsHistory();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const { orders: fetchedOrders, expenses: fetchedExpenses, salaryPayments: fetchedSalaries } = await fetchAllData();
      setOrders(fetchedOrders);
      setExpenses(fetchedExpenses);
      setSalaryPayments(fetchedSalaries);
      
      // Fetch existing distributions
      const distributions = await fetchDistributions(distributionPeriod);
      setExistingDistributions(distributions);
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  const loadDistributions = async () => {
    const distributions = await fetchDistributions(distributionPeriod);
    setExistingDistributions(distributions);
  };

  const loadBankSavings = async () => {
    const total = await fetchBankSavings(distributionPeriod);
    setBankSavings(total);
  };

  const loadBankSavingsHistory = async () => {
    const history = await fetchBankSavingsHistory();
    setBankSavingsHistory(history);
  };

  const handleSaveBankSavingsDeposit = async (depositAmount: number) => {
    setSavingBankSavings(true);
    try {
      // Always use 'all' for deposits (which uses 'custom' period type)
      const result = await saveBankSavingsDeposit(
        depositAmount,
        'all',
        user,
        toast
      );
      
      if (result.success) {
        // Reload bank savings for the current period to ensure it's in sync
        await loadBankSavings();
        // Refresh history to show the new deposit
        await loadBankSavingsHistory();
      }
    } finally {
      setSavingBankSavings(false);
    }
  };

  // Calculate total bank savings from history for the current period
  const totalBankSavingsForPeriod = useMemo(() => {
    if (distributionPeriod === 'all') {
      // For "all time", sum all bank savings from history
      return bankSavingsHistory.reduce((sum, record) => {
        const amount = typeof record.amount === 'number' ? record.amount : parseFloat(record.amount || '0');
        return sum + amount;
      }, 0);
    } else {
      // For monthly/yearly, use the filtered bank savings
      return bankSavings;
    }
  }, [bankSavings, bankSavingsHistory, distributionPeriod]);

  // Calculate net income distribution
  const distributionData = useMemo(() => {
    return calculateDistributionData(
      orders,
      expenses,
      salaryPayments,
      distributionPeriod,
      selectedOwners,
      existingDistributions,
      totalBankSavingsForPeriod
    );
  }, [orders, expenses, salaryPayments, distributionPeriod, selectedOwners, existingDistributions, totalBankSavingsForPeriod]);

  // Group bank savings history by period for summary (no filtering, just grouping)
  const groupedBankSavingsHistory = useMemo(() => {
    if (bankSavingsHistoryFilter === 'all') {
      return null; // No grouping for 'all'
    }

    // Group ALL records by month or year (don't filter by period_type)
    const groups: Record<string, typeof bankSavingsHistory> = {};

    bankSavingsHistory.forEach(record => {
      const startDate = new Date(record.period_start);
      let groupKey: string;

      if (bankSavingsHistoryFilter === 'monthly') {
        // Group all records by their month (year-month)
        groupKey = format(startDate, 'yyyy-MM');
      } else if (bankSavingsHistoryFilter === 'yearly') {
        // Group all records by their year
        groupKey = format(startDate, 'yyyy');
      } else {
        return;
      }

      if (!groups[groupKey]) {
        groups[groupKey] = [];
      }
      groups[groupKey].push(record);
    });

    // Sort groups by key (most recent first)
    const sortedGroupKeys = Object.keys(groups).sort().reverse();

    return sortedGroupKeys.map(key => {
      const records = groups[key];
      const total = records.reduce((sum, r) => {
        const amount = typeof r.amount === 'number' ? r.amount : parseFloat(String(r.amount || '0'));
        return sum + amount;
      }, 0);

      return {
        key,
        label: bankSavingsHistoryFilter === 'monthly'
          ? format(new Date(records[0].period_start), 'MMMM yyyy')
          : format(new Date(records[0].period_start), 'yyyy'),
        records,
        total,
      };
    });
  }, [bankSavingsHistory, bankSavingsHistoryFilter]);

  // For grouped view, use all records (filtering is handled in grouping)
  const filteredBankSavingsHistory = useMemo(() => {
    return bankSavingsHistory;
  }, [bankSavingsHistory]);

  // Prepare chart data for distribution over time
  const timeSeriesData = useMemo(() => {
    return calculateTimeSeriesData(orders, expenses, salaryPayments, distributionPeriod);
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
    await loadDistributions();
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
      loadDistributions();
      loadBankSavings();
      loadBankSavingsHistory();
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
      {/* Header with Refresh Button and Period Selector */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Income Distribution Overview</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Manage and track net income distribution among owners
          </p>
        </div>
        <div className="flex items-center gap-2">
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
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-1 gap-4">
        <OwnerSelection
          selectedOwners={selectedOwners}
          distribution={distributionData.distribution}
          onToggleOwner={handleToggleOwner}
        />
      </div>

      <SummaryCards
        distributionData={distributionData}
        bankSavings={totalBankSavingsForPeriod}
        showCustomTransfer={showCustomTransfer}
        customTransferAmount={customTransferAmount}
        savingBankSavings={savingBankSavings}
        distributionPeriod={distributionPeriod}
        selectedOwnersCount={selectedOwners.size}
        onCustomTransferAmountChange={setCustomTransferAmount}
        onShowCustomTransfer={() => {
          setShowCustomTransfer(true);
        }}
        onHideCustomTransfer={() => {
          setShowCustomTransfer(false);
          setCustomTransferAmount('');
        }}
        onDepositBankSavings={handleSaveBankSavingsDeposit}
      />

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
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Bank Savings History
              </CardTitle>
              <CardDescription>View all bank savings deposits by period</CardDescription>
            </div>
            <div className="flex items-center gap-2 border rounded-md p-1 bg-muted/50">
              <Button
                variant={bankSavingsHistoryFilter === 'monthly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBankSavingsHistoryFilter('monthly')}
                className="h-8 text-xs"
              >
                Monthly
              </Button>
              <Button
                variant={bankSavingsHistoryFilter === 'yearly' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBankSavingsHistoryFilter('yearly')}
                className="h-8 text-xs"
              >
                Yearly
              </Button>
              <Button
                variant={bankSavingsHistoryFilter === 'all' ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setBankSavingsHistoryFilter('all')}
                className="h-8 text-xs"
              >
                All Time
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredBankSavingsHistory.length > 0 ? (
            <div className="space-y-4">
              {groupedBankSavingsHistory ? (
                // Grouped view (monthly or yearly)
                <>
                  {groupedBankSavingsHistory.map((group) => (
                    <div key={group.key} className="space-y-2">
                      <div className="flex items-center justify-between px-2 py-1 bg-muted/50 rounded-md">
                        <span className="font-semibold text-sm">{group.label}</span>
                        <span className="text-sm font-medium text-blue-600">
                          Total: ₱{group.total.toFixed(2)}
                        </span>
                      </div>
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
                          {group.records.map((record) => {
                            const startDate = new Date(record.period_start);
                            const endDate = new Date(record.period_end);
                            const periodLabel = record.period_type === 'monthly'
                              ? format(startDate, 'MMMM yyyy')
                              : record.period_type === 'yearly'
                              ? format(startDate, 'yyyy')
                              : format(startDate, 'MMMM yyyy');
                            
                            return (
                              <TableRow key={record.id}>
                                <TableCell className="font-medium">{periodLabel}</TableCell>
                                <TableCell>
                                  <Badge variant="outline">
                                    {record.period_type === 'monthly' ? 'Monthly' : record.period_type === 'yearly' ? 'Yearly' : 'Custom'}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-right font-semibold text-blue-600">
                                  ₱{typeof record.amount === 'number' ? record.amount.toFixed(2) : parseFloat(String(record.amount || '0')).toFixed(2)}
                                </TableCell>
                                <TableCell className="text-right text-muted-foreground text-sm">
                                  {format(new Date(record.created_at), 'MMM dd, yyyy')}
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  ))}
                  {/* Grand Total for grouped view */}
                  <div className="mt-4 pt-4 border-t">
                    <Table>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={2} className="font-bold">
                            Total {bankSavingsHistoryFilter === 'monthly' ? 'Monthly' : 'Yearly'} Savings
                          </TableCell>
                          <TableCell className="text-right font-bold text-blue-600">
                            ₱{groupedBankSavingsHistory.reduce((sum, group) => sum + group.total, 0).toFixed(2)}
                          </TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </div>
                </>
              ) : (
                // All time view (no grouping)
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
                    {filteredBankSavingsHistory.map((record) => {
                      const startDate = new Date(record.period_start);
                      const endDate = new Date(record.period_end);
                      const periodLabel = record.period_type === 'monthly'
                        ? format(startDate, 'MMMM yyyy')
                        : record.period_type === 'yearly'
                        ? format(startDate, 'yyyy')
                        : format(startDate, 'MMMM yyyy');
                      
                      return (
                        <TableRow key={record.id}>
                          <TableCell className="font-medium">{periodLabel}</TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              {record.period_type === 'monthly' ? 'Monthly' : record.period_type === 'yearly' ? 'Yearly' : 'Custom'}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-semibold text-blue-600">
                            ₱{typeof record.amount === 'number' ? record.amount.toFixed(2) : parseFloat(String(record.amount || '0')).toFixed(2)}
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
                        ₱{filteredBankSavingsHistory.reduce((sum, r) => {
                          const amount = typeof r.amount === 'number' ? r.amount : parseFloat(String(r.amount || '0'));
                          return sum + amount;
                        }, 0).toFixed(2)}
                      </TableCell>
                      <TableCell></TableCell>
                    </TableRow>
                  </TableFooter>
                </Table>
              )}
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

