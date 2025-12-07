"use client";

import { useState } from 'react';
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
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Edit, Save, X, Loader2 } from 'lucide-react';
import { Timestamp } from 'firebase/firestore';

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  contactNumber: string;
  load: number;
  weight: number;
  status: string;
  total: number;
  orderDate: Timestamp;
};

type OrderListProps = {
  orders: Order[];
  onUpdateOrder: (order: Order) => Promise<void>;
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

function OrderRow({ order, onUpdateOrder }: { order: Order, onUpdateOrder: OrderListProps['onUpdateOrder'] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editableOrder, setEditableOrder] = useState(order);

    const handleFieldChange = (field: keyof Order, value: string | number) => {
        const numericFields = ['weight', 'load', 'total'];
        const isNumeric = numericFields.includes(field as string);
        setEditableOrder(prev => ({
            ...prev,
            [field]: isNumeric ? (Number(value) || 0) : value
        }));
    };
    
    const handleSave = async () => {
        setIsSaving(true);
        await onUpdateOrder(editableOrder);
        setIsSaving(false);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setEditableOrder(order);
        setIsEditing(false);
    };

    return (
        <>
            {/* Mobile View */}
            <div className="md:hidden">
                 <Card key={order.id} className="w-full">
                    <CardHeader className="p-4 flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">{order.id}</CardTitle>
                         {isEditing ? (
                            <div className="relative w-[150px]">
                                <Select
                                    value={editableOrder.status}
                                    onValueChange={(value) => handleFieldChange('status', value)}
                                    disabled={isSaving}
                                >
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {statusOptions.map((status) => (
                                            <SelectItem key={status} value={status}>{status}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                         ) : (
                            <Badge className={`${getStatusColor(order.status)} hover:${getStatusColor(order.status)} text-white`}>
                               {order.status}
                            </Badge>
                         )}
                    </CardHeader>
                    <CardContent className="p-4 pt-0 space-y-3">
                         <div className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">Customer:</span> {order.customerName}
                        </div>
                        <div className="text-sm text-muted-foreground">
                            <span className="font-semibold text-foreground">Contact:</span> {order.contactNumber}
                        </div>
                         <div className="grid grid-cols-2 gap-3">
                            <div className="text-sm">
                                <Label htmlFor={`weight-mob-${order.id}`}>Weight (kg)</Label>
                                <Input id={`weight-mob-${order.id}`} type="number" value={editableOrder.weight} onChange={e => handleFieldChange('weight', e.target.value)} className="h-8" disabled={!isEditing || isSaving} />
                            </div>
                            <div className="text-sm">
                                <Label htmlFor={`load-mob-${order.id}`}>Load</Label>
                                <Input id={`load-mob-${order.id}`} type="number" value={editableOrder.load} onChange={e => handleFieldChange('load', e.target.value)} className="h-8" disabled={!isEditing || isSaving} />
                            </div>
                        </div>
                        <div className="text-sm">
                            <Label htmlFor={`total-mob-${order.id}`}>Total (₱)</Label>
                            <Input id={`total-mob-${order.id}`} type="number" value={editableOrder.total.toString()} onChange={e => handleFieldChange('total', e.target.value)} className="h-8" disabled={!isEditing || isSaving} />
                        </div>
                    </CardContent>
                    <CardFooter className="p-4 pt-0 flex justify-end gap-2">
                        {isEditing ? (
                            <>
                                <Button variant="ghost" onClick={handleCancel} disabled={isSaving}><X className="h-4 w-4" /> Cancel</Button>
                                <Button onClick={handleSave} disabled={isSaving}>
                                    {isSaving ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4" />} Save
                                </Button>
                            </>
                        ) : (
                            <Button variant="outline" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4" /> Edit</Button>
                        )}
                    </CardFooter>
                </Card>
            </div>

            {/* Desktop View */}
            <TableRow className="hidden md:table-row">
                <TableCell className="font-medium">{order.id}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>
                    {isEditing ? (
                        <Input type="number" value={editableOrder.weight} onChange={e => handleFieldChange('weight', e.target.value)} className="h-8 w-24" disabled={isSaving}/>
                    ) : (
                        order.weight
                    )}
                </TableCell>
                <TableCell>
                    {isEditing ? (
                        <Input type="number" value={editableOrder.load} onChange={e => handleFieldChange('load', e.target.value)} className="h-8 w-20" disabled={isSaving}/>
                    ) : (
                        order.load
                    )}
                </TableCell>
                <TableCell>
                    {isEditing ? (
                        <Input type="number" value={editableOrder.total.toString()} onChange={e => handleFieldChange('total', e.target.value)} className="h-8 w-28" disabled={isSaving}/>
                    ) : (
                        `₱${order.total.toFixed(2)}`
                    )}
                </TableCell>
                <TableCell>
                    {isEditing ? (
                         <div className="relative w-[180px]">
                            <Select
                                value={editableOrder.status}
                                onValueChange={(value) => handleFieldChange('status', value)}
                                disabled={isSaving}
                            >
                                <SelectTrigger className="w-[180px] h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {statusOptions.map((status) => (
                                        <SelectItem key={status} value={status}>{status}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    ) : (
                       <Badge className={`${getStatusColor(order.status)} hover:${getStatusColor(order.status)} text-white`}>
                           {order.status}
                        </Badge>
                    )}
                </TableCell>
                <TableCell className="space-x-2">
                     {isEditing ? (
                        <>
                            <Button size="icon" variant="ghost" onClick={handleCancel} disabled={isSaving}><X className="h-4 w-4" /></Button>
                            <Button size="icon" onClick={handleSave} disabled={isSaving}>
                                {isSaving ? <Loader2 className="animate-spin h-4 w-4"/> : <Save className="h-4 w-4" />}
                            </Button>
                        </>
                    ) : (
                        <Button size="icon" variant="outline" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4" /></Button>
                    )}
                </TableCell>
            </TableRow>
        </>
    );
}

export function OrderList({ orders, onUpdateOrder }: OrderListProps) {
  return (
    <>
      {/* Mobile View - Card List */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <OrderRow key={order.id} order={order} onUpdateOrder={onUpdateOrder} />
        ))}
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
              <OrderRow key={order.id} order={order} onUpdateOrder={onUpdateOrder} />
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
