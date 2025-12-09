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
import { Loader2, Inbox, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ManualOrderDialog } from '@/components/manual-order-dialog';

// Function to generate a sequential RKR order ID for admin
const generateAdminOrderId = (orders: Order[]) => {
  try {
    if (orders.length === 0) {
      return 'RKR000';
    }

    const latestOrderNumber = orders
      .map(o => parseInt(o.id.replace('RKR', ''), 10))
      .filter(n => !isNaN(n))
      .sort((a, b) => b - a)[0];

    const nextOrderNumber = isFinite(latestOrderNumber) ? latestOrderNumber + 1 : 0;
    
    return `RKR${String(nextOrderNumber).padStart(3, '0')}`;
  } catch (error) {
    console.error("Failed to generate order ID from existing orders", error);
    // Fallback to random if parsing fails
    const orderNumber = Math.floor(Math.random() * 1000);
    return `RKR${String(orderNumber).padStart(3, '0')}`;
  }
};


export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    try {
      const storedOrders = localStorage.getItem('rkr-orders');
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
      localStorage.setItem('rkr-orders', JSON.stringify(allOrders));
    }
  }, [allOrders, loadingAdmin]);

  const handleUpdateOrder = async (updatedOrder: Order) => {
    setAllOrders(prevOrders => prevOrders.map(o => o.id === updatedOrder.id ? updatedOrder : o));
    toast({
        title: 'Order Updated',
        description: `Order #${updatedOrder.id} has been updated to ${updatedOrder.status}.`,
    });
  }

  const handleAddOrder = async (newOrder: Omit<Order, 'id' | 'orderDate' | 'userId'>) => {
    const orderToAdd: Order = {
      ...newOrder,
      id: generateAdminOrderId(allOrders),
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
      <Card className="w-full">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Orders</CardTitle>
            <CardDescription>View and update all customer orders.</CardDescription>
          </div>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
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
      <ManualOrderDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddOrder={handleAddOrder}
      />
    </>
  );
}
