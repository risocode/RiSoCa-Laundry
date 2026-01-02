'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { OrderStatusTracker } from '@/components/order-status-tracker';
import { RateRKRLaundrySection } from '@/components/rate-rkr-laundry/rate-rkr-laundry-section';
import { CancelOrderButton } from '@/components/cancel-order-button';
import type { Order } from '@/components/order-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Inbox, Loader2, Filter, X, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { fetchMyOrders } from '@/lib/api/orders';
import { useAuthSession } from '@/hooks/use-auth-session';
import { getCachedOrders, setCachedOrders } from '@/lib/order-cache';

export default function MyOrdersPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const [myOrders, setMyOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loadingMyOrders, setLoadingMyOrders] = useState(true);
  const [orderIdSearch, setOrderIdSearch] = useState('');
  const [dateFilter, setDateFilter] = useState<'recent' | 'oldest' | 'all'>('recent');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // Redirect if not logged in
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        variant: 'destructive',
        title: 'Authentication Required',
        description: 'Please log in to view your orders.',
      });
      router.push('/login');
    }
  }, [user, authLoading, router, toast]);

  // Load orders for logged-in users with caching
  useEffect(() => {
    async function loadMyOrders() {
      if (authLoading || !user) return;
      
      // Load cached orders immediately
      const cachedOrders = getCachedOrders(user.id);
      if (cachedOrders && cachedOrders.length > 0) {
        setMyOrders(cachedOrders);
        // Auto-select the most recent order
        if (cachedOrders.length > 0) {
          setSelectedOrder(cachedOrders[0]);
        }
      }
      
      // Fetch fresh data in background
      setLoadingMyOrders(true);
      const { data, error } = await fetchMyOrders();
      
      if (error) {
        console.error('Failed to load orders', error);
        toast({
          variant: 'destructive',
          title: 'Failed to load orders',
          description: error.message || 'Could not load your orders.',
        });
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
          balance: typeof o.balance === 'number' ? o.balance : (o.balance ? parseFloat(o.balance) : (o.is_paid ? 0 : o.total)),
          deliveryOption: o.delivery_option ?? undefined,
          servicePackage: o.service_package,
          distance: o.distance ?? 0,
          statusHistory: (o.order_status_history ?? []).map((sh: any) => ({
            status: sh.status,
            timestamp: new Date(sh.created_at),
          })),
          orderType: o.order_type || 'customer',
          assignedEmployeeId: o.assigned_employee_id ?? null,
          foundItems: Array.isArray(o.found_items) && o.found_items.length > 0 ? o.found_items : undefined,
        }));
        
        // Update cache with fresh data
        setCachedOrders(user.id, mapped);
        
        // Update state with fresh data
        setMyOrders(mapped);
        // Auto-select the most recent order
        if (mapped.length > 0) {
          setSelectedOrder(mapped[0]);
        }
      }
      setLoadingMyOrders(false);
    }

    loadMyOrders();
  }, [user, authLoading, toast]);

  // Filter and sort orders based on search, date filter, and status filter
  useEffect(() => {
    if (!user) return;

    let filtered = [...myOrders];

    // Filter by Order ID search (case-insensitive)
    if (orderIdSearch.trim()) {
      const searchLower = orderIdSearch.trim().toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower)
      );
    }

    // Filter by status
    if (statusFilter !== 'all') {
      filtered = filtered.filter(order => order.status === statusFilter);
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
    } else if (filtered.length === 0 && (orderIdSearch.trim() || statusFilter !== 'all')) {
      setSelectedOrder(null);
    }
  }, [myOrders, orderIdSearch, dateFilter, statusFilter, user, selectedOrder]);

  // Get unique statuses for filter
  const uniqueStatuses = Array.from(new Set(myOrders.map(o => o.status))).sort();

  // Don't render if not logged in (will redirect)
  if (!authLoading && !user) {
    return null;
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="w-full max-w-4xl mx-auto">
            {/* Header with back button */}
            <div className="mb-6 flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/order-status')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Order Status
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>My Orders</CardTitle>
                <CardDescription>
                  View all your orders, including completed ones.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loadingMyOrders ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                  </div>
                ) : myOrders.length === 0 ? (
                  <div className="p-8 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                    <Inbox className="h-12 w-12 mx-auto mb-4" />
                    <p className="text-lg font-semibold mb-2">No orders found</p>
                    <p>You don't have any orders yet.</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {/* Search and Filter Controls */}
                    <div className="space-y-4">
                      {/* Order ID Search */}
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          placeholder="Search by Order ID or Customer Name (e.g., RKR001)"
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

                      {/* Filters Row */}
                      <div className="flex flex-col sm:flex-row gap-3 transition-all duration-300">
                        {/* Status Filter */}
                        <div className="flex items-center gap-2 flex-1">
                          <Filter className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                          <Label className="text-sm text-muted-foreground whitespace-nowrap">Status:</Label>
                          <select
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            className="flex-1 px-3 py-2 text-sm border rounded-md bg-background min-w-0"
                          >
                            <option value="all">All Statuses</option>
                            {uniqueStatuses.map(status => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>

                        {/* Date Filter */}
                        <div className="flex items-center gap-2">
                          <Label className="text-sm text-muted-foreground whitespace-nowrap">Sort by:</Label>
                          <div className="flex gap-2">
                            <Button
                              type="button"
                              variant={dateFilter === 'recent' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setDateFilter('recent')}
                            >
                              Recent
                            </Button>
                            <Button
                              type="button"
                              variant={dateFilter === 'oldest' ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setDateFilter('oldest')}
                            >
                              Oldest
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Orders List */}
                    {filteredOrders.length > 0 ? (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 transition-all duration-300">
                        {/* Orders List Column */}
                        <div className="space-y-2 max-h-[600px] overflow-y-auto scrollable">
                          {filteredOrders.map((order) => (
                            <button
                              key={order.id}
                              type="button"
                              onClick={() => setSelectedOrder(order)}
                              className={`w-full text-left p-4 rounded-lg border transition-colors ${
                                selectedOrder?.id === order.id
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:bg-muted'
                              }`}
                            >
                              <div className="flex justify-between items-start">
                                <div className="flex-1">
                                  <p className="font-semibold text-sm">Order #{order.id}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {order.customerName} • {new Date(order.orderDate).toLocaleDateString('en-US', { 
                                      year: 'numeric', 
                                      month: 'short', 
                                      day: 'numeric',
                                      hour: '2-digit',
                                      minute: '2-digit'
                                    })}
                                  </p>
                                  <p className="text-xs font-medium mt-1 text-muted-foreground">
                                    Status: <span className="text-foreground">{order.status}</span>
                                  </p>
                                </div>
                                <div className="text-right ml-4">
                                  <p className="font-semibold text-sm">₱{order.total.toFixed(2)}</p>
                                  <p className="text-xs text-muted-foreground mt-1">
                                    {order.isPaid ? 'Paid' : 'Unpaid'}
                                  </p>
                                </div>
                              </div>
                            </button>
                          ))}
                        </div>

                        {/* Order Details Column */}
                        <div className="lg:sticky lg:top-4 lg:h-fit">
                          {selectedOrder && (
                            <div className="space-y-4">
                              <OrderStatusTracker order={selectedOrder} />
                              {user && selectedOrder.userId === user.id && (
                                <CancelOrderButton
                                  orderId={selectedOrder.id}
                                  orderStatus={selectedOrder.status}
                                  onCancelSuccess={async () => {
                                    // Refresh orders after cancellation
                                    setLoadingMyOrders(true);
                                    const { data, error } = await fetchMyOrders();
                                    if (!error && data) {
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
                                        balance: typeof o.balance === 'number' ? o.balance : (o.balance ? parseFloat(o.balance) : (o.is_paid ? 0 : o.total)),
                                        deliveryOption: o.delivery_option ?? undefined,
                                        servicePackage: o.service_package,
                                        distance: o.distance ?? 0,
                                        statusHistory: (o.order_status_history ?? []).map((sh: any) => ({
                                          status: sh.status,
                                          timestamp: new Date(sh.created_at),
                                  })),
                                  orderType: o.order_type || 'customer',
                                  assignedEmployeeId: o.assigned_employee_id ?? null,
                                  foundItems: Array.isArray(o.found_items) && o.found_items.length > 0 ? o.found_items : undefined,
                                }));
                                setMyOrders(mapped);
                                setSelectedOrder(null);
                                    }
                                    setLoadingMyOrders(false);
                                  }}
                                />
                              )}
                              <RateRKRLaundrySection orderId={selectedOrder.id} />
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="p-8 border border-dashed rounded-lg text-center text-sm text-muted-foreground">
                        <Inbox className="h-12 w-12 mx-auto mb-4" />
                        <p>No orders found matching your filters.</p>
                      </div>
                    )}
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

