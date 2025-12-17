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
import { Edit, Save, X, Loader2, Package, User, Phone, Weight, Layers, DollarSign, CreditCard, CheckCircle2, MoreVertical } from 'lucide-react';
import { PaymentDialog } from '@/components/payment-dialog';
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
  balance?: number; // Remaining balance for unpaid/partially paid orders
  deliveryOption?: string;
  servicePackage: string;
  distance: number;
  statusHistory: StatusHistory[];
  branchId?: string | null;
  orderType?: 'customer' | 'internal';
  assignedEmployeeId?: string | null;
};

type OrderListProps = {
  orders: Order[];
  onUpdateOrder: (order: Order) => Promise<void>;
};

const statusOptions = [
  'Order Created',
  'Order Placed',
  'Pickup Scheduled',
  'Washing',
  'Drying',
  'Folding',
  'Ready for Pick Up',
  'Out for Delivery',
  'Delivered',
  'Success',
  'Canceled',
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
    case 'Order Placed':
      return 'bg-orange-500';
    case 'Order Created':
      return 'bg-gray-500';
    case 'Canceled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

const getPaymentStatusColor = (isPaid: boolean) => {
    return isPaid ? 'bg-green-500' : 'bg-red-500';
}

const getPaymentBadgeInfo = (isPaid: boolean, isPartiallyPaid: boolean) => {
    if (isPaid) {
        return { text: 'Paid', color: 'bg-green-500', clickable: false };
    } else if (isPartiallyPaid) {
        return { text: 'Balance', color: 'bg-orange-500', clickable: true };
    } else {
        return { text: 'Unpaid', color: 'bg-red-500', clickable: true };
    }
}

function OrderRow({ order, onUpdateOrder }: { order: Order, onUpdateOrder: OrderListProps['onUpdateOrder'] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editableOrder, setEditableOrder] = useState(order);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    // SAFETY CHECK: If balance is undefined but order is not paid, set balance to total
    // This handles cases where the mapping function fails or old code is running
    const safeOrder = {
        ...order,
        balance: order.balance !== undefined 
            ? order.balance 
            : (order.isPaid ? 0 : order.total)
    };

    // Use safeOrder for all calculations to ensure balance is never undefined
    const workingOrder = safeOrder;

    // Fix: Watch for balance and isPaid changes, not just order.id
    useEffect(() => {
        setEditableOrder(safeOrder);
    }, [order.id, order.balance, order.isPaid, order.total]);

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
        setEditableOrder(safeOrder);
        setIsEditing(false);
    };

    const handlePayment = async (amountPaid: number, balance: number) => {
        const updatedOrder = {
            ...workingOrder,
            isPaid: balance === 0,
            balance: balance > 0 ? balance : 0, // Ensure balance is never negative
        };
        await onUpdateOrder(updatedOrder);
    };
    
    // Determine payment status
    const isFullyPaid = workingOrder.isPaid === true;
    const isPartiallyPaid = workingOrder.isPaid === false && 
        workingOrder.balance !== undefined && 
        workingOrder.balance > 0 && 
        workingOrder.balance < workingOrder.total;
    const isUnpaid = !isFullyPaid && !isPartiallyPaid;
    
    // Calculate display values for total/balance
    // For unpaid orders, if balance is undefined or 0, use order total. For paid orders, use 0.
    const displayBalance = workingOrder.isPaid 
        ? 0 
        : (workingOrder.balance !== undefined && workingOrder.balance > 0) 
            ? workingOrder.balance 
            : workingOrder.total;

    return (
        <>
        <TableRow className={cn(
          "hover:bg-muted/30 transition-colors border-b",
          isEditing && "bg-primary/5 border-primary/20"
        )}>
            <TableCell className="font-semibold">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">{workingOrder.id}</span>
                {workingOrder.orderType === 'internal' && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 text-xs font-semibold">
                    Internal
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell>
                {isEditing ? (
                    <Input 
                        type="text" 
                        value={editableOrder.customerName} 
                        onChange={e => handleFieldChange('customerName', e.target.value)} 
                        className="h-9 w-full min-w-[120px] max-w-[200px] border-2" 
                        disabled={isSaving}
                    />
                ) : (
                    <span className="font-medium">{workingOrder.customerName}</span>
                )}
            </TableCell>
            <TableCell>
                {isEditing ? (
                    <Input 
                        type="tel" 
                        value={editableOrder.contactNumber} 
                        onChange={e => handleFieldChange('contactNumber', e.target.value)} 
                        className="h-9 w-full min-w-[130px] max-w-[180px] border-2" 
                        disabled={isSaving}
                    />
                ) : (
                    <span className="text-muted-foreground">{workingOrder.contactNumber || 'N/A'}</span>
                )}
            </TableCell>
            <TableCell className="text-center">
                {isEditing ? (
                    <Input 
                        type="number" 
                        value={editableOrder.weight} 
                        onChange={e => handleFieldChange('weight', e.target.value)} 
                        className="h-9 w-full min-w-[80px] max-w-[120px] border-2 text-center" 
                        disabled={isSaving}
                    />
                ) : (
                    <span className="font-medium">{workingOrder.weight}</span>
                )}
            </TableCell>
            <TableCell className="text-center">
                {isEditing ? (
                    <Input 
                        type="number" 
                        value={editableOrder.load} 
                        onChange={e => handleFieldChange('load', e.target.value)} 
                        className="h-9 w-full min-w-[60px] max-w-[100px] border-2 text-center" 
                        disabled={isSaving}
                    />
                ) : (
                    <Badge variant="outline" className="font-semibold">
                        {workingOrder.load}
                    </Badge>
                )}
            </TableCell>
            <TableCell className="text-right">
                {isEditing ? (
                    <Input 
                        type="number" 
                        value={editableOrder.total.toString()} 
                        onChange={e => handleFieldChange('total', e.target.value)} 
                        className="h-9 w-full min-w-[100px] max-w-[150px] border-2 text-right font-semibold" 
                        disabled={isSaving}
                    />
                ) : (
                    <div className="flex items-center justify-end gap-2">
                        {isPartiallyPaid ? (
                            <>
                                <span className="line-through text-muted-foreground text-sm">₱{workingOrder.total.toFixed(0)}</span>
                                <span className="text-orange-600 dark:text-orange-400 font-bold text-base">₱{workingOrder.balance!.toFixed(0)}</span>
                            </>
                        ) : isFullyPaid ? (
                            <span className="text-green-600 dark:text-green-400 font-bold text-base">₱{workingOrder.total.toFixed(0)}</span>
                        ) : (
                            <span className="text-red-600 dark:text-red-400 font-bold text-base">₱{workingOrder.total.toFixed(0)}</span>
                        )}
                    </div>
                )}
            </TableCell>
             <TableCell className="text-center">
                {isEditing ? (
                    <Button
                        size="sm"
                        className={cn(
                            "h-9 w-24 font-semibold shadow-sm",
                            editableOrder.isPaid 
                                ? "bg-green-500 hover:bg-green-600 text-white" 
                                : "bg-red-500 hover:bg-red-600 text-white"
                        )}
                        onClick={() => handleFieldChange('isPaid', !editableOrder.isPaid)}
                        disabled={isSaving}
                    >
                        {editableOrder.isPaid ? 'Paid' : 'Unpaid'}
                    </Button>
                ) : (
                    (() => {
                        const badgeInfo = getPaymentBadgeInfo(workingOrder.isPaid, isPartiallyPaid);
                        return badgeInfo.clickable ? (
                            <Badge 
                                className={cn(
                                    `${badgeInfo.color} hover:${badgeInfo.color} text-white cursor-pointer hover:opacity-90 transition-all shadow-sm font-semibold px-3 py-1.5`
                                )}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setIsPaymentDialogOpen(true);
                                }}
                                role="button"
                                tabIndex={0}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        setIsPaymentDialogOpen(true);
                                    }
                                }}
                            >
                                {badgeInfo.text}
                            </Badge>
                        ) : (
                            <Badge 
                                className={`${badgeInfo.color} text-white shadow-sm font-semibold px-3 py-1.5`}
                            >
                                {badgeInfo.text}
                            </Badge>
                        );
                    })()
                )}
            </TableCell>
            <TableCell className="text-center">
                {isEditing ? (
                     <div className="relative w-full min-w-[140px] max-w-[200px] mx-auto">
                        <Select
                            value={editableOrder.status}
                            onValueChange={(value) => handleFieldChange('status', value)}
                            disabled={isSaving}
                        >
                            <SelectTrigger className="w-full h-9 border-2 font-semibold">
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
                   <Badge className={cn(
                       `${getStatusColor(workingOrder.status)} text-white shadow-sm font-semibold px-3 py-1.5`,
                       "hover:opacity-90 transition-opacity"
                   )}>
                       {workingOrder.status}
                    </Badge>
                )}
            </TableCell>
            <TableCell className="text-center">
                 {isEditing ? (
                    <div className="flex items-center justify-center gap-2">
                        <Button 
                            size="icon" 
                            variant="ghost" 
                            onClick={handleCancel} 
                            disabled={isSaving}
                            className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                        <Button 
                            size="icon" 
                            onClick={handleSave} 
                            disabled={isSaving}
                            className="h-9 w-9 bg-primary hover:bg-primary/90 shadow-sm"
                        >
                            {isSaving ? (
                                <Loader2 className="animate-spin h-4 w-4"/>
                            ) : (
                                <Save className="h-4 w-4" />
                            )}
                        </Button>
                    </div>
                ) : (
                    <Button 
                        size="icon" 
                        variant="outline" 
                        onClick={() => setIsEditing(true)}
                        className="h-9 w-9 hover:bg-primary/10 hover:border-primary hover:text-primary transition-all"
                    >
                        <Edit className="h-4 w-4" />
                    </Button>
                )}
            </TableCell>
        </TableRow>
        <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onClose={() => setIsPaymentDialogOpen(false)}
            onConfirm={handlePayment}
            orderTotal={workingOrder.total}
            currentBalance={displayBalance}
            orderId={workingOrder.id}
        />
        </>
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
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);

    // SAFETY CHECK: If balance is undefined but order is not paid, set balance to total
    // This handles cases where the mapping function fails or old code is running
    const safeOrder = {
        ...order,
        balance: order.balance !== undefined 
            ? order.balance 
            : (order.isPaid ? 0 : order.total)
    };

    // Use safeOrder for all calculations to ensure balance is never undefined
    const workingOrder = safeOrder;

    // Fix: Watch for balance and isPaid changes, not just order.id
    useEffect(() => {
        setEditableOrder(safeOrder);
    }, [order.id, order.balance, order.isPaid, order.total]);

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
        setEditableOrder(safeOrder);
        setIsEditing(false);
    };

    const handlePayment = async (amountPaid: number, balance: number) => {
        const updatedOrder = {
            ...workingOrder,
            isPaid: balance === 0,
            balance: balance > 0 ? balance : 0, // Ensure balance is never negative
        };
        await onUpdateOrder(updatedOrder);
    };

    // Determine payment status
    const isFullyPaid = workingOrder.isPaid === true;
    const isPartiallyPaid = workingOrder.isPaid === false && 
        workingOrder.balance !== undefined && 
        workingOrder.balance > 0 && 
        workingOrder.balance < workingOrder.total;
    const isUnpaid = !isFullyPaid && !isPartiallyPaid;
    
    // Calculate display values for total/balance
    // For unpaid orders, if balance is undefined or 0, use order total. For paid orders, use 0.
    const displayBalance = workingOrder.isPaid 
        ? 0 
        : (workingOrder.balance !== undefined && workingOrder.balance > 0) 
            ? workingOrder.balance 
            : workingOrder.total;

    return (
        <>
        <Card>
            <Accordion type="single" collapsible>
                <AccordionItem value={workingOrder.id} className="border-b-0">
                    <AccordionTrigger className="p-4 hover:no-underline">
                         <div className="flex flex-col items-start text-left w-full gap-1">
                            <div className='flex items-center justify-between w-full'>
                                <span className="font-bold text-lg">{workingOrder.id}</span>
                                <Badge className={cn(
                                    getStatusColor(workingOrder.status),
                                    "hover:" + getStatusColor(workingOrder.status),
                                    "text-white text-xs"
                                )}>
                                    {workingOrder.status}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center justify-between w-full gap-x-3 text-foreground/90">
                                <span className="text-base font-medium">{workingOrder.customerName}</span>
                                {(() => {
                                    const badgeInfo = getPaymentBadgeInfo(workingOrder.isPaid, isPartiallyPaid);
                                    const amountText = isPartiallyPaid 
                                        ? `₱${workingOrder.balance!.toFixed(2)}` 
                                        : isFullyPaid 
                                            ? `₱${workingOrder.total.toFixed(2)}` 
                                            : `₱${workingOrder.total.toFixed(2)}`;
                                    
                                    return badgeInfo.clickable ? (
                                        <Badge 
                                            className={cn(
                                                `${badgeInfo.color} hover:${badgeInfo.color} text-white cursor-pointer hover:opacity-80 transition-opacity text-xs`
                                            )}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setIsPaymentDialogOpen(true);
                                            }}
                                            role="button"
                                            tabIndex={0}
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter' || e.key === ' ') {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    setIsPaymentDialogOpen(true);
                                                }
                                            }}
                                        >
                                            {badgeInfo.text} {amountText}
                                        </Badge>
                                    ) : (
                                        <Badge 
                                            className={`${badgeInfo.color} hover:${badgeInfo.color} text-white text-xs`}
                                        >
                                            {badgeInfo.text} {amountText}
                                        </Badge>
                                    );
                                })()}
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
                                    {isEditing ? (
                                        <Input id={`total-mob-${order.id}`} type="number" value={editableOrder.total.toString()} onChange={e => handleFieldChange('total', e.target.value)} className="h-8" disabled={isSaving} />
                                    ) : (
                                        <div className="flex flex-col gap-1">
                                            {isPartiallyPaid ? (
                                                <>
                                                    <span className="line-through text-muted-foreground text-sm">₱{workingOrder.total.toFixed(2)}</span>
                                                    <span className="text-red-600 font-semibold">₱{workingOrder.balance!.toFixed(2)}</span>
                                                </>
                                            ) : isFullyPaid ? (
                                                <span className="text-green-600 font-semibold text-base">₱{workingOrder.total.toFixed(2)}</span>
                                            ) : (
                                                <span className="text-red-600 font-semibold text-base">₱{workingOrder.total.toFixed(2)}</span>
                                            )}
                                        </div>
                                    )}
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
                                        (() => {
                                            const badgeInfo = getPaymentBadgeInfo(workingOrder.isPaid, isPartiallyPaid);
                                            return badgeInfo.clickable ? (
                                                <Badge 
                                                    className={cn(
                                                        `${badgeInfo.color} hover:${badgeInfo.color} text-white cursor-pointer hover:opacity-80 transition-opacity`
                                                    )}
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setIsPaymentDialogOpen(true);
                                                    }}
                                                    role="button"
                                                    tabIndex={0}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            setIsPaymentDialogOpen(true);
                                                        }
                                                    }}
                                                >
                                                    {badgeInfo.text}
                                                </Badge>
                                            ) : (
                                                <Badge 
                                                    className={`${badgeInfo.color} hover:${badgeInfo.color} text-white`}
                                                >
                                                    {badgeInfo.text}
                                                </Badge>
                                            );
                                        })()
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
        <PaymentDialog
            isOpen={isPaymentDialogOpen}
            onClose={() => setIsPaymentDialogOpen(false)}
            onConfirm={handlePayment}
            orderTotal={workingOrder.total}
            currentBalance={displayBalance}
            orderId={workingOrder.id}
        />
        </>
    );
}

