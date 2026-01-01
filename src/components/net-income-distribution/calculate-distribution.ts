import { format, startOfMonth, endOfMonth, startOfYear, endOfYear } from 'date-fns';
import type { OrderData, ExpenseData, SalaryPaymentData, DistributionRecord, DistributionPeriod, DistributionData, OwnerDistribution } from './types';
import { OWNERS, COLORS } from './types';

export function calculateDistributionData(
  orders: OrderData[],
  expenses: ExpenseData[],
  salaryPayments: SalaryPaymentData[],
  distributionPeriod: DistributionPeriod,
  selectedOwners: Set<string>,
  existingDistributions: DistributionRecord[],
  bankSavings: number
): DistributionData {
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
  // Distribution share is based on total net income (not after bank savings)
  const selectedCount = selectedOwners.size || 1;
  const distributionPercentage = selectedCount > 0 ? 100 / selectedCount : 0;
  const distributionAmount = selectedCount > 0 ? netIncome / selectedCount : 0;

  const distribution: OwnerDistribution[] = OWNERS.map((owner, index) => {
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
}
