'use client';

import { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { OrderStatusTracker } from '@/components/order-status-tracker';
import type { Order } from '@/components/order-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Inbox, AlertTriangle, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// Mock data has been removed to prepare for backend integration.
const mockOrders: Order[] = [];

export default function OrderStatusPage() {
  const [orderId, setOrderId] = useState('');
  const [name, setName] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
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

    // Simulate API call to find the order
    setTimeout(() => {
      const foundOrder = mockOrders.find(o => {
        const orderIdMatch = o.id.toLowerCase() === orderId.trim().toLowerCase();
        if (!orderIdMatch) return false;

        const nameParts = o.customerName.toLowerCase().split(' ');
        const inputName = name.trim().toLowerCase();

        return nameParts.some(part => part === inputName);
      });

      setSearchedOrder(foundOrder || null);
      setSearchAttempted(true);
      setLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col h-screen">
      <AppHeader showLogo={true} />
      <main className="flex-1 overflow-y-auto flex items-center justify-center container mx-auto px-4 py-8">
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
                      <Label htmlFor="name">First or Last Name</Label>
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
