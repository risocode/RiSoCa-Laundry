"use client";

import { useState, useEffect } from 'react';
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
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from '@/lib/utils';

export type StatusHistory = {
  status: string;
  timestamp: Date;
};

export type Order = {
  id: string;
  userId: string;
  customerName: string;
  contactNumber: string;
  load: number;
  weight: number;
  status: string;
  total: number;
  orderDate: Date;
  isPaid: boolean;
  deliveryOption?: string;
  servicePackage: string;
  distance: number;
  statusHistory: StatusHistory[];
  branchId?: string | null;
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

const getPaymentStatusColor = (isPaid: boolean) => {
    return isPaid ? 'bg-green-500' : 'bg-red-500';
}

function OrderRow({ order, onUpdateOrder }: { order: Order, onUpdateOrder: OrderListProps['onUpdateOrder'] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editableOrder, setEditableOrder] = useState(order);

    useEffect(() => {
        setEditableOrder(order);
    }, [order.id]);

    const handleFieldChange = (field: keyof Order, value: string | number | boolean) => {
        let newOrderState = { ...editableOrder };

        if (field === 'status' && typeof value === 'string' && value !== editableOrder.status) {
            newOrderState = {
                ...newOrderState,
                status: value,
                statusHistory: [...(editableOrder.statusHistory || []), { status: value, timestamp: new Date() }]
            };
        } else {
            const numericFields = ['weight', 'load', 'total'];
            const isNumeric = numericFields.includes(field as string);
            newOrderState = {
                ...newOrderState,
                [field]: isNumeric ? (Number(value) || 0) : value
            };
        }
        
        setEditableOrder(newOrderState);
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
        <TableRow>
            <TableCell className="font-medium">{order.id}</TableCell>
            <TableCell>
                {isEditing ? (
                    <Input 
                        type="text" 
                        value={editableOrder.customerName} 
                        onChange={e => handleFieldChange('customerName', e.target.value)} 
                        className="h-8 w-32" 
                        disabled={isSaving}
                    />
                ) : (
                    order.customerName
                )}
            </TableCell>
            <TableCell>
                {isEditing ? (
                    <Input 
                        type="tel" 
                        value={editableOrder.contactNumber} 
                        onChange={e => handleFieldChange('contactNumber', e.target.value)} 
                        className="h-8 w-32" 
                        disabled={isSaving}
                    />
                ) : (
                    order.contactNumber
                )}
            </TableCell>
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
                    <Button
                        size="sm"
                        className={cn("h-8 w-20", getPaymentStatusColor(editableOrder.isPaid), `hover:${getPaymentStatusColor(editableOrder.isPaid)}`)}
                        onClick={() => handleFieldChange('isPaid', !editableOrder.isPaid)}
                        disabled={isSaving}
                    >
                        {editableOrder.isPaid ? 'Paid' : 'Unpaid'}
                    </Button>
                ) : (
                   <Badge className={`${getPaymentStatusColor(order.isPaid)} hover:${getPaymentStatusColor(order.isPaid)} text-white`}>
                       {order.isPaid ? 'Paid' : 'Unpaid'}
                    </Badge>
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
    );
}

// Add a Label component for mobile view consistency
const Label = ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className="text-xs font-medium text-muted-foreground" {...props}>{children}</label>
);

