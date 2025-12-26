'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Loader2, Inbox, CalendarIcon } from 'lucide-react';
import { useAuthSession } from '@/hooks/use-auth-session';
import { supabase } from '@/lib/supabase-client';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { SalaryCalendar } from '@/components/salary-calendar';
import type { Order } from '@/components/order-list';
import { Badge } from '@/components/ui/badge';
import { isAdmin, isEmployee } from '@/lib/auth-helpers';

const SALARY_PER_LOAD = 30;

type DailySalary = {
  date: Date;
  orders: Order[];
  totalLoads: number;
  totalSalary: number;
  isPaid?: boolean;
};

export default function EmployeeSalaryPage() {
  const { user } = useAuthSession();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState<{ start: Date | null; end: Date | null }>({ start: null, end: null });
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [dailyPayments, setDailyPayments] = useState<Record<string, boolean>>({});
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [userIsEmployee, setUserIsEmployee] = useState(false);
  const [employeeId, setEmployeeId] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
    if (user) {
      checkUserRole();
    }
  }, [user]);

  const checkUserRole = async () => {
    if (!user) {
      return;
    }
    
    const [adminStatus, employeeStatus] = await Promise.all([
      isAdmin(user.id),
      isEmployee(user.id),
    ]);
    
    setUserIsAdmin(adminStatus);
    setUserIsEmployee(employeeStatus);
    
    if (employeeStatus) {
      // If user is an employee, use their own ID
      setEmployeeId(user.id);
    } else if (adminStatus) {
      // If user is an admin, fetch the single employee's ID
      fetchSingleEmployee();
    }
  };

  const fetchSingleEmployee = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', 'employee')
        .limit(1)
        .maybeSingle();

      if (error) {
        return;
      }
      
      if (data) {
        setEmployeeId(data.id);
      }
    } catch (error) {
      // Silently handle error
    }
  };

  // Refetch payment status when employee ID is set and orders are loaded
  useEffect(() => {
    if (employeeId && orders.length > 0) {
      // Get unique dates from orders
      const uniqueDates = new Set<string>();
      orders.forEach((order) => {
        const dateKey = format(startOfDay(new Date(order.orderDate)), 'yyyy-MM-dd');
        uniqueDates.add(dateKey);
      });
      
      // Fetch all payments in parallel and wait for completion BEFORE updating state
      const fetchAllPayments = async () => {
        const paymentPromises = Array.from(uniqueDates).map(async (dateStr) => {
          const { data, error } = await supabase
            .from('daily_salary_payments')
            .select('is_paid, employee_id, date')
            .eq('employee_id', employeeId)
            .eq('date', dateStr)
            .maybeSingle();
          
          if (error) {
            return { dateStr, isPaid: false };
          }
          
          return { dateStr, isPaid: data?.is_paid ?? false };
        });
        
        const results = await Promise.all(paymentPromises);
        
        // Update state once with all results
        const newPayments: Record<string, boolean> = {};
        results.forEach(({ dateStr, isPaid }) => {
          newPayments[dateStr] = isPaid;
        });
        
        setDailyPayments(newPayments);
      };
      
      fetchAllPayments().catch(() => {
        // Silently handle error
      });
    }
  }, [employeeId, orders]);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      // Fetch all orders - this page doesn't need assigned_employee_ids for salary calculation
      const { data, error } = await supabase
        .from('orders')
        .select('*, order_type, assigned_employee_id');

      if (error) {
        console.error('Error fetching orders:', error);
        setOrders([]);
      } else {
        const mapped: Order[] = (data ?? []).map(o => ({
          id: o.id,
          userId: o.customer_id,
          customerName: o.customer_name,
          contactNumber: o.contact_number,
          load: o.loads,
          weight: o.weight,
          status: o.status,
          total: o.total,
          orderDate: new Date(o.created_at),
          isPaid: o.is_paid,
          deliveryOption: o.delivery_option ?? undefined,
          servicePackage: o.service_package,
          distance: o.distance ?? 0,
          statusHistory: [],
          orderType: o.order_type || 'customer',
          assignedEmployeeId: o.assigned_employee_id ?? null,
        }));
        setOrders(mapped);
      }
    } catch (error) {
      console.error('Error in fetchOrders:', error);
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  // Count ALL orders for salary calculation - no status filter needed
  // Payment is daily and all loads are paid immediately
  const completedOrdersByDate = useMemo(() => {
    return orders.reduce((acc, order) => {
      // Use consistent 'yyyy-MM-dd' format for date keys
      const dateKey = format(startOfDay(new Date(order.orderDate)), 'yyyy-MM-dd');
      if (!acc[dateKey]) {
        acc[dateKey] = [];
      }
      acc[dateKey].push(order);
      return acc;
    }, {} as Record<string, Order[]>);
  }, [orders]);

  const dailySalaries: DailySalary[] = useMemo(() => {
    const allSalaries = Object.entries(completedOrdersByDate)
      .map(([dateKey, orders]) => {
        const totalLoads = orders.reduce((sum, o) => sum + o.load, 0);
        const isPaid = dailyPayments[dateKey] ?? false;
        
        return {
          date: new Date(dateKey + 'T00:00:00'), // Parse dateKey as local date
          orders: orders,
          totalLoads: totalLoads,
          totalSalary: totalLoads * SALARY_PER_LOAD,
          isPaid: isPaid,
        };
      })
      .sort((a, b) => b.date.getTime() - a.date.getTime());

    // Apply date range filter if set
    if (dateRange.start) {
      const fromDate = startOfDay(dateRange.start);
      const toDate = dateRange.end ? startOfDay(dateRange.end) : fromDate;
      
      return allSalaries.filter(({ date }) => {
        const orderDate = startOfDay(date);
        return orderDate >= fromDate && orderDate <= toDate;
      });
    }

    return allSalaries;
  }, [completedOrdersByDate, dailyPayments, dateRange]);

  const handleCalendarApply = (start: Date | null, end: Date | null) => {
    setDateRange({ start, end });
    setCalendarOpen(false);
  };

  const handleClearFilter = () => {
    setDateRange({ start: null, end: null });
    setCalendarOpen(false);
  };

  const totalSalary = dailySalaries.reduce((sum, day) => sum + day.totalSalary, 0);
  const totalLoads = dailySalaries.reduce((sum, day) => sum + day.totalLoads, 0);

  return (
    <Card className="w-full flex flex-col max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-14rem)] transition-all duration-300">
      <CardHeader className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sticky top-0 bg-background z-10 border-b rounded-t-lg">
        <div>
          <CardTitle className="text-lg sm:text-xl">{userIsAdmin && !userIsEmployee ? 'Employee Salary' : 'My Salary'}</CardTitle>
          <CardDescription className="text-xs sm:text-sm">Salary is calculated at ₱{SALARY_PER_LOAD} per load for each day. All loads are paid immediately.</CardDescription>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden scrollable pt-4 pb-4">
        {/* Calendar Date Range Filter */}
        <div className="mb-6 p-4 border rounded-lg bg-muted/50 transition-all duration-300">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full sm:w-[280px] justify-start text-left font-normal",
                      !dateRange.start && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateRange.start
                      ? dateRange.end && dateRange.end.getTime() !== dateRange.start.getTime()
                        ? `${format(dateRange.start, "MMM dd, yyyy")} - ${format(dateRange.end, "MMM dd, yyyy")}`
                        : format(dateRange.start, "PPP")
                      : "Pick a date range to filter"
                    }
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <SalaryCalendar onApply={handleCalendarApply} onClose={() => setCalendarOpen(false)} />
                </PopoverContent>
              </Popover>
              {dateRange.start && (
                <Button onClick={handleClearFilter} variant="outline" size="sm">
                  Clear Filter
                </Button>
              )}
            </div>
            {dateRange.start && (
              <div className="text-sm text-muted-foreground">
                Showing salaries for: <span className="font-semibold text-foreground">
                  {dateRange.end && dateRange.end.getTime() !== dateRange.start.getTime()
                    ? `${format(dateRange.start, "MMM dd, yyyy")} - ${format(dateRange.end, "MMM dd, yyyy")}`
                    : format(dateRange.start, "PPP")
                  }
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Summary Cards */}
        {dailySalaries.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Total Loads</div>
                <div className="text-2xl font-bold text-primary">{totalLoads}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Total Salary</div>
                <div className="text-2xl font-bold text-primary">₱{totalSalary.toFixed(2)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Days Worked</div>
                <div className="text-2xl font-bold text-primary">{dailySalaries.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Salary History Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Daily Salary History</h3>
            <span className="text-sm text-muted-foreground">
              {dateRange.start
                ? `${dailySalaries.length} day${dailySalaries.length !== 1 ? 's' : ''} found`
                : `Total: ${dailySalaries.length} day${dailySalaries.length !== 1 ? 's' : ''}`
              }
            </span>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
              <Loader2 className="h-12 w-12 mb-2 animate-spin" />
              <p>Loading salary data...</p>
            </div>
          ) : dailySalaries.length > 0 ? (
            <Accordion type="single" collapsible className="w-full">
              {dailySalaries.map(({ date, orders, totalLoads, totalSalary, isPaid }) => (
                <AccordionItem key={date.toISOString()} value={date.toISOString()}>
                  <AccordionTrigger className="no-underline hover:no-underline">
                    <div className="flex justify-between w-full pr-4 text-left">
                      <div className="flex flex-col gap-1">
                        <span className="font-semibold">{format(date, 'PPP')}</span>
                        <Badge 
                          variant={isPaid ? "default" : "secondary"}
                          className={isPaid ? "bg-green-600 hover:bg-green-700 w-fit" : "bg-orange-600 hover:bg-orange-700 w-fit"}
                        >
                          {isPaid ? 'Paid' : 'Unpaid'}
                        </Badge>
                      </div>
                      <div className="flex gap-4 text-sm text-right">
                        <span>Loads: <span className="font-bold">{totalLoads}</span></span>
                        <span className="text-primary">Salary: <span className="font-bold">₱{totalSalary.toFixed(2)}</span></span>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Order ID</TableHead>
                          <TableHead>Customer</TableHead>
                          <TableHead className="text-center">Loads</TableHead>
                          <TableHead className="text-right">Salary Earned</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {orders.map((order) => (
                          <TableRow key={order.id}>
                            <TableCell className="text-xs">{order.id}</TableCell>
                            <TableCell className="text-xs">{order.customerName}</TableCell>
                            <TableCell className="text-center text-xs">{order.load}</TableCell>
                            <TableCell className="text-right text-xs">₱{(order.load * SALARY_PER_LOAD).toFixed(2)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                      <TableFooter>
                        <TableRow>
                          <TableCell colSpan={2} className="font-bold text-xs">Total</TableCell>
                          <TableCell className="text-center font-bold text-xs">{totalLoads}</TableCell>
                          <TableCell className="text-right font-bold text-xs">₱{totalSalary.toFixed(2)}</TableCell>
                        </TableRow>
                      </TableFooter>
                    </Table>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border rounded-lg bg-card p-8">
              <Inbox className="h-12 w-12 mb-2" />
              <h3 className="text-lg font-semibold mb-1">No Orders</h3>
              <p className="text-sm">
                {dateRange.start
                  ? 'No orders found for the selected date range.'
                  : 'No orders found. Salary is calculated based on all loads.'}
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

