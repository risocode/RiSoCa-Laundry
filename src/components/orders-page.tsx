'use client';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { OrderList } from '@/components/order-list';
import type { Order } from '@/components/order-list/types';
import { Separator } from '@/components/ui/separator';
import {
  Loader2,
  Inbox,
  Package,
  Plus,
  RefreshCw,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { ManualOrderDialog } from '@/components/manual-order-dialog';
import { InternalOrderDialog } from '@/components/internal-order-dialog';
import { supabase } from '@/lib/supabase-client';
import { useAuthSession } from '@/hooks/use-auth-session';
import { StatisticsCards } from './orders-page/statistics-cards';
import { OrderFilters } from './orders-page/order-filters';
import { calculateStatistics } from './orders-page/calculate-statistics';
import { filterOrders } from './orders-page/filter-orders';
import { fetchOrders } from './orders-page/fetch-orders';
import { handleOrderUpdate } from './orders-page/handle-order-updates';
import { handleOrderCreation } from './orders-page/handle-order-creation';
import { deleteOrder } from '@/lib/api/orders';

export function OrdersPage() {
  const { toast } = useToast();
  const { user } = useAuthSession();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isInternalDialogOpen, setIsInternalDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [datePreset, setDatePreset] = useState<string>('all'); // 'all', 'today'

  const loadOrders = async () => {
    setLoadingAdmin(true);
    try {
      const { data, error } = await fetchOrders();
      if (error) {
        toast({
          variant: 'default',
          title: 'Unable to load orders',
          description: error.message || 'Please refresh the page to see the latest orders.',
        });
      } else if (data) {
        setAllOrders(data);
      }
    } catch (err: any) {
      console.error('Unexpected error fetching orders:', err);
      toast({
        variant: 'default',
        title: 'Unable to load orders',
        description:
          err.message || 'Please refresh the page to see the latest orders.',
      });
    } finally {
      setLoadingAdmin(false);
    }
  };

  // Calculate statistics
  const statistics = useMemo(
    () => calculateStatistics(allOrders),
    [allOrders]
  );

  // Filter orders
  const filteredOrders = useMemo(
    () =>
      filterOrders(
        allOrders,
        searchQuery,
        statusFilter,
        paymentFilter,
        datePreset
      ),
    [allOrders, searchQuery, statusFilter, paymentFilter, datePreset]
  );

  useEffect(() => {
    loadOrders();

    // Set up real-time subscription to refresh when orders change
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          // Refresh orders after a short delay to ensure database is updated
          setTimeout(() => {
            loadOrders();
          }, 100);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const handleUpdateOrder = async (updatedOrder: Order) => {
    const previous = allOrders.find((o) => o.id === updatedOrder.id);
    await handleOrderUpdate(
      updatedOrder,
      previous,
      allOrders,
      setAllOrders,
      toast
    );
  };

  const handleAddOrder = async (newOrder: Omit<Order, 'id' | 'userId'>) => {
    await handleOrderCreation(newOrder, user?.id, toast, loadOrders);
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const { error } = await deleteOrder(orderId);
      if (error) {
        toast({
          variant: 'destructive',
          title: 'Delete failed',
          description: error.message || 'Failed to delete order. Please try again.',
        });
      } else {
        toast({
          title: 'Order deleted',
          description: `Order ${orderId} has been permanently deleted.`,
        });
        // Refresh orders list
        loadOrders();
      }
    } catch (err: any) {
      console.error('Error deleting order:', err);
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: err.message || 'An unexpected error occurred. Please try again.',
      });
    }
  };

  return (
    <div className="w-full">
      {/* Main Orders Card */}
      <Card className="w-full flex flex-col shadow-xl border-2">
        <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-6">
          <div className="flex flex-col gap-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                  <Package className="h-6 w-6 text-primary" />
                  Orders Dashboard
                </CardTitle>
                <CardDescription className="text-sm mt-1">
                  Manage and track all customer orders
                </CardDescription>
              </div>
              <div className="flex gap-2 w-full sm:w-auto">
                <Button
                  onClick={() => setIsInternalDialogOpen(true)}
                  variant="outline"
                  className="flex-1 sm:flex-none gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Internal Order
                </Button>
                <Button
                  onClick={() => setIsDialogOpen(true)}
                  className="flex-1 sm:flex-none gap-2"
                >
                  <Plus className="h-4 w-4" />
                  New Order
                </Button>
                <Button
                  onClick={loadOrders}
                  variant="outline"
                  size="icon"
                  disabled={loadingAdmin}
                >
                  <RefreshCw
                    className={`h-4 w-4 ${loadingAdmin ? 'animate-spin' : ''}`}
                  />
                </Button>
              </div>
            </div>

            {/* Statistics Cards */}
            <StatisticsCards statistics={statistics} />

            <Separator />

            {/* Filters */}
            <OrderFilters
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              statusFilter={statusFilter}
              onStatusFilterChange={setStatusFilter}
              paymentFilter={paymentFilter}
              onPaymentFilterChange={setPaymentFilter}
              datePreset={datePreset}
              onDatePresetChange={(value) => setDatePreset(value)}
              filteredCount={filteredOrders.length}
              totalCount={allOrders.length}
              isLoading={loadingAdmin}
            />
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-y-auto scrollable p-6">
          {loadingAdmin ? (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground">
              <Loader2 className="h-12 w-12 mb-4 animate-spin text-primary" />
              <p className="text-base font-medium">Loading orders dashboard...</p>
            </div>
          ) : filteredOrders && filteredOrders.length > 0 ? (
            <OrderList
              orders={filteredOrders}
              onUpdateOrder={handleUpdateOrder}
              onDeleteOrder={handleDeleteOrder}
              enablePagination={datePreset === 'all'}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-center text-muted-foreground py-12">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Inbox className="h-12 w-12" />
              </div>
              <p className="text-lg font-semibold mb-1">
                {allOrders.length === 0
                  ? 'No orders yet'
                  : 'No orders match your filters'}
              </p>
              <p className="text-sm">
                {allOrders.length === 0
                  ? 'Create your first order to get started'
                  : 'Try adjusting your search or filter criteria'}
              </p>
              {allOrders.length === 0 && (
                <Button onClick={() => setIsDialogOpen(true)} className="mt-4 gap-2">
                  <Plus className="h-4 w-4" />
                  Create First Order
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
      <ManualOrderDialog
        isOpen={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onAddOrder={handleAddOrder}
      />
      <InternalOrderDialog
        isOpen={isInternalDialogOpen}
        onClose={() => setIsInternalDialogOpen(false)}
        onAddOrder={handleAddOrder}
      />
    </div>
  );
}
