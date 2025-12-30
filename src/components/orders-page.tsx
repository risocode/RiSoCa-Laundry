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
import { format, startOfDay, endOfDay, subDays, isSameDay } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DateRange } from 'react-day-picker';

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
  const [datePreset, setDatePreset] = useState<string>('all'); // 'all', 'today', 'custom'
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);

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
      assignedEmployeeIds: Array.isArray(o.assigned_employee_ids) && o.assigned_employee_ids.length > 0 
        ? o.assigned_employee_ids 
        : undefined,
      loadPieces: Array.isArray(o.load_pieces) && o.load_pieces.length > 0
        ? o.load_pieces
        : undefined,
    };

    // CRITICAL: Ensure balance is never undefined
    if (mapped.balance === undefined) {
      mapped.balance = mapped.isPaid ? 0 : mapped.total;
    }

    return mapped;
  };

  const fetchOrders = async () => {
    setLoadingAdmin(true);
    try {
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
          load_pieces,
          order_status_history(*)
        `)
        .order('id', { ascending: false });

      if (error) {
        // If error is about assigned_employee_ids column not existing, try without it
        // Error codes: 42703 = column doesn't exist, 400 = bad request (often column issues)
        if (error.message?.includes('assigned_employee_ids') || 
            error.message?.includes('column') ||
            error.code === '42703' || 
            error.code === 'PGRST116' ||
            (error.code && error.code.toString().startsWith('42'))) {
          console.warn('assigned_employee_ids column may not exist, fetching without it:', error.message);
          const { data: fallbackData, error: fallbackError } = await supabase
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
              load_pieces,
              order_status_history(*)
            `)
            .order('id', { ascending: false });
          
          if (fallbackError) {
            console.error('Fallback query also failed:', fallbackError);
            toast({ 
              variant: 'default', 
              title: 'Unable to load orders', 
              description: fallbackError.message || 'Please refresh the page to see the latest orders.' 
            });
            setLoadingAdmin(false);
            return;
          }
          
          const mappedOrders = (fallbackData ?? []).map(mapOrder);
          setAllOrders(mappedOrders);
          setLoadingAdmin(false);
          return;
        }
        
        console.error('Error fetching orders:', error);
        toast({ 
          variant: 'default', 
          title: 'Unable to load orders', 
          description: error.message || 'Please refresh the page to see the latest orders.' 
        });
        setLoadingAdmin(false);
        return;
      }

      const mappedOrders = (data ?? []).map(mapOrder);
      setAllOrders(mappedOrders);
      setLoadingAdmin(false);
    } catch (err: any) {
      console.error('Unexpected error fetching orders:', err);
      toast({ 
        variant: 'default', 
        title: 'Unable to load orders', 
        description: err.message || 'Please refresh the page to see the latest orders.' 
      });
      setLoadingAdmin(false);
    }
  };

  // Calculate statistics
  const statistics = useMemo(() => {
    // Filter out internal orders - only count customer orders
    const customerOrders = allOrders.filter(o => o.orderType !== 'internal');
    
    const totalOrders = customerOrders.length;
    
    // Total Revenue: Only paid customer orders (exclude internal, exclude unpaid)
    const paidCustomerOrders = customerOrders.filter(o => o.isPaid === true);
    const totalRevenue = paidCustomerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // Paid and pending revenue (for other cards)
    const paidRevenue = paidCustomerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    const unpaidCustomerOrders = customerOrders.filter(o => !o.isPaid);
    const pendingRevenue = unpaidCustomerOrders.reduce((sum, o) => sum + ((o.balance || o.total) || 0), 0);
    
    const completedOrders = customerOrders.filter(o => o.status === 'Success' || o.status === 'Completed' || o.status === 'Delivered').length;
    const pendingOrders = customerOrders.filter(o => 
      o.status !== 'Success' && 
      o.status !== 'Completed' && 
      o.status !== 'Delivered' && 
      o.status !== 'Canceled'
    ).length;
    const canceledOrders = customerOrders.filter(o => o.status === 'Canceled').length;
    const paidOrders = paidCustomerOrders.length;
    const unpaidOrders = unpaidCustomerOrders.length;
    
    // Today's stats - all customer orders created today (not just paid)
    const today = startOfDay(new Date());
    const todayCustomerOrders = customerOrders.filter(o => 
      startOfDay(o.orderDate).getTime() === today.getTime()
    );
    const todayPaidCustomerOrders = todayCustomerOrders.filter(o => o.isPaid === true);
    const todayRevenue = todayPaidCustomerOrders.reduce((sum, o) => sum + (o.total || 0), 0);
    
    // This week's stats
    const weekStart = startOfDay(subDays(new Date(), 7));
    const weekOrders = customerOrders.filter(o => o.orderDate >= weekStart);
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
      todayOrders: todayCustomerOrders.length,
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
    if (datePreset === 'all') {
      // Show all orders - no filtering
    } else if (datePreset === 'today') {
      const today = startOfDay(new Date());
      filtered = filtered.filter(o => startOfDay(o.orderDate).getTime() === today.getTime());
    } else if (datePreset === 'custom' && dateRange) {
      // Date picker - can be single date or range
      if (dateRange.from && !dateRange.to) {
        // Single date selected
        const selectedDate = startOfDay(dateRange.from);
        filtered = filtered.filter(o => isSameDay(startOfDay(o.orderDate), selectedDate));
      } else if (dateRange.from && dateRange.to) {
        // Date range selected
        const from = startOfDay(dateRange.from);
        const to = endOfDay(dateRange.to);
        filtered = filtered.filter(o => o.orderDate >= from && o.orderDate <= to);
      }
    }

    // Sort by order number (extract numeric part from order ID) - latest first
    filtered.sort((a, b) => {
      const getOrderNum = (id: string) => {
        const match = id.match(/\d+$/);
        return match ? parseInt(match[0], 10) : 0;
      };
      const numA = getOrderNum(a.id);
      const numB = getOrderNum(b.id);
      if (numA !== numB) {
        return numB - numA; // Descending (latest first)
      }
      // If no numeric part, sort alphabetically (descending)
      return b.id.localeCompare(a.id);
    });

    return filtered;
  }, [allOrders, searchQuery, statusFilter, paymentFilter, datePreset, dateRange]);

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
          // For 406/coerce errors, update in place if we can find the order
          setAllOrders(prevOrders => {
            const orderIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
            if (orderIndex !== -1) {
              const newOrders = [...prevOrders];
              newOrders[orderIndex] = updatedOrder;
              return newOrders;
            }
            return prevOrders;
          });
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
          // Update the order in place with new ID to maintain position
          setAllOrders(prevOrders => {
            const orderIndex = prevOrders.findIndex(o => o.id === updatedOrder.id);
            if (orderIndex !== -1) {
              const newOrders = [...prevOrders];
              newOrders[orderIndex] = updatedOrder;
              return newOrders;
            }
            return prevOrders;
          });
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
        created_at: updatedOrder.orderDate.toISOString(), // Update the order date
      };
      
      // Include order_type and assigned_employee_id if they exist
      if (updatedOrder.orderType !== undefined) {
        patch.order_type = updatedOrder.orderType;
      }
      
      // Normalize employee assignments to prevent duplication
      if (updatedOrder.assignedEmployeeIds !== undefined) {
        // If assignedEmployeeIds is provided, use it as the source of truth
        if (updatedOrder.assignedEmployeeIds.length > 0) {
          patch.assigned_employee_ids = updatedOrder.assignedEmployeeIds;
          // Set assigned_employee_id to first employee for backward compatibility
          patch.assigned_employee_id = updatedOrder.assignedEmployeeIds[0];
        } else {
          // Empty array means no employees assigned
          patch.assigned_employee_ids = null;
          patch.assigned_employee_id = null;
        }
      } else if (updatedOrder.assignedEmployeeId !== undefined) {
        // If only assignedEmployeeId is provided (backward compatibility)
        if (updatedOrder.assignedEmployeeId) {
          patch.assigned_employee_id = updatedOrder.assignedEmployeeId;
          patch.assigned_employee_ids = [updatedOrder.assignedEmployeeId];
        } else {
          patch.assigned_employee_id = null;
          patch.assigned_employee_ids = null;
        }
      }

      // Include load_pieces if provided
      if (updatedOrder.loadPieces !== undefined) {
        // If loadPieces is provided, use it (can be array or undefined/null)
        if (updatedOrder.loadPieces && updatedOrder.loadPieces.length > 0) {
          // Filter out null values before saving
          const cleanedPieces = updatedOrder.loadPieces.filter(p => p !== null && p !== undefined);
          patch.load_pieces = cleanedPieces.length > 0 ? cleanedPieces : null;
        } else {
          patch.load_pieces = null;
        }
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
      
      // Update the order in place to maintain its position in the list
      setAllOrders(prevOrders => {
        const orderIndex = prevOrders.findIndex(o => o.id === updatedOrder.id || o.id === finalOrderId);
        if (orderIndex !== -1) {
          const newOrders = [...prevOrders];
          newOrders[orderIndex] = updatedOrder;
          return newOrders;
        }
        // If order not found, refresh all orders
        return prevOrders;
      });

      toast({
        title: 'Order Updated',
        description: `Order #${finalOrderId} has been updated successfully.`,
      });
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
      // Normalize employee assignments - use assigned_employee_ids as source of truth
      assigned_employee_ids: newOrder.assignedEmployeeIds && newOrder.assignedEmployeeIds.length > 0 
        ? newOrder.assignedEmployeeIds 
        : null,
      assigned_employee_id: (newOrder.assignedEmployeeIds && newOrder.assignedEmployeeIds.length > 0)
        ? newOrder.assignedEmployeeIds[0] // First employee for backward compatibility
        : (newOrder.assignedEmployeeId || null), // Fallback to single assignment
      created_at: newOrder.orderDate.toISOString(), // Use the custom order date
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
        // Normalize employee assignments - use assigned_employee_ids as source of truth
        assigned_employee_ids: newOrder.assignedEmployeeIds && newOrder.assignedEmployeeIds.length > 0 
          ? newOrder.assignedEmployeeIds 
          : null,
        assigned_employee_id: (newOrder.assignedEmployeeIds && newOrder.assignedEmployeeIds.length > 0)
          ? newOrder.assignedEmployeeIds[0] // First employee for backward compatibility
          : (newOrder.assignedEmployeeId || null), // Fallback to single assignment
        created_at: newOrder.orderDate.toISOString(), // Use the custom order date
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
                <p className="text-xs text-muted-foreground mb-1">Total Revenue (all paid)</p>
                <p className="text-lg font-bold text-primary">₱{Math.ceil(statistics.totalRevenue)}</p>
                <p className="text-xs text-muted-foreground mt-0.5">Today's Revenue (paid): ₱{Math.ceil(statistics.todayRevenue)}</p>
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
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
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
              </div>
              
              {/* Date Filter */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Date Filter</span>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    type="button"
                    variant={datePreset === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setDatePreset('all');
                      setDateRange(undefined);
                      setIsDatePickerOpen(false);
                    }}
                    className="h-8 text-xs flex-shrink-0"
                  >
                    All Time
                  </Button>
                  <Button
                    type="button"
                    variant={datePreset === 'today' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => {
                      setDatePreset('today');
                      setDateRange(undefined);
                      setIsDatePickerOpen(false);
                    }}
                    className="h-8 text-xs flex-shrink-0"
                  >
                    Today
                  </Button>
                  <Popover open={isDatePickerOpen} onOpenChange={(open) => {
                    setIsDatePickerOpen(open);
                    if (open) {
                      setDatePreset('custom');
                    }
                  }}>
                    <PopoverTrigger asChild>
                      <Button
                        type="button"
                        variant={datePreset === 'custom' ? 'default' : 'outline'}
                        size="sm"
                        className="h-8 text-xs flex-shrink-0"
                      >
                        Date Picker
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent 
                      className="!w-auto !p-0 max-w-[calc(100vw-2rem)] sm:max-w-none border shadow-lg bg-background" 
                      align="start"
                      side="bottom"
                      sideOffset={8}
                    >
                      <div className="p-0">
                        <Calendar
                          mode="range"
                          selected={dateRange}
                          onSelect={(range) => {
                            if (!range) {
                              setDateRange(undefined);
                              return;
                            }
                            
                            // If user clicks the same date twice (from and to are the same), treat as single date
                            if (range.from && range.to && isSameDay(range.from, range.to)) {
                              setDateRange({ from: range.from, to: undefined });
                            } else {
                              setDateRange(range);
                            }
                          }}
                          numberOfMonths={1}
                        />
                      </div>
                      <div className="flex items-center justify-between p-3 border-t gap-2 bg-background">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDateRange(undefined);
                            setIsDatePickerOpen(false);
                          }}
                          className="h-8 text-xs text-muted-foreground hover:text-destructive flex-1 sm:flex-initial"
                        >
                          Clear
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            const today = new Date();
                            setDateRange({ from: today, to: undefined });
                          }}
                          className="h-8 text-xs flex-1 sm:flex-initial"
                        >
                          Today
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
                
                {/* Date Selection Display */}
                {datePreset === 'custom' && dateRange && dateRange.from && (
                  <div className="flex items-center gap-2 text-sm">
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3 py-1.5 sm:py-2 rounded-md bg-primary/10 border border-primary/20 w-full sm:w-auto">
                      <CalendarIcon className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                      <div className="flex flex-wrap items-center gap-1 sm:gap-1.5 flex-1 min-w-0">
                        <span className="font-medium text-primary text-xs sm:text-sm whitespace-nowrap">
                          {format(dateRange.from, 'MMM dd, yyyy')}
                        </span>
                        {dateRange.to && !isSameDay(dateRange.from, dateRange.to) ? (
                          <>
                            <span className="text-muted-foreground text-xs sm:text-sm">to</span>
                            <span className="font-medium text-primary text-xs sm:text-sm whitespace-nowrap">
                              {format(dateRange.to, 'MMM dd, yyyy')}
                            </span>
                          </>
                        ) : null}
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2 ml-auto">
                        {dateRange.to && !isSameDay(dateRange.from, dateRange.to) ? (
                          <Badge variant="outline" className="text-xs bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 flex-shrink-0">
                            Range
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-xs bg-green-500/10 text-green-700 dark:text-green-400 border-green-300 flex-shrink-0">
                            Single Date
                          </Badge>
                        )}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setDateRange(undefined);
                            setDatePreset('all');
                            setIsDatePickerOpen(false);
                          }}
                          className="h-6 w-6 sm:h-5 sm:w-5 p-0 hover:bg-destructive/10 hover:text-destructive flex-shrink-0"
                          aria-label="Clear date selection"
                        >
                          <X className="h-3.5 w-3.5 sm:h-3 sm:w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
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
              enablePagination={datePreset === 'all' || (datePreset === 'custom' && dateRange?.from && dateRange?.to)}
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

