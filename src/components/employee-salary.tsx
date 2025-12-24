'use client';

import { useState, useEffect } from 'react';
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
  TableFooter
} from '@/components/ui/table';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Inbox, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Order } from '@/components/order-list';
import { format, startOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

const SALARY_PER_LOAD = 30;

type DailySalary = {
    date: Date;
    orders: Order[];
    totalLoads: number;
    totalSalary: number;
};

type Employee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

type DailyPaymentStatus = {
  [employeeId: string]: {
    is_paid: boolean;
    amount: number;
  };
};

export function EmployeeSalary() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDateOrderId, setEditingDateOrderId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [dailyPayments, setDailyPayments] = useState<Record<string, DailyPaymentStatus>>({});
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    // Fetch all orders, we'll filter by status and is_paid in the component
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_type, assigned_employee_id');
    if (error) {
      console.error("Failed to load orders", error);
      setLoading(false);
      return;
    }
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
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    fetchEmployees();
  }, []);

  // Fetch all daily payments when orders are loaded
  useEffect(() => {
    if (orders.length === 0 || employees.length === 0) return;
    
    // Get unique dates from orders
    const uniqueDates = new Set<string>();
    orders.forEach((order) => {
      const dateKey = format(startOfDay(new Date(order.orderDate)), 'yyyy-MM-dd');
      uniqueDates.add(dateKey);
    });
    
    // Fetch payments for all dates
    const paymentPromises = Array.from(uniqueDates).map(dateStr => fetchDailyPayments(dateStr));
    Promise.all(paymentPromises).catch(error => {
      console.error('Error fetching daily payments:', error);
    });
  }, [orders, employees]);

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'employee');

      if (error) {
        console.error("Failed to load employees", error);
        return;
      }
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees', error);
    }
  };

  const fetchDailyPayments = async (dateStr: string) => {
    try {
      const { data, error } = await supabase
        .from('daily_salary_payments')
        .select('*')
        .eq('date', dateStr);

      if (error) {
        console.error("Failed to load daily payments", error);
        return;
      }

      const payments: DailyPaymentStatus = {};
      (data || []).forEach((payment: any) => {
        payments[payment.employee_id] = {
          is_paid: payment.is_paid,
          amount: payment.amount,
        };
      });

      setDailyPayments(prev => ({
        ...prev,
        [dateStr]: payments,
      }));
    } catch (error) {
      console.error('Error fetching daily payments', error);
    }
  };

  const handleDateEditStart = (order: Order) => {
    setEditingDateOrderId(order.id);
    // Format date as YYYY-MM-DD for input
    const dateStr = format(order.orderDate, 'yyyy-MM-dd');
    setEditingDateValue(dateStr);
  };

  const handleDateEditCancel = () => {
    setEditingDateOrderId(null);
    setEditingDateValue('');
  };

  const handleDateUpdate = async (orderId: string) => {
    if (!editingDateValue) {
      toast({
        variant: 'destructive',
        title: 'Invalid Date',
        description: 'Please select a valid date.',
      });
      return;
    }

    setUpdatingOrderId(orderId);
    try {
      // Parse the date and set time to start of day
      const newDate = new Date(editingDateValue);
      newDate.setHours(0, 0, 0, 0);
      
      // Update the order's created_at in the database
      const { error } = await supabase
        .from('orders')
        .update({ created_at: newDate.toISOString() })
        .eq('id', orderId);

      if (error) {
        throw error;
      }

      toast({
        title: 'Date Updated',
        description: `Order date has been updated successfully.`,
      });

      // Refresh orders to reflect the new grouping
      await fetchOrders();
      setEditingDateOrderId(null);
      setEditingDateValue('');
    } catch (error: any) {
      console.error('Failed to update order date:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update order date.',
      });
    } finally {
      setUpdatingOrderId(null);
    }
  };

  // Count ALL orders for salary calculation - no status filter needed
  // Payment is daily and all loads are paid immediately
  const completedOrdersByDate = orders
    .reduce((acc, order) => {
        const dateStr = startOfDay(new Date(order.orderDate)).toISOString();
        if (!acc[dateStr]) {
            acc[dateStr] = [];
        }
        acc[dateStr].push(order);
        return acc;
    }, {} as Record<string, Order[]>);

  const dailySalaries: DailySalary[] = Object.entries(completedOrdersByDate)
    .map(([dateStr, orders]) => {
        const totalLoads = orders.reduce((sum, o) => sum + o.load, 0);
        // Calculate base salary from loads
        const baseSalary = totalLoads * SALARY_PER_LOAD;
        // Calculate internal order bonuses (+30 per assigned internal order)
        const internalOrderBonus = orders
          .filter(o => o.orderType === 'internal' && o.assignedEmployeeId)
          .length * 30;
        const totalSalary = baseSalary + internalOrderBonus;
        
        return {
            date: new Date(dateStr),
            orders: orders,
            totalLoads: totalLoads,
            totalSalary: totalSalary,
        };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const handleAssignOldOrdersToMyra = async () => {
    // Find MYRA employee
    const myraEmployee = employees.find(e => 
      e.first_name?.toUpperCase() === 'MYRA' || 
      e.first_name?.toUpperCase().includes('MYRA')
    );

    if (!myraEmployee) {
      toast({
        variant: 'destructive',
        title: 'MYRA not found',
        description: 'Could not find MYRA employee. Please ensure MYRA is registered as an employee.',
      });
      return;
    }

    setAssigningOldOrders(true);
    try {
      // Find all unassigned customer orders
      const { data: unassignedOrders, error: fetchError } = await supabase
        .from('orders')
        .select('id')
        .is('assigned_employee_id', null)
        .or('order_type.is.null,order_type.eq.customer');

      if (fetchError) {
        throw fetchError;
      }

      if (!unassignedOrders || unassignedOrders.length === 0) {
        toast({
          title: 'No unassigned orders',
          description: 'All orders are already assigned.',
        });
        setAssigningOldOrders(false);
        return;
      }

      // Update all unassigned orders to MYRA
      const { error: updateError } = await supabase
        .from('orders')
        .update({ assigned_employee_id: myraEmployee.id })
        .is('assigned_employee_id', null)
        .or('order_type.is.null,order_type.eq.customer');

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Old orders assigned',
        description: `${unassignedOrders.length} unassigned order(s) have been assigned to ${myraEmployee.first_name} ${myraEmployee.last_name}.`,
      });

      // Refresh orders
      await fetchOrders();
    } catch (error: any) {
      console.error('Failed to assign old orders:', error);
      toast({
        variant: 'destructive',
        title: 'Assignment failed',
        description: error.message || 'Failed to assign old orders to MYRA.',
      });
    } finally {
      setAssigningOldOrders(false);
    }
  };

  const handleTogglePayment = async (employeeId: string, date: Date, currentStatus: boolean, amount: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const paymentKey = `${employeeId}-${dateStr}`;
    setUpdatingPayment(paymentKey);

    try {
      const newStatus = !currentStatus;
      const { error } = await supabase
        .from('daily_salary_payments')
        .upsert({
          employee_id: employeeId,
          date: dateStr,
          amount: amount,
          is_paid: newStatus,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'employee_id,date',
        });

      if (error) throw error;

      toast({
        title: newStatus ? 'Marked as Paid' : 'Marked as Unpaid',
        description: `Employee salary for ${format(date, 'MMM dd, yyyy')} has been updated.`,
      });

      // Refresh payments for this date
      await fetchDailyPayments(dateStr);
    } catch (error: any) {
      console.error('Failed to update payment status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update payment status.',
      });
    } finally {
      setUpdatingPayment(null);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <CardTitle>Daily Salary Calculation</CardTitle>
            <CardDescription>
              Salary is calculated at ₱{SALARY_PER_LOAD} per load assigned to each employee. 
              Old unassigned orders are automatically counted for MYRA (the original employee).
            </CardDescription>
          </div>
          {(() => {
            const hasUnassignedOrders = orders.some(
              o => o.orderType !== 'internal' && !o.assignedEmployeeId
            );
            const myraEmployee = employees.find(e => 
              e.first_name?.toUpperCase() === 'MYRA' || 
              e.first_name?.toUpperCase().includes('MYRA')
            );
            return hasUnassignedOrders && myraEmployee ? (
              <Button
                onClick={handleAssignOldOrdersToMyra}
                disabled={assigningOldOrders}
                variant="outline"
                size="sm"
                className="whitespace-nowrap"
              >
                {assigningOldOrders ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Assigning...
                  </>
                ) : (
                  <>
                    Assign Old Orders to {myraEmployee.first_name}
                  </>
                )}
              </Button>
            ) : null;
          })()}
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <Loader2 className="h-12 w-12 mb-2 animate-spin" />
            <p>Loading salary data...</p>
          </div>
        ) : dailySalaries.length > 0 ? (
          <Accordion type="single" collapsible className="w-full">
            {dailySalaries.map(({ date, orders, totalLoads, totalSalary }) => (
              <AccordionItem key={date.toISOString()} value={date.toISOString()}>
                <AccordionTrigger className="no-underline hover:no-underline">
                    <div className="flex justify-between w-full pr-4 text-left">
                        <div className="flex flex-col gap-1">
                          <span className="font-semibold">{format(date, 'PPP')}</span>
                          {employees.length > 0 && (
                            <div className="flex gap-2 text-xs text-muted-foreground">
                              {employees.map((emp) => {
                                const dateKey = format(date, 'yyyy-MM-dd');
                                const payment = dailyPayments[dateKey]?.[emp.id];
                                const isPaid = payment?.is_paid ?? false;
                                return (
                                  <span key={emp.id} className={isPaid ? 'text-green-600' : 'text-orange-600'}>
                                    {emp.first_name || 'Employee'}: {isPaid ? 'Paid' : 'Unpaid'}
                                  </span>
                                );
                              })}
                            </div>
                          )}
                        </div>
                        <div className="flex gap-4 text-sm text-right">
                           <span>Loads: <span className="font-bold">{totalLoads}</span></span>
                           <span className="text-primary">Salary: <span className="font-bold">₱{totalSalary.toFixed(2)}</span></span>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
                   {/* Internal Orders Management Section */}
                   {orders.some(o => o.orderType === 'internal') && (
                     <div className="mb-4 p-4 border rounded-lg bg-blue-50 dark:bg-blue-950/20">
                       <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                         <span>Internal Orders</span>
                         <Badge variant="outline" className="text-xs">
                           {orders.filter(o => o.orderType === 'internal').length} order{orders.filter(o => o.orderType === 'internal').length !== 1 ? 's' : ''}
                         </Badge>
                       </h4>
                       <div className="space-y-2">
                         {orders
                           .filter(o => o.orderType === 'internal')
                           .map((order) => {
                             const assignedEmployee = employees.find(e => e.id === order.assignedEmployeeId);
                             return (
                               <div key={order.id} className="flex items-center justify-between p-2 bg-background rounded border text-xs">
                                 <div className="flex items-center gap-2">
                                   <span className="font-medium">{order.id}</span>
                                   <span className="text-muted-foreground">
                                     {order.customerName} - {order.load} load{order.load !== 1 ? 's' : ''}
                                   </span>
                                 </div>
                                 <div className="flex items-center gap-2">
                                   {assignedEmployee ? (
                                     <>
                                       <Badge variant="outline" className="text-xs">
                                         {assignedEmployee.first_name} {assignedEmployee.last_name} (+₱30)
                                       </Badge>
                                       <Button
                                         size="sm"
                                         variant="ghost"
                                         onClick={async () => {
                                           const { error } = await supabase
                                             .from('orders')
                                             .update({ assigned_employee_id: null })
                                             .eq('id', order.id);
                                           if (error) {
                                             toast({
                                               variant: 'destructive',
                                               title: 'Error',
                                               description: 'Failed to remove assignment.',
                                             });
                                           } else {
                                             toast({
                                               title: 'Assignment removed',
                                               description: 'Internal order bonus removed.',
                                             });
                                             fetchOrders();
                                           }
                                         }}
                                         className="h-6 px-2 text-xs text-red-600 hover:text-red-700"
                                       >
                                         Remove
                                       </Button>
                                     </>
                                   ) : (
                                     <>
                                       <span className="text-muted-foreground">Unassigned</span>
                                       <Select
                                         value=""
                                         onValueChange={async (employeeId) => {
                                           const { error } = await supabase
                                             .from('orders')
                                             .update({ assigned_employee_id: employeeId })
                                             .eq('id', order.id);
                                           if (error) {
                                             toast({
                                               variant: 'destructive',
                                               title: 'Error',
                                               description: 'Failed to assign employee.',
                                             });
                                           } else {
                                             toast({
                                               title: 'Employee assigned',
                                               description: 'Internal order bonus added.',
                                             });
                                             fetchOrders();
                                           }
                                         }}
                                       >
                                         <SelectTrigger className="h-6 w-[140px] text-xs">
                                           <SelectValue placeholder="Assign..." />
                                         </SelectTrigger>
                                         <SelectContent>
                                           {employees.map((emp) => (
                                             <SelectItem key={emp.id} value={emp.id}>
                                               {emp.first_name} {emp.last_name}
                                             </SelectItem>
                                           ))}
                                         </SelectContent>
                                       </Select>
                                     </>
                                   )}
                                 </div>
                               </div>
                             );
                           })}
                       </div>
                     </div>
                   )}
                   
                   {/* Employee Payment Status Section */}
                   {employees.length > 0 && (
                     <div className="mb-4 p-4 border rounded-lg bg-muted/50">
                       <h4 className="text-sm font-semibold mb-3">Employee Payment Status</h4>
                       <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                         {employees.map((emp) => {
                           const dateKey = format(date, 'yyyy-MM-dd');
                           const payment = dailyPayments[dateKey]?.[emp.id];
                           const isPaid = payment?.is_paid ?? false;
                           
                           // Find MYRA (the original employee) - check by first name
                           const myraEmployee = employees.find(e => 
                             e.first_name?.toUpperCase() === 'MYRA' || 
                             e.first_name?.toUpperCase() === 'MYRA GAMMAL'
                           );
                           const isMyra = myraEmployee?.id === emp.id;
                           
                           // Calculate employee-specific salary based on assigned loads only
                           // Customer orders assigned to this employee
                           const customerOrdersForEmployee = orders.filter(
                             o => o.orderType !== 'internal' && o.assignedEmployeeId === emp.id
                           );
                           
                           // For MYRA: also include unassigned customer orders (old records)
                           const unassignedCustomerOrders = isMyra 
                             ? orders.filter(
                                 o => o.orderType !== 'internal' && !o.assignedEmployeeId
                               )
                             : [];
                           
                           const allCustomerOrdersForEmployee = [...customerOrdersForEmployee, ...unassignedCustomerOrders];
                           const customerLoadsForEmployee = allCustomerOrdersForEmployee.reduce((sum, o) => sum + o.load, 0);
                           const customerSalary = customerLoadsForEmployee * SALARY_PER_LOAD;
                           
                           // Bonus: +30 for each internal order assigned to this employee
                           const internalOrdersForEmployee = orders.filter(
                             o => o.orderType === 'internal' && o.assignedEmployeeId === emp.id
                           );
                           const internalBonus = internalOrdersForEmployee.length * 30;
                           
                           // Total salary = only loads assigned to this employee + internal bonuses
                           const employeeSalary = customerSalary + internalBonus;
                           const paymentKey = `${emp.id}-${dateKey}`;
                           
                           return (
                             <div key={emp.id} className="flex items-center justify-between p-3 border rounded-md bg-background">
                               <div className="flex flex-col">
                                 <span className="text-sm font-medium">
                                   {emp.first_name || ''} {emp.last_name || ''}
                                 </span>
                                 <div className="flex flex-col gap-0.5 mt-1">
                                   <span className="text-xs text-muted-foreground">
                                     {customerLoadsForEmployee} load{customerLoadsForEmployee !== 1 ? 's' : ''} × ₱{SALARY_PER_LOAD} = ₱{customerSalary.toFixed(2)}
                                     {isMyra && unassignedCustomerOrders.length > 0 && (
                                       <span className="text-orange-600 ml-1">
                                         ({unassignedCustomerOrders.length} unassigned)
                                       </span>
                                     )}
                                   </span>
                                   {internalBonus > 0 && (
                                     <span className="text-xs text-green-600">
                                       + {internalOrdersForEmployee.length} internal order{internalOrdersForEmployee.length !== 1 ? 's' : ''} (₱{internalBonus.toFixed(2)})
                                     </span>
                                   )}
                                   <span className="text-xs font-semibold text-primary mt-0.5">
                                     Total: ₱{employeeSalary.toFixed(2)}
                                   </span>
                                 </div>
                               </div>
                               <Button
                                 size="sm"
                                 variant={isPaid ? "default" : "outline"}
                                 onClick={() => handleTogglePayment(emp.id, date, isPaid, employeeSalary)}
                                 disabled={updatingPayment === paymentKey}
                                 className={isPaid ? "bg-green-600 hover:bg-green-700" : ""}
                               >
                                 {updatingPayment === paymentKey ? (
                                   <Loader2 className="h-4 w-4 animate-spin" />
                                 ) : (
                                   isPaid ? 'Paid' : 'Unpaid'
                                 )}
                               </Button>
                             </div>
                           );
                         })}
                       </div>
                     </div>
                   )}
                   
                   <Table>
                        <TableHeader>
                        <TableRow>
                            <TableHead>Order ID</TableHead>
                            <TableHead>Date</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead className="text-center">Loads</TableHead>
                            <TableHead className="text-right">Salary Earned</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {orders.map((order) => (
                            <TableRow key={order.id} className="group">
                            <TableCell className="text-xs">{order.id}</TableCell>
                            <TableCell className="text-xs">
                              {editingDateOrderId === order.id ? (
                                <div className="flex items-center gap-2">
                                  <Input
                                    type="date"
                                    value={editingDateValue}
                                    onChange={(e) => setEditingDateValue(e.target.value)}
                                    className="h-8 w-[140px] text-xs"
                                    disabled={updatingOrderId === order.id}
                                  />
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={() => handleDateUpdate(order.id)}
                                    disabled={updatingOrderId === order.id}
                                  >
                                    {updatingOrderId === order.id ? (
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Check className="h-4 w-4 text-green-600" />
                                    )}
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-8 w-8 p-0"
                                    onClick={handleDateEditCancel}
                                    disabled={updatingOrderId === order.id}
                                  >
                                    <X className="h-4 w-4 text-red-600" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2">
                                  <span>{format(order.orderDate, 'MMM dd, yyyy')}</span>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 hover:opacity-100"
                                    onClick={() => handleDateEditStart(order)}
                                    title="Edit date"
                                  >
                                    <svg
                                      xmlns="http://www.w3.org/2000/svg"
                                      width="12"
                                      height="12"
                                      viewBox="0 0 24 24"
                                      fill="none"
                                      stroke="currentColor"
                                      strokeWidth="2"
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      className="text-muted-foreground hover:text-foreground"
                                    >
                                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                                    </svg>
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell className="text-xs">
                              <div className="flex items-center gap-2">
                                {order.customerName}
                                {order.orderType === 'internal' && (
                                  <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 text-xs">
                                    Internal
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="text-center text-xs">{order.load}</TableCell>
                            <TableCell className="text-right text-xs">
                              {order.orderType === 'internal' && order.assignedEmployeeId ? (
                                <span className="text-green-600 font-semibold">₱30.00</span>
                              ) : order.orderType === 'internal' ? (
                                <span className="text-muted-foreground">₱0.00 (unassigned)</span>
                              ) : (
                                `₱${(order.load * SALARY_PER_LOAD).toFixed(2)}`
                              )}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow>
                                <TableCell colSpan={3} className="font-bold text-xs">Total</TableCell>
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
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <Inbox className="h-12 w-12 mb-2" />
            <p>No completed orders found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
