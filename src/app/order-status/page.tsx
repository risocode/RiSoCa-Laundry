'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { OrderStatusTracker } from '@/components/order-status-tracker';
import type { Order } from '@/components/order-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Inbox, AlertTriangle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchOrderForCustomer } from '@/lib/api/orders';

export default function OrderStatusPage() {
  const [orderId, setOrderId] = useState('');
  const [name, setName] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!orderId || !name) {
      toast({
        variant: 'destructive',
        title: 'Information Required',
        description: 'Please enter both an Order ID and your name.',
      });
      return;
    }

    setLoading(true);
    setSearchAttempted(false);

    const { data, error } = await fetchOrderForCustomer(orderId.trim(), name.trim());
    if (error) {
      console.error('Order lookup failed', error);
      toast({ variant: 'destructive', title: 'Search failed', description: 'Could not search for your order.' });
      setLoading(false);
      return;
    }

    if (data) {
      const mapped: Order = {
        id: data.id,
        userId: data.customer_id,
        customerName: data.customer_name,
        contactNumber: data.contact_number,
        load: data.loads,
        weight: data.weight,
        status: data.status,
        total: data.total,
        orderDate: new Date(data.created_at),
        isPaid: data.is_paid,
        deliveryOption: data.delivery_option ?? undefined,
        servicePackage: data.service_package,
        distance: data.distance ?? 0,
        statusHistory: (data.order_status_history ?? []).map((sh: any) => ({
          status: sh.status,
          timestamp: new Date(sh.created_at),
        })),
      };
      setSearchedOrder(mapped);
    } else {
      setSearchedOrder(null);
    }
    setSearchAttempted(true);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto flex items-center justify-center container mx-auto px-4 py-8 pb-14">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Check Order Status</CardTitle>
              <CardDescription>Enter your order ID and name to see the real-time progress of your laundry.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSearch} className="flex flex-col gap-3 mb-6">
                <div className="flex flex-col sm:flex-row gap-3">
                    <div className="w-full grid gap-1.5">
                      <Label htmlFor="orderId">Order ID</Label>
                       <div className="relative">
                         <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="orderId"
                          placeholder="e.g., RKR001"
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                          className="pl-10"
                          disabled={loading}
                        />
                       </div>
                    </div>
                     <div className="w-full grid gap-1.5">
                      <Label htmlFor="name">Any Part of Your Name</Label>
                       <div className="relative">
                         <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="e.g., Jane"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10"
                          disabled={loading}
                        />
                       </div>
                    </div>
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                    {loading ? 'Searching...' : 'Check Status'}
                </Button>
              </form>

              {searchAttempted && searchedOrder && (
                <OrderStatusTracker order={searchedOrder} />
              )}
              
              {searchAttempted && !searchedOrder && (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border rounded-lg bg-card p-8">
                    <AlertTriangle className="h-12 w-12 mb-2 text-destructive" />
                    <h3 className="text-lg font-semibold">Order Not Found</h3>
                    <p>No order was found with the provided details. Please check the ID and name, then try again.</p>
                </div>
              )}

              {!searchAttempted && !searchedOrder && (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-transparent p-8">
                    <Inbox className="h-12 w-12 mb-2" />
                    <p>Your order status will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
