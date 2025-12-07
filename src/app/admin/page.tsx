
'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { OrderList } from '@/components/order-list';
import { useOrders } from '@/context/OrderContext';
import { Loader2, Inbox } from 'lucide-react';

export default function AdminPage() {
  const { orders, updateOrderStatus } = useOrders();
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus);
  };

  return (
    <div className="flex flex-col h-screen">
      <AppHeader showLogo={true} />
      <main className="flex-1 overflow-y-auto container mx-auto px-4 py-8">
        <Card>
          <CardHeader>
            <CardTitle>Admin Dashboard</CardTitle>
            <CardDescription>Manage and track all customer orders.</CardDescription>
          </CardHeader>
          <CardContent>
            {!isClient ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : orders.length > 0 ? (
              <OrderList orders={orders} onStatusChange={handleStatusChange} />
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                <Inbox className="h-12 w-12 mb-2" />
                <p>No orders have been placed yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
