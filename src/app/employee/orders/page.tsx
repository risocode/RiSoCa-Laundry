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
import { createOrderWithHistory, fetchLatestOrderId, generateNextOrderId, updateOrderStatus, updateOrderFields } from '@/lib/api/orders';
import { supabase } from '@/lib/supabase-client';
import { useAuthSession } from '@/hooks/use-auth-session';

export default function EmployeeOrdersPage() {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const mapOrder = (o: any): Order => ({
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
    balance: o.balance ?? (o.is_paid ? 0 : o.total),
    deliveryOption: o.delivery_option ?? undefined,
    servicePackage: o.service_package,
    distance: o.distance ?? 0,
    statusHistory: (o.order_status_history ?? []).map((sh: any) => ({
      status: sh.status,
      timestamp: new Date(sh.created_at),
    })) as StatusHistory[],
    branchId: o.branch_id ?? null,
  });

  const fetchOrders = async () => {
    setLoadingOrders(true);
    const { data, error } = await supabase
      .from('orders')
      .select('*, order_status_history(*)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Failed to load orders', error);
      toast({ variant: 'destructive', title: 'Load error', description: 'Could not load orders.' });
      setLoadingOrders(false);
      return;
    }

    setAllOrders((data ?? []).map(mapOrder));
    setLoadingOrders(false);
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleUpdateOrder = async (updatedOrder: Order) => {
    const previous = allOrders.find(o => o.id === updatedOrder.id);
    const hasStatusChange = previous?.status !== updatedOrder.status;

    if (hasStatusChange) {
      const { error } = await updateOrderStatus(updatedOrder.id, updatedOrder.status);
      if (error) {
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

    const { error: patchError } = await updateOrderFields(updatedOrder.id, patch as any);
    if (patchError) {
      toast({ variant: 'destructive', title: 'Update failed', description: patchError.message });
      return;
    }

    toast({
        title: 'Order Updated',
        description: `Order #${updatedOrder.id} has been updated.`,
    });
    fetchOrders();
  };

  const handleAddOrder = async (newOrder: Omit<Order, 'id' | 'userId'>) => {
    // IMPORTANT: Uses the same ID generation as customer orders to ensure sequential numbering
    const { latestId, error: latestError } = await fetchLatestOrderId();
    if (latestError) {
      toast({ variant: 'destructive', title: 'Order ID error', description: 'Could not generate new order ID.' });
      return;
    }
    const newId = generateNextOrderId(latestId);
    const initialStatus = newOrder.status || 'Order Placed';

    const { error } = await createOrderWithHistory({
      id: newId,
      customer_id: user?.id ?? 'employee-manual',
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
            customer_id: user?.id ?? 'employee-manual',
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
            <CardDescription>View and manage all customer orders.</CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            New Order
          </Button>
        </CardHeader>
      <CardContent className="flex-1 overflow-y-auto overflow-x-hidden scrollable pt-4 pb-4">
        {loadingOrders ? (
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
            <p>No orders have been placed yet.</p>
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

