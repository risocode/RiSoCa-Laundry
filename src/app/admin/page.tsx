
'use client';

import { useState } from 'react';
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

const initialOrders = [
  { id: 'ORD001', customer: 'John Doe', contact: '09171234567', load: 1, weight: 7.5, status: 'Washing', total: 450.0 },
  { id: 'ORD002', customer: 'Jane Smith', contact: '09182345678', load: 2, weight: 15, status: 'Pickup Scheduled', total: 220.5 },
  { id: 'ORD003', customer: 'Bob Johnson', contact: '09193456789', load: 1, weight: 5, status: 'Out for Delivery', total: 180.0 },
  { id: 'ORD004', customer: 'Alice Williams', contact: '09204567890', load: 3, weight: 22, status: 'Delivered', total: 300.0 },
  { id: 'ORD005', customer: 'Charlie Brown', contact: '09215678901', load: 1, weight: 8, status: 'Folding', total: 150.75 },
];

export default function AdminPage() {
  const [orders, setOrders] = useState(initialOrders);

  const handleStatusChange = (orderId: string, newStatus: string) => {
    setOrders(
      orders.map((order) =>
        order.id === orderId ? { ...order, status: newStatus } : order
      )
    );
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
            <OrderList orders={orders} onStatusChange={handleStatusChange} />
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
