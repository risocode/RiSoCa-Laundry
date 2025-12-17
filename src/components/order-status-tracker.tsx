"use client";
import { useState, useEffect, useRef } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shirt, Truck, PackageCheck, CircleCheck, Wind, WashingMachine, Package, CheckCircle2, User, Weight as WeightIcon, Layers, Wallet, X, Info, RefreshCw, Clock, Sparkles, AlertCircle } from 'lucide-react';
import type { Order, StatusHistory } from '@/components/order-list';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { Button } from './ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { fetchOrderWithHistory } from '@/lib/api/orders';

const statuses = [
  { 
    name: 'Order Created', 
    icon: CircleCheck, 
    description: 'Your order has been created and is awaiting approval',
    estimatedTime: '5-10 minutes',
    color: 'text-gray-600'
  },
  { 
    name: 'Order Placed', 
    icon: CircleCheck, 
    description: 'Order confirmed and ready for processing',
    estimatedTime: 'Immediate',
    color: 'text-blue-600'
  },
  { 
    name: 'Pickup Scheduled', 
    icon: Truck, 
    description: 'Pickup has been scheduled and is on the way',
    estimatedTime: '30-60 minutes',
    color: 'text-purple-600'
  },
  { 
    name: 'Washing', 
    icon: WashingMachine, 
    description: 'Your laundry is being washed with care',
    estimatedTime: '40-50 minutes',
    color: 'text-cyan-600'
  },
  { 
    name: 'Drying', 
    icon: Wind, 
    description: 'Laundry is being dried to perfection',
    estimatedTime: '40-50 minutes',
    color: 'text-yellow-600'
  },
  { 
    name: 'Folding', 
    icon: Shirt, 
    description: 'Your clean laundry is being neatly folded',
    estimatedTime: '20-30 minutes',
    color: 'text-indigo-600'
  },
  { 
    name: 'Ready for Pick Up', 
    icon: Package, 
    description: 'Your order is ready! You can pick it up anytime',
    estimatedTime: 'Available now',
    color: 'text-green-600'
  },
  { 
    name: 'Out for Delivery', 
    icon: Truck, 
    description: 'Your order is on the way to you',
    estimatedTime: '30-60 minutes',
    color: 'text-orange-600'
  },
  { 
    name: 'Delivered', 
    icon: PackageCheck, 
    description: 'Order has been successfully delivered',
    estimatedTime: 'Completed',
    color: 'text-green-600'
  },
  { 
    name: 'Success', 
    icon: CheckCircle2, 
    description: 'Order completed successfully!',
    estimatedTime: 'Completed',
    color: 'text-green-600'
  },
  { 
    name: 'Canceled', 
    icon: X, 
    description: 'This order has been canceled',
    estimatedTime: 'N/A',
    color: 'text-red-600'
  },
];