function OrderCard({ order, onUpdateOrder }: { order: Order, onUpdateOrder: OrderListProps['onUpdateOrder'] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editableOrder, setEditableOrder] = useState(order);

    useEffect(() => {
        setEditableOrder(order);
    }, [order.id]);

    const handleFieldChange = (field: keyof Order, value: string | number | boolean) => {
        let newOrderState = { ...editableOrder };

        if (field === 'status' && typeof value === 'string' && value !== editableOrder.status) {
            newOrderState = {
                ...newOrderState,
                status: value,
                statusHistory: [...(editableOrder.statusHistory || []), { status: value, timestamp: new Date() }]
            };
        } else {
            const numericFields = ['weight', 'load', 'total'];
            const isNumeric = numericFields.includes(field as string);
            newOrderState = {
                ...newOrderState,
                [field]: isNumeric ? (Number(value) || 0) : value
            };
        }
        
        setEditableOrder(newOrderState);
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
        <Card>
            <Accordion type="single" collapsible>
                <AccordionItem value={order.id} className="border-b-0">
                    <AccordionTrigger className="p-4 hover:no-underline">
                         <div className="flex flex-col items-start text-left w-full gap-1">
                            <div className='flex items-center justify-between w-full'>
                                <span className="font-bold text-lg">{order.id}</span>
                                <Badge className={cn(
                                    getStatusColor(order.status),
                                    "hover:" + getStatusColor(order.status),
                                    "text-white text-xs"
                                )}>
                                    {order.status}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-baseline gap-x-3 text-foreground/90">
                                <span className="text-base font-medium">{order.customerName}</span>
                                {order.contactNumber && order.contactNumber !== 'N/A' && (
                                    <span className="text-sm">{order.contactNumber}</span>
                                )}
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor={`customer-name-mob-${order.id}`}>Customer Name</Label>
                                    <Input 
                                        id={`customer-name-mob-${order.id}`} 
                                        type="text" 
                                        value={editableOrder.customerName} 
                                        onChange={e => handleFieldChange('customerName', e.target.value)} 
                                        className="h-8" 
                                        disabled={!isEditing || isSaving} 
                                    />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`contact-number-mob-${order.id}`}>Contact Number</Label>
                                    <Input 
                                        id={`contact-number-mob-${order.id}`} 
                                        type="tel" 
                                        value={editableOrder.contactNumber} 
                                        onChange={e => handleFieldChange('contactNumber', e.target.value)} 
                                        className="h-8" 
                                        disabled={!isEditing || isSaving} 
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="space-y-1">
                                    <Label htmlFor={`load-mob-${order.id}`}>Load</Label>
                                    <Input id={`load-mob-${order.id}`} type="number" value={editableOrder.load} onChange={e => handleFieldChange('load', e.target.value)} className="h-8" disabled={!isEditing || isSaving} />
                                </div>
                                <div className="space-y-1">
                                    <Label htmlFor={`weight-mob-${order.id}`}>Weight (kg)</Label>
                                    <Input id={`weight-mob-${order.id}`} type="number" value={editableOrder.weight} onChange={e => handleFieldChange('weight', e.target.value)} className="h-8" disabled={!isEditing || isSaving} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 items-end">
                                <div className="space-y-1">
                                    <Label htmlFor={`total-mob-${order.id}`}>Total (₱)</Label>
                                    <Input id={`total-mob-${order.id}`} type="number" value={editableOrder.total.toString()} onChange={e => handleFieldChange('total', e.target.value)} className="h-8" disabled={!isEditing || isSaving} />
                                </div>
                                <div className="flex flex-col items-start space-y-1">
                                    <Label>Payment</Label>
                                    {isEditing ? (
                                        <Button
                                            size="sm"
                                            className={cn("h-8 w-20", getPaymentStatusColor(editableOrder.isPaid), `hover:${getPaymentStatusColor(editableOrder.isPaid)}`)}
                                            onClick={() => handleFieldChange('isPaid', !editableOrder.isPaid)}
                                            disabled={isSaving}
                                        >
                                            {editableOrder.isPaid ? 'Paid' : 'Unpaid'}
                                        </Button>
                                    ) : (
                                        <Badge className={`${getPaymentStatusColor(order.isPaid)} hover:${getPaymentStatusColor(order.isPaid)} text-white`}>
                                            {order.isPaid ? 'Paid' : 'Unpaid'}
                                        </Badge>
                                    )}
                                </div>
                            </div>
                             {isEditing && (
                                <div className="relative w-full">
                                    <Label>Status</Label>
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
                            )}

                            <div className="flex justify-center gap-2 pt-2">
                                {isEditing ? (
                                    <>
                                        <Button variant="ghost" onClick={handleCancel} disabled={isSaving}><X className="mr-2 h-4 w-4" /> Cancel</Button>
                                        <Button onClick={handleSave} disabled={isSaving}>
                                            {isSaving ? <Loader2 className="animate-spin mr-2 h-4 w-4"/> : <Save className="mr-2 h-4 w-4" />}
                                            Save
                                        </Button>
                                    </>
                                ) : (
                                    <Button variant="outline" onClick={() => setIsEditing(true)} className="w-full"><Edit className="mr-2 h-4 w-4" /> Edit</Button>
                                )}
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>
        </Card>
    );
}

export function OrderList({ orders, onUpdateOrder }: OrderListProps) {
  return (
    <>
      {/* Mobile View - Card List */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <OrderCard key={order.id} order={order} onUpdateOrder={onUpdateOrder} />
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer</TableHead>
              <TableHead>Contact</TableHead>
              <TableHead>Weight (kg)</TableHead>
              <TableHead>Load</TableHead>
              <TableHead>Total (₱)</TableHead>
              <TableHead>Payment</TableHead>
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
