import { differenceInDays } from 'date-fns';
import type { OrderData, ExpenseData, SalaryPaymentData } from './types';

export function calculateFinancialTotals(
  orders: OrderData[],
  expenses: ExpenseData[],
  salaryPayments: SalaryPaymentData[]
) {
  const paidOrders = orders.filter(o => o.is_paid === true);
  const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.total || 0), 0);
  
  const regularExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);
  const employeeSalaries = salaryPayments.reduce((sum, s) => sum + (s.amount || 0), 0);
  const totalExpenses = regularExpenses + employeeSalaries;
  
  const netIncome = totalRevenue - totalExpenses;

  return {
    totalRevenue,
    regularExpenses,
    employeeSalaries,
    totalExpenses,
    netIncome,
    paidOrdersCount: paidOrders.length,
  };
}

export function calculateBusinessMetrics(
  orders: OrderData[],
  businessStartDate: Date | null
) {
  const totalLoads = orders.reduce((sum, o) => sum + (o.loads || 0), 0);
  const totalWeight = orders.reduce((sum, o) => sum + (o.weight || 0), 0);
  const totalOrders = orders.length;
  const totalDaysOfOperation = businessStartDate 
    ? differenceInDays(new Date(), businessStartDate) + 1 
    : 0;

  return {
    totalLoads,
    totalWeight,
    totalOrders,
    totalDaysOfOperation,
  };
}
