'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { supabase } from '@/lib/supabase-client';
import { fetchExpenses } from '@/lib/api/expenses';
import { format, startOfMonth, endOfMonth, subMonths, eachMonthOfInterval } from 'date-fns';
import {
  LineChart,
  Line,
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

type OrderData = {
  id: string;
  total: number;
  is_paid: boolean;
  created_at: string;
};

type ExpenseData = {
  id: string;
  amount: number;
  category: string | null;
  incurred_on: string;
  created_at: string;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

export function FinanceDashboard() {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [expenses, setExpenses] = useState<ExpenseData[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<'all' | 'month' | '3months' | '6months' | 'year'>('all');

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch paid orders (revenue)
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select('id, total, is_paid, created_at')
        .eq('is_paid', true);

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
          category: e.category,
          incurred_on: e.incurred_on || e.created_at,
          created_at: e.created_at,
        })));
      }
    } catch (error) {
      console.error('Error fetching data', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter data based on date range
  const filteredData = useMemo(() => {
    const now = new Date();
    let startDate: Date | null = null;

    switch (dateRange) {
      case 'month':
        startDate = startOfMonth(now);
        break;
      case '3months':
        startDate = startOfMonth(subMonths(now, 2));
        break;
      case '6months':
        startDate = startOfMonth(subMonths(now, 5));
        break;
      case 'year':
        startDate = startOfMonth(subMonths(now, 11));
        break;
      default:
        startDate = null;
    }

    const filteredOrders = startDate
      ? orders.filter((o) => new Date(o.created_at) >= startDate!)
      : orders;

    const filteredExpenses = startDate
      ? expenses.filter((e) => new Date(e.incurred_on) >= startDate!)
      : expenses;

    return { orders: filteredOrders, expenses: filteredExpenses };
  }, [orders, expenses, dateRange]);

  // Calculate totals
  const totalRevenue = filteredData.orders.reduce((sum, o) => sum + (o.total || 0), 0);
  const totalExpenses = filteredData.expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const netIncome = totalRevenue - totalExpenses;

  // Prepare monthly data for charts
  const monthlyData = useMemo(() => {
    if (filteredData.orders.length === 0 && filteredData.expenses.length === 0) {
      return [];
    }

    let startDate: Date;
    if (dateRange === 'all') {
      const orderDates = filteredData.orders.map(o => new Date(o.created_at).getTime());
      const expenseDates = filteredData.expenses.map(e => new Date(e.incurred_on).getTime());
      const allDates = [...orderDates, ...expenseDates];
      if (allDates.length === 0) return [];
      startDate = startOfMonth(new Date(Math.min(...allDates)));
    } else {
      const monthsBack = dateRange === 'month' ? 0 : dateRange === '3months' ? 2 : dateRange === '6months' ? 5 : 11;
      startDate = startOfMonth(subMonths(new Date(), monthsBack));
    }

    const months = eachMonthOfInterval({
      start: startDate,
      end: new Date(),
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      const monthKey = format(month, 'MMM yyyy');

      const monthOrders = filteredData.orders.filter(
        (o) => {
          const orderDate = new Date(o.created_at);
          return orderDate >= monthStart && orderDate <= monthEnd;
        }
      );
      const monthExpenses = filteredData.expenses.filter(
        (e) => {
          const expenseDate = new Date(e.incurred_on);
          return expenseDate >= monthStart && expenseDate <= monthEnd;
        }
      );

      return {
        month: monthKey,
        revenue: monthOrders.reduce((sum, o) => sum + (o.total || 0), 0),
        expenses: monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
        net: monthOrders.reduce((sum, o) => sum + (o.total || 0), 0) - monthExpenses.reduce((sum, e) => sum + (e.amount || 0), 0),
      };
    }).filter(d => d.revenue > 0 || d.expenses > 0);
  }, [filteredData, dateRange]);

  // Prepare expense category data
  const expenseCategoryData = useMemo(() => {
    const categoryMap = new Map<string, number>();
    filteredData.expenses.forEach((e) => {
      const category = e.category || 'Uncategorized';
      categoryMap.set(category, (categoryMap.get(category) || 0) + (e.amount || 0));
    });

    return Array.from(categoryMap.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [filteredData.expenses]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
        <Loader2 className="h-12 w-12 mb-2 animate-spin" />
        <p>Loading financial data...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Date Range Filter */}
      <Card>
        <CardHeader>
          <CardTitle>Date Range</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {(['all', 'month', '3months', '6months', 'year'] as const).map((range) => (
              <button
                key={range}
                onClick={() => setDateRange(range)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  dateRange === range
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                {range === 'all' ? 'All Time' : range === 'month' ? 'This Month' : range === '3months' ? 'Last 3 Months' : range === '6months' ? 'Last 6 Months' : 'Last Year'}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₱{totalRevenue.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              From {filteredData.orders.length} paid order{filteredData.orders.length !== 1 ? 's' : ''}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₱{totalExpenses.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {filteredData.expenses.length} expense{filteredData.expenses.length !== 1 ? 's' : ''} recorded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Net Income</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${netIncome >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₱{netIncome.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {netIncome >= 0 ? 'Profit' : 'Loss'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue vs Expenses Line Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue vs Expenses</CardTitle>
            <CardDescription>Monthly comparison over time</CardDescription>
          </CardHeader>
          <CardContent>
            {monthlyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={monthlyData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip formatter={(value: number) => `₱${value.toFixed(2)}`} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#22c55e" strokeWidth={2} name="Revenue" />
                  <Line type="monotone" dataKey="expenses" stroke="#ef4444" strokeWidth={2} name="Expenses" />
                  <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} name="Net Income" />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No data available for the selected period
              </div>
            )}
          </CardContent>
        </Card>

        {/* Expense Categories Pie Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Expense Categories</CardTitle>
            <CardDescription>Breakdown by category</CardDescription>
          </CardHeader>
          <CardContent>
            {expenseCategoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={expenseCategoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {expenseCategoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `₱${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                No expense data available
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly Bar Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Monthly Financial Overview</CardTitle>
          <CardDescription>Revenue and expenses by month</CardDescription>
        </CardHeader>
        <CardContent>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value: number) => `₱${value.toFixed(2)}`} />
                <Legend />
                <Bar dataKey="revenue" fill="#22c55e" name="Revenue" />
                <Bar dataKey="expenses" fill="#ef4444" name="Expenses" />
                <Bar dataKey="net" fill="#3b82f6" name="Net Income" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[400px] text-muted-foreground">
              No data available for the selected period
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

