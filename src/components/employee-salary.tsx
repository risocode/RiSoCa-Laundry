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
import type { Order } from '@/components/order-list';
import { format, startOfDay } from 'date-fns';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';

const SALARY_PER_LOAD = 30;

// Filter orders by status - only count orders that are ready for salary calculation
// Orders must be: "Ready for Pick Up", "Out for Delivery", "Delivered", "Success", or "Washing" (and beyond)
// Orders that are not in these statuses will be moved to the next day
const ELIGIBLE_STATUSES = [
  'Ready for Pick Up',
  'Out for Delivery',
  'Delivered',
  'Success',
  'Washing',
  'Drying',
  'Folding',
];

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
  const [editingPaymentAmount, setEditingPaymentAmount] = useState<string | null>(null);
  const [editingPaymentValue, setEditingPaymentValue] = useState<string>('');
  const [assigningOldOrders, setAssigningOldOrders] = useState(false);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    // Fetch all orders, we'll filter by status and is_paid in the component
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_type, assigned_employee_id, assigned_employee_ids');
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
      assignedEmployeeId: o.assigned_employee_id ?? null, // For backward compatibility
      assignedEmployeeIds: Array.isArray(o.assigned_employee_ids) ? o.assigned_employee_ids : (o.assigned_employee_ids ? [o.assigned_employee_ids] : undefined),
    }));
    setOrders(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
    fetchEmployees();
    // Fetch all existing daily salary payments from database on initial load
    fetchAllDailyPayments();
  }, []);

  // Fetch all daily salary payments to ensure existing records are loaded from database
  const fetchAllDailyPayments = async () => {
    try {
      const { data, error } = await supabase
        .from('daily_salary_payments')
        .select('*')
        .order('date', { ascending: false })
        .limit(1000); // Limit to recent records

      if (error) {
        console.error("Failed to load all daily payments", error);
        return;
      }

      // Group payments by date
      const paymentsByDate: Record<string, DailyPaymentStatus> = {};
      (data || []).forEach((payment: any) => {
        const dateStr = payment.date;
        if (!paymentsByDate[dateStr]) {
          paymentsByDate[dateStr] = {};
        }
        paymentsByDate[dateStr][payment.employee_id] = {
          is_paid: payment.is_paid,
          amount: payment.amount,
        };
      });

      setDailyPayments(prev => ({
        ...prev,
        ...paymentsByDate,
      }));
    } catch (error) {
      console.error('Error fetching all daily payments', error);
    }
  };

  // Auto-save calculated salaries when orders and employees are loaded
  // This runs after fetchAllDailyPayments has loaded existing records
  useEffect(() => {
    if (orders.length === 0 || employees.length === 0) return;
    
    // Get unique dates from orders
    const uniqueDates = new Set<string>();
    orders.forEach((order) => {
      const dateKey = format(startOfDay(new Date(order.orderDate)), 'yyyy-MM-dd');
      uniqueDates.add(dateKey);
    });
    
    // Auto-save calculated salaries for dates with orders
    // This will only create new records if they don't exist (existing records are preserved)
    autoSaveDailySalaries(Array.from(uniqueDates), orders, employees);
  }, [orders, employees]);

  // Auto-save calculated daily salaries to database
  const autoSaveDailySalaries = async (dateStrings: string[], currentOrders: Order[], currentEmployees: Employee[]) => {
    if (currentEmployees.length === 0 || currentOrders.length === 0) return;

    const myraEmployee = currentEmployees.find(e => 
      e.first_name?.toUpperCase() === 'MYRA' || 
      e.first_name?.toUpperCase() === 'MYRA GAMMAL'
    );

    const savePromises: Promise<void>[] = [];

    dateStrings.forEach(dateStr => {
      // Filter orders by status - only count eligible orders
      const dayOrders = currentOrders.filter(order => {
        const orderDateKey = format(startOfDay(new Date(order.orderDate)), 'yyyy-MM-dd');
        return orderDateKey === dateStr && ELIGIBLE_STATUSES.includes(order.status);
      });

      currentEmployees.forEach(emp => {
        const isMyra = myraEmployee?.id === emp.id;
        
        // Calculate employee-specific salary, handling both single and multiple employee assignments
        let customerLoadsForEmployee = 0;
        
        dayOrders.forEach(order => {
          if (order.orderType === 'internal') return; // Skip internal orders here
          
          // Check if order has multiple employees assigned
          if (order.assignedEmployeeIds && Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length > 0) {
            // Order has multiple employees - divide load equally
            if (order.assignedEmployeeIds.includes(emp.id)) {
              const dividedLoad = order.load / order.assignedEmployeeIds.length;
              customerLoadsForEmployee += dividedLoad;
            }
          } else if (order.assignedEmployeeId === emp.id) {
            // Single employee assignment (backward compatibility)
            customerLoadsForEmployee += order.load;
          } else if (!order.assignedEmployeeId && (!order.assignedEmployeeIds || (Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length === 0))) {
            // Unassigned order - assign to MYRA if she's the only employee (old records)
            if (isMyra && currentEmployees.length === 1) {
              customerLoadsForEmployee += order.load;
            }
          }
        });
        
        // Round to 2 decimal places to avoid floating point errors
        customerLoadsForEmployee = Math.round(customerLoadsForEmployee * 100) / 100;
        
        const customerSalary = customerLoadsForEmployee * SALARY_PER_LOAD;
        
        const internalOrdersForEmployee = dayOrders.filter(
          o => o.orderType === 'internal' && o.assignedEmployeeId === emp.id
        );
        const internalBonus = internalOrdersForEmployee.length * 30;
        
        const calculatedSalary = customerSalary + internalBonus;

        // Only save if employee has loads or internal orders
        if (calculatedSalary > 0) {
          const existingPayment = dailyPayments[dateStr]?.[emp.id];
          
          // Only auto-save if no record exists
          // If record exists, it means it was manually edited or marked as paid, so don't overwrite
          if (!existingPayment) {
            savePromises.push(
              (async () => {
                try {
                  // Check if record exists first
                  const { data: existing, error: checkError } = await supabase
                    .from('daily_salary_payments')
                    .select('id')
                    .eq('employee_id', emp.id)
                    .eq('date', dateStr)
                    .maybeSingle();

                  // If no record exists (maybeSingle returns null when not found)
                  if (!existing && !checkError) {
                    // Insert new record
                    const { error } = await supabase
                      .from('daily_salary_payments')
                      .insert({
                        employee_id: emp.id,
                        date: dateStr,
                        amount: calculatedSalary,
                        is_paid: false,
                        updated_at: new Date().toISOString(),
                      });

                    if (error) {
                      console.error(`Failed to auto-save salary for ${emp.id} on ${dateStr}:`, error);
                    }
                  }
                } catch (error: any) {
                  console.error(`Error checking/inserting salary for ${emp.id} on ${dateStr}:`, error);
                }
              })()
            );
          }
        }
      });
    });

    // Wait for all saves to complete, then refresh payments
    if (savePromises.length > 0) {
      Promise.all(savePromises).then(() => {
        // Refresh payments for all dates
        dateStrings.forEach(dateStr => fetchDailyPayments(dateStr));
      }).catch(error => {
        console.error('Error auto-saving daily salaries:', error);
      });
    }
  };

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
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to load payments: ${error.message}`,
        });
        return;
      }

      const payments: DailyPaymentStatus = {};
      (data || []).forEach((payment: any) => {
        payments[payment.employee_id] = {
          is_paid: payment.is_paid,
          amount: payment.amount,
        };
      });

      // Use functional update to ensure state is properly merged
      setDailyPayments(prev => {
        const updated = { ...prev };
        updated[dateStr] = payments;
        return updated;
      });
    } catch (error: any) {
      console.error('Error fetching daily payments', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to fetch payments: ${error.message || 'Unknown error'}`,
      });
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

  const completedOrdersByDate = orders
    .filter(order => ELIGIBLE_STATUSES.includes(order.status))
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
        const calculatedTotalSalary = baseSalary + internalOrderBonus;
        
        return {
            date: new Date(dateStr),
            orders: orders,
            totalLoads: totalLoads,
            totalSalary: calculatedTotalSalary, // This will be overridden with actual payment amounts in display
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

  const handleEditPaymentAmount = (employeeId: string, date: Date, currentAmount: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const paymentKey = `${employeeId}-${dateStr}`;
    setEditingPaymentAmount(paymentKey);
    setEditingPaymentValue(currentAmount.toFixed(2));
  };

  const handleCancelEditPaymentAmount = () => {
    setEditingPaymentAmount(null);
    setEditingPaymentValue('');
  };

  const handleSavePaymentAmount = async (employeeId: string, date: Date, currentStatus: boolean) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const paymentKey = `${employeeId}-${dateStr}`;
    const amount = parseFloat(editingPaymentValue);

    if (isNaN(amount) || amount < 0) {
      toast({
        variant: 'destructive',
        title: 'Invalid Amount',
        description: 'Please enter a valid positive number.',
      });
      return;
    }

    setUpdatingPayment(paymentKey);

    try {
      // First, try to get existing record to check if it exists
      const { data: existingData, error: fetchError } = await supabase
        .from('daily_salary_payments')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', dateStr)
        .maybeSingle();

      let result;
      if (existingData && !fetchError) {
        // Update existing record
        result = await supabase
          .from('daily_salary_payments')
          .update({
            amount: amount,
            is_paid: currentStatus,
            updated_at: new Date().toISOString(),
          })
          .eq('employee_id', employeeId)
          .eq('date', dateStr);
      } else {
        // Insert new record
        result = await supabase
          .from('daily_salary_payments')
          .insert({
            employee_id: employeeId,
            date: dateStr,
            amount: amount,
            is_paid: currentStatus,
            updated_at: new Date().toISOString(),
          });
      }

      if (result.error) {
        console.error('Database error:', result.error);
        throw result.error;
      }

      toast({
        title: 'Amount Updated',
        description: `Payment amount has been updated to ₱${amount.toFixed(2)}.`,
      });

      // Refresh payments for this date and update local state immediately
      await fetchDailyPayments(dateStr);
      
      // Also update local state immediately for better UX
      setDailyPayments(prev => {
        const updated = { ...prev };
        if (!updated[dateStr]) {
          updated[dateStr] = {};
        }
        updated[dateStr][employeeId] = {
          is_paid: currentStatus,
          amount: amount,
        };
        return updated;
      });
      
      setEditingPaymentAmount(null);
      setEditingPaymentValue('');
    } catch (error: any) {
      console.error('Failed to update payment amount:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update payment amount. Please try again.',
      });
    } finally {
      setUpdatingPayment(null);
    }
  };

  const handleTogglePayment = async (employeeId: string, date: Date, currentStatus: boolean, amount: number) => {
    const dateStr = format(date, 'yyyy-MM-dd');
    const paymentKey = `${employeeId}-${dateStr}`;
    setUpdatingPayment(paymentKey);

    try {
      const newStatus = !currentStatus;
      
      // First, try to get existing record
      const { data: existingData, error: fetchError } = await supabase
        .from('daily_salary_payments')
        .select('id')
        .eq('employee_id', employeeId)
        .eq('date', dateStr)
        .maybeSingle();

      let result;
      if (existingData && !fetchError) {
        // Update existing record
        result = await supabase
          .from('daily_salary_payments')
          .update({
            is_paid: newStatus,
            amount: amount,
            updated_at: new Date().toISOString(),
          })
          .eq('employee_id', employeeId)
          .eq('date', dateStr);
      } else {
        // Insert new record
        result = await supabase
          .from('daily_salary_payments')
          .insert({
            employee_id: employeeId,
            date: dateStr,
            amount: amount,
            is_paid: newStatus,
            updated_at: new Date().toISOString(),
          });
      }

      if (result.error) {
        console.error('Database error:', result.error);
        throw result.error;
      }

      toast({
        title: newStatus ? 'Marked as Paid' : 'Marked as Unpaid',
        description: `Employee salary for ${format(date, 'MMM dd, yyyy')} has been updated.`,
      });

      // Refresh payments for this date and update local state immediately
      await fetchDailyPayments(dateStr);
      
      // Also update local state immediately for better UX
      setDailyPayments(prev => {
        const updated = { ...prev };
        if (!updated[dateStr]) {
          updated[dateStr] = {};
        }
        updated[dateStr][employeeId] = {
          is_paid: newStatus,
          amount: amount,
        };
        return updated;
      });
    } catch (error: any) {
      console.error('Failed to update payment status:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update payment status. Please try again.',
      });
    } finally {
      setUpdatingPayment(null);
    }
  };

  // Helper function to calculate actual total salary from payment records (adjusted amounts)
  const calculateActualTotalSalary = (date: Date, dayOrders: Order[]) => {
    const dateKey = format(date, 'yyyy-MM-dd');
    let actualTotal = 0;
    
    employees.forEach(emp => {
      const payment = dailyPayments[dateKey]?.[emp.id];
      if (payment) {
        // Use adjusted amount from database
        actualTotal += payment.amount;
      } else {
        // If no payment record exists, calculate it
        const myraEmployee = employees.find(e => 
          e.first_name?.toUpperCase() === 'MYRA' || 
          e.first_name?.toUpperCase() === 'MYRA GAMMAL'
        );
        const isMyra = myraEmployee?.id === emp.id;
        
        // Calculate loads for this employee, handling both single and multiple employee assignments
        let customerLoadsForEmployee = 0;
        
        dayOrders.forEach(order => {
          if (order.orderType === 'internal') return; // Skip internal orders here
          
          // Check if order has multiple employees assigned
          if (order.assignedEmployeeIds && Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length > 0) {
            // Order has multiple employees - divide load equally
            if (order.assignedEmployeeIds.includes(emp.id)) {
              const dividedLoad = order.load / order.assignedEmployeeIds.length;
              customerLoadsForEmployee += dividedLoad;
            }
          } else if (order.assignedEmployeeId === emp.id) {
            // Single employee assignment (backward compatibility)
            customerLoadsForEmployee += order.load;
          } else if (!order.assignedEmployeeId && (!order.assignedEmployeeIds || (Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length === 0))) {
            // Unassigned order - assign to MYRA if she's the only employee (old records)
            if (isMyra && currentEmployees.length === 1) {
              customerLoadsForEmployee += order.load;
            }
          }
        });
        
        // Round to 2 decimal places to avoid floating point errors
        customerLoadsForEmployee = Math.round(customerLoadsForEmployee * 100) / 100;
        
        const customerSalary = customerLoadsForEmployee * SALARY_PER_LOAD;
        
        const internalOrdersForEmployee = dayOrders.filter(
          o => o.orderType === 'internal' && o.assignedEmployeeId === emp.id
        );
        const internalBonus = internalOrdersForEmployee.length * 30;
        
        actualTotal += customerSalary + internalBonus;
      }
    });
    
    return actualTotal;
  };

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex-1">
            <CardTitle>Daily Salary Calculation</CardTitle>
            <CardDescription>
              Salary is calculated at ₱{SALARY_PER_LOAD} per load assigned to each employee. 
              Only orders with status "Ready for Pick Up", "Out for Delivery", "Delivered", "Success", or "Washing" (and beyond) are counted. 
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
                          {employees.length > 0 && (() => {
                            // Find MYRA (the original employee)
                            const myraEmployee = employees.find(e => 
                              e.first_name?.toUpperCase() === 'MYRA' || 
                              e.first_name?.toUpperCase().includes('MYRA')
                            );
                            
                            // Calculate which employees have loads for this day
                            const employeesWithLoads = employees.filter((emp) => {
                              const isMyra = myraEmployee?.id === emp.id;
                              
                              // Calculate loads for this employee, handling both single and multiple employee assignments
                              let customerLoadsForEmployee = 0;
                              
                              orders.forEach(order => {
                                if (order.orderType === 'internal') return; // Skip internal orders here
                                
                                // Check if order has multiple employees assigned
                                if (order.assignedEmployeeIds && Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length > 0) {
                                  // Order has multiple employees - divide load equally
                                  if (order.assignedEmployeeIds.includes(emp.id)) {
                                    const dividedLoad = order.load / order.assignedEmployeeIds.length;
                                    customerLoadsForEmployee += dividedLoad;
                                  }
                                } else if (order.assignedEmployeeId === emp.id) {
                                  // Single employee assignment (backward compatibility)
                                  customerLoadsForEmployee += order.load;
                                } else if (!order.assignedEmployeeId && (!order.assignedEmployeeIds || (Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length === 0))) {
                                  // Unassigned order - assign to MYRA if she's the only employee (old records)
                                  if (isMyra && employees.length === 1) {
                                    customerLoadsForEmployee += order.load;
                                  }
                                }
                              });
                              
                              // Round to 2 decimal places to avoid floating point errors
                              customerLoadsForEmployee = Math.round(customerLoadsForEmployee * 100) / 100;
                              
                              // Internal orders assigned to this employee
                              const internalOrdersForEmployee = orders.filter(
                                o => o.orderType === 'internal' && o.assignedEmployeeId === emp.id
                              );
                              
                              // Employee has loads if they have customer loads or internal orders
                              return customerLoadsForEmployee > 0 || internalOrdersForEmployee.length > 0;
                            });
                            
                            // Only show employees who have loads
                            if (employeesWithLoads.length > 0) {
                              return (
                                <div className="flex gap-2 text-xs text-muted-foreground">
                                  {employeesWithLoads.map((emp) => {
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
                              );
                            }
                            return null;
                          })()}
                        </div>
                        <div className="flex gap-4 text-sm text-right">
                           <span>Loads: <span className="font-bold">{totalLoads}</span></span>
                           <span className="text-primary">Salary: <span className="font-bold">₱{calculateActualTotalSalary(date, orders).toFixed(2)}</span></span>
                        </div>
                    </div>
                </AccordionTrigger>
                <AccordionContent>
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
                           // Handle both single employee assignment (assignedEmployeeId) and multiple employees (assignedEmployeeIds)
                           let customerLoadsForEmployee = 0;
                           
                           // Track unassigned orders for MYRA display
                           const unassignedCustomerOrders = isMyra && employees.length === 1
                             ? orders.filter(
                                 o => o.orderType !== 'internal' && !o.assignedEmployeeId && !o.assignedEmployeeIds
                               )
                             : [];
                           
                           orders.forEach(order => {
                             if (order.orderType === 'internal') return; // Skip internal orders here
                             
                             // Check if order has multiple employees assigned
                             if (order.assignedEmployeeIds && Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length > 0) {
                               // Order has multiple employees - divide load equally
                               if (order.assignedEmployeeIds.includes(emp.id)) {
                                 const dividedLoad = order.load / order.assignedEmployeeIds.length;
                                 customerLoadsForEmployee += dividedLoad;
                               }
                             } else if (order.assignedEmployeeId === emp.id) {
                               // Single employee assignment (backward compatibility)
                               customerLoadsForEmployee += order.load;
                             } else if (!order.assignedEmployeeId && (!order.assignedEmployeeIds || (Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length === 0))) {
                               // Unassigned order - assign to MYRA if she's the only employee (old records)
                               if (isMyra && employees.length === 1) {
                                 customerLoadsForEmployee += order.load;
                               }
                             }
                           });
                           
                           // Round to 2 decimal places to avoid floating point errors
                           customerLoadsForEmployee = Math.round(customerLoadsForEmployee * 100) / 100;
                           
                           const customerSalary = customerLoadsForEmployee * SALARY_PER_LOAD;
                           
                           // Bonus: +30 for each internal order assigned to this employee
                           const internalOrdersForEmployee = orders.filter(
                             o => o.orderType === 'internal' && o.assignedEmployeeId === emp.id
                           );
                           const internalBonus = internalOrdersForEmployee.length * 30;
                           
                           // Total salary = only loads assigned to this employee + internal bonuses
                           const employeeSalary = customerSalary + internalBonus;
                           const paymentKey = `${emp.id}-${dateKey}`;
                           const isEditingAmount = editingPaymentAmount === paymentKey;
                           const currentAmount = payment?.amount ?? employeeSalary;
                           
                           return (
                             <div key={emp.id} className="flex flex-col gap-2 p-3 border rounded-md bg-background">
                               <div className="flex items-center justify-between">
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
                                       Calculated: ₱{employeeSalary.toFixed(2)}
                                     </span>
                                   </div>
                                 </div>
                               </div>
                               <div className="flex items-center gap-2 pt-2 border-t">
                                 <div className="flex-1 min-w-0">
                                   {isEditingAmount ? (
                                     <div className="flex items-center gap-2">
                                       <span className="text-xs text-muted-foreground whitespace-nowrap">Amount:</span>
                                       <Input
                                         type="number"
                                         step="0.01"
                                         min="0"
                                         value={editingPaymentValue}
                                         onChange={(e) => setEditingPaymentValue(e.target.value)}
                                         className="h-8 text-xs flex-1 min-w-[120px] sm:min-w-[150px]"
                                         placeholder="0.00"
                                         disabled={updatingPayment === paymentKey}
                                       />
                                       <Button
                                         size="sm"
                                         variant="ghost"
                                         className="h-8 w-8 p-0"
                                         onClick={() => handleSavePaymentAmount(emp.id, date, isPaid)}
                                         disabled={updatingPayment === paymentKey}
                                       >
                                         {updatingPayment === paymentKey ? (
                                           <Loader2 className="h-3 w-3 animate-spin" />
                                         ) : (
                                           <Check className="h-3 w-3 text-green-600" />
                                         )}
                                       </Button>
                                       <Button
                                         size="sm"
                                         variant="ghost"
                                         className="h-8 w-8 p-0"
                                         onClick={handleCancelEditPaymentAmount}
                                         disabled={updatingPayment === paymentKey}
                                       >
                                         <X className="h-3 w-3 text-red-600" />
                                       </Button>
                                     </div>
                                   ) : (
                                     <div className="flex items-center gap-2">
                                       <span className="text-xs text-muted-foreground whitespace-nowrap">Payment:</span>
                                       <span className="text-sm font-semibold text-primary">
                                         ₱{currentAmount.toFixed(2)}
                                       </span>
                                       {currentAmount !== employeeSalary && (
                                         <span className="text-xs text-muted-foreground">
                                           (adjusted)
                                         </span>
                                       )}
                                       <Button
                                         size="sm"
                                         variant="ghost"
                                         className="h-6 w-6 p-0"
                                         onClick={() => handleEditPaymentAmount(emp.id, date, currentAmount)}
                                         disabled={updatingPayment === paymentKey || isPaid}
                                         title="Edit payment amount"
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
                                 </div>
                                 <Button
                                   size="sm"
                                   variant={isPaid ? "default" : "outline"}
                                   onClick={() => handleTogglePayment(emp.id, date, isPaid, currentAmount)}
                                   disabled={updatingPayment === paymentKey || isEditingAmount}
                                   className={isPaid ? "bg-green-600 hover:bg-green-700" : ""}
                                 >
                                   {updatingPayment === paymentKey ? (
                                     <Loader2 className="h-4 w-4 animate-spin" />
                                   ) : (
                                     isPaid ? 'Paid' : 'Mark Paid'
                                   )}
                                 </Button>
                               </div>
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
                            <TableHead className="text-center">Employee</TableHead>
                            <TableHead className="text-right">Salary Earned</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {[...orders].sort((a, b) => {
                          // Sort by order ID (order number)
                          // Extract numeric part if exists (e.g., "RKR001" -> 1, "RKR002" -> 2)
                          const getOrderNum = (id: string) => {
                            const match = id.match(/\d+$/);
                            return match ? parseInt(match[0], 10) : 0;
                          };
                          const numA = getOrderNum(a.id);
                          const numB = getOrderNum(b.id);
                          if (numA !== numB) {
                            return numA - numB;
                          }
                          // If no numeric part, sort alphabetically
                          return a.id.localeCompare(b.id);
                        }).map((order) => (
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
                            <TableCell className="text-center text-xs">
                              {order.orderType === 'internal' ? (
                                <div className="flex flex-wrap items-center justify-center gap-1">
                                  {(() => {
                                    const assignedEmp = employees.find(e => e.id === order.assignedEmployeeId);
                                    const handleAssign = async (employeeId: string | null) => {
                                      const { error } = await supabase
                                        .from('orders')
                                        .update({ assigned_employee_id: employeeId })
                                        .eq('id', order.id);
                                      if (error) {
                                        toast({
                                          variant: 'destructive',
                                          title: 'Error',
                                          description: 'Failed to update assignment.',
                                        });
                                      } else {
                                        toast({
                                          title: employeeId ? 'Employee assigned' : 'Assignment removed',
                                          description: employeeId ? 'Internal order bonus added.' : 'Internal order bonus removed.',
                                        });
                                        fetchOrders();
                                      }
                                    };
                                    
                                    return (
                                      <>
                                        {assignedEmp ? (
                                          <Button
                                            size="sm"
                                            variant="default"
                                            className="h-6 px-2 text-xs bg-green-600 hover:bg-green-700"
                                            onClick={() => handleAssign(null)}
                                          >
                                            {assignedEmp.first_name} {assignedEmp.last_name} ×
                                          </Button>
                                        ) : (
                                          <Button
                                            size="sm"
                                            variant="outline"
                                            className="h-6 px-2 text-xs"
                                            onClick={() => handleAssign(null)}
                                            disabled
                                          >
                                            Unassigned
                                          </Button>
                                        )}
                                        {employees.map((emp) => {
                                          if (assignedEmp && emp.id === assignedEmp.id) return null;
                                          return (
                                            <Button
                                              key={emp.id}
                                              size="sm"
                                              variant="outline"
                                              className="h-6 px-2 text-xs"
                                              onClick={() => handleAssign(emp.id)}
                                            >
                                              {emp.first_name} {emp.last_name}
                                            </Button>
                                          );
                                        })}
                                      </>
                                    );
                                  })()}
                                </div>
                              ) : (
                                (() => {
                                  // Check for multiple employees assigned
                                  if (order.assignedEmployeeIds && order.assignedEmployeeIds.length > 0) {
                                    const assignedEmps = employees.filter(e => order.assignedEmployeeIds!.includes(e.id));
                                    if (assignedEmps.length > 0) {
                                      return (
                                        <div className="flex flex-wrap items-center justify-center gap-1">
                                          {assignedEmps.map((emp) => (
                                            <span key={emp.id} className="text-xs">
                                              {emp.first_name} {emp.last_name}
                                            </span>
                                          ))}
                                        </div>
                                      );
                                    }
                                  }
                                  // Check for single employee assignment (backward compatibility)
                                  const assignedEmp = employees.find(e => e.id === order.assignedEmployeeId);
                                  return assignedEmp ? (
                                    <span className="text-xs">{assignedEmp.first_name} {assignedEmp.last_name}</span>
                                  ) : (
                                    <span className="text-xs text-muted-foreground">Unassigned</span>
                                  );
                                })()
                              )}
                            </TableCell>
                            <TableCell className="text-right text-xs">
                              {order.orderType === 'internal' && order.assignedEmployeeId ? (
                                <span className="text-green-600 font-semibold">₱30.00</span>
                              ) : order.orderType === 'internal' ? (
                                <span className="text-muted-foreground">₱0.00</span>
                              ) : (
                                `₱${(order.load * SALARY_PER_LOAD).toFixed(2)}`
                              )}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4} className="font-bold text-xs">Total</TableCell>
                                <TableCell className="text-center font-bold text-xs">{totalLoads}</TableCell>
                                <TableCell className="text-right font-bold text-xs">₱{calculateActualTotalSalary(date, orders).toFixed(2)}</TableCell>
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