export function OrderStatusTracker({ order: initialOrder }: { order: Order }) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [statusLogs, setStatusLogs] = useState<StatusHistory[]>([]);
  const [progress, setProgress] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [hasNewUpdate, setHasNewUpdate] = useState(false);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const previousStatusRef = useRef<string>(initialOrder.status);

  // Real-time subscription for order updates
  useEffect(() => {
    const channel = supabase
      .channel(`order-${order.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${order.id}`,
        },
        async (payload) => {
          // Fetch updated order with history
          const { data: updatedOrder, error } = await fetchOrderWithHistory(order.id);
          if (!error && updatedOrder) {
            const mapped: Order = {
              id: updatedOrder.id,
              userId: updatedOrder.customer_id,
              customerName: updatedOrder.customer_name,
              contactNumber: updatedOrder.contact_number,
              load: updatedOrder.loads,
              weight: updatedOrder.weight,
              status: updatedOrder.status,
              total: updatedOrder.total,
              orderDate: new Date(updatedOrder.created_at),
              isPaid: updatedOrder.is_paid,
              balance: typeof updatedOrder.balance === 'number' ? updatedOrder.balance : (updatedOrder.balance ? parseFloat(updatedOrder.balance) : (updatedOrder.is_paid ? 0 : updatedOrder.total)),
              deliveryOption: updatedOrder.delivery_option ?? undefined,
              servicePackage: updatedOrder.service_package,
              distance: updatedOrder.distance ?? 0,
              statusHistory: (updatedOrder.order_status_history ?? []).map((sh: any) => ({
                status: sh.status,
                timestamp: new Date(sh.created_at),
              })),
              orderType: updatedOrder.order_type || 'customer',
              assignedEmployeeId: updatedOrder.assigned_employee_id ?? null,
            };
            
            if (mapped.status !== previousStatusRef.current) {
              setHasNewUpdate(true);
              previousStatusRef.current = mapped.status;
            }
            
            setOrder(mapped);
            setLastUpdated(new Date());
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [order.id]);

  // Auto-refresh every 30 seconds for active orders
  useEffect(() => {
    const isActiveOrder = order.status !== 'Success' && order.status !== 'Delivered' && order.status !== 'Canceled';
    
    if (isActiveOrder) {
      refreshIntervalRef.current = setInterval(async () => {
        setIsRefreshing(true);
        const { data: updatedOrder, error } = await fetchOrderWithHistory(order.id);
        if (!error && updatedOrder) {
          const mapped: Order = {
            id: updatedOrder.id,
            userId: updatedOrder.customer_id,
            customerName: updatedOrder.customer_name,
            contactNumber: updatedOrder.contact_number,
            load: updatedOrder.loads,
            weight: updatedOrder.weight,
            status: updatedOrder.status,
            total: updatedOrder.total,
            orderDate: new Date(updatedOrder.created_at),
            isPaid: updatedOrder.is_paid,
            balance: typeof updatedOrder.balance === 'number' ? updatedOrder.balance : (updatedOrder.balance ? parseFloat(updatedOrder.balance) : (updatedOrder.is_paid ? 0 : updatedOrder.total)),
            deliveryOption: updatedOrder.delivery_option ?? undefined,
            servicePackage: updatedOrder.service_package,
            distance: updatedOrder.distance ?? 0,
            statusHistory: (updatedOrder.order_status_history ?? []).map((sh: any) => ({
              status: sh.status,
              timestamp: new Date(sh.created_at),
            })),
            orderType: updatedOrder.order_type || 'customer',
            assignedEmployeeId: updatedOrder.assigned_employee_id ?? null,
          };
          
          if (mapped.status !== previousStatusRef.current) {
            setHasNewUpdate(true);
            previousStatusRef.current = mapped.status;
          }
          
          setOrder(mapped);
          setLastUpdated(new Date());
        }
        setIsRefreshing(false);
      }, 30000); // Refresh every 30 seconds
    }

    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, [order.id, order.status]);

  // Update when order prop changes
  useEffect(() => {
    setOrder(initialOrder);
    previousStatusRef.current = initialOrder.status;
  }, [initialOrder.id, initialOrder.status]);

  useEffect(() => {
    const orderStatusIndex = statuses.findIndex(s => s.name === order.status);
    
    if (orderStatusIndex !== -1) {
      setCurrentStatusIndex(orderStatusIndex);
      
      const logs = (order.statusHistory || [{ status: order.status, timestamp: order.orderDate }])
        .map(log => ({ ...log, timestamp: new Date(log.timestamp) }))
        .sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime());

      setStatusLogs(logs);

      // Calculate progress based on completed statuses
      const activeStatuses = statuses.filter(s => s.name !== 'Canceled');
      const currentStatusInAllStatuses = activeStatuses.findIndex(s => s.name === order.status);
      const progressValue = order.status === 'Canceled' 
        ? 0 
        : ((currentStatusInAllStatuses + 1) / activeStatuses.length) * 100;
      setProgress(progressValue);
    }
  }, [order]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    const { data: updatedOrder, error } = await fetchOrderWithHistory(order.id);
    if (!error && updatedOrder) {
      const mapped: Order = {
        id: updatedOrder.id,
        userId: updatedOrder.customer_id,
        customerName: updatedOrder.customer_name,
        contactNumber: updatedOrder.contact_number,
        load: updatedOrder.loads,
        weight: updatedOrder.weight,
        status: updatedOrder.status,
        total: updatedOrder.total,
        orderDate: new Date(updatedOrder.created_at),
        isPaid: updatedOrder.is_paid,
        balance: typeof updatedOrder.balance === 'number' ? updatedOrder.balance : (updatedOrder.balance ? parseFloat(updatedOrder.balance) : (updatedOrder.is_paid ? 0 : updatedOrder.total)),
        deliveryOption: updatedOrder.delivery_option ?? undefined,
        servicePackage: updatedOrder.service_package,
        distance: updatedOrder.distance ?? 0,
        statusHistory: (updatedOrder.order_status_history ?? []).map((sh: any) => ({
          status: sh.status,
          timestamp: new Date(sh.created_at),
        })),
        orderType: updatedOrder.order_type || 'customer',
        assignedEmployeeId: updatedOrder.assigned_employee_id ?? null,
      };
      setOrder(mapped);
      setLastUpdated(new Date());
      setHasNewUpdate(false);
    }
    setIsRefreshing(false);
  };

  const CurrentIcon = statuses[currentStatusIndex]?.icon || CircleCheck;
  const currentStatusInfo = statuses[currentStatusIndex];
  const isPaid = order.isPaid || order.status === 'Success' || order.status === 'Delivered';
  const isActiveOrder = order.status !== 'Success' && order.status !== 'Delivered' && order.status !== 'Canceled';

  const formatTimestamp = (date: Date) => {
    if (isToday(date)) {
      return `Today at ${format(date, 'h:mm a')}`;
    } else if (isYesterday(date)) {
      return `Yesterday at ${format(date, 'h:mm a')}`;
    } else {
      return format(date, 'MMM d, yyyy h:mm a');
    }
  };

  return (
    <Card className="shadow-lg h-full">
      <CardHeader className="p-4">
        <CardTitle className="text-xl">Real-Time Order Tracking</CardTitle>
        <CardDescription className="text-xs">
          Tracking ID: <span className="font-semibold text-primary">{order.id}</span>
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center mb-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-base text-primary">{statuses[currentStatusIndex]?.name}</h3>
                {order.status === 'Order Created' && (
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="max-w-xs">
                          Please wait for approval. Your laundry must first arrive at the shop before this order can be processed.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                )}
              </div>
              <CurrentIcon className="h-6 w-6 text-primary" />
            </div>
            <Progress value={progress} className="w-full h-2 [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-1000" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Placed</span>
              <span>Delivered</span>
            </div>
          </div>
          
          <Separator />
          
          {/* Order Details & Billing */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-2 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  Order Details
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2 text-sm">
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <WeightIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{order.weight} kg</span>
                </div>
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span>{order.load} load{order.load !== 1 ? 's' : ''}</span>
                </div>
                {order.servicePackage && (
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-muted-foreground" />
                    <Badge variant="outline" className="text-xs">
                      Package {order.servicePackage.replace('package', '').toUpperCase()}
                    </Badge>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <Card className="border-2 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
              <CardHeader className="p-3 pb-2">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                  <Wallet className="h-4 w-4 text-primary" />
                  Billing Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 space-y-2 text-sm">
                <div className="flex items-center justify-between">
                    <span className="font-semibold">Total Price:</span>
                    <span className="font-bold text-primary text-base">₱{Math.ceil(order.total)}</span>
                </div>
                <div className="flex items-center justify-between">
                    <span className="font-semibold">Payment:</span>
                    <Badge 
                      variant={isPaid ? 'default' : 'destructive'} 
                      className={cn(
                        isPaid ? 'bg-green-500 hover:bg-green-600' : 'bg-red-500 hover:bg-red-600',
                        "text-white font-semibold"
                      )}
                    >
                        {isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
                </div>
                {order.balance !== undefined && order.balance > 0 && !isPaid && (
                  <div className="flex items-center justify-between pt-1 border-t">
                    <span className="text-xs text-muted-foreground">Balance:</span>
                    <span className="text-xs font-semibold text-orange-600 dark:text-orange-400">
                      ₱{Math.ceil(order.balance)}
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Separator />

          {/* Enhanced Status Timeline */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-sm text-foreground flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Status Timeline
              </h4>
              {hasNewUpdate && (
                <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/30 text-xs animate-pulse">
                  New Update!
                </Badge>
              )}
            </div>
            <div className="max-h-64 overflow-y-auto scrollable pr-2 -mr-2">
              <ul className="space-y-4 border-l-2 border-dashed border-primary/30 ml-4 pl-4">
                {statusLogs.slice().reverse().map((log, index) => {
                  const statusInfo = statuses.find(s => s.name === log.status);
                  const isLatest = index === 0;
                  const LogIcon = statusInfo?.icon || CircleCheck;
                  
                  return (
                    <li key={`${log.status}-${log.timestamp.getTime()}`} className="relative -ml-6">
                      <div className="flex items-start gap-3">
                        <div className={cn(
                          "flex-shrink-0 mt-1 rounded-full h-5 w-5 flex items-center justify-center border-2 transition-all",
                          isLatest 
                            ? "bg-primary border-primary shadow-lg shadow-primary/50 animate-pulse" 
                            : "bg-muted border-muted-foreground/30"
                        )}>
                          <LogIcon className={cn(
                            "h-3 w-3",
                            isLatest ? "text-white" : "text-muted-foreground"
                          )} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <p className={cn(
                              "font-semibold text-sm",
                              isLatest ? "text-primary" : "text-muted-foreground"
                            )}>
                              {log.status}
                            </p>
                            {isLatest && (
                              <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30 text-[10px] px-1.5 py-0">
                                Current
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            <span>{formatTimestamp(log.timestamp)}</span>
                            <span className="text-[10px]">•</span>
                            <span>{formatDistanceToNow(log.timestamp, { addSuffix: true })}</span>
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
              {statusLogs.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <AlertCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No status history available</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
