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
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, Inbox, ChevronDown, Search, Users, Package, DollarSign, TrendingUp, Phone, Calendar, Filter } from 'lucide-react';
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
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'name' | 'visits' | 'total' | 'amount'>('name');

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

    // Convert to array and sort
    let sorted = Array.from(customerMap.values());
    
    // Apply sorting
    switch (sortBy) {
      case 'visits':
        sorted.sort((a, b) => b.visits - a.visits);
        break;
      case 'total':
        sorted.sort((a, b) => b.totalLoads - a.totalLoads);
        break;
      case 'amount':
        sorted.sort((a, b) => b.totalAmountPaid - a.totalAmountPaid);
        break;
      case 'name':
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    
    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      sorted = sorted.filter(customer => 
        customer.name.toLowerCase().includes(query) ||
        customer.contactNumber.toLowerCase().includes(query)
      );
    }
    
    return sorted;
  }, [orders, sortBy, searchQuery]);
  
  // Calculate statistics
  const stats = useMemo(() => {
    const totalCustomers = customers.length;
    const totalVisits = customers.reduce((sum, c) => sum + c.visits, 0);
    const totalLoads = customers.reduce((sum, c) => sum + c.totalLoads, 0);
    const totalRevenue = customers.reduce((sum, c) => sum + c.totalAmountPaid, 0);
    
    return { totalCustomers, totalVisits, totalLoads, totalRevenue };
  }, [customers]);

  const toggleExpand = (customerName: string) => {
    setExpandedCustomer(expandedCustomer === customerName ? null : customerName);
  };

  return (
    <div className="w-full space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-2 hover:border-primary/50 transition-all shadow-lg bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Customers</p>
                <p className="text-2xl font-bold text-primary">{stats.totalCustomers}</p>
              </div>
              <div className="p-3 rounded-lg bg-blue-500/20">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all shadow-lg bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Visits</p>
                <p className="text-2xl font-bold text-primary">{stats.totalVisits}</p>
              </div>
              <div className="p-3 rounded-lg bg-green-500/20">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all shadow-lg bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Loads</p>
                <p className="text-2xl font-bold text-primary">{stats.totalLoads}</p>
              </div>
              <div className="p-3 rounded-lg bg-purple-500/20">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 hover:border-primary/50 transition-all shadow-lg bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-2xl font-bold text-primary">₱{stats.totalRevenue.toFixed(0)}</p>
              </div>
              <div className="p-3 rounded-lg bg-amber-500/20">
                <DollarSign className="h-6 w-6 text-amber-600 dark:text-amber-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Customers Card */}
      <Card className="w-full transition-all duration-300 shadow-xl border-2">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                <Users className="h-6 w-6 text-primary" />
                Customers
              </CardTitle>
              <CardDescription className="text-sm mt-1">
                View all customers and their transaction history
              </CardDescription>
            </div>
            
            {/* Search and Filter */}
            <div className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-1 sm:w-64">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search customers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
                  className="px-3 py-2 rounded-md border bg-background text-sm"
                >
                  <option value="name">Sort by Name</option>
                  <option value="visits">Sort by Visits</option>
                  <option value="total">Sort by Loads</option>
                  <option value="amount">Sort by Revenue</option>
                </select>
              </div>
            </div>
          </div>
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
                <TableRow className="bg-muted/50">
                  <TableHead className="text-left px-4 py-4 min-w-[200px] font-semibold">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      Customer Name
                    </div>
                  </TableHead>
                  <TableHead className="text-center px-4 py-4 w-[100px] font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Calendar className="h-4 w-4" />
                      Visits
                    </div>
                  </TableHead>
                  <TableHead className="text-center px-4 py-4 w-[120px] font-semibold">
                    <div className="flex items-center justify-center gap-2">
                      <Package className="h-4 w-4" />
                      Total Loads
                    </div>
                  </TableHead>
                  <TableHead className="text-right px-4 py-4 min-w-[140px] whitespace-nowrap font-semibold">
                    Total Weight (kg)
                  </TableHead>
                  <TableHead className="text-right px-4 py-4 min-w-[160px] whitespace-nowrap font-semibold">
                    <div className="flex items-center justify-end gap-2">
                      <DollarSign className="h-4 w-4" />
                      Total Revenue
                    </div>
                  </TableHead>
                  <TableHead className="w-[60px] px-4 py-4"></TableHead>
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
                        className="hover:bg-muted/50 transition-colors border-b"
                      >
                        <TableCell className="text-left px-4 py-4 align-top min-w-[200px]">
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs font-bold text-primary">
                                  {customer.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <span className="font-semibold break-words">{customer.name}</span>
                            </div>
                            {customer.contactNumber && (
                              <div className="flex items-center gap-1.5 text-xs text-muted-foreground ml-10">
                                <Phone className="h-3 w-3" />
                                <span className="break-words">{customer.contactNumber}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-center px-4 py-4 align-middle w-[100px]">
                          <Badge variant="secondary" className="font-semibold">
                            {customer.visits}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center px-4 py-4 align-middle w-[120px]">
                          <Badge variant="outline" className="font-semibold">
                            {customer.totalLoads}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right px-4 py-4 align-middle min-w-[140px] whitespace-nowrap">
                          <span className="font-medium">{customer.totalWeight.toFixed(2)} kg</span>
                        </TableCell>
                        <TableCell className="text-right px-4 py-4 align-middle min-w-[160px] whitespace-nowrap">
                          <span className="font-bold text-primary text-lg">
                            ₱{customer.totalAmountPaid.toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell className="px-4 py-4 align-middle w-[60px]">
                          {hasMultipleTransactions && (
                            <button
                              onClick={() => toggleExpand(customer.name)}
                              className="h-9 w-9 flex items-center justify-center hover:bg-primary/10 rounded-lg transition-all hover:scale-110"
                            >
                              <ChevronDown 
                                className={cn(
                                  "h-5 w-5 text-primary transition-transform duration-200",
                                  isExpanded && "rotate-180"
                                )} 
                              />
                            </button>
                          )}
                        </TableCell>
                      </TableRow>
                      {isExpanded && hasMultipleTransactions && (
                        <TableRow>
                          <TableCell colSpan={6} className="p-0 bg-gradient-to-br from-muted/50 to-muted/30 border-t-2">
                            <div className="p-5 sm:p-6">
                              <div className="flex items-center justify-between mb-4">
                                <h4 className="text-base font-semibold flex items-center gap-2">
                                  <Package className="h-5 w-5 text-primary" />
                                  Transaction History
                                  <Badge variant="secondary" className="ml-2">
                                    {customer.transactions.length} {customer.transactions.length === 1 ? 'order' : 'orders'}
                                  </Badge>
                                </h4>
                              </div>
                              <Separator className="mb-4" />
                              <div className="overflow-x-auto">
                                <div className="min-w-[600px]">
                                  {/* Header Row */}
                                  <div className="grid grid-cols-5 gap-3 sm:gap-4 text-xs font-semibold text-muted-foreground pb-3 border-b mb-3">
                                    <div className="text-left min-w-[120px] flex items-center gap-2">
                                      <Calendar className="h-3 w-3" />
                                      Date
                                    </div>
                                    <div className="text-center min-w-[80px] flex items-center justify-center gap-2">
                                      <Package className="h-3 w-3" />
                                      Loads
                                    </div>
                                    <div className="text-right min-w-[100px] whitespace-nowrap">Weight (kg)</div>
                                    <div className="text-right min-w-[120px] whitespace-nowrap flex items-center justify-end gap-2">
                                      <DollarSign className="h-3 w-3" />
                                      Amount Paid
                                    </div>
                                    <div className="text-center min-w-[120px]">Order ID</div>
                                  </div>
                                  {/* Transaction Rows */}
                                  <div className="space-y-2">
                                    {customer.transactions.map((transaction, idx) => (
                                      <div
                                        key={`${transaction.orderId}-${idx}`}
                                        className="grid grid-cols-5 gap-3 sm:gap-4 text-sm py-3 px-2 rounded-lg hover:bg-background/50 transition-colors border border-transparent hover:border-border"
                                      >
                                        <div className="text-left min-w-[120px] flex items-center">
                                          <span className="font-medium">{format(transaction.date, 'MMM dd, yyyy')}</span>
                                        </div>
                                        <div className="text-center min-w-[80px]">
                                          <Badge variant="outline" className="font-semibold">
                                            {transaction.loads}
                                          </Badge>
                                        </div>
                                        <div className="text-right min-w-[100px] whitespace-nowrap">
                                          <span className="font-medium">{transaction.weight.toFixed(2)} kg</span>
                                        </div>
                                        <div className="text-right min-w-[120px] whitespace-nowrap">
                                          <span className="font-bold text-primary">₱{transaction.amountPaid.toFixed(2)}</span>
                                        </div>
                                        <div className="text-center min-w-[120px]">
                                          <code className="text-xs text-muted-foreground break-all bg-muted px-2 py-1 rounded">
                                            {transaction.orderId}
                                          </code>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
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
          <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground py-12">
            <div className="p-4 rounded-full bg-muted mb-4">
              <Inbox className="h-12 w-12" />
            </div>
            <p className="text-lg font-semibold mb-1">No customers found</p>
            <p className="text-sm">
              {searchQuery ? 'Try adjusting your search query' : 'No customer data available yet'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </div>
  );
}
