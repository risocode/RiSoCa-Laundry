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
import { Loader2, Inbox, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
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

export function EmployeeSalary() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingDateOrderId, setEditingDateOrderId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [updatingOrderId, setUpdatingOrderId] = useState<string | null>(null);
  const { toast } = useToast();

  const fetchOrders = async () => {
    setLoading(true);
    // Fetch all orders, we'll filter by status and is_paid in the component
    const { data, error } = await supabase
      .from('orders')
      .select('*');
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
    }));
    setOrders(mapped);
    setLoading(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

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
    .filter((order) => 
      order.status === 'Success' || 
      order.status === 'Delivered' || 
      order.isPaid === true
    )
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
        return {
            date: new Date(dateStr),
            orders: orders,
            totalLoads: totalLoads,
            totalSalary: totalLoads * SALARY_PER_LOAD,
        };
    })
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  return (
    <Card className="w-full">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle>Daily Salary Calculation</CardTitle>
        <CardDescription>Salary is calculated at ₱{SALARY_PER_LOAD} per completed load for each day.</CardDescription>
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
                        <span className="font-semibold">{format(date, 'PPP')}</span>
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
                            <TableCell className="text-xs">{order.customerName}</TableCell>
                            <TableCell className="text-center text-xs">{order.load}</TableCell>
                            <TableCell className="text-right text-xs">₱{(order.load * SALARY_PER_LOAD).toFixed(2)}</TableCell>
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
