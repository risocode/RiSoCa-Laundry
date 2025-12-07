'use client';

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { OrderList, Order } from '@/components/order-list';
import { Loader2, Inbox } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useFirestore, useCollection, useMemoFirebase } from '@/firebase';
import { collection, updateDoc, doc } from 'firebase/firestore';

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const firestore = useFirestore();

  const ordersQuery = useMemoFirebase(() => {
    if (!firestore) return null;
    return collection(firestore, 'orders');
  }, [firestore]);

  const { data: adminOrders, isLoading: ordersLoading, error } = useCollection<Order>(ordersQuery);

  useEffect(() => {
    if (error) {
      console.error('Error fetching admin orders:', error);
      toast({
          variant: 'destructive',
          title: 'Error Fetching Orders',
          description: 'Could not fetch orders from the database.',
      });
    }
  }, [error, toast]);
  
  const handleUpdateOrder = async (updatedOrder: Order) => {
    if (!firestore) return;
    const orderDocRef = doc(firestore, 'orders', updatedOrder.id);
    
    try {
        await updateDoc(orderDocRef, {
            status: updatedOrder.status,
            weight: updatedOrder.weight,
            load: updatedOrder.load,
            total: updatedOrder.total,
        });

        toast({
            title: 'Order Updated',
            description: `Order ${updatedOrder.id} has been successfully updated.`,
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Update Failed',
            description: `Could not update order ${updatedOrder.id}. Please try again.`,
        });
    }
  }

  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Orders</CardTitle>
          <CardDescription>View and update all customer orders.</CardDescription>
        </div>
      </CardHeader>
      <CardContent>
        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <Loader2 className="h-12 w-12 mb-2 animate-spin" />
            <p>Loading all orders...</p>
          </div>
        ) : adminOrders && adminOrders.length > 0 ? (
          <OrderList 
            orders={adminOrders} 
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
  );
}
