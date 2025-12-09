'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { OrderStatusTracker } from '@/components/order-status-tracker';
import type { Order } from '@/components/order-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Inbox, AlertTriangle, User, Loader2, Filter, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchOrderForCustomer, fetchMyOrders } from '@/lib/api/orders';
import { useAuthSession } from '@/hooks/use-auth-session';

export default function OrderStatusPage() {
  const { user, loading: authLoading } = useAuthSession();
  const [orderId, setOrderId] = useState('');
  const [name, setName] = useState('');
  const [searchedOrder, setSearchedOrder] = useState<Order | null>(null);
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [searchAttempted, setSearchAttempted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMyOrders, setLoadingMyOrders] = useState(false);
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'recent' | 'oldest' | 'all'>('recent');
  const { toast } = useToast();

  // Auto-load orders for logged-in users
  useEffect(() => {
    async function loadMyOrders() {
      if (authLoading || !user) return;
      
      setLoadingMyOrders(true);
      const { data, error } = await fetchMyOrders();
      
      if (error) {
        console.error('Failed to load orders', error);
        setLoadingMyOrders(false);
        return;
      }

      if (data && data.length > 0) {
        const mapped: Order[] = data.map((o: any) => ({
          id: o.id,
          userId: o.customer_id,
          customerName: o.customer_name,
          contactNumber: o.contact_number,
          load: o.loads,
          weight: o.weight,
          status: o.status,
          total: o.total,
          orderDate: new Date(o.created_at),
          isPaid: o.is_paid,
          deliveryOption: o.delivery_option ?? undefined,
          servicePackage: o.service_package,
          distance: o.distance ?? 0,
          statusHistory: (o.order_status_history ?? []).map((sh: any) => ({
            status: sh.status,
            timestamp: new Date(sh.created_at),
          })),
        }));
        setMyOrders(mapped);
        // Auto-select the most recent order
        if (mapped.length > 0) {
          setSelectedOrder(mapped[0]);
        }
      }
      setLoadingMyOrders(false);
    }

    loadMyOrders();
  }, [user, authLoading]);

  // Filter and sort orders based on search and date filter
  useEffect(() => {
    if (!user) return;

    let filtered = [...myOrders];

    // Filter by Order ID search
    if (orderIdSearch.trim()) {
      const searchLower = orderIdSearch.trim().toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower)
      );
    }

    // Sort by date filter
    if (dateFilter === 'recent') {
      filtered.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());
    } else if (dateFilter === 'oldest') {
      filtered.sort((a, b) => a.orderDate.getTime() - b.orderDate.getTime());
    }

    setFilteredOrders(filtered);

    // Auto-select first order if available and current selection is not in filtered list
    if (filtered.length > 0) {
      const isCurrentSelectedInFiltered = selectedOrder && filtered.some(o => o.id === selectedOrder.id);
      if (!isCurrentSelectedInFiltered) {
        setSelectedOrder(filtered[0]);
      }
    } else if (filtered.length === 0 && orderIdSearch.trim()) {
      setSelectedOrder(null);
    }
  }, [myOrders, orderIdSearch, dateFilter, user, selectedOrder]);

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
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8 flex items-start justify-center min-h-full">
        <div className="w-full max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>Check Order Status</CardTitle>
              <CardDescription>
                {user 
                  ? 'View your orders below or search for a specific order.'
                  : 'Enter your order ID and name to see the real-time progress of your laundry.'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {user && myOrders.length > 0 && (
                <div className="mb-6 space-y-4">
                  <div>
                    <Label className="text-base font-semibold mb-3 block">Your Orders</Label>
                    
                    {/* Search and Filter Controls */}
                    <div className="space-y-3 mb-4">
                      {/* Order ID Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by Order ID (e.g., RKR001)"
                          value={orderIdSearch}
                          onChange={(e) => setOrderIdSearch(e.target.value)}
                          className="pl-10 pr-10"
                        />
                        {orderIdSearch && (
                          <button
                            type="button"
                            onClick={() => setOrderIdSearch('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Date Filter */}
                      <div className="flex items-center gap-2">
                        <Filter className="h-4 w-4 text-muted-foreground" />
                        <Label className="text-sm text-muted-foreground">Sort by:</Label>
                        <div className="flex gap-2 flex-1">
                          <Button
                            type="button"
                            variant={dateFilter === 'recent' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDateFilter('recent')}
                            className="flex-1 text-xs"
                          >
                            Recent
                          </Button>
                          <Button
                            type="button"
                            variant={dateFilter === 'oldest' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setDateFilter('oldest')}
                            className="flex-1 text-xs"
                          >
                            Oldest
                          </Button>
                          {orderIdSearch && (
                            <Button
                              type="button"
                              variant={dateFilter === 'all' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setDateFilter('all')}
                              className="flex-1 text-xs"
                            >
                              All
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Orders List */}
                    {filteredOrders.length > 0 ? (
                      <div className="space-y-2 max-h-64 overflow-y-auto scrollable">
                        {filteredOrders.map((order) => (
                          <button
                            key={order.id}
                            type="button"
                            onClick={() => setSelectedOrder(order)}
                            className={`w-full text-left p-3 rounded-lg border transition-colors ${
                              selectedOrder?.id === order.id
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted'
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div>
                                <p className="font-semibold text-sm">Order #{order.id}</p>
                                <p className="text-xs text-muted-foreground">
                                  {order.customerName} • {new Date(order.orderDate).toLocaleDateString('en-US', { 
                                    year: 'numeric', 
                                    month: 'short', 
                                    day: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </p>
                              </div>
                              <div className="text-right">
                                <p className="font-semibold text-sm">₱{order.total.toFixed(2)}</p>
                                <p className="text-xs text-muted-foreground">{order.status}</p>
                              </div>
                            </div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                        <Inbox className="h-8 w-8 mx-auto mb-2" />
                        <p>No orders found matching your search.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {user && loadingMyOrders && (
                <div className="mb-6 flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              )}

              {user && myOrders.length === 0 && !loadingMyOrders && (
                <div className="mb-6 p-4 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                  <Inbox className="h-8 w-8 mx-auto mb-2" />
                  <p>You don't have any orders yet.</p>
                </div>
              )}

              <div className="mb-6">
                <Label className="text-base font-semibold mb-3 block">
                  {user ? 'Search for Another Order' : 'Search Order'}
                </Label>
                <form onSubmit={handleSearch} className="flex flex-col gap-3">
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
              </div>

              {/* Show selected order from my orders or searched order */}
              {(selectedOrder || (searchAttempted && searchedOrder)) && (
                <OrderStatusTracker order={selectedOrder || searchedOrder!} />
              )}
              
              {searchAttempted && !searchedOrder && !selectedOrder && (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border rounded-lg bg-card p-8">
                    <AlertTriangle className="h-12 w-12 mb-2 text-destructive" />
                    <h3 className="text-lg font-semibold">Order Not Found</h3>
                    <p>No order was found with the provided details. Please check the ID and name, then try again.</p>
                </div>
              )}

              {!user && !searchAttempted && !searchedOrder && (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border-2 border-dashed rounded-lg bg-transparent p-8">
                    <Inbox className="h-12 w-12 mb-2" />
                    <p>Your order status will appear here.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
