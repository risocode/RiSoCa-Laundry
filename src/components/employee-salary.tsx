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
import { Loader2, Inbox } from 'lucide-react';
import type { Order } from '@/components/order-list';
import { format, startOfDay } from 'date-fns';
import { RKR_ORDERS_KEY } from '@/lib/constants';

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

  useEffect(() => {
    try {
        const storedOrders = localStorage.getItem(RKR_ORDERS_KEY);
        if (storedOrders) {
            setOrders(JSON.parse(storedOrders).map((o: Order) => ({...o, orderDate: new Date(o.orderDate)})));
        }
    } catch (error) {
        console.error("Failed to parse orders from localStorage", error);
    }
    setLoading(false);
  }, []);

  const completedOrdersByDate = orders
    .filter((order) => order.status === 'Success' || order.status === 'Delivered')
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
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <Inbox className="h-12 w-12 mb-2" />
            <p>No completed orders found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
