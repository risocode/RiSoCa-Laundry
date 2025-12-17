'use client';

import { useState, useEffect } from 'react';
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
import { Search, Inbox, AlertTriangle, User, Loader2, X, ArrowRight, Info, Package, Clock, CheckCircle2 } from 'lucide-react';
import { AverageRatingCard } from '@/components/average-rating-card';
import { useToast } from '@/hooks/use-toast';
import { fetchOrderForCustomer, fetchMyOrders } from '@/lib/api/orders';
import type { Order as OrderType } from '@/components/order-list';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCachedOrders, setCachedOrders } from '@/lib/order-cache';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function OrderStatusPage() {
  const router = useRouter();
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
  const { toast } = useToast();

  // Auto-load orders for logged-in users with caching
  useEffect(() => {
    async function loadMyOrders() {
      if (authLoading || !user) return;
      
      // Load cached orders immediately
      const cachedOrders = getCachedOrders(user.id);
      if (cachedOrders && cachedOrders.length > 0) {
        setMyOrders(cachedOrders);
        // Auto-select the most recent non-Success order
        const nonSuccessOrders = cachedOrders.filter(o => o.status !== 'Success' && o.status !== 'Completed');
        if (nonSuccessOrders.length > 0) {
          setSelectedOrder(nonSuccessOrders[0]);
        } else if (cachedOrders.length > 0) {
          setSelectedOrder(cachedOrders[0]);
        }
      }
      
      // Fetch fresh data in background
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
        }));
        
        // Update cache with fresh data
        setCachedOrders(user.id, mapped);
        
        // Update state with fresh data
        setMyOrders(mapped);
        // Auto-select the most recent non-Success order
        const nonSuccessOrders = mapped.filter(o => o.status !== 'Success' && o.status !== 'Completed');
        if (nonSuccessOrders.length > 0) {
          setSelectedOrder(nonSuccessOrders[0]);
        } else if (mapped.length > 0) {
          // If all orders are Success, still select the first one
          setSelectedOrder(mapped[0]);
        }
      }
      setLoadingMyOrders(false);
    }

    loadMyOrders();
  }, [user, authLoading]);

  // Filter orders based on search
  // IMPORTANT: Filter out "Success" and "Completed" orders for logged-in users on Order Status page
  useEffect(() => {
    if (!user) return;

    let filtered = [...myOrders];

    // Filter out "Success" and "Completed" orders (only show active/pending orders)
    filtered = filtered.filter(order => 
      order.status !== 'Success' && order.status !== 'Completed'
    );

    // Filter by Order ID search (case-insensitive)
    if (orderIdSearch.trim()) {
      const searchLower = orderIdSearch.trim().toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toLowerCase().includes(searchLower) ||
        order.customerName.toLowerCase().includes(searchLower)
      );
    }

    // Sort by most recent
    filtered.sort((a, b) => b.orderDate.getTime() - a.orderDate.getTime());

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
  }, [myOrders, orderIdSearch, user, selectedOrder]);

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
        orderType: data.order_type || 'customer',
        assignedEmployeeId: data.assigned_employee_id ?? null,
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
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="text-center space-y-2">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Package className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold">Check Order Status</h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                {user 
                  ? 'Track your active orders in real-time or search for a specific order.'
                  : 'Enter your Order ID and Name to track your laundry order status.'}
              </p>
            </div>

            {/* Average Rating Card */}
            <AverageRatingCard />

            {/* Main Content Card */}
            <Card className="shadow-lg">
              <CardHeader className="border-b bg-muted/30">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      Order Tracking
                    </CardTitle>
                    <CardDescription className="text-xs sm:text-sm mt-1">
                      {user 
                        ? 'Your active orders are listed below. Select one to view details.'
                        : 'Search for your order using the form below.'}
                    </CardDescription>
                  </div>
                  {user && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push('/my-orders')}
                      className="flex items-center gap-2 w-full sm:w-auto"
                    >
                      View All Orders
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-6">

              {user && myOrders.length > 0 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" />
                      <Label className="text-base font-semibold">Your Active Orders</Label>
                    </div>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Only active orders are shown here. Completed orders are available in "My Orders".
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  
                  {/* Search Controls */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                    <Input
                      placeholder="Search by Order ID or customer name..."
                      value={orderIdSearch}
                      onChange={(e) => setOrderIdSearch(e.target.value)}
                      className="pl-10 pr-10"
                    />
                    {orderIdSearch && (
                      <button
                        type="button"
                        onClick={() => setOrderIdSearch('')}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {/* Orders List */}
                  {filteredOrders.length > 0 ? (
                    <div className="space-y-3 max-h-80 overflow-y-auto scrollable pr-2 -mr-2">
                      {filteredOrders.map((order) => (
                        <button
                          key={order.id}
                          type="button"
                          onClick={() => setSelectedOrder(order)}
                          className={`w-full text-left p-4 rounded-lg border-2 transition-all duration-200 ${
                            selectedOrder?.id === order.id
                              ? 'border-primary bg-primary/5 shadow-md'
                              : 'border-border hover:border-primary/50 hover:bg-muted/50'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-4">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-1">
                                <Package className="h-4 w-4 text-primary flex-shrink-0" />
                                <p className="font-semibold text-sm sm:text-base truncate">Order #{order.id}</p>
                              </div>
                              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs text-muted-foreground">
                                <span className="truncate">{order.customerName}</span>
                                <span className="hidden sm:inline">•</span>
                                <span className="whitespace-nowrap">
                                  {new Date(order.orderDate).toLocaleDateString('en-US', { 
                                    month: 'short', 
                                    day: 'numeric',
                                    year: 'numeric',
                                    hour: '2-digit',
                                    minute: '2-digit'
                                  })}
                                </span>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-sm sm:text-base text-primary">₱{order.total.toFixed(2)}</p>
                              <p className="text-xs text-muted-foreground mt-1">{order.status}</p>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-8 border-2 border-dashed rounded-lg text-center bg-muted/30">
                      <Inbox className="h-10 w-10 mx-auto mb-3 text-muted-foreground" />
                      <p className="text-sm font-medium text-muted-foreground">No orders found matching your search.</p>
                      {orderIdSearch && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setOrderIdSearch('')}
                          className="mt-3"
                        >
                          Clear search
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              )}

              {user && loadingMyOrders && (
                <div className="flex flex-col items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
                  <p className="text-sm text-muted-foreground">Loading your orders...</p>
                </div>
              )}

              {user && myOrders.length === 0 && !loadingMyOrders && (
                <div className="p-8 border-2 border-dashed rounded-lg text-center bg-muted/30">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-base font-medium mb-1">No orders yet</p>
                  <p className="text-sm text-muted-foreground mb-4">Start by creating your first order!</p>
                  <Button
                    onClick={() => router.push('/create-order')}
                    className="gap-2"
                  >
                    Create Order
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {user && myOrders.length > 0 && filteredOrders.length === 0 && !loadingMyOrders && (
                <div className="p-8 border-2 border-dashed rounded-lg text-center bg-muted/30">
                  <CheckCircle2 className="h-12 w-12 mx-auto mb-3 text-green-500" />
                  <p className="text-base font-medium mb-1">All orders completed!</p>
                  <p className="text-sm text-muted-foreground mb-4">All your active orders have been completed.</p>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/my-orders')}
                    className="gap-2"
                  >
                    View All Orders
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Search Form Section */}
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    <Label className="text-base font-semibold">
                      {user ? 'Search for Another Order' : 'Search Order'}
                    </Label>
                  </div>
                  {!user && (
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                        </TooltipTrigger>
                        <TooltipContent>
                          <p className="max-w-xs">
                            Create an account to save and view your order history.
                          </p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  )}
                </div>
                <form onSubmit={handleSearch} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="orderId" className="text-sm font-medium">Order ID</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="orderId"
                          placeholder="e.g., RKR001"
                          value={orderId}
                          onChange={(e) => setOrderId(e.target.value)}
                          className="pl-10 h-11"
                          disabled={loading}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name" className="text-sm font-medium">Customer Name</Label>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                          id="name"
                          placeholder="Enter the name on the order"
                          value={name}
                          onChange={(e) => setName(e.target.value)}
                          className="pl-10 h-11"
                          disabled={loading}
                        />
                      </div>
                    </div>
                  </div>
                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="w-full h-11 text-base font-semibold"
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Searching...
                      </>
                    ) : (
                      <>
                        <Search className="mr-2 h-4 w-4" />
                        Check Status
                      </>
                    )}
                  </Button>
                </form>
              </div>

              {/* Show selected order from my orders or searched order */}
              {(selectedOrder || (searchAttempted && searchedOrder)) && (() => {
                const currentOrder = selectedOrder || searchedOrder!;
                return (
                  <div className="pt-6 border-t space-y-4">
                    <OrderStatusTracker order={currentOrder} />
                    <div className="flex flex-col sm:flex-row gap-3">
                      {user && currentOrder.userId === user.id && (
                        <CancelOrderButton
                          orderId={currentOrder.id}
                          orderStatus={currentOrder.status}
                          onCancelSuccess={async () => {
                            // Refresh orders after cancellation
                            setLoadingMyOrders(true);
                            try {
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
                                }));
                                setMyOrders(mapped);
                                setSelectedOrder(null);
                              } else if (error) {
                                console.error('Error refreshing orders after cancellation:', error);
                              }
                            } catch (error) {
                              console.error('Unexpected error refreshing orders:', error);
                            } finally {
                              setLoadingMyOrders(false);
                            }
                          }}
                        />
                      )}
                      <div className="flex-1">
                        <RateRKRLaundrySection orderId={currentOrder.id} />
                      </div>
                    </div>
                  </div>
                );
              })()}
              
              {searchAttempted && !searchedOrder && !selectedOrder && (
                <div className="p-8 border-2 border-dashed rounded-lg text-center bg-muted/30">
                  <AlertTriangle className="h-12 w-12 mx-auto mb-3 text-destructive" />
                  <h3 className="text-lg font-semibold mb-2">Order Not Found</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    No order was found with the provided details. Please check the ID and name, then try again.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setOrderId('');
                      setName('');
                      setSearchAttempted(false);
                    }}
                  >
                    Try Again
                  </Button>
                </div>
              )}

              {!user && !searchAttempted && !searchedOrder && (
                <div className="p-8 border-2 border-dashed rounded-lg text-center bg-muted/30">
                  <Package className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
                  <p className="text-base font-medium mb-1">Your order status will appear here</p>
                  <p className="text-sm text-muted-foreground mb-4">
                    Create an account to save and view your order history.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 justify-center">
                    <Link href="/register">
                      <Button variant="outline" size="sm" className="w-full sm:w-auto">
                        Sign Up
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button size="sm" className="w-full sm:w-auto">
                        Log In
                      </Button>
                    </Link>
                  </div>
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
