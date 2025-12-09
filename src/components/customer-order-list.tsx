'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Order } from '@/components/order-list';
import { format } from 'date-fns';

type CustomerOrderListProps = {
  orders: Order[];
  onOrderSelect: (order: Order) => void;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered':
    case 'Success':
      return 'bg-green-500';
    case 'Out for Delivery':
    case 'Ready for Pick Up':
      return 'bg-blue-500';
    case 'Washing':
    case 'Drying':
    case 'Folding':
      return 'bg-yellow-500';
    case 'Pickup Scheduled':
      return 'bg-orange-500';
    default:
      return 'bg-gray-500';
  }
};

export function CustomerOrderList({ orders, onOrderSelect }: CustomerOrderListProps) {
  return (
    <Card className="shadow-lg">
      <CardHeader>
        <CardTitle>Your Orders</CardTitle>
        <CardDescription>Select an order to view its real-time status.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.map((order) => (
            <Card 
              key={order.id} 
              className="w-full cursor-pointer hover:border-primary transition-colors"
              onClick={() => onOrderSelect(order)}
            >
              <CardHeader className="p-4 flex flex-row items-start justify-between">
                 <div>
                    <CardTitle className="text-base">{order.id}</CardTitle>
                     <p className="text-xs text-muted-foreground">
                        {order.orderDate ? format(order.orderDate, 'PPP') : 'Date not available'}
                    </p>
                 </div>
                <Badge className={`${getStatusColor(order.status)} hover:${getStatusColor(order.status)} text-white`}>
                  {order.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0">
                 <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Total:</span> ₱{order.total.toFixed(2)}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
