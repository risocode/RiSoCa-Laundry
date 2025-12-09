"use client";
import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Shirt, Truck, PackageCheck, CircleCheck, Wind, WashingMachine, Package, CheckCircle2, User, Weight as WeightIcon, Layers, Wallet } from 'lucide-react';
import type { Order, StatusHistory } from '@/components/order-list';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

const statuses = [
  { name: 'Order Placed', icon: CircleCheck },
  { name: 'Pickup Scheduled', icon: Truck },
  { name: 'Washing', icon: WashingMachine },
  { name: 'Drying', icon: Wind },
  { name: 'Folding', icon: Shirt },
  { name: 'Ready for Pick Up', icon: Package },
  { name: 'Out for Delivery', icon: Truck },
  { name: 'Delivered', icon: PackageCheck },
  { name: 'Success', icon: CheckCircle2 },
];

export function OrderStatusTracker({ order }: { order: Order }) {
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [statusLogs, setStatusLogs] = useState<StatusHistory[]>([]);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const orderStatusIndex = statuses.findIndex(s => s.name === order.status);
    
    if (orderStatusIndex !== -1) {
      setCurrentStatusIndex(orderStatusIndex);
      
      const logs = (order.statusHistory || [{ status: 'Order Placed', timestamp: order.orderDate }])
        .map(log => ({ ...log, timestamp: new Date(log.timestamp) }));

      setStatusLogs(logs);

      // Ensure progress reflects the actual status, not just index
      const uniqueStatusesInHistory = [...new Map(logs.map(item => [item['status'], item])).values()];
      const currentStatusInAllStatuses = statuses.findIndex(s => s.name === order.status);
      setProgress(((currentStatusInAllStatuses + 1) / statuses.length) * 100);
    }
  }, [order]);

  const CurrentIcon = statuses[currentStatusIndex]?.icon || CircleCheck;
  const isPaid = order.isPaid || order.status === 'Success' || order.status === 'Delivered';

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
              <h3 className="font-semibold text-base text-primary">{statuses[currentStatusIndex]?.name}</h3>
              <CurrentIcon className="h-6 w-6 text-primary" />
            </div>
            <Progress value={progress} className="w-full h-2 [&>div]:bg-primary [&>div]:transition-all [&>div]:duration-1000" />
            <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
              <span>Placed</span>
              <span>Delivered</span>
            </div>
          </div>
          
          <Separator />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground/80">Order Details</h4>
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-muted-foreground" />
                    <span>{order.customerName}</span>
                </div>
                <div className="flex items-center gap-2">
                    <WeightIcon className="h-4 w-4 text-muted-foreground" />
                    <span>{order.weight} kg</span>
                </div>
                <div className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-muted-foreground" />
                    <span>{order.load} load(s)</span>
                </div>
            </div>
            <div className="space-y-2">
                <h4 className="font-semibold text-sm text-foreground/80">Billing Summary</h4>
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Wallet className="h-4 w-4 text-muted-foreground" />
                      <span className="font-semibold">Total Price:</span>
                    </div>
                    <span className="font-bold text-primary">₱{order.total.toFixed(2)}</span>
                </div>
                 <div className="flex items-center justify-between">
                    <span className="font-semibold">Status:</span>
                    <Badge variant={isPaid ? 'default' : 'destructive'} className={isPaid ? 'bg-green-500' : 'bg-red-500'}>
                        {isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
                </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <h4 className="font-semibold text-sm text-foreground/80">Status Log</h4>
            <div className="max-h-60 overflow-y-auto pr-2 -mr-2">
              <ul className="space-y-3 border-l-2 border-dashed border-border ml-3">
                {statusLogs.slice().reverse().map((log, index) => (
                  <li key={index} className="flex items-start gap-3 -ml-[10px] relative">
                    <div className={`flex-shrink-0 mt-1 rounded-full h-4 w-4 flex items-center justify-center ${index === 0 ? 'bg-primary' : 'bg-muted'}`}>
                       <div className="h-1.5 w-1.5 rounded-full bg-card"></div>
                    </div>
                    <div className="flex-1 pt-0">
                      <p className={`font-medium text-xs ${index === 0 ? 'text-primary' : 'text-muted-foreground'}`}>{log.status}</p>
                      <p className="text-[10px] text-muted-foreground">{log.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
