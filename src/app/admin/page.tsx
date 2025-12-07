
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
import { useAuth } from '@/context/AuthContext';
import { Loader2, Inbox } from 'lucide-react';

export default function AdminPage() {
  const { orders, updateOrderStatus } = useOrders();
  const { user, profile, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading) {
      if (!user || profile?.role !== 'admin') {
        router.push('/login');
      }
    }
  }, [user, profile, loading, router]);


  const handleStatusChange = (orderId: string, newStatus: string) => {
    updateOrderStatus(orderId, newStatus);
  };

  if (loading || !user || profile?.role !== 'admin') {
     return (
        <div className="flex flex-col h-screen">
          <AppHeader showLogo={true} />
          <main className="flex-1 flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </main>
          <AppFooter />
        </div>
    );
  }

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
            {orders.length > 0 ? (
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