export function OrderList({ orders, onUpdateOrder }: OrderListProps) {
  return (
    <>
      {/* Mobile View - Card List */}
      <div className="md:hidden space-y-4">
        {orders.map((order) => (
          <OrderCard key={`${order.id}-${order.balance}-${order.isPaid}`} order={order} onUpdateOrder={onUpdateOrder} />
        ))}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="min-w-[120px] font-semibold">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  ORDER #
                </div>
              </TableHead>
              <TableHead className="min-w-[140px] font-semibold">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Name
                </div>
              </TableHead>
              <TableHead className="min-w-[140px] font-semibold">
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-primary" />
                  Contact
                </div>
              </TableHead>
              <TableHead className="min-w-[110px] font-semibold text-center">
                <div className="flex items-center justify-center gap-2">
                  <Weight className="h-4 w-4 text-primary" />
                  Weight (kg)
                </div>
              </TableHead>
              <TableHead className="min-w-[90px] font-semibold text-center">
                <div className="flex items-center justify-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Load
                </div>
              </TableHead>
              <TableHead className="min-w-[130px] font-semibold text-right">
                <div className="flex items-center justify-end gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Total (₱)
                </div>
              </TableHead>
              <TableHead className="min-w-[110px] font-semibold text-center">
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment
                </div>
              </TableHead>
              <TableHead className="min-w-[150px] font-semibold text-center">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Status
                </div>
              </TableHead>
              <TableHead className="min-w-[120px] font-semibold text-center">
                <div className="flex items-center justify-center gap-2">
                  <MoreVertical className="h-4 w-4 text-primary" />
                  Action
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <OrderRow key={`${order.id}-${order.balance}-${order.isPaid}`} order={order} onUpdateOrder={onUpdateOrder} />
            ))}
          </TableBody>
        </Table>
      </div>
    </>
  );
}
