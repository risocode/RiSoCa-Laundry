import { startOfDay, subDays } from 'date-fns';
import type { Order } from '@/components/order-list/types';

export interface OrderStatistics {
  totalOrders: number;
  totalRevenue: number;
  paidRevenue: number;
  pendingRevenue: number;
  completedOrders: number;
  pendingOrders: number;
  canceledOrders: number;
  paidOrders: number;
  unpaidOrders: number;
  todayOrders: number;
  todayRevenue: number;
  yesterdayRevenue: number;
  weekOrders: number;
  weekRevenue: number;
  totalLoads: number;
  todayLoads: number;
}

export function calculateStatistics(allOrders: Order[]): OrderStatistics {
  // Filter out internal orders - only count customer orders
  const customerOrders = allOrders.filter(
    (o) => o.orderType !== 'internal'
  );

  const totalOrders = customerOrders.length;

  // Separate paid and unpaid customer orders
  const paidCustomerOrders = customerOrders.filter(
    (o) => o.isPaid === true
  );
  const unpaidCustomerOrders = customerOrders.filter((o) => !o.isPaid);

  // Paid Revenue: Sum of all paid orders' total
  const paidRevenue = paidCustomerOrders.reduce(
    (sum, o) => sum + (o.total || 0),
    0
  );

  // Pending Revenue: Sum of unpaid orders' balance (or total if balance doesn't exist)
  const pendingRevenue = unpaidCustomerOrders.reduce(
    (sum, o) => sum + ((o.balance || o.total) || 0),
    0
  );

  // Total Revenue: Sum of all revenue (paid + pending)
  const totalRevenue = paidRevenue + pendingRevenue;

  const completedOrders = customerOrders.filter(
    (o) =>
      o.status === 'Success' ||
      o.status === 'Completed' ||
      o.status === 'Delivered'
  ).length;

  const pendingOrders = customerOrders.filter(
    (o) =>
      o.status !== 'Success' &&
      o.status !== 'Completed' &&
      o.status !== 'Delivered' &&
      o.status !== 'Canceled'
  ).length;

  const canceledOrders = customerOrders.filter(
    (o) => o.status === 'Canceled'
  ).length;

  const paidOrders = paidCustomerOrders.length;
  const unpaidOrders = unpaidCustomerOrders.length;

  // Today's stats - all customer orders created today (not just paid)
  const today = startOfDay(new Date());
  const todayCustomerOrders = customerOrders.filter(
    (o) => startOfDay(o.orderDate).getTime() === today.getTime()
  );
  const todayPaidCustomerOrders = todayCustomerOrders.filter(
    (o) => o.isPaid === true
  );
  const todayRevenue = todayPaidCustomerOrders.reduce(
    (sum, o) => sum + (o.total || 0),
    0
  );

  // Calculate total loads (sum of all orders' load property, including internal orders)
  const totalLoads = allOrders.reduce((sum, o) => sum + (o.load || 0), 0);
  
  // Calculate today's loads (including internal orders)
  const todayAllOrders = allOrders.filter(
    (o) => startOfDay(o.orderDate).getTime() === today.getTime()
  );
  const todayLoads = todayAllOrders.reduce((sum, o) => sum + (o.load || 0), 0);

  // Yesterday's stats - all customer orders created yesterday
  const yesterday = startOfDay(subDays(new Date(), 1));
  const yesterdayCustomerOrders = customerOrders.filter(
    (o) => startOfDay(o.orderDate).getTime() === yesterday.getTime()
  );
  const yesterdayPaidCustomerOrders = yesterdayCustomerOrders.filter(
    (o) => o.isPaid === true
  );
  const yesterdayRevenue = yesterdayPaidCustomerOrders.reduce(
    (sum, o) => sum + (o.total || 0),
    0
  );

  // This week's stats
  const weekStart = startOfDay(subDays(new Date(), 7));
  const weekOrders = customerOrders.filter(
    (o) => o.orderDate >= weekStart
  );
  const weekRevenue = weekOrders.reduce(
    (sum, o) => sum + (o.total || 0),
    0
  );

  return {
    totalOrders,
    totalRevenue,
    paidRevenue,
    pendingRevenue,
    completedOrders,
    pendingOrders,
    canceledOrders,
    paidOrders,
    unpaidOrders,
    todayOrders: todayCustomerOrders.length,
    todayRevenue,
    yesterdayRevenue,
    weekOrders: weekOrders.length,
    weekRevenue,
    totalLoads,
    todayLoads,
  };
}
