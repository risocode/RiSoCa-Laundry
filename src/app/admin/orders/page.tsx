'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { OrderList } from '@/components/order-list';
import type { Order } from '@/components/order-list';
import { Loader2, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useOrders } from '@/context/OrderContext';

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const { allOrders, loadingAdmin, updateOrderStatus } = useOrders();

  const handleUpdateOrder = async (updatedOrder: Order) => {
    await updateOrderStatus(updatedOrder.id, updatedOrder.status, updatedOrder.userId);

    toast({
        title: 'Order Updated',
        description: `Order ${updatedOrder.id} has been updated to ${updatedOrder.status}.`,
    });
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage All Orders</CardTitle>
          <CardDescription>View and update all customer orders.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
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
  );
}
