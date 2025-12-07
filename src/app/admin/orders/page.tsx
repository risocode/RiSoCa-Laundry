'use client';

import { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { OrderList, Order } from '@/components/order-list';
import { supabase } from '@/lib/supabaseClient';
import { Loader2, Inbox, Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';

export default function AdminOrdersPage() {
  const { toast } = useToast();
  const [adminOrders, setAdminOrders] = useState<Order[]>([]);
  const [initialOrders, setInitialOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    async function fetchAdminOrders() {
      setOrdersLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching admin orders:', error);
        toast({
            variant: 'destructive',
            title: 'Error Fetching Orders',
            description: 'Could not fetch orders from the database.',
        });
      } else {
        const fetchedOrders = data as Order[];
        setAdminOrders(fetchedOrders);
        setInitialOrders(fetchedOrders); // Keep a copy of the original state
      }
      setOrdersLoading(false);
    }
    fetchAdminOrders();
  }, [toast]);

  const handleUpdateOrder = (orderId: string, field: keyof Order, value: any) => {
    setAdminOrders(prev =>
      prev.map(o => (o.id === orderId ? { ...o, [field]: value } : o))
    );
  };
  
  const handleCancel = () => {
    setAdminOrders(initialOrders);
    setIsEditing(false);
  }

  const handleSave = async () => {
    setIsSaving(true);

    const updatePromises = adminOrders.map(order => 
        supabase
            .from('orders')
            .update({
                status: order.status,
                weight: order.weight,
                load: order.load,
                total: order.total,
            })
            .eq('id', order.id)
    );

    try {
        const results = await Promise.all(updatePromises);
        const hasError = results.some(res => res.error);

        if (hasError) {
            throw new Error('An error occurred while saving one or more orders.');
        }

        toast({
            title: 'Success!',
            description: 'All order changes have been saved.',
            className: 'bg-green-500 text-white',
        });
        setInitialOrders(adminOrders); // Update the base state
        setIsEditing(false);
    } catch(error: any) {
        console.error('Error saving orders:', error);
        toast({
            variant: 'destructive',
            title: 'Save Failed',
            description: error.message || 'Could not save order changes.',
        });
        setAdminOrders(initialOrders); // Revert on failure
    } finally {
        setIsSaving(false);
    }
  }


  return (
    <Card className="w-full">
      <CardHeader className="flex flex-row items-center justify-between">
        <div>
          <CardTitle>Manage Orders</CardTitle>
          <CardDescription>Manage and track all customer orders.</CardDescription>
        </div>
        <div className="flex gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                  <X className="mr-2 h-4 w-4" /> Cancel
                </Button>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                  Save
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} disabled={ordersLoading}>
                <Edit className="mr-2 h-4 w-4" /> Edit Orders
              </Button>
            )}
        </div>
      </CardHeader>
      <CardContent>
        {ordersLoading ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <Loader2 className="h-12 w-12 mb-2 animate-spin" />
            <p>Loading all orders...</p>
          </div>
        ) : adminOrders.length > 0 ? (
          <OrderList 
            orders={adminOrders} 
            isEditing={isEditing}
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
