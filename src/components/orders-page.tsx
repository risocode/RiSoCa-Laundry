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
import { Loader2, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ManualOrderDialog } from '@/components/manual-order-dialog';
import { createOrderWithHistory, fetchLatestOrderId, generateNextOrderId, updateOrderFields, updateOrderStatus } from '@/lib/api/orders';
import { supabase } from '@/lib/supabase-client';
import { useAuthSession } from '@/hooks/use-auth-session';

export function OrdersPage() {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mapOrder = (o: any): Order => {
    // Log raw database values
    console.log(`[Orders Page] Mapping order ${o.id}:`, {
      raw_balance: o.balance,
      raw_balance_type: typeof o.balance,
      raw_is_paid: o.is_paid,
      raw_total: o.total,
      raw_total_type: typeof o.total,
    });

    const totalNum = typeof o.total === 'string' ? parseFloat(o.total) : Number(o.total);
    const balanceNum = o.balance !== null && o.balance !== undefined 
      ? (typeof o.balance === 'string' ? parseFloat(o.balance) : Number(o.balance))
      : (o.is_paid ? 0 : totalNum);
    
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
      balance: balanceNum,
      deliveryOption: o.delivery_option ?? undefined,
      servicePackage: o.service_package,
      distance: o.distance ?? 0,
      statusHistory: (o.order_status_history ?? []).map((sh: any) => ({
        status: sh.status,
        timestamp: new Date(sh.created_at),
      })) as StatusHistory[],
      branchId: o.branch_id ?? null,
    };

    console.log(`[Orders Page] Mapped order ${o.id}:`, {
      final_balance: mapped.balance,
      final_isPaid: mapped.isPaid,
      final_total: mapped.total,
      isPartiallyPaid: mapped.isPaid === false && mapped.balance > 0 && mapped.balance < mapped.total,
    });

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
        order_status_history(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load orders', error);
      toast({ variant: 'destructive', title: 'Load error', description: 'Could not load orders.' });
      setLoadingAdmin(false);
      return;
    }

    console.log('[Orders Page] ===== FETCH ORDERS START =====');
    console.log('[Orders Page] Raw data from Supabase:', data?.length, 'orders');
    
    const mappedOrders = (data ?? []).map(mapOrder);
    
    console.log('[Orders Page] Mapped orders count:', mappedOrders.length);
    
    // Log RKR014 specifically
    const rkr014 = mappedOrders.find(o => o.id === 'RKR014');
    if (rkr014) {
      console.log('[Orders Page] ===== RKR014 DETAILS =====');
      console.log('[Orders Page] RKR014 order details:', {
        id: rkr014.id,
        balance: rkr014.balance,
        balance_type: typeof rkr014.balance,
        isPaid: rkr014.isPaid,
        isPaid_type: typeof rkr014.isPaid,
        total: rkr014.total,
        total_type: typeof rkr014.total,
        isPartiallyPaid: rkr014.isPaid === false && rkr014.balance !== undefined && rkr014.balance > 0 && rkr014.balance < rkr014.total,
        isUnpaid: !rkr014.isPaid && (rkr014.balance === undefined || rkr014.balance === 0 || rkr014.balance >= rkr014.total),
      });
      console.log('[Orders Page] ===== RKR014 END =====');
    } else {
      console.log('[Orders Page] RKR014 not found in mapped orders');
    }
    
    console.log('[Orders Page] Setting allOrders state with', mappedOrders.length, 'orders');
    setAllOrders(mappedOrders);
    setLoadingAdmin(false);
    console.log('[Orders Page] ===== FETCH ORDERS END =====');
  };

  useEffect(() => {
    console.log('[Orders Page] ===== COMPONENT MOUNTED =====');
    console.log('[Orders Page] Initial fetch starting...');
    fetchOrders();
    
    // Set up real-time subscription to refresh when orders change
    const channelName = 'orders-changes';
    console.log('[Orders Page] Setting up real-time subscription with channel:', channelName);
    
    const channel = supabase
      .channel(channelName)
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
          console.log('[Orders Page] ===== REAL-TIME EVENT =====');
          console.log('[Orders Page] Order changed:', payload.eventType);
          console.log('[Orders Page] Order ID:', payload.new?.id || payload.old?.id);
          console.log('[Orders Page] New data:', payload.new);
          console.log('[Orders Page] Balance in new data:', payload.new?.balance);
          console.log('[Orders Page] is_paid in new data:', payload.new?.is_paid);
          // Refresh orders after a short delay to ensure database is updated
          setTimeout(() => {
            console.log('[Orders Page] Refreshing orders after real-time event...');
            fetchOrders();
          }, 100);
        }
      )
      .subscribe((status) => {
        console.log('[Orders Page] Real-time subscription status:', status);
      });

    return () => {
      console.log('[Orders Page] Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateOrder = async (updatedOrder: Order) => {
    console.log('[Orders Page] ===== HANDLE UPDATE ORDER START =====');
    console.log('[Orders Page] Updated order received:', {
      id: updatedOrder.id,
      balance: updatedOrder.balance,
      balance_type: typeof updatedOrder.balance,
      isPaid: updatedOrder.isPaid,
      isPaid_type: typeof updatedOrder.isPaid,
      total: updatedOrder.total,
      total_type: typeof updatedOrder.total,
    });

    const previous = allOrders.find(o => o.id === updatedOrder.id);
    console.log('[Orders Page] Previous order state:', previous ? {
      balance: previous.balance,
      isPaid: previous.isPaid,
      total: previous.total,
    } : 'NOT FOUND');

    const hasStatusChange = previous?.status !== updatedOrder.status;

    if (hasStatusChange) {
      console.log('[Orders Page] Status changed, updating status...');
      const { error } = await updateOrderStatus(updatedOrder.id, updatedOrder.status);
      if (error) {
        console.error('[Orders Page] Status update error:', error);
        toast({ variant: 'destructive', title: 'Update failed', description: error.message });
        return;
      }
    }

    const patch = {
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
    };

    console.log('[Orders Page] Patch data being sent to database:', {
      id: updatedOrder.id,
      is_paid: patch.is_paid,
      balance: patch.balance,
      balance_type: typeof patch.balance,
      total: patch.total,
    });

    const { error: patchError, data: patchData } = await updateOrderFields(updatedOrder.id, patch as any);
    if (patchError) {
      console.error('[Orders Page] Patch update error:', patchError);
      toast({ variant: 'destructive', title: 'Update failed', description: patchError.message });
      return;
    }

    console.log('[Orders Page] Patch update successful. Response:', patchData);
    console.log('[Orders Page] Refreshing orders...');
    
    toast({
        title: 'Order Updated',
        description: `Order #${updatedOrder.id} has been updated.`,
    });
    fetchOrders();
    console.log('[Orders Page] ===== HANDLE UPDATE ORDER END =====');
  };

  const handleAddOrder = async (newOrder: Omit<Order, 'id' | 'userId'>) => {
    // IMPORTANT: Uses the same ID generation as customer orders to ensure sequential numbering
    // If admin creates RKR001, next customer order will be RKR002, and vice versa
    const { latestId, error: latestError } = await fetchLatestOrderId();
    if (latestError) {
      toast({ variant: 'destructive', title: 'Order ID error', description: 'Could not generate new order ID.' });
      return;
    }
    const newId = generateNextOrderId(latestId);
    const initialStatus = newOrder.status || 'Order Placed';

    const { error } = await createOrderWithHistory({
      id: newId,
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
    });

    if (error) {
      // Handle duplicate ID error (race condition)
      if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
        // Retry with a fresh ID fetch
        const { latestId: retryLatestId, error: retryError } = await fetchLatestOrderId();
        if (!retryError && retryLatestId) {
          const retryId = generateNextOrderId(retryLatestId);
          const { error: retryCreateError } = await createOrderWithHistory({
            id: retryId,
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
          });
          if (retryCreateError) {
            toast({ variant: 'destructive', title: 'Create failed', description: retryCreateError.message });
            return;
          }
          toast({
            title: 'Order Created',
            description: `New order #${retryId} for ${newOrder.customerName} has been added.`,
          });
          fetchOrders();
          return;
        }
      }
      toast({ variant: 'destructive', title: 'Create failed', description: error.message });
      return;
    }

    toast({
        title: 'Order Created',
        description: `New order for ${newOrder.customerName} has been added.`,
    });
    fetchOrders();
  };

  return (
    <>
      <Card className="w-full flex flex-col max-h-[calc(100vh-12rem)] sm:max-h-[calc(100vh-14rem)]">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background z-10 border-b rounded-t-lg">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>View and update all customer orders.</CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            New Order
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto overflow-x-hidden scrollable pt-4 pb-4">
          {loadingAdmin ? (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
              <Loader2 className="h-12 w-12 mb-2 animate-spin" />
              <p>Loading all orders...</p>
            </div>
          ) : allOrders && allOrders.length > 0 ? (
            (() => {
              console.log('[Orders Page] Rendering OrderList with', allOrders.length, 'orders');
              const rkr014InState = allOrders.find(o => o.id === 'RKR014');
              if (rkr014InState) {
                console.log('[Orders Page] RKR014 in state before render:', {
                  balance: rkr014InState.balance,
                  isPaid: rkr014InState.isPaid,
                  total: rkr014InState.total,
                });
              }
              return (
                <OrderList 
                  orders={allOrders} 
                  onUpdateOrder={handleUpdateOrder}
                />
              );
            })()
          ) : (
            <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
              <Inbox className="h-12 w-12 mb-2" />
              <p>No orders have been placed yet across the platform.</p>
            </div>
          )}
        </CardContent>
      </Card>
      <ManualOrderDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddOrder={handleAddOrder}
      />
    </>
  );
}

