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
} from '@/components/ui/table';
import { Loader2, Inbox, ChevronDown } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';
import { format, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

type Order = {
  id: string;
  customer_name: string;
  contact_number: string;
  loads: number;
  weight: number;
  total: number;
  is_paid: boolean;
  created_at: string;
};

type CustomerTransaction = {
  date: Date;
  loads: number;
  weight: number;
  amountPaid: number;
  orderId: string;
};

type CustomerData = {
  name: string;
  contactNumber: string;
  visits: number;
  totalLoads: number;
  totalWeight: number;
  totalAmountPaid: number;
  transactions: CustomerTransaction[];
};

export default function AdminCustomersPage() {
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedCustomer, setExpandedCustomer] = useState<string | null>(null);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, customer_name, contact_number, loads, weight, total, is_paid, created_at')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Failed to load orders', error);
        toast({
          variant: 'destructive',
          title: 'Load error',
          description: 'Could not load customer data.',
        });
        setLoading(false);
        return;
      }

      setOrders((data ?? []) as Order[]);
    } catch (error) {
      console.error('Error fetching orders', error);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch customer data.',
      });
    } finally {
      setLoading(false);
    }
  };

  // Group customers by name and calculate aggregates
  const customers = useMemo(() => {
    const customerMap = new Map<string, CustomerData>();

    orders.forEach((order) => {
      const customerName = order.customer_name || 'Unknown';
      const contactNumber = order.contact_number || '';
      
      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          name: customerName,
          contactNumber: contactNumber,
          visits: 0,
          totalLoads: 0,
          totalWeight: 0,
          totalAmountPaid: 0,
          transactions: [],
        });
      }

      const customer = customerMap.get(customerName)!;
      const orderDate = startOfDay(new Date(order.created_at));
      const amountPaid = order.is_paid ? order.total : 0;

      // Update contact number if this order has one and current is empty
      if (contactNumber && !customer.contactNumber) {
        customer.contactNumber = contactNumber;
      }

      // Check if this is a unique visit date
      const isNewVisit = !customer.transactions.some(
        (t) => startOfDay(t.date).getTime() === orderDate.getTime()
      );

      if (isNewVisit) {
        customer.visits += 1;
      }

      customer.totalLoads += order.loads || 0;
      customer.totalWeight += order.weight || 0;
      customer.totalAmountPaid += amountPaid;

      customer.transactions.push({
        date: new Date(order.created_at),
        loads: order.loads || 0,
        weight: order.weight || 0,
        amountPaid: amountPaid,
        orderId: order.id,
      });
    });

    // Sort transactions by date (newest first) for each customer
    // Update contact number to most recent non-empty one
    customerMap.forEach((customer) => {
      customer.transactions.sort((a, b) => b.date.getTime() - a.date.getTime());
      
      // Find most recent contact number
      const customerOrders = orders.filter(o => (o.customer_name || 'Unknown') === customer.name);
      const ordersWithContact = customerOrders
        .filter(o => o.contact_number)
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      
      if (ordersWithContact.length > 0) {
        customer.contactNumber = ordersWithContact[0].contact_number || '';
      }
    });

    // Convert to array and sort by customer name
    return Array.from(customerMap.values()).sort((a, b) =>
      a.name.localeCompare(b.name)
    );
  }, [orders]);

  const toggleExpand = (customerName: string) => {
    setExpandedCustomer(expandedCustomer === customerName ? null : customerName);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Customers</CardTitle>
        <CardDescription>
          View all customers and their transaction history
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0 sm:p-6">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground py-8">
            <Loader2 className="h-12 w-12 mb-2 animate-spin" />
            <p>Loading customer data...</p>
          </div>
        ) : customers.length > 0 ? (
          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-left px-4 py-3 min-w-[180px]">
                    Customer Name
                  </TableHead>
                  <TableHead className="text-center px-4 py-3 w-[80px]">
                    Visits
                  </TableHead>
                  <TableHead className="text-center px-4 py-3 w-[100px]">
                    Total Loads
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 min-w-[130px] whitespace-nowrap">
                    Total Weight (kg)
                  </TableHead>
                  <TableHead className="text-right px-4 py-3 min-w-[150px] whitespace-nowrap">
                    Total Amount Paid
                  </TableHead>
                  <TableHead className="w-[60px] px-4 py-3"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const isExpanded = expandedCustomer === customer.name;
                  const hasMultipleTransactions = customer.transactions.length > 1;
                  
                  return (
                    <>
                      <TableRow 
                        key={customer.name}
                        className="hover:bg-muted/50"
                      >
                        <TableCell className="text-left px-4 py-3 align-top min-w-[180px]">
                          <div className="flex flex-col">
                            <span className="font-medium break-words">{customer.name}</span>
                            <span className="text-xs text-muted-foreground mt-0.5 break-words">
                              {customer.contactNumber || 'N/A'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-4 py-3 align-middle w-[80px]">
                          {customer.visits}
                        </TableCell>
                        <TableCell className="text-center px-4 py-3 align-middle w-[100px]">
                          {customer.totalLoads}
                        </TableCell>
                        <TableCell className="text-right px-4 py-3 align-middle min-w-[130px] whitespace-nowrap">
                          {customer.totalWeight.toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right px-4 py-3 align-middle min-w-[150px] whitespace-nowrap font-semibold">
                          ₱{customer.totalAmountPaid.toFixed(2)}
                        </TableCell>
                        <TableCell className="px-4 py-3 align-middle w-[60px]">
                          {hasMultipleTransactions && (
                            <button
                              onClick={() => toggleExpand(customer.name)}
                              className="h-8 w-8 flex items-center justify-center hover:bg-muted rounded transition-colors"
                            >
                              <ChevronDown 
                                className={cn(
                                  "h-4 w-4 transition-transform duration-200",
                                  isExpanded && "rotate-180"
                                )} 
                              />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasMultipleTransactions && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0 bg-muted/30">
                            <div className="p-4 sm:p-6">
                              <h4 className="text-sm font-semibold mb-4">
                                Transaction History ({customer.transactions.length} orders)
                              </h4>
                              <div className="overflow-x-auto">
                                <div className="min-w-[600px]">
                                  {/* Header Row */}
                                  <div className="grid grid-cols-5 gap-3 sm:gap-4 text-xs font-medium text-muted-foreground pb-2 border-b mb-2">
                                    <div className="text-left min-w-[110px]">Date</div>
                                    <div className="text-center min-w-[60px]">Loads</div>
                                    <div className="text-right min-w-[90px] whitespace-nowrap">Weight (kg)</div>
                                    <div className="text-right min-w-[100px] whitespace-nowrap">Amount Paid</div>
                                    <div className="text-center min-w-[100px]">Order ID</div>
                                  </div>
                                  {/* Transaction Rows */}
                                  {customer.transactions.map((transaction, idx) => (
                                    <div
                                      key={`${transaction.orderId}-${idx}`}
                                      className="grid grid-cols-5 gap-3 sm:gap-4 text-sm py-2 border-b last:border-0"
                                    >
                                      <div className="text-left min-w-[110px]">
                                        {format(transaction.date, 'MMM dd, yyyy')}
                                      </div>
                                      <div className="text-center min-w-[60px]">
                                        {transaction.loads}
                                      </div>
                                      <div className="text-right min-w-[90px] whitespace-nowrap">
                                        {transaction.weight.toFixed(2)}
                                      </div>
                                      <div className="text-right min-w-[100px] whitespace-nowrap font-medium">
                                        ₱{transaction.amountPaid.toFixed(2)}
                                      </div>
                                      <div className="text-center min-w-[100px] text-xs text-muted-foreground break-all">
                                        {transaction.orderId}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground py-8">
            <Inbox className="h-12 w-12 mb-2" />
            <p>No customers found.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
