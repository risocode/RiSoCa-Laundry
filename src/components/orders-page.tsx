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
import { createOrderWithHistory, generateTemporaryOrderId, updateOrderFields, updateOrderStatus } from '@/lib/api/orders';
import { supabase } from '@/lib/supabase-client';
import { useAuthSession } from '@/hooks/use-auth-session';

export function OrdersPage() {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        order_status_history(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      toast({ variant: 'destructive', title: 'Load error', description: 'Could not load orders.' });
      setLoadingAdmin(false);
      return;
    }

    const mappedOrders = (data ?? []).map(mapOrder);
    setAllOrders(mappedOrders);
    setLoadingAdmin(false);
  };

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

      if (hasStatusChange) {
        const { error } = await updateOrderStatus(updatedOrder.id, updatedOrder.status);
        if (error) {
          toast({ 
            variant: 'destructive', 
            title: 'Status update failed', 
            description: error.message || 'Could not update order status. Please check your permissions.' 
          });
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

      const { error: patchError } = await updateOrderFields(updatedOrder.id, patch as any);
      if (patchError) {
        const errorMessage = patchError.message || 'Could not update order. Please check your permissions.';
        toast({ 
          variant: 'destructive', 
          title: 'Update failed', 
          description: errorMessage 
        });
        console.error('Order update error:', patchError);
        return;
      }
      
      toast({
        title: 'Order Updated',
        description: `Order #${updatedOrder.id} has been updated.`,
      });
      fetchOrders();
    } catch (error: any) {
      console.error('Unexpected error updating order:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Update failed', 
        description: error?.message || 'An unexpected error occurred while updating the order.' 
      });
    }
  };

  const handleAddOrder = async (newOrder: Omit<Order, 'id' | 'userId'>) => {
    // Use temporary ID - will be replaced with RKR format when status changes to "Order Placed"
    const tempOrderId = generateTemporaryOrderId();
    const initialStatus = newOrder.status || 'Order Created';

    const { error } = await createOrderWithHistory({
      id: tempOrderId,
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
        // Retry with a new temporary ID
        const retryTempId = generateTemporaryOrderId();
        const { error: retryCreateError } = await createOrderWithHistory({
          id: retryTempId,
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
            description: `New order for ${newOrder.customerName} has been created. Change status to "Order Placed" to assign order ID.`,
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
        description: `New order for ${newOrder.customerName} has been created. Change status to "Order Placed" to assign order ID.`,
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
            <OrderList 
              orders={allOrders} 
              onUpdateOrder={handleUpdateOrder}
            />
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

