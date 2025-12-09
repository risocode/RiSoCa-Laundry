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
import { RKR_ORDERS_KEY, generateOrderId } from '@/lib/constants';

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem(RKR_ORDERS_KEY);
      if (storedOrders) {
        setAllOrders(JSON.parse(storedOrders).map((o: Order) => ({
          ...o,
          orderDate: new Date(o.orderDate),
          statusHistory: o.statusHistory 
            ? o.statusHistory.map((sh: StatusHistory) => ({...sh, timestamp: new Date(sh.timestamp)}))
            : [{ status: o.status, timestamp: new Date(o.orderDate) }]
        })));
      }
    } catch (error) {
      console.error("Failed to parse orders from localStorage", error);
    }
    setLoadingAdmin(false);
  }, []);

  useEffect(() => {
    if(!loadingAdmin){
      localStorage.setItem(RKR_ORDERS_KEY, JSON.stringify(allOrders));
    }
  }, [allOrders, loadingAdmin]);

  const handleUpdateOrder = async (updatedOrder: Order) => {
    setAllOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    toast({
        title: 'Order Updated',
        description: `Order #${updatedOrder.id} has been updated to ${updatedOrder.status}.`,
    });
  }

  const handleAddOrder = async (newOrder: Omit<Order, 'id' | 'userId'>) => {
    // ID generation is now handled here to ensure it has the latest list of orders.
    const orderToAdd: Order = {
      ...newOrder,
      id: generateOrderId(allOrders),
      userId: 'admin-manual',
      orderDate: new Date(),
    };
    
    setAllOrders(prevOrders => [orderToAdd, ...prevOrders]);
    toast({
        title: 'Order Created',
        description: `New order for ${newOrder.customerName} has been added.`,
    });
  }

  return (
    <>
      <Card className="w-full h-[calc(100vh-10rem)] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between sticky top-0 bg-background z-10 border-b rounded-t-lg">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>View and update all customer orders.</CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            New Order
          </Button>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto pt-4">
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
