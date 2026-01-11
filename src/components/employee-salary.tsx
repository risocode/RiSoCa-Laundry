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
import { Loader2, Inbox, Check, X, Layers, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { format, startOfDay, addDays } from 'date-fns';
import { supabase } from '@/lib/supabase-client';
import { useToast } from '@/hooks/use-toast';
import { useEmployees } from '@/hooks/use-employees';
import type { Order } from '@/components/order-list';
import type { DailySalary, Employee, DailyPaymentStatus } from './employee-salary/types';
import { SALARY_PER_LOAD, ELIGIBLE_STATUSES } from './employee-salary/types';
import { fetchOrders, fetchAllDailyPayments, fetchDailyPayments } from './employee-salary/fetch-data';
import { groupOrdersByDate, calculateActualTotalSalary, calculateEmployeeLoads, calculateEmployeeSalary } from './employee-salary/calculate-salary';
import { autoSaveDailySalaries } from './employee-salary/auto-save-salaries';
import { savePaymentAmount, togglePaymentStatus } from './employee-salary/payment-handlers';
import { saveLoadCompletion } from './employee-salary/load-completion-handlers';
import { LoadDetailsDialog } from '@/components/load-details-dialog';
import type { LoadCompletionData } from './employee-salary/types';
import { createOrderWithHistory, fetchLatestOrderId, generateNextOrderId } from '@/lib/api/orders';

export function EmployeeSalary() {
  const [orders, setOrders] = useState<Order[]>([]);
  const { employees } = useEmployees();
  const [loading, setLoading] = useState(true);
  const [editingDateOrderId, setEditingDateOrderId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const [dailyPayments, setDailyPayments] = useState<Record<string, DailyPaymentStatus>>({});
  const [updatingPayment, setUpdatingPayment] = useState<string | null>(null);
  const [editingPaymentAmount, setEditingPaymentAmount] = useState<string | null>(null);
  const [editingPaymentValue, setEditingPaymentValue] = useState<string>('');
  const [lastManualSave, setLastManualSave] = useState<Record<string, number>>({}); // Track manual saves by payment key
  const [loadDialogOrder, setLoadDialogOrder] = useState<Order | null>(null);
  const [loadDialogEmployeeId, setLoadDialogEmployeeId] = useState<string | null>(null);
  const [loadDialogDate, setLoadDialogDate] = useState<Date | null>(null);
  const { toast } = useToast();

  const loadOrders = async () => {
    setLoading(true);
    try {
      const mapped = await fetchOrders();
      setOrders(mapped);
    } catch (error) {
      console.error("Failed to load orders", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    loadAllDailyPayments();
  }, []);

  const loadAllDailyPayments = async () => {
    try {
      const paymentsByDate = await fetchAllDailyPayments();
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
  // Skip auto-save if a manual save happened recently (within last 2 seconds)
  useEffect(() => {
    if (orders.length === 0 || employees.length === 0) return;
    
    // Check if any manual saves happened recently
    const now = Date.now();
    const recentManualSaves = Object.values(lastManualSave).some(timestamp => now - timestamp < 2000);
    if (recentManualSaves) {
      // Skip auto-save if manual save happened recently to prevent overwriting
      return;
    }
    
    // Get unique dates from orders
    const uniqueDates = new Set<string>();
    orders.forEach((order) => {
      const dateKey = format(startOfDay(new Date(order.orderDate)), 'yyyy-MM-dd');
      uniqueDates.add(dateKey);
    });
    
    autoSaveDailySalaries(Array.from(uniqueDates), orders, employees).then(() => {
      Array.from(uniqueDates).forEach(dateStr => {
        loadDailyPayments(dateStr);
      });
    });
  }, [orders, employees, lastManualSave]);

  const loadDailyPayments = async (dateStr: string) => {
    try {
      const payments = await fetchDailyPayments(dateStr);
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
      await loadOrders();
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

  const completedOrdersByDate = groupOrdersByDate(orders);

  const dailySalaries: DailySalary[] = Object.entries(completedOrdersByDate)
    .map(([dateStr, orders]) => {
        // Only count customer orders that are assigned to employees (exclude internal and unassigned)
        const assignedCustomerOrders = orders.filter(o => {
          if (o.orderType === 'internal') return false; // Exclude internal orders
          // Must have at least one employee assigned
          return (o.assignedEmployeeIds && Array.isArray(o.assignedEmployeeIds) && o.assignedEmployeeIds.length > 0) ||
                 o.assignedEmployeeId !== null;
        });
        const totalLoads = assignedCustomerOrders.reduce((sum, o) => sum + o.load, 0);
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

    // Check if amount changed
    const dateKey = format(date, 'yyyy-MM-dd');
    const payment = dailyPayments[dateKey]?.[employeeId];
    const currentAmount = (payment?.amount && payment.amount > 0) ? payment.amount : calculateEmployeeSalary(
      groupOrdersByDate(orders)[dateKey] || [],
      employees.find(e => e.id === employeeId)!,
      employees,
      dailyPayments
    );
    if (Math.abs(amount - currentAmount) < 0.01) {
      // No change, just cancel
      setEditingPaymentAmount(null);
      setEditingPaymentValue('');
      return;
    }

    setUpdatingPayment(paymentKey);

    try {
      // Mark this as a manual save to prevent auto-save from overwriting
      setLastManualSave(prev => ({
        ...prev,
        [paymentKey]: Date.now()
      }));

      await savePaymentAmount(
        employeeId,
        date,
        amount,
        currentStatus,
        toast,
        (dateStr, payments) => {
          setDailyPayments(prev => {
            const updated = { ...prev };
            updated[dateStr] = payments;
            return updated;
          });
        }
      );
      
      setEditingPaymentAmount(null);
      setEditingPaymentValue('');
      
      // Clear the manual save flag after 3 seconds (auto-save can run again after that)
      setTimeout(() => {
        setLastManualSave(prev => {
          const updated = { ...prev };
          delete updated[paymentKey];
          return updated;
        });
      }, 3000);
    } catch (error: any) {
      console.error('Failed to update payment amount:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'Failed to update payment amount. Please try again.',
      });
      // Remove manual save flag on error
      setLastManualSave(prev => {
        const updated = { ...prev };
        delete updated[paymentKey];
        return updated;
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
      await togglePaymentStatus(
        employeeId,
        date,
        currentStatus,
        amount,
        toast,
        (dateStr, payments) => {
          setDailyPayments(prev => {
            const updated = { ...prev };
            updated[dateStr] = payments;
            return updated;
          });
        }
      );
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

  const handleOpenLoadDetails = (order: Order, date: Date, employeeId: string) => {
    setLoadDialogOrder(order);
    setLoadDialogDate(date);
    setLoadDialogEmployeeId(employeeId);
  };

  const handleCloseLoadDetails = () => {
    setLoadDialogOrder(null);
    setLoadDialogDate(null);
    setLoadDialogEmployeeId(null);
  };

  const calculateTotalFromLoads = (loads: number, servicePackage: string, distance: number): number => {
    const baseCost = loads * 180;
    const needsLocation = servicePackage === 'package2' || servicePackage === 'package3';
    const isFree = needsLocation && distance > 0 && distance <= 0.5;
    
    let transportFee = 0;
    if (!isFree && needsLocation) {
      const billableDistance = Math.max(0, distance - 1);
      if (servicePackage === 'package2') {
        transportFee = billableDistance * 20;
      } else if (servicePackage === 'package3') {
        transportFee = billableDistance * 20 * 2;
      }
    }
    
    return baseCost + transportFee;
  };

  const handleSaveLoadCompletion = async (loadCompletion: LoadCompletionData) => {
    console.log('[handleSaveLoadCompletion] Starting save operation', {
      hasOrder: !!loadDialogOrder,
      hasDate: !!loadDialogDate,
      hasEmployeeId: !!loadDialogEmployeeId,
      orderId: loadDialogOrder?.id,
    });

    if (!loadDialogOrder || !loadDialogDate || !loadDialogEmployeeId) {
      console.warn('[handleSaveLoadCompletion] Missing required data, aborting');
      return;
    }

    try {
      const dateStr = format(loadDialogDate, 'yyyy-MM-dd');
      console.log('[handleSaveLoadCompletion] Saving load completion data', { dateStr, employeeId: loadDialogEmployeeId });
      
      await saveLoadCompletion(
        loadDialogEmployeeId,
        loadDialogDate,
        loadCompletion,
        toast,
        (dateStr, payments) => {
          setDailyPayments(prev => {
            const updated = { ...prev };
            updated[dateStr] = payments;
            return updated;
          });
        }
      );

      console.log('[handleSaveLoadCompletion] Load completion saved successfully');

      // Check if there are incomplete loads for this order
      const orderCompletion = loadCompletion[loadDialogOrder.id];
      const incompleteLoads = orderCompletion?.incomplete_loads || [];
      const nextDayEmployeeId = orderCompletion?.next_day_employee_id || null;

      console.log('[handleSaveLoadCompletion] Checking for incomplete loads', {
        incompleteLoadsCount: incompleteLoads.length,
        incompleteLoads,
        nextDayEmployeeId,
      });

      // If there are incomplete loads, create a new order for tomorrow
      // NOTE: The original order is NOT modified - it remains unchanged in the main dashboard
      // Only the load_completion data is used for salary calculations
      if (incompleteLoads.length > 0) {
        const tomorrow = startOfDay(addDays(loadDialogDate, 1));
        const incompleteLoadCount = incompleteLoads.length;
        
        console.log('[handleSaveLoadCompletion] Creating order for tomorrow', {
          tomorrow: tomorrow.toISOString(),
          incompleteLoadCount,
        });

        // Generate new order ID for tomorrow's order
        const { latestId, error: idError } = await fetchLatestOrderId();
        
        if (idError) {
          console.error('[handleSaveLoadCompletion] Failed to generate order ID:', idError);
          toast({
            variant: 'destructive',
            title: 'Error',
            description: `Failed to generate order ID for tomorrow's order: ${idError.message || 'Unknown error'}. Please try again.`,
          });
          // Continue to finally block - don't return early
        } else if (latestId !== null) {
          try {
            const newOrderId = generateNextOrderId(latestId);
            console.log('[handleSaveLoadCompletion] Generated new order ID', { newOrderId });
            
            // Calculate values for tomorrow's order
            const incompleteWeight = incompleteLoadCount * 7.5;
            const incompleteTotal = calculateTotalFromLoads(
              incompleteLoadCount,
              loadDialogOrder.servicePackage,
              loadDialogOrder.distance || 0
            );
            
            // Determine employee assignment for the new order
            const assignedEmployeeId = nextDayEmployeeId || loadDialogEmployeeId;
            
            if (!assignedEmployeeId) {
              console.error('[handleSaveLoadCompletion] No employee ID available for new order');
              toast({
                variant: 'destructive',
                title: 'Error',
                description: 'No employee assigned for tomorrow\'s order. Please assign an employee.',
              });
              // Continue to finally block
            } else {
              console.log('[handleSaveLoadCompletion] Creating order with data', {
                newOrderId,
                assignedEmployeeId,
                incompleteLoadCount,
                incompleteWeight,
                incompleteTotal,
              });

              // Create the new order for tomorrow
              const { error: createError } = await createOrderWithHistory({
                id: newOrderId,
                customer_id: loadDialogOrder.userId || 'admin-manual',
                customer_name: loadDialogOrder.customerName,
                contact_number: loadDialogOrder.contactNumber,
                service_package: loadDialogOrder.servicePackage as 'package1' | 'package2' | 'package3',
                weight: incompleteWeight,
                loads: incompleteLoadCount,
                distance: loadDialogOrder.distance ?? null,
                delivery_option: loadDialogOrder.deliveryOption ?? null,
                status: 'Partial Complete',
                total: incompleteTotal,
                is_paid: false,
                order_type: loadDialogOrder.orderType || 'customer',
                assigned_employee_id: assignedEmployeeId,
                assigned_employee_ids: assignedEmployeeId ? [assignedEmployeeId] : undefined,
                created_at: tomorrow.toISOString(),
              });

              if (createError) {
                console.error('[handleSaveLoadCompletion] Failed to create order for tomorrow:', createError);
                toast({
                  variant: 'destructive',
                  title: 'Error',
                  description: `Failed to create order for tomorrow: ${createError.message || 'Unknown error'}. Please try again.`,
                });
              } else {
                console.log('[handleSaveLoadCompletion] Order created successfully for tomorrow', { newOrderId });
                toast({
                  title: 'Order Created for Tomorrow',
                  description: `New order #${newOrderId} created for tomorrow with ${incompleteLoadCount} load${incompleteLoadCount > 1 ? 's' : ''}. The original order remains unchanged.`,
                });
              }
            }
          } catch (orderCreationError: any) {
            console.error('[handleSaveLoadCompletion] Exception creating order for tomorrow:', orderCreationError);
            toast({
              variant: 'destructive',
              title: 'Error',
              description: `Failed to create order for tomorrow: ${orderCreationError.message || 'Unknown error'}. Please try again.`,
            });
            // Continue execution - we've saved the load completion, just failed to create tomorrow's order
          }
        } else {
          console.warn('[handleSaveLoadCompletion] Latest order ID is null, cannot generate new ID');
          toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to generate order ID: No existing orders found. Please try again.',
          });
        }
      } else {
        console.log('[handleSaveLoadCompletion] No incomplete loads, skipping order creation');
      }

      // Refresh orders to recalculate salaries (wrap in try-catch to prevent blocking)
      console.log('[handleSaveLoadCompletion] Refreshing orders');
      try {
        await loadOrders();
        console.log('[handleSaveLoadCompletion] Orders refreshed successfully');
      } catch (loadError) {
        console.error('[handleSaveLoadCompletion] Error refreshing orders:', loadError);
        // Non-critical error, don't block dialog closure
      }
    } catch (error: any) {
      console.error('[handleSaveLoadCompletion] Failed to save load completion:', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to save load completion: ${error.message || 'Unknown error'}. Please try again.`,
      });
    } finally {
      console.log('[handleSaveLoadCompletion] Closing dialog (finally block)');
      // Always close the dialog, even if there were errors
      handleCloseLoadDetails();
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
              Only orders with status "Ready for Pick Up", "Out for Delivery", "Delivered", "Success", "Partial Complete", or "Washing" (and beyond) are counted. 
              Old unassigned orders are automatically counted for MYRA (the original employee).
            </CardDescription>
          </div>
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
                              // Only count orders with eligible statuses: Ready for Pick Up, Out for Delivery, Delivered, Success
                              let customerLoadsForEmployee = 0;
                              
                              const eligibleOrders = orders.filter(order => 
                                ELIGIBLE_STATUSES.includes(order.status)
                              );
                              
                              eligibleOrders.forEach(order => {
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
                           <span className="text-primary">Salary: <span className="font-bold">₱{calculateActualTotalSalary(date, orders, employees, dailyPayments).toFixed(2)}</span></span>
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
                           
                           const customerLoadsForEmployee = calculateEmployeeLoads(orders, emp, employees, dailyPayments);
                           const customerSalary = customerLoadsForEmployee * SALARY_PER_LOAD;
                           
                           const internalOrdersForEmployee = orders.filter(
                             o => o.orderType === 'internal' && o.assignedEmployeeId === emp.id
                           );
                           const internalBonus = internalOrdersForEmployee.length * 30;
                           
                           const employeeSalary = calculateEmployeeSalary(orders, emp, employees, dailyPayments);
                           
                           const unassignedCustomerOrders = isMyra && employees.length === 1
                             ? orders.filter(
                                 o => o.orderType !== 'internal' && !o.assignedEmployeeId && !o.assignedEmployeeIds
                               )
                             : [];
                           const paymentKey = `${emp.id}-${dateKey}`;
                           const isEditingAmount = editingPaymentAmount === paymentKey;
                           // Use payment amount from database if it exists and is not 0, otherwise use calculated salary
                           // This preserves manually edited amounts while defaulting to calculated salary
                           // If amount is 0, treat it as unset and use calculated
                           const currentAmount = (payment?.amount && payment.amount > 0) ? payment.amount : employeeSalary;
                           
                           return (
                             <div key={emp.id} className="flex flex-col gap-2 p-3 border rounded-md bg-background">
                               <div className="flex items-center justify-between">
                                 <div className="flex flex-col">
                                   <span className="text-sm font-medium">
                                     {emp.first_name || ''}
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
                                         disabled={updatingPayment === paymentKey || (() => {
                                           const amount = parseFloat(editingPaymentValue);
                                           if (isNaN(amount) || amount < 0) return true;
                                           return Math.abs(amount - currentAmount) < 0.01;
                                         })()}
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
                            <TableCell className="text-center text-xs">
                              {order.orderType === 'internal' ? (
                                order.load
                              ) : (() => {
                                // Find the first assigned employee for this order
                                const assignedEmployeeId = order.assignedEmployeeIds?.[0] || order.assignedEmployeeId;
                                if (!assignedEmployeeId) {
                                  return order.load;
                                }
                                return (
                                  <button
                                    type="button"
                                    onClick={() => handleOpenLoadDetails(order, date, assignedEmployeeId)}
                                    className="underline hover:no-underline text-primary font-medium cursor-pointer"
                                    title="Edit load completion"
                                  >
                                    {order.load}
                                  </button>
                                );
                              })()}
                            </TableCell>
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
                                            {assignedEmp.first_name} ×
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
                                              {emp.first_name}
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
                                              {emp.first_name}
                                            </span>
                                          ))}
                                        </div>
                                      );
                                    }
                                  }
                                  // Check for single employee assignment (backward compatibility)
                                  const assignedEmp = employees.find(e => e.id === order.assignedEmployeeId);
                                  return assignedEmp ? (
                                    <span className="text-xs">{assignedEmp.first_name}</span>
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
                              ) : (() => {
                                // Check if order is assigned to any employee
                                const hasAssignment = (order.assignedEmployeeIds && Array.isArray(order.assignedEmployeeIds) && order.assignedEmployeeIds.length > 0) ||
                                                     order.assignedEmployeeId !== null;
                                // If unassigned, show ₱0.00, otherwise calculate salary
                                return hasAssignment 
                                  ? `₱${(order.load * SALARY_PER_LOAD).toFixed(2)}`
                                  : <span className="text-muted-foreground">₱0.00</span>;
                              })()}
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                         <TableFooter>
                            <TableRow>
                                <TableCell colSpan={4} className="font-bold text-xs">Total</TableCell>
                                <TableCell className="text-center font-bold text-xs">{totalLoads}</TableCell>
                                <TableCell className="text-right font-bold text-xs">₱{calculateActualTotalSalary(date, orders, employees, dailyPayments).toFixed(2)}</TableCell>
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
      {loadDialogOrder && loadDialogDate && loadDialogEmployeeId && (
        <LoadDetailsDialog
          isOpen={!!loadDialogOrder}
          onClose={handleCloseLoadDetails}
          order={loadDialogOrder}
          date={loadDialogDate}
          employeeId={loadDialogEmployeeId}
          loadCompletion={(() => {
            const dateStr = format(loadDialogDate, 'yyyy-MM-dd');
            return dailyPayments[dateStr]?.[loadDialogEmployeeId]?.load_completion;
          })()}
          onSave={handleSaveLoadCompletion}
        />
      )}
    </Card>
  );
}
