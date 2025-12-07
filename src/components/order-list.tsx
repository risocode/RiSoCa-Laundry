"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export type Order = {
  id: string;
  customer_id: string;
  customer: string;
  contact: string;
  load: number;
  weight: number;
  status: string;
  total: number;
  created_at: string;
};

type OrderListProps = {
  orders: Order[];
  isEditing: boolean;
  onUpdateOrder: (orderId: string, field: keyof Order, value: any) => void;
};

const statusOptions = [
  'Order Placed',
  'Pickup Scheduled',
  'Washing',
  'Drying',
  'Folding',
  'Ready for Pick Up',
  'Out for Delivery',
  'Delivered',
  'Success',
];

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

export function OrderList({ orders, isEditing, onUpdateOrder }: OrderListProps) {
  const handleFieldChange = (orderId: string, field: keyof Order, value: string) => {
    const numericValue = field === 'status' ? value : parseFloat(value) || 0;
    onUpdateOrder(orderId, field, numericValue);
  }

  return (
    <>
      {/* Mobile View - Card List */}
      <div className="md:hidden">
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="w-full">
              <CardHeader className="p-4 flex flex-row items-center justify-between">
                <CardTitle className="text-lg">{order.id}</CardTitle>
                <Badge className={`${getStatusColor(order.status)} hover:${getStatusColor(order.status)} text-white`}>
                  {order.status}
                </Badge>
              </CardHeader>
              <CardContent className="p-4 pt-0 space-y-3">
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Customer Name:</span> {order.customer}
                </div>
                <div className="text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Contact #:</span> {order.contact}
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div className="text-sm">
                    <Label for={`weight-mob-${order.id}`}>Weight (kg)</Label>
                    {isEditing ? (
                        <Input id={`weight-mob-${order.id}`} type="number" value={order.weight} onChange={e => handleFieldChange(order.id, 'weight', e.target.value)} className="h-8"/>
                    ) : (
                        <p className="font-semibold text-foreground">{order.weight} kg</p>
                    )}
                  </div>
                   <div className="text-sm">
                    <Label for={`load-mob-${order.id}`}>Load</Label>
                     {isEditing ? (
                        <Input id={`load-mob-${order.id}`} type="number" value={order.load} onChange={e => handleFieldChange(order.id, 'load', e.target.value)} className="h-8"/>
                    ) : (
                        <p className="font-semibold text-foreground">{order.load}</p>
                    )}
                  </div>
                </div>

                <div className="text-sm">
                  <Label for={`total-mob-${order.id}`}>Total (₱)</Label>
                   {isEditing ? (
                        <Input id={`total-mob-${order.id}`} type="number" value={order.total} onChange={e => handleFieldChange(order.id, 'total', e.target.value)} className="h-8"/>
                    ) : (
                        <p className="font-semibold text-foreground">₱{order.total.toFixed(2)}</p>
                    )}
                </div>

                 <Select
                    value={order.status}
                    onValueChange={(newStatus) => onUpdateOrder(order.id, 'status', newStatus)}
                  >
                    <SelectTrigger className="w-full h-10 mt-2">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead>Load</TableHead>
              <TableHead>Total (₱)</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customer}</TableCell>
                <TableCell>
                  {isEditing ? (
                    <Input type="number" value={order.weight} onChange={e => handleFieldChange(order.id, 'weight', e.target.value)} className="h-8 w-24" />
                  ) : (
                    order.weight
                  )}
                </TableCell>
                 <TableCell>
                  {isEditing ? (
                    <Input type="number" value={order.load} onChange={e => handleFieldChange(order.id, 'load', e.target.value)} className="h-8 w-20" />
                  ) : (
                    order.load
                  )}
                </TableCell>
                <TableCell>
                   {isEditing ? (
                    <Input type="number" value={order.total} onChange={e => handleFieldChange(order.id, 'total', e.target.value)} className="h-8 w-28" />
                  ) : (
                    `₱${order.total.toFixed(2)}`
                  )}
                </TableCell>
                <TableCell>
                  <Badge className={`${getStatusColor(order.status)} hover:${getStatusColor(order.status)} text-white`}>
                    {order.status}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select
                    value={order.status}
                    onValueChange={(newStatus) => onUpdateOrder(order.id, 'status', newStatus)}
                  >
                    <SelectTrigger className="w-[180px] h-9">
                      <SelectValue placeholder="Update Status" />
                    </SelectTrigger>
                    <SelectContent>
                      {statusOptions.map((status) => (
                        <SelectItem key={status} value={status}>
                          {status}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}

// Add a Label component for mobile view consistency
const Label = ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className="text-xs font-medium text-muted-foreground" {...props}>{children}</label>
);
