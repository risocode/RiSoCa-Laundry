import { format, startOfDay } from 'date-fns';
import type { Order } from '@/components/order-list';
import type { Employee, DailyPaymentStatus } from './types';
import { SALARY_PER_LOAD, ELIGIBLE_STATUSES } from './types';

export function calculateEmployeeLoads(
  orders: Order[],
  employee: Employee,
  allEmployees: Employee[]
): number {
  const myraEmployee = allEmployees.find(e => 
    e.first_name?.toUpperCase() === 'MYRA' || 
    e.first_name?.toUpperCase() === 'MYRA GAMMAL'
  );
  const isMyra = myraEmployee?.id === employee.id;
  
  let customerLoadsForEmployee = 0;
  
  // Only count orders with eligible statuses
  const eligibleOrders = orders.filter(order => 
    ELIGIBLE_STATUSES.includes(order.status)
  );
  
  eligibleOrders.forEach(order => {
    if (order.orderType === 'internal') return;
    
    if (order.assignedEmployeeIds && Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length > 0) {
      if (order.assignedEmployeeIds.includes(employee.id)) {
        const dividedLoad = order.load / order.assignedEmployeeIds.length;
        customerLoadsForEmployee += dividedLoad;
      }
    } else if (order.assignedEmployeeId === employee.id) {
      customerLoadsForEmployee += order.load;
    } else if (!order.assignedEmployeeId && (!order.assignedEmployeeIds || (Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length === 0))) {
      if (isMyra && allEmployees.length === 1) {
        customerLoadsForEmployee += order.load;
      }
    }
  });
  
  return Math.round(customerLoadsForEmployee * 100) / 100;
}

export function calculateEmployeeSalary(
  orders: Order[],
  employee: Employee,
  allEmployees: Employee[]
): number {
  const customerLoadsForEmployee = calculateEmployeeLoads(orders, employee, allEmployees);
  const customerSalary = customerLoadsForEmployee * SALARY_PER_LOAD;
  
  const internalOrdersForEmployee = orders.filter(
    o => o.orderType === 'internal' && o.assignedEmployeeId === employee.id
  );
  const internalBonus = internalOrdersForEmployee.length * 30;
  
  return customerSalary + internalBonus;
}

export function calculateActualTotalSalary(
  date: Date,
  orders: Order[],
  employees: Employee[],
  dailyPayments: Record<string, DailyPaymentStatus>
): number {
  const dateKey = format(date, 'yyyy-MM-dd');
  let actualTotal = 0;
  
  employees.forEach(emp => {
    const payment = dailyPayments[dateKey]?.[emp.id];
    const calculatedSalary = calculateEmployeeSalary(orders, emp, employees);
    
    if (payment) {
      actualTotal += payment.amount;
    } else {
      actualTotal += calculatedSalary;
    }
  });
  
  return actualTotal;
}

export function groupOrdersByDate(orders: Order[]): Record<string, Order[]> {
  return orders
    .filter(order => ELIGIBLE_STATUSES.includes(order.status))
    .reduce((acc, order) => {
      const dateStr = startOfDay(new Date(order.orderDate)).toISOString();
      if (!acc[dateStr]) {
        acc[dateStr] = [];
      }
      acc[dateStr].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
}
