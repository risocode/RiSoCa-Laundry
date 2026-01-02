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
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Search, Inbox, AlertTriangle, User, Loader2, X, ArrowRight, Info, Package, Clock, CheckCircle2, Sparkles, WashingMachine, Wind, Shirt, Truck, MapPin, Phone, HelpCircle, FileText, DollarSign } from 'lucide-react';
import { AverageRatingCard } from '@/components/average-rating-card';
import { useToast } from '@/hooks/use-toast';
import { fetchOrderForCustomer, fetchMyOrders } from '@/lib/api/orders';
import type { Order as OrderType } from '@/components/order-list';
import { useAuthSession } from '@/hooks/use-auth-session';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getCachedOrders, setCachedOrders } from '@/lib/order-cache';
import { PopupAd } from '@/components/popup-ad';
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
  const [popupAdTrigger, setPopupAdTrigger] = useState(0);
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
          foundItems: Array.isArray(o.found_items) && o.found_items.length > 0 ? o.found_items : undefined,
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
  // Show active orders by default, but allow searching for all orders including completed ones
  useEffect(() => {
    if (!user) return;

    let filtered = [...myOrders];

    // Only filter out "Success" and "Completed" orders if NOT searching
    // When searching, show all orders including completed ones so users can find past orders
    const isSearching = orderIdSearch.trim().length > 0;
    
    if (!isSearching) {
      // Default view: only show active/pending orders
      filtered = filtered.filter(order => 
        order.status !== 'Success' && order.status !== 'Completed'
      );
    }
    // If searching, keep all orders (including completed) so users can find past orders

    // Filter by Order ID search (case-insensitive)
    if (isSearching) {
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
    } else if (filtered.length === 0 && isSearching) {
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

    // Trigger pop-up ad when Check Status is clicked
    setPopupAdTrigger(prev => prev + 1);

    // Normalize order ID: user only enters numbers, we prepend "RKR"
    let normalizedOrderId = orderId.trim();
    // Remove any non-numeric characters (in case user pasted something)
    normalizedOrderId = normalizedOrderId.replace(/\D/g, '');
    
    if (normalizedOrderId) {
      // It's a number, prepend "RKR" and pad with zeros if needed
      const num = parseInt(normalizedOrderId, 10);
      normalizedOrderId = `RKR${String(num).padStart(3, '0')}`;
    } else {
      toast({
        variant: 'destructive',
        title: 'Invalid Order ID',
        description: 'Please enter a valid order number.',
      });
      setLoading(false);
      return;
    }

    const { data, error } = await fetchOrderForCustomer(normalizedOrderId, name.trim());
    if (error) {
      console.error('Order lookup failed', error);
      toast({ variant: 'destructive', title: 'Search failed', description: 'Could not search for your order.' });
      setLoading(false);
      return;
    }

    if (data) {
      // Debug: Log the raw data to see what we're getting
      if (process.env.NODE_ENV === 'development') {
        console.log('fetchOrderForCustomer - Raw data:', data);
        console.log('fetchOrderForCustomer - found_items:', data.found_items, 'Type:', typeof data.found_items, 'IsArray:', Array.isArray(data.found_items));
      }
      
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
        foundItems: Array.isArray(data.found_items) && data.found_items.length > 0 ? data.found_items : (data.found_items ? [data.found_items].flat() : undefined),
      };
      
      // Debug: Log the mapped order
      if (process.env.NODE_ENV === 'development') {
        console.log('fetchOrderForCustomer - Mapped order foundItems:', mapped.foundItems);
      }
      
      setSearchedOrder(mapped);
      // Scroll to order details after a short delay to ensure DOM is updated
      setTimeout(() => {
        const orderDetailsSection = document.getElementById('order-details-section');
        if (orderDetailsSection) {
          orderDetailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 100);
    } else {
      setSearchedOrder(null);
    }
    setSearchAttempted(true);
    setLoading(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <PopupAd trigger={popupAdTrigger} />
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="w-full max-w-4xl mx-auto space-y-6">
            {/* Page Header */}
            <div className="text-center space-y-3 mb-8">
              <div className="flex items-center justify-center gap-3 mb-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                  <Package className="h-7 w-7 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Check Order Status
                </h1>
              </div>
              <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                {user 
                  ? 'Track your active orders in real-time or search for a specific order.'
                  : 'Enter your Order ID and Name to track your laundry order status.'}
              </p>
            </div>

            {/* Average Rating Card */}
            <div className="mb-6">
              <AverageRatingCard />
            </div>

            {/* Main Content Card - Tracking/Search */}
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
                            Active orders are shown by default. Use the search box above to find completed orders, or visit "My Orders" to see all your orders.
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
                          onClick={() => {
                            setSelectedOrder(order);
                            // Trigger pop-up ad when order is selected
                            setPopupAdTrigger(prev => prev + 1);
                            // Scroll to order details after a short delay
                            setTimeout(() => {
                              const orderDetailsSection = document.getElementById('order-details-section');
                              if (orderDetailsSection) {
                                orderDetailsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                              }
                            }, 100);
                          }}
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
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1 z-10 pointer-events-none">
                          <Search className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-semibold text-foreground">RKR</span>
                        </div>
                        <Input
                          id="orderId"
                          type="text"
                          inputMode="numeric"
                          placeholder="123"
                          value={orderId}
                          onChange={(e) => {
                            // Only allow numeric input
                            const value = e.target.value.replace(/\D/g, '');
                            setOrderId(value);
                          }}
                          onKeyDown={(e) => {
                            // Prevent deleting "RKR" prefix
                            if (e.key === 'Backspace' && orderId === '') {
                              e.preventDefault();
                            }
                          }}
                          className="pl-16 h-11"
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
                  <div 
                    id="order-details-section"
                    className="pt-6 border-t space-y-4"
                  >
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
                                  foundItems: Array.isArray(o.found_items) && o.found_items.length > 0 ? o.found_items : undefined,
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

            {/* Divider */}
            <div className="relative my-12">
              <div className="absolute inset-0 flex items-center">
                <Separator className="w-full" />
              </div>
              <div className="relative flex justify-center">
                <div className="bg-background px-4">
                  <span className="text-sm text-muted-foreground font-medium">Learn More</span>
                </div>
              </div>
            </div>

            {/* How Tracking Works Section */}
            <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border-b p-6">
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  How Order Tracking Works
                </CardTitle>
                <CardDescription className="text-sm mt-2 text-base">
                  Real-time updates on your laundry order status
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8 space-y-5">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Our order tracking system provides real-time updates on your laundry order from the moment it's placed until it's delivered or ready for pickup. You can monitor every stage of the process and know exactly when to expect your clean laundry.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="space-y-2 p-5 rounded-xl border-2 bg-muted/30 hover:border-primary/30 hover:bg-muted/50 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/15">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-base">Real-Time Updates</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Your order status updates automatically as it progresses through each stage. No need to refresh - we keep you informed in real-time.
                    </p>
                  </div>
                  <div className="space-y-2 p-5 rounded-xl border-2 bg-muted/30 hover:border-primary/30 hover:bg-muted/50 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/15">
                        <Package className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-base">Complete History</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      View the complete timeline of your order, including when each status change occurred. Track your laundry from start to finish.
                    </p>
                  </div>
                  <div className="space-y-2 p-5 rounded-xl border-2 bg-muted/30 hover:border-primary/30 hover:bg-muted/50 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/15">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-base">Status Notifications</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Get notified when your order reaches important milestones like "In Progress", "Ready for Pickup", or "Out for Delivery".
                    </p>
                  </div>
                  <div className="space-y-2 p-5 rounded-xl border-2 bg-muted/30 hover:border-primary/30 hover:bg-muted/50 transition-all">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="p-2 rounded-lg bg-primary/15">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <h3 className="font-bold text-base">Easy Access</h3>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Search for any order using your Order ID and name. No account required to track your order status.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Status Guide Card */}
            <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border-b p-6">
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Info className="h-6 w-6 text-primary" />
                  </div>
                  Understanding Order Statuses
                </CardTitle>
                <CardDescription className="text-sm mt-2 text-base">
                  What each status means for your order
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-5">
                  <div className="flex gap-5 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shadow-sm">
                        <Package className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-base">Order Created</h3>
                        <Badge variant="outline" className="text-xs">Initial</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your order has been successfully placed and is waiting to be processed.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-5 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center shadow-sm">
                        <WashingMachine className="h-5 w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-base">In Progress</h3>
                        <Badge variant="outline" className="text-xs">Processing</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your laundry is being washed, dried, and folded with care. This typically takes 40-50 minutes per stage.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-5 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center shadow-sm">
                        <Wind className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-base">Drying</h3>
                        <Badge variant="outline" className="text-xs">Processing</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your laundry is being dried to perfection. This stage typically takes 40-50 minutes.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-5 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center shadow-sm">
                        <Shirt className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-base">Folding</h3>
                        <Badge variant="outline" className="text-xs">Processing</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your clean laundry is being neatly folded and prepared for pickup or delivery. This takes 20-30 minutes.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-5 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center shadow-sm">
                        <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-base">Ready for Pickup / Out for Delivery</h3>
                        <Badge variant="outline" className="text-xs">Ready</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your laundry is ready! You can pick it up at our location, or we're on our way to deliver it to you.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-5 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center shadow-sm">
                        <Truck className="h-5 w-5 text-primary" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-bold text-base">Delivered / Completed</h3>
                        <Badge variant="outline" className="text-xs">Complete</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your order has been successfully completed and delivered or picked up. Thank you for choosing RKR Laundry!
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Helpful Tips Section */}
            <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
              <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border-b p-6">
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <HelpCircle className="h-6 w-6 text-primary" />
                  </div>
                  Helpful Tips
                </CardTitle>
                <CardDescription className="text-sm mt-2 text-base">
                  Everything you need to know about tracking your order
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div className="space-y-5">
                  <div className="flex gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/15">
                      <Package className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base mb-2">Finding Your Order ID</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Your Order ID is provided when you place an order. Simply enter the number (e.g., 123) and the system will automatically format it as RKR123. You can find it in your order confirmation email or on your account's order history.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/15">
                      <Clock className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base mb-2">When to Expect Updates</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Status updates occur in real-time as your order progresses. Standard service typically takes 24-48 hours from drop-off to completion. You'll see updates at each major stage of the process.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/15">
                      <AlertTriangle className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base mb-2">If Your Order is Delayed</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        If your order seems delayed, check the status tracker for the latest update. For urgent concerns, please contact us directly using the contact information provided on our website.
                      </p>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex gap-4 p-4 rounded-xl bg-muted/20 hover:bg-muted/30 transition-colors">
                    <div className="flex-shrink-0 p-2.5 rounded-lg bg-primary/15">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold text-base mb-2">Need Help?</h3>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        If you have questions about your order or need assistance, visit our Contact Us page or check our FAQs. We're here to help ensure you have the best experience with RKR Laundry.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Related Services Card */}
            <Card className="shadow-xl border-2 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 hover:shadow-2xl transition-shadow">
              <CardHeader className="border-b p-6">
                <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/20">
                    <Sparkles className="h-6 w-6 text-primary" />
                  </div>
                  Related Services
                </CardTitle>
                <CardDescription className="text-sm mt-2 text-base">
                  Explore more of what we offer
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 sm:p-8">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Link href="/create-order">
                    <div className="p-5 rounded-xl border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-background/80 group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-primary/15 group-hover:bg-primary/25 transition-colors">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-base">Create New Order</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Place a new laundry order with our easy-to-use order form. Select your package and get instant pricing.
                      </p>
                    </div>
                  </Link>
                  <Link href="/service-rates">
                    <div className="p-5 rounded-xl border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-background/80 group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-primary/15 group-hover:bg-primary/25 transition-colors">
                          <DollarSign className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-base">Service Rates</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        View our transparent pricing structure. Standard rates, delivery fees, and package details.
                      </p>
                    </div>
                  </Link>
                  <Link href="/faqs">
                    <div className="p-5 rounded-xl border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-background/80 group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-primary/15 group-hover:bg-primary/25 transition-colors">
                          <HelpCircle className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-base">FAQs</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Find answers to common questions about our services, pricing, delivery, and more.
                      </p>
                    </div>
                  </Link>
                  <Link href="/contact-us">
                    <div className="p-5 rounded-xl border-2 hover:border-primary hover:shadow-lg transition-all cursor-pointer bg-background/80 group">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="p-2.5 rounded-lg bg-primary/15 group-hover:bg-primary/25 transition-colors">
                          <Phone className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-bold text-base">Contact Us</h3>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        Get in touch with us for questions, support, or special requests. We're here to help!
                      </p>
                    </div>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
