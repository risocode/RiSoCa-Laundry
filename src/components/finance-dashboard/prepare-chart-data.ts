import {
  format,
  startOfDay,
  endOfDay,
  startOfWeek,
  endOfWeek,
  startOfMonth,
  endOfMonth,
  startOfYear,
  endOfYear,
  eachDayOfInterval,
  eachWeekOfInterval,
  eachMonthOfInterval,
  eachYearOfInterval,
  subDays,
  subWeeks,
  subMonths,
} from 'date-fns';
import type { OrderData, ExpenseData, SalaryPaymentData, ChartPeriod, ChartDataPoint } from './types';

export function prepareChartData(
  orders: OrderData[],
  expenses: ExpenseData[],
  salaryPayments: SalaryPaymentData[],
  chartPeriod: ChartPeriod
): ChartDataPoint[] {
  if (orders.length === 0 && expenses.length === 0) {
    return [];
  }

  const now = new Date();
  let periods: Date[];
  let dateFormatter: (date: Date) => string;
  let periodStartFn: (date: Date) => Date;
  let periodEndFn: (date: Date) => Date;

  let startDate: Date;
  const endDate = now;

  switch (chartPeriod) {
    case 'daily':
      startDate = startOfDay(subDays(now, 29));
      periods = eachDayOfInterval({ start: startDate, end: endDate });
      dateFormatter = (d) => format(d, 'MMM d');
      periodStartFn = startOfDay;
      periodEndFn = endOfDay;
      break;
    case 'weekly':
      startDate = startOfWeek(subWeeks(now, 11));
      periods = eachWeekOfInterval({ start: startDate, end: endDate }, { weekStartsOn: 1 });
      dateFormatter = (d) => `Week ${format(d, 'MMM d')}`;
      periodStartFn = (d) => startOfWeek(d, { weekStartsOn: 1 });
      periodEndFn = (d) => endOfWeek(d, { weekStartsOn: 1 });
      break;
    case 'monthly':
      startDate = startOfMonth(subMonths(now, 11));
      periods = eachMonthOfInterval({ start: startDate, end: endDate });
      dateFormatter = (d) => format(d, 'MMM yyyy');
      periodStartFn = startOfMonth;
      periodEndFn = endOfMonth;
      break;
    case 'yearly':
      const orderDates = orders.map(o => new Date(o.created_at).getTime());
      const expenseDates = expenses.map(e => new Date(e.incurred_on).getTime());
      const allDates = [...orderDates, ...expenseDates];
      if (allDates.length === 0) return [];
      startDate = startOfYear(new Date(Math.min(...allDates)));
      periods = eachYearOfInterval({ start: startDate, end: endDate });
      dateFormatter = (d) => format(d, 'yyyy');
      periodStartFn = startOfYear;
      periodEndFn = endOfYear;
      break;
  }

  return periods.map((period) => {
    const periodStart = periodStartFn(period);
    const periodEnd = periodEndFn(period);
    const periodKey = dateFormatter(period);

    const periodOrders = orders.filter(
      (o) => {
        const orderDate = new Date(o.created_at);
        return orderDate >= periodStart && orderDate <= periodEnd;
      }
    );
    const periodExpenses = expenses.filter(
      (e) => {
        const expenseDate = new Date(e.incurred_on);
        return expenseDate >= periodStart && expenseDate <= periodEnd;
      }
    );

    const periodSalaries = salaryPayments.filter(
      (s) => {
        const salaryDate = new Date(s.date);
        return salaryDate >= periodStart && salaryDate <= periodEnd;
      }
    );

    const periodRevenue = periodOrders.filter(o => o.is_paid === true).reduce((sum, o) => sum + (o.total || 0), 0);
    const periodRegularExpenses = periodExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const periodEmployeeSalaries = periodSalaries.reduce((sum, s) => sum + (s.amount || 0), 0);
    const periodTotalExpenses = periodRegularExpenses + periodEmployeeSalaries;

    return {
      period: periodKey,
      revenue: periodRevenue,
      expenses: periodTotalExpenses,
      net: periodRevenue - periodTotalExpenses,
    };
  }).filter(d => d.revenue > 0 || d.expenses > 0);
}

export function prepareExpenseCategoryData(
  expenses: ExpenseData[]
): Array<{ name: string; value: number }> {
  const categoryMap = new Map<string, number>();
  expenses.forEach((e) => {
    const category = e.category || 'Uncategorized';
    categoryMap.set(category, (categoryMap.get(category) || 0) + (e.amount || 0));
  });

  return Array.from(categoryMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}
