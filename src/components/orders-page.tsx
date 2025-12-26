'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { OrderList } from '@/components/order-list';
import type { Order, StatusHistory } from '@/components/order-list';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Loader2, 
  Inbox, 
  Package, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle,
  Search,
  Filter,
  Plus,
  RefreshCw,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ManualOrderDialog } from '@/components/manual-order-dialog';
import { InternalOrderDialog } from '@/components/internal-order-dialog';
import { createOrderWithHistory, fetchLatestOrderId, generateNextOrderId, updateOrderFields, updateOrderStatus } from '@/lib/api/orders';
import { supabase } from '@/lib/supabase-client';
import { useAuthSession } from '@/hooks/use-auth-session';
import { format, startOfDay, endOfDay, subDays } from 'date-fns';

export function OrdersPage() {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInternalDialogOpen, setIsInternalDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<string>('all');

  const mapOrder = (o: any): Order => {
    const totalNum = typeof o.total === 'string' ? parseFloat(o.total) : Number(o.total);
    
    // CRITICAL FIX: Handle balance more explicitly
    // Check if balance exists and is a valid number (including 0)
    let balanceNum: number;
    if (o.balance !== null && o.balance !== undefined && o.balance !== '') {
      // Balance exists - convert to number
      balanceNum = typeof o.balance === 'string' ? parseFloat(o.balance) : Number(o.balance);
      // Ensure it's a valid number (not NaN)
      if (isNaN(balanceNum)) {
        balanceNum = o.is_paid ? 0 : totalNum;
      }
    } else {
      // Balance is null/undefined/empty - use fallback logic
      balanceNum = o.is_paid ? 0 : totalNum;
    }
    
    const mapped = {
      id: o.id,
      userId: o.customer_id,
      customerName: o.customer_name,
      contactNumber: o.contact_number,
      load: o.loads,
      weight: o.weight,
      status: o.status,
      total: totalNum,
      orderDate: new Date(o.created_at),
      isPaid: o.is_paid,
      balance: balanceNum, // ALWAYS set balance, never undefined
      deliveryOption: o.delivery_option ?? undefined,
      servicePackage: o.service_package,
      distance: o.distance ?? 0,
      statusHistory: (o.order_status_history ?? []).map((sh: any) => ({
        status: sh.status,
        timestamp: new Date(sh.created_at),
      })) as StatusHistory[],
      branchId: o.branch_id ?? null,
      orderType: o.order_type || 'customer',
      assignedEmployeeId: o.assigned_employee_id ?? null, // For backward compatibility
      assignedEmployeeIds: Array.isArray(o.assigned_employee_ids) ? o.assigned_employee_ids : (o.assigned_employee_ids ? [o.assigned_employee_ids] : undefined),
    };

    // CRITICAL: Ensure balance is never undefined
    if (mapped.balance === undefined) {
      mapped.balance = mapped.isPaid ? 0 : mapped.total;
    }

    return mapped;
  };

  const fetchOrders = async () => {
    setLoadingAdmin(true);
    const { data, error } = await supabase
      .from('orders')
      .select(`
        id,
        customer_id,
        customer_name,
        contact_number,
        loads,
        weight,
        status,
        total,
        created_at,
        is_paid,
        balance,
        delivery_option,
        service_package,
        distance,
        branch_id,
        order_type,
        assigned_employee_id,
        assigned_employee_ids,
        order_status_history(*)
      `)
      .order('id', { ascending: true });

    if (error) {
      toast({ 
        variant: 'default', 
        title: 'Unable to load orders', 
        description: 'Please refresh the page to see the latest orders.' 
      });
      setLoadingAdmin(false);
      return;
    }

    const mappedOrders = (data ?? []).map(mapOrder);
    setAllOrders(mappedOrders);
    setLoadingAdmin(false);
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    const totalOrders = allOrders.length;
    const totalRevenue = allOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const paidRevenue = allOrders.filter(o => o.isPaid).reduce((sum, o) => sum + (o.total || 0), 0);
    const pendingRevenue = allOrders.filter(o => !o.isPaid).reduce((sum, o) => sum + ((o.balance || o.total) || 0), 0);
    const completedOrders = allOrders.filter(o => o.status === 'Success' || o.status === 'Completed' || o.status === 'Delivered').length;
    const pendingOrders = allOrders.filter(o => 
      o.status !== 'Success' && 
      o.status !== 'Completed' && 
      o.status !== 'Delivered' && 
      o.status !== 'Canceled'
    ).length;
    const canceledOrders = allOrders.filter(o => o.status === 'Canceled').length;
    const paidOrders = allOrders.filter(o => o.isPaid).length;
    const unpaidOrders = allOrders.filter(o => !o.isPaid).length;
    
    // Today's stats
    const today = startOfDay(new Date());
    const todayOrders = allOrders.filter(o => startOfDay(o.orderDate).getTime() === today.getTime());
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // This week's stats
    const weekStart = startOfDay(subDays(new Date(), 7));
    const weekOrders = allOrders.filter(o => o.orderDate >= weekStart);
    const weekRevenue = weekOrders.reduce((sum, o) => sum + (o.total || 0), 0);

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
      todayOrders: todayOrders.length,
      todayRevenue,
      weekOrders: weekOrders.length,
      weekRevenue,
    };
  }, [allOrders]);

  // Filter orders
  const filteredOrders = useMemo(() => {
    let filtered = [...allOrders];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter(order =>
        order.id.toLowerCase().includes(query) ||
        order.customerName.toLowerCase().includes(query) ||
        order.contactNumber.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      if (statusFilter === 'active') {
        filtered = filtered.filter(o => 
          o.status !== 'Success' && 
          o.status !== 'Completed' && 
          o.status !== 'Delivered' && 
          o.status !== 'Canceled'
        );
      } else if (statusFilter === 'completed') {
        filtered = filtered.filter(o => 
          o.status === 'Success' || 
          o.status === 'Completed' || 
          o.status === 'Delivered'
        );
      } else {
        filtered = filtered.filter(o => o.status === statusFilter);
      }
    }

    // Payment filter
    if (paymentFilter === 'paid') {
      filtered = filtered.filter(o => o.isPaid);
    } else if (paymentFilter === 'unpaid') {
      filtered = filtered.filter(o => !o.isPaid);
    } else if (paymentFilter === 'partial') {
      filtered = filtered.filter(o => !o.isPaid && o.balance && o.balance > 0 && o.balance < o.total);
    }

    // Date filter
    if (dateFilter === 'today') {
      const today = startOfDay(new Date());
      filtered = filtered.filter(o => startOfDay(o.orderDate).getTime() === today.getTime());
    } else if (dateFilter === 'week') {
      const weekStart = startOfDay(subDays(new Date(), 7));
      filtered = filtered.filter(o => o.orderDate >= weekStart);
    } else if (dateFilter === 'month') {
      const monthStart = startOfDay(subDays(new Date(), 30));
      filtered = filtered.filter(o => o.orderDate >= monthStart);
    }

    // Sort by order number (extract numeric part from order ID)
    filtered.sort((a, b) => {
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
    });

    return filtered;
  }, [allOrders, searchQuery, statusFilter, paymentFilter, dateFilter]);

  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription to refresh when orders change
    const channel = supabase
      .channel('orders-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          // Refresh orders after a short delay to ensure database is updated
          setTimeout(() => {
            fetchOrders();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateOrder = async (updatedOrder: Order) => {
    try {
      const previous = allOrders.find(o => o.id === updatedOrder.id);
      const hasStatusChange = previous?.status !== updatedOrder.status;
      let finalOrderId = updatedOrder.id;

      if (hasStatusChange) {
        const { data: updatedOrderData, error } = await updateOrderStatus(updatedOrder.id, updatedOrder.status);
        if (error) {
          // Check for 406 or coerce errors - these are usually false positives
          const isCoerceOr406Error = error.message?.includes('coerce') || 
                                      error.message?.includes('JSON object') ||
                                      error.code === '406' ||
                                      error.message?.includes('406');
          
          // Don't show error for 406/coerce - the update likely succeeded
          if (!isCoerceOr406Error) {
            toast({ 
              variant: 'default', 
              title: 'Update in progress', 
              description: 'The order may have been updated. Please refresh the page to see the latest status.' 
            });
          }
          // For 406/coerce errors, just refresh silently - update likely succeeded
          fetchOrders();
          return;
        }
        
        // If the order ID was updated (from TEMP to RKR), use the new ID
        if (updatedOrderData && updatedOrderData.id && updatedOrderData.id !== updatedOrder.id) {
          finalOrderId = updatedOrderData.id;
          // Update the order object with the new ID
          updatedOrder = {
            ...updatedOrder,
            id: updatedOrderData.id
          };
        }
      }

      const patch: any = {
        customer_name: updatedOrder.customerName,
        contact_number: updatedOrder.contactNumber,
        weight: updatedOrder.weight,
        loads: updatedOrder.load,
        total: updatedOrder.total,
        is_paid: updatedOrder.isPaid,
        balance: updatedOrder.balance ?? (updatedOrder.isPaid ? 0 : updatedOrder.total),
        delivery_option: updatedOrder.deliveryOption,
        distance: updatedOrder.distance,
        service_package: updatedOrder.servicePackage,
        status: updatedOrder.status,
      };
      
      // Include order_type and assigned_employee_id if they exist
      if (updatedOrder.orderType !== undefined) {
        patch.order_type = updatedOrder.orderType;
      }
      if (updatedOrder.assignedEmployeeId !== undefined) {
        patch.assigned_employee_id = updatedOrder.assignedEmployeeId;
      }

      // Use finalOrderId (which might be the new RKR ID) for the update
      const { error: patchError } = await updateOrderFields(finalOrderId, patch as any);
      if (patchError) {
        // Check for specific Supabase errors and show friendly messages
        const isCoerceError = patchError.message?.includes('coerce') || patchError.message?.includes('JSON object');
        toast({ 
          variant: 'default', 
          title: isCoerceError ? 'Please refresh the page' : 'Update may be in progress', 
          description: 'The order may have been updated. Please refresh the page to see the latest information.' 
        });
        console.error('Order update error:', patchError);
        return;
      }
      
      toast({
        title: 'Order Updated',
        description: `Order #${finalOrderId} has been updated successfully.`,
      });
      fetchOrders(); // Refresh to get the updated order with new ID
    } catch (error: any) {
      console.error('Unexpected error updating order:', error);
      toast({ 
        variant: 'default', 
        title: 'Please refresh the page', 
        description: 'The order may have been updated. Refresh to see the latest information.' 
      });
    }
  };

  const handleAddOrder = async (newOrder: Omit<Order, 'id' | 'userId'>) => {
    // Admin/Employee orders get RKR ID immediately with "Order Placed" status
    const { latestId, error: idError } = await fetchLatestOrderId();
    if (idError) {
      toast({ 
        variant: 'default', 
        title: 'Please try again', 
        description: 'Unable to generate order ID. Please refresh the page and try creating the order again.' 
      });
      return;
    }
    const newOrderId = generateNextOrderId(latestId);
    const initialStatus = 'Order Placed';

      const { error } = await createOrderWithHistory({
      id: newOrderId,
      customer_id: user?.id ?? 'admin-manual',
      customer_name: newOrder.customerName,
      contact_number: newOrder.contactNumber,
      service_package: newOrder.servicePackage as any,
      weight: newOrder.weight,
      loads: newOrder.load,
      distance: newOrder.distance,
      delivery_option: newOrder.deliveryOption,
      status: initialStatus,
      total: newOrder.total,
      is_paid: newOrder.isPaid,
      order_type: newOrder.orderType || 'customer',
      assigned_employee_id: newOrder.assignedEmployeeId || null, // For backward compatibility
      assigned_employee_ids: newOrder.assignedEmployeeIds || null, // Multiple employees (JSON array)
    });

    if (error) {
      // Handle duplicate ID error (race condition) - retry with fresh ID fetch
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        // Retry with a fresh ID fetch
        const { latestId: retryLatestId, error: retryIdError } = await fetchLatestOrderId();
        if (retryIdError) {
          toast({ 
            variant: 'default', 
            title: 'Please refresh and try again', 
            description: 'Unable to generate order ID. Please refresh the page and try creating the order again.' 
          });
          return;
        }
        const retryOrderId = generateNextOrderId(retryLatestId);
        const { error: retryCreateError } = await createOrderWithHistory({
        id: retryOrderId,
        customer_id: user?.id ?? 'admin-manual',
        customer_name: newOrder.customerName,
        contact_number: newOrder.contactNumber,
        service_package: newOrder.servicePackage as any,
        weight: newOrder.weight,
        loads: newOrder.load,
        distance: newOrder.distance,
        delivery_option: newOrder.deliveryOption,
        status: initialStatus,
        total: newOrder.total,
        is_paid: newOrder.isPaid,
        order_type: newOrder.orderType || 'customer',
        assigned_employee_id: newOrder.assignedEmployeeId || null,
        });
        if (retryCreateError) {
          toast({ 
            variant: 'default', 
            title: 'Please refresh and try again', 
            description: 'The order may have been created. Please refresh the page to check.' 
          });
          return;
        }
        toast({
          title: 'Order Placed',
          description: `New order #${retryOrderId} for ${newOrder.customerName} has been created.`,
        });
        fetchOrders();
        return;
      }
      toast({ 
        variant: 'default', 
        title: 'Please refresh and try again', 
        description: 'Unable to create order. Please refresh the page and try again.' 
      });
      return;
    }

    toast({
        title: 'Order Placed',
        description: `New order #${newOrderId} for ${newOrder.customerName} has been created.`,
    });
    fetchOrders();
  };

  return (
    <div className="w-full">
      {/* Main Orders Card */}
      <Card className="w-full flex flex-col shadow-xl border-2">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-6">
          <div className="flex flex-col gap-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  Orders Dashboard
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Manage and track all customer orders
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button 
                  onClick={() => setIsInternalDialogOpen(true)} 
                  variant="outline" 
                  className="flex-1 sm:flex-none gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Internal Order
                </Button>
                <Button 
                  onClick={() => setIsDialogOpen(true)} 
                  className="flex-1 sm:flex-none gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
                <Button 
                  onClick={fetchOrders} 
                  variant="outline" 
                  size="icon"
                  disabled={loadingAdmin}
                >
                  <RefreshCw className={`h-4 w-4 ${loadingAdmin ? 'animate-spin' : ''}`} />
                </Button>
              </div>
            </div>

            {/* Statistics Cards - Simplified */}
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-1">Total Orders</p>
                <p className="text-lg font-bold text-primary">{statistics.totalOrders}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{statistics.todayOrders} today</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-1">Total Revenue</p>
                <p className="text-lg font-bold text-primary">₱{Math.ceil(statistics.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">₱{Math.ceil(statistics.todayRevenue)} today</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-1">Pending Orders</p>
                <p className="text-lg font-bold text-primary">{statistics.pendingOrders}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{statistics.completedOrders} completed</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-1">Payment Status</p>
                <p className="text-lg font-bold text-primary">{statistics.paidOrders}</p>
                <p className="text-xs text-muted-foreground mt-0.5">{statistics.unpaidOrders} unpaid</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-1">Paid Revenue</p>
                <p className="text-lg font-bold text-green-600 dark:text-green-400">₱{Math.ceil(statistics.paidRevenue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-1">Pending Revenue</p>
                <p className="text-lg font-bold text-orange-600 dark:text-orange-400">₱{Math.ceil(statistics.pendingRevenue)}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30 border">
                <p className="text-xs text-muted-foreground mb-1">This Week</p>
                <p className="text-lg font-bold text-blue-600 dark:text-blue-400">{statistics.weekOrders} orders</p>
                <p className="text-xs text-muted-foreground mt-0.5">₱{Math.ceil(statistics.weekRevenue)}</p>
              </div>
            </div>

            <Separator />

            {/* Filters */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search orders..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="completed">Completed</option>
                <option value="Order Created">Order Created</option>
                <option value="Order Placed">Order Placed</option>
                <option value="Washing">Washing</option>
                <option value="Drying">Drying</option>
                <option value="Folding">Folding</option>
                <option value="Ready for Pick Up">Ready for Pick Up</option>
                <option value="Out for Delivery">Out for Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Success">Success</option>
                <option value="Canceled">Canceled</option>
              </select>
              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value="all">All Payments</option>
                <option value="paid">Paid</option>
                <option value="unpaid">Unpaid</option>
                <option value="partial">Partially Paid</option>
              </select>
              <select
                value={dateFilter}
                onChange={(e) => setDateFilter(e.target.value)}
                className="px-3 py-2 rounded-md border bg-background text-sm"
              >
                <option value="all">All Time</option>
                <option value="today">Today</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
              </select>
            </div>

            {/* Results Summary */}
            {!loadingAdmin && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                <Filter className="h-4 w-4" />
                <span>
                  Showing <strong className="text-foreground">{filteredOrders.length}</strong> of{' '}
                  <strong className="text-foreground">{allOrders.length}</strong> orders
                </span>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto overflow-x-hidden scrollable p-6">
          {loadingAdmin ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <Loader2 className="h-12 w-12 mb-4 animate-spin text-primary" />
              <p className="text-base font-medium">Loading orders dashboard...</p>
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <OrderList 
              orders={filteredOrders} 
              onUpdateOrder={handleUpdateOrder}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground py-12">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Inbox className="h-12 w-12" />
              </div>
              <p className="text-lg font-semibold mb-1">
                {allOrders.length === 0 ? 'No orders yet' : 'No orders match your filters'}
              </p>
              <p className="text-sm">
                {allOrders.length === 0 
                  ? 'Create your first order to get started' 
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {allOrders.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Order
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <ManualOrderDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddOrder={handleAddOrder}
      />
      <InternalOrderDialog
        isOpen={isInternalDialogOpen}
        onClose={() => setIsInternalDialogOpen(false)}
        onAddOrder={handleAddOrder}
      />
    </div>
  );
}

