'use client';

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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Edit,
  Save,
  X,
  Loader2,
  Package,
  User,
  Phone,
  Weight,
  Layers,
  DollarSign,
  CreditCard,
  CheckCircle2,
  MoreVertical,
  ChevronLeft,
  ChevronRight,
  Users,
  Calendar,
  Plus,
  Search,
  Trash2,
} from 'lucide-react';
import { PaymentDialog } from '@/components/payment-dialog';
import { StatusDialog } from '@/components/status-dialog';
import { DeleteOrderDialog } from '@/components/delete-order-dialog';
import { useEmployees } from '@/hooks/use-employees';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import type {
  Order,
  StatusHistory,
  OrderListProps,
  Employee,
} from './order-list/types';
import {
  statusOptions,
  getStatusColor,
  getPaymentStatusColor,
  getPaymentBadgeInfo,
} from './order-list/utils';

function OrderRow({ order, onUpdateOrder, onDeleteOrder }: { order: Order, onUpdateOrder: OrderListProps['onUpdateOrder'], onDeleteOrder?: OrderListProps['onDeleteOrder'] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editableOrder, setEditableOrder] = useState(order);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { employees, loading: loadingEmployees } = useEmployees();

    // SAFETY CHECK: If balance is undefined but order is not paid, set balance to total
    // This handles cases where the mapping function fails or old code is running
    const safeOrder = {
        ...order,
        balance: order.balance !== undefined 
            ? order.balance 
            : (order.isPaid ? 0 : order.total),
        // Ensure assignedEmployeeIds is properly included
        assignedEmployeeId: order.assignedEmployeeId ?? null,
        assignedEmployeeIds: order.assignedEmployeeIds ?? undefined,
    };

    // Use safeOrder for all calculations to ensure balance is never undefined
    const workingOrder = safeOrder;

    // Fix: Watch for balance and isPaid changes, not just order.id
    useEffect(() => {
        setEditableOrder({
            ...safeOrder,
            // Ensure assignedEmployeeIds is properly initialized
            assignedEmployeeIds: safeOrder.assignedEmployeeIds || 
                (safeOrder.assignedEmployeeId ? [safeOrder.assignedEmployeeId] : undefined)
        });
    }, [order.id, order.balance, order.isPaid, order.total, order.assignedEmployeeId, order.assignedEmployeeIds]);

    // Employees are now fetched via useEmployees hook with caching

    const handleFieldChange = (field: keyof Order, value: string | number | boolean | null | string[] | Date) => {
        let newOrderState = { ...editableOrder };

        if (field === 'status' && typeof value === 'string' && value !== editableOrder.status) {
            newOrderState = {
                ...newOrderState,
                status: value,
                statusHistory: [...(editableOrder.statusHistory || []), { status: value, timestamp: new Date() }]
            };
        } else if (field === 'assignedEmployeeIds' && Array.isArray(value)) {
            // Handle multi-select employee assignment
            newOrderState = {
                ...newOrderState,
                assignedEmployeeIds: value.length > 0 ? value : undefined,
                // For backward compatibility, set assignedEmployeeId to first employee or null
                assignedEmployeeId: value.length > 0 ? value[0] : null
            };
        } else if (field === 'loadPieces' && Array.isArray(value)) {
            // Handle load pieces array
            // Filter out null/undefined/empty values, but keep 0 if explicitly set
            const cleanedPieces = value.map(p => p === null || p === undefined || p === '' ? null : Number(p));
            // If all are null/empty, set to undefined
            const hasAnyPieces = cleanedPieces.some(p => p !== null && p !== undefined);
            newOrderState = {
                ...newOrderState,
                loadPieces: hasAnyPieces ? cleanedPieces : undefined
            };
        } else if (field === 'orderDate' && value instanceof Date) {
            // Handle date field
            newOrderState = {
                ...newOrderState,
                orderDate: value
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
            <TableCell className="font-semibold px-2">
              <div className="flex items-center gap-2">
                <span className="text-primary font-bold">{workingOrder.id}</span>
                {workingOrder.orderType === 'internal' && (
                  <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 text-xs font-semibold">
                    Internal
                  </Badge>
                )}
              </div>
            </TableCell>
            <TableCell className="text-center px-2">
                {isEditing ? (
                    <Input 
                        type="date" 
                        value={format(editableOrder.orderDate, 'yyyy-MM-dd')} 
                        onChange={e => {
                            const newDate = new Date(e.target.value);
                            handleFieldChange('orderDate', newDate);
                        }} 
                        className="h-9 w-full min-w-[120px] max-w-[150px] border-2 text-center" 
                        disabled={isSaving}
                    />
                ) : (
                    <span className="font-medium text-sm">{format(workingOrder.orderDate, 'MMM dd, yyyy')}</span>
                )}
            </TableCell>
            <TableCell className="px-2">
                {isEditing ? (
                    <div className="space-y-1.5">
                        <Input 
                            type="text" 
                            value={editableOrder.customerName} 
                            onChange={e => handleFieldChange('customerName', e.target.value)} 
                            className="h-9 w-full min-w-[120px] max-w-[200px] border-2" 
                            disabled={isSaving}
                            placeholder="Customer Name"
                        />
                        <Input 
                            type="text" 
                            placeholder="Contact Number"
                            value={editableOrder.contactNumber && editableOrder.contactNumber !== 'N/A' ? editableOrder.contactNumber : ''} 
                            onChange={e => handleFieldChange('contactNumber', e.target.value)} 
                            className="h-8 w-full min-w-[120px] max-w-[200px] border-2 text-xs" 
                            disabled={isSaving}
                        />
                    </div>
                ) : (
                    <div className="flex flex-col gap-0.5">
                        <span className="font-medium">{workingOrder.customerName}</span>
                        {workingOrder.contactNumber && workingOrder.contactNumber !== 'N/A' && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                <Phone className="h-3 w-3" />
                                <span>{workingOrder.contactNumber}</span>
                            </div>
                        )}
                    </div>
                )}
            </TableCell>
            <TableCell className="px-2">
                {isEditing ? (
                    <div className="flex flex-wrap gap-1.5 min-w-[140px] max-w-[250px]">
                        {employees.map((emp) => {
                            const selectedIds = editableOrder.assignedEmployeeIds || [];
                            const isSelected = selectedIds.includes(emp.id);
                            return (
                                <Button
                                    key={emp.id}
                                    type="button"
                                    variant={isSelected ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => {
                                        const currentIds = editableOrder.assignedEmployeeIds || [];
                                        const newIds = isSelected
                                            ? currentIds.filter(id => id !== emp.id)
                                            : [...currentIds, emp.id];
                                        handleFieldChange('assignedEmployeeIds', newIds);
                                    }}
                                    disabled={isSaving || loadingEmployees}
                                    className={cn(
                                        "h-8 text-xs font-medium transition-all",
                                        isSelected 
                                            ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                                            : "hover:border-primary hover:text-primary"
                                    )}
                                >
                                    {emp.first_name || 'Employee'}
                                </Button>
                            );
                        })}
                    </div>
                ) : (
                    (() => {
                        // Show loading state
                        if (loadingEmployees) {
                            return <span className="text-muted-foreground text-xs">Loading employees...</span>;
                        }
                        
                        // Check for multiple employees assigned
                        if (workingOrder.assignedEmployeeIds && Array.isArray(workingOrder.assignedEmployeeIds) && workingOrder.assignedEmployeeIds.length > 0) {
                            const assignedEmps = employees.filter(e => workingOrder.assignedEmployeeIds!.includes(e.id));
                            if (assignedEmps.length > 0) {
                                return (
                                    <div className="flex flex-col gap-1">
                                        {assignedEmps.map((emp) => (
                                            <span key={emp.id} className="font-medium text-xs">
                                                {emp.first_name || ''}
                                            </span>
                                        ))}
                                    </div>
                                );
                            }
                        }
                        // Check for single employee assignment (backward compatibility)
                        if (workingOrder.assignedEmployeeId) {
                            const assignedEmp = employees.find(e => e.id === workingOrder.assignedEmployeeId);
                            if (assignedEmp) {
                                return (
                                    <span className="font-medium">
                                        {assignedEmp.first_name || ''}
                                    </span>
                                );
                            }
                        }
                        return <span className="text-muted-foreground">Unassigned</span>;
                    })()
                )}
            </TableCell>
            <TableCell className="text-center px-2">
                {isEditing ? (
                    <div className="space-y-2 min-w-[120px]">
                        <Input 
                            type="number" 
                            value={editableOrder.load} 
                            onChange={e => {
                                const newLoad = Number(e.target.value) || 0;
                                handleFieldChange('load', newLoad);
                                // Adjust loadPieces array if load count changes
                                if (newLoad !== editableOrder.load) {
                                    const currentPieces = editableOrder.loadPieces || [];
                                    if (newLoad > currentPieces.length) {
                                        // Add empty slots for new loads
                                        const newPieces = [...currentPieces, ...Array(newLoad - currentPieces.length).fill(null)];
                                        handleFieldChange('loadPieces', newPieces);
                                    } else if (newLoad < currentPieces.length) {
                                        // Remove excess pieces
                                        const newPieces = currentPieces.slice(0, newLoad);
                                        handleFieldChange('loadPieces', newPieces);
                                    }
                                }
                            }} 
                            className="h-9 w-full border-2 text-center" 
                            disabled={isSaving}
                        />
                        <div className="space-y-1.5 border rounded-md p-2 bg-muted/30">
                            <div className="text-xs font-medium text-muted-foreground mb-1">Piece Count per Load</div>
                            {Array.from({ length: editableOrder.load }, (_, i) => i + 1).map((loadNum) => {
                                const currentPieces = editableOrder.loadPieces || [];
                                const pieceValue = currentPieces[loadNum - 1] ?? '';
                                return (
                                    <div key={loadNum} className="flex items-center gap-1.5">
                                        <span className="text-xs text-muted-foreground w-12 text-left">Load {loadNum}:</span>
                                        <Input
                                            type="number"
                                            min="1"
                                            step="1"
                                            placeholder="pcs"
                                            value={pieceValue}
                                            onChange={(e) => {
                                                const newPieces = [...(editableOrder.loadPieces || [])];
                                                // Ensure array is long enough
                                                while (newPieces.length < editableOrder.load) {
                                                    newPieces.push(null);
                                                }
                                                const numValue = e.target.value === '' ? null : Number(e.target.value);
                                                newPieces[loadNum - 1] = numValue;
                                                handleFieldChange('loadPieces', newPieces);
                                            }}
                                            className="h-7 text-xs border text-center flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                            disabled={isSaving}
                                        />
                                        <span className="text-xs text-muted-foreground w-8">pcs</span>
                                    </div>
                                );
                            })}
                            {(() => {
                                const pieces = editableOrder.loadPieces || [];
                                const totalPieces = pieces.reduce((sum, p) => sum + (p || 0), 0);
                                if (totalPieces > 0) {
                                    return (
                                        <div className="text-xs font-semibold text-primary mt-1.5 pt-1 border-t">
                                            Total: {totalPieces} pcs
                                        </div>
                                    );
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-0.5 items-center">
                        <Badge variant="outline" className="font-semibold">
                            {workingOrder.load} load{workingOrder.load > 1 ? 's' : ''}
                        </Badge>
                        {workingOrder.loadPieces && workingOrder.loadPieces.length > 0 && workingOrder.loadPieces.some(p => p !== null && p !== undefined) && (
                            <div className="text-xs text-muted-foreground">
                                ({workingOrder.loadPieces.filter(p => p !== null && p !== undefined).join(', ')} pcs)
                            </div>
                        )}
                    </div>
                )}
            </TableCell>
            <TableCell className="px-2">
                {isEditing ? (
                    <div className="space-y-2">
                        <div className="text-xs font-medium text-muted-foreground mb-1">Found Items</div>
                        <div className="space-y-1.5 border rounded-md p-2 bg-muted/30">
                            {(editableOrder.foundItems || []).map((item, index) => (
                                <div key={index} className="flex items-center gap-1.5">
                                    <Input
                                        type="text"
                                        value={item}
                                        onChange={(e) => {
                                            const newItems = [...(editableOrder.foundItems || [])];
                                            newItems[index] = e.target.value;
                                            handleFieldChange('foundItems', newItems);
                                        }}
                                        className="h-7 text-xs border flex-1"
                                        disabled={isSaving}
                                        placeholder="Item description"
                                    />
                                    <Button
                                        type="button"
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => {
                                            const newItems = (editableOrder.foundItems || []).filter((_, i) => i !== index);
                                            handleFieldChange('foundItems', newItems.length > 0 ? newItems : undefined);
                                        }}
                                        disabled={isSaving}
                                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                    >
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            ))}
                            <Button
                                type="button"
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                    const newItems = [...(editableOrder.foundItems || []), ''];
                                    handleFieldChange('foundItems', newItems);
                                }}
                                disabled={isSaving}
                                className="w-full h-7 text-xs"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Add Item
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-1">
                        {workingOrder.foundItems && workingOrder.foundItems.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                                {workingOrder.foundItems.map((item, index) => (
                                    <Badge key={index} variant="outline" className="text-xs bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
                                        {item}
                                    </Badge>
                                ))}
                            </div>
                        ) : (
                            <span className="text-xs text-muted-foreground">No items found</span>
                        )}
                    </div>
                )}
            </TableCell>
            <TableCell className="text-right px-2">
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
             <TableCell className="text-center px-2">
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
            <TableCell className="text-center px-2">
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
                    <Badge 
                        className={cn(
                            `${getStatusColor(workingOrder.status)} text-white shadow-sm font-semibold px-3 py-1.5 cursor-pointer`,
                            "hover:opacity-90 hover:scale-105 hover:shadow-md transition-all active:scale-95"
                        )}
                        onClick={() => setIsStatusDialogOpen(true)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setIsStatusDialogOpen(true);
                            }
                        }}
                    >
                        {workingOrder.status}
                    </Badge>
                )}
            </TableCell>
            <TableCell className="text-center px-2">
                 {isEditing ? (
                    <div className="flex items-center justify-center gap-2">
                        {onDeleteOrder && (
                            <Button 
                                size="icon" 
                                variant="ghost" 
                                onClick={() => setIsDeleteDialogOpen(true)} 
                                disabled={isSaving}
                                className="h-9 w-9 hover:bg-destructive/10 hover:text-destructive"
                                title="Delete order"
                            >
                                <Trash2 className="h-4 w-4" />
                            </Button>
                        )}
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
        <StatusDialog
            isOpen={isStatusDialogOpen}
            onClose={() => setIsStatusDialogOpen(false)}
            onConfirm={async (newStatus) => {
                const updatedOrder = {
                    ...workingOrder,
                    status: newStatus,
                    statusHistory: [...(workingOrder.statusHistory || []), { status: newStatus, timestamp: new Date() }]
                };
                await onUpdateOrder(updatedOrder);
            }}
            currentStatus={workingOrder.status}
            orderId={workingOrder.id}
        />
        {onDeleteOrder && (
            <DeleteOrderDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={async () => {
                    if (onDeleteOrder) {
                        await onDeleteOrder(workingOrder.id);
                        setIsEditing(false);
                    }
                }}
                orderId={workingOrder.id}
            />
        )}
        </>
    );
}

// Add a Label component for mobile view consistency
const Label = ({ children, ...props }: React.LabelHTMLAttributes<HTMLLabelElement>) => (
    <label className="text-xs font-medium text-muted-foreground" {...props}>{children}</label>
);

function OrderCard({ order, onUpdateOrder, onDeleteOrder }: { order: Order, onUpdateOrder: OrderListProps['onUpdateOrder'], onDeleteOrder?: OrderListProps['onDeleteOrder'] }) {
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editableOrder, setEditableOrder] = useState(order);
    const [isPaymentDialogOpen, setIsPaymentDialogOpen] = useState(false);
    const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const { employees, loading: loadingEmployees } = useEmployees();

    // SAFETY CHECK: If balance is undefined but order is not paid, set balance to total
    // This handles cases where the mapping function fails or old code is running
    const safeOrder = {
        ...order,
        balance: order.balance !== undefined 
            ? order.balance 
            : (order.isPaid ? 0 : order.total),
        // Ensure assignedEmployeeIds is properly included
        assignedEmployeeId: order.assignedEmployeeId ?? null,
        assignedEmployeeIds: order.assignedEmployeeIds ?? undefined,
    };

    // Use safeOrder for all calculations to ensure balance is never undefined
    const workingOrder = safeOrder;

    // Fix: Watch for balance and isPaid changes, not just order.id
    useEffect(() => {
        setEditableOrder({
            ...safeOrder,
            // Ensure assignedEmployeeIds is properly initialized
            assignedEmployeeIds: safeOrder.assignedEmployeeIds || 
                (safeOrder.assignedEmployeeId ? [safeOrder.assignedEmployeeId] : undefined),
            // Ensure loadPieces is properly initialized as array
            loadPieces: safeOrder.loadPieces || undefined,
            // Ensure foundItems is properly initialized as array
            foundItems: safeOrder.foundItems || undefined
        });
    }, [order.id, order.balance, order.isPaid, order.total, order.assignedEmployeeId, order.assignedEmployeeIds, order.loadPieces, order.foundItems]);

    // Employees are now fetched via useEmployees hook with caching

    const handleFieldChange = (field: keyof Order, value: string | number | boolean | null | string[] | Date | number[]) => {
        let newOrderState = { ...editableOrder };

        if (field === 'status' && typeof value === 'string' && value !== editableOrder.status) {
            newOrderState = {
                ...newOrderState,
                status: value,
                statusHistory: [...(editableOrder.statusHistory || []), { status: value, timestamp: new Date() }]
            };
        } else if (field === 'assignedEmployeeIds' && Array.isArray(value)) {
            // Handle multi-select employee assignment
            newOrderState = {
                ...newOrderState,
                assignedEmployeeIds: value.length > 0 ? value : undefined,
                // For backward compatibility, set assignedEmployeeId to first employee or null
                assignedEmployeeId: value.length > 0 ? value[0] : null
            };
        } else if (field === 'loadPieces' && Array.isArray(value)) {
            // Handle load pieces array
            // Filter out null/undefined/empty values, but keep 0 if explicitly set
            const cleanedPieces = value.map(p => p === null || p === undefined || p === '' ? null : Number(p));
            // If all are null/empty, set to undefined
            const hasAnyPieces = cleanedPieces.some(p => p !== null && p !== undefined);
            newOrderState = {
                ...newOrderState,
                loadPieces: hasAnyPieces ? cleanedPieces : undefined
            };
        } else if (field === 'orderDate' && value instanceof Date) {
            // Handle date field
            newOrderState = {
                ...newOrderState,
                orderDate: value
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
        <Card className="border-2 hover:border-primary/30 transition-all shadow-md">
            <Accordion type="single" collapsible>
                <AccordionItem value={workingOrder.id} className="border-b-0">
                    <AccordionTrigger className="p-4 hover:no-underline">
                         <div className="flex flex-col items-start text-left w-full gap-2">
                            <div className='flex items-center justify-between w-full'>
                                <div className="flex items-center gap-2">
                                    <Package className="h-4 w-4 text-primary" />
                                    <span className="font-bold text-lg text-primary">{workingOrder.id}</span>
                                    {workingOrder.orderType === 'internal' && (
                                      <Badge variant="outline" className="bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-300 dark:border-blue-700 text-xs font-semibold">
                                        Internal
                                      </Badge>
                                    )}
                                </div>
                                <Badge 
                                    className={cn(
                                        getStatusColor(workingOrder.status),
                                        "text-white text-xs font-semibold shadow-sm cursor-pointer",
                                        "hover:opacity-90 hover:scale-105 hover:shadow-md transition-all active:scale-95"
                                    )}
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setIsStatusDialogOpen(true);
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' || e.key === ' ') {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsStatusDialogOpen(true);
                                        }
                                    }}
                                >
                                    {workingOrder.status}
                                </Badge>
                            </div>
                            <div className="flex flex-wrap items-center justify-between w-full gap-x-3 text-foreground/90">
                                <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                        <User className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-base font-semibold">{workingOrder.customerName}</span>
                                    </div>
                                    {workingOrder.contactNumber && workingOrder.contactNumber !== 'N/A' && (
                                        <div className="flex items-center gap-1 text-xs text-muted-foreground ml-6">
                                            <Phone className="h-3 w-3" />
                                            <span>{workingOrder.contactNumber}</span>
                                        </div>
                                    )}
                                </div>
                                <div className="flex items-center gap-2">
                                    {(() => {
                                        const badgeInfo = getPaymentBadgeInfo(workingOrder.isPaid, isPartiallyPaid);
                                        const amountText = isPartiallyPaid 
                                            ? `₱${workingOrder.balance!.toFixed(0)}` 
                                            : isFullyPaid 
                                                ? `₱${workingOrder.total.toFixed(0)}` 
                                                : `₱${workingOrder.total.toFixed(0)}`;
                                        
                                        return badgeInfo.clickable ? (
                                            <Badge 
                                                className={cn(
                                                    `${badgeInfo.color} hover:${badgeInfo.color} text-white cursor-pointer hover:opacity-90 transition-opacity text-xs font-semibold shadow-sm`
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
                                                className={`${badgeInfo.color} text-white text-xs font-semibold shadow-sm`}
                                            >
                                                {badgeInfo.text} {amountText}
                                            </Badge>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    </AccordionTrigger>
                    <AccordionContent className="p-4 pt-0">
                        <div className="space-y-4">
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`customer-name-mob-${order.id}`} className="flex items-center gap-2">
                                        <User className="h-3 w-3 text-muted-foreground" />
                                        Customer Name
                                    </Label>
                                    <Input 
                                        id={`customer-name-mob-${order.id}`} 
                                        type="text" 
                                        value={editableOrder.customerName} 
                                        onChange={e => handleFieldChange('customerName', e.target.value)} 
                                        className="h-9 border-2" 
                                        disabled={!isEditing || isSaving} 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`contact-mob-${order.id}`} className="flex items-center gap-2">
                                        <Phone className="h-3 w-3 text-muted-foreground" />
                                        Contact Number
                                    </Label>
                                    <Input 
                                        id={`contact-mob-${order.id}`} 
                                        type="text" 
                                        value={editableOrder.contactNumber && editableOrder.contactNumber !== 'N/A' ? editableOrder.contactNumber : ''} 
                                        onChange={e => handleFieldChange('contactNumber', e.target.value)} 
                                        className="h-9 border-2" 
                                        disabled={!isEditing || isSaving} 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`date-mob-${order.id}`} className="flex items-center gap-2">
                                        <Calendar className="h-3 w-3 text-muted-foreground" />
                                        Date
                                    </Label>
                                    <Input 
                                        id={`date-mob-${order.id}`} 
                                        type="date" 
                                        value={format(editableOrder.orderDate, 'yyyy-MM-dd')} 
                                        onChange={e => {
                                            const newDate = new Date(e.target.value);
                                            handleFieldChange('orderDate', newDate);
                                        }} 
                                        className="h-9 border-2" 
                                        disabled={!isEditing || isSaving} 
                                    />
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`employee-mob-${order.id}`} className="flex items-center gap-2">
                                        <Users className="h-3 w-3 text-muted-foreground" />
                                        Employee
                                    </Label>
                                    {isEditing ? (
                                        <div className="flex flex-wrap gap-1.5">
                                            {employees.map((emp) => {
                                                const selectedIds = editableOrder.assignedEmployeeIds || [];
                                                const isSelected = selectedIds.includes(emp.id);
                                                return (
                                                    <Button
                                                        key={emp.id}
                                                        type="button"
                                                        variant={isSelected ? "default" : "outline"}
                                                        size="sm"
                                                        onClick={() => {
                                                            const currentIds = editableOrder.assignedEmployeeIds || [];
                                                            const newIds = isSelected
                                                                ? currentIds.filter(id => id !== emp.id)
                                                                : [...currentIds, emp.id];
                                                            handleFieldChange('assignedEmployeeIds', newIds);
                                                        }}
                                                        disabled={isSaving || loadingEmployees}
                                                        className={cn(
                                                            "h-8 text-xs font-medium transition-all",
                                                            isSelected 
                                                                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                                                                : "hover:border-primary hover:text-primary"
                                                        )}
                                                    >
                                                        {emp.first_name || 'Employee'}
                                                    </Button>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        (() => {
                                            // Check for multiple employees assigned
                                            if (workingOrder.assignedEmployeeIds && Array.isArray(workingOrder.assignedEmployeeIds) && workingOrder.assignedEmployeeIds.length > 0) {
                                                const assignedEmps = employees.filter(e => workingOrder.assignedEmployeeIds!.includes(e.id));
                                                if (assignedEmps.length > 0) {
                                                    return (
                                                        <div className="flex flex-col gap-1">
                                                            {assignedEmps.map((emp) => (
                                                                <span key={emp.id} className="font-medium text-xs">
                                                                    {emp.first_name || ''}
                                                                </span>
                                                            ))}
                                                        </div>
                                                    );
                                                }
                                            }
                                            // Check for single employee assignment (backward compatibility)
                                            if (workingOrder.assignedEmployeeId) {
                                                const assignedEmp = employees.find(e => e.id === workingOrder.assignedEmployeeId);
                                                if (assignedEmp) {
                                                    return (
                                                        <span className="font-medium">
                                                            {assignedEmp.first_name || ''}
                                                        </span>
                                                    );
                                                }
                                            }
                                            return <span className="text-muted-foreground">Unassigned</span>;
                                        })()
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`load-mob-${order.id}`} className="flex items-center gap-2">
                                        <Layers className="h-3 w-3 text-muted-foreground" />
                                        Load
                                    </Label>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <Input 
                                                id={`load-mob-${order.id}`} 
                                                type="number" 
                                                value={editableOrder.load} 
                                                onChange={e => {
                                                    const newLoad = Number(e.target.value) || 0;
                                                    handleFieldChange('load', newLoad);
                                                    // Adjust loadPieces array if load count changes
                                                    if (newLoad !== editableOrder.load) {
                                                        const currentPieces = editableOrder.loadPieces || [];
                                                        if (newLoad > currentPieces.length) {
                                                            // Add empty slots for new loads
                                                            const newPieces = [...currentPieces, ...Array(newLoad - currentPieces.length).fill(null)];
                                                            handleFieldChange('loadPieces', newPieces);
                                                        } else if (newLoad < currentPieces.length) {
                                                            // Remove excess pieces
                                                            const newPieces = currentPieces.slice(0, newLoad);
                                                            handleFieldChange('loadPieces', newPieces);
                                                        }
                                                    }
                                                }} 
                                                className="h-9 border-2" 
                                                disabled={isSaving} 
                                            />
                                            <div className="space-y-1.5 border rounded-md p-2 bg-muted/30">
                                                <div className="text-xs font-medium text-muted-foreground mb-1">Piece Count per Load</div>
                                                {Array.from({ length: editableOrder.load }, (_, i) => i + 1).map((loadNum) => {
                                                    const currentPieces = editableOrder.loadPieces || [];
                                                    const pieceValue = currentPieces[loadNum - 1] ?? '';
                                                    return (
                                                        <div key={loadNum} className="flex items-center gap-1.5">
                                                            <span className="text-xs text-muted-foreground w-16 text-left">Load {loadNum}:</span>
                                                            <Input
                                                                type="number"
                                                                min="1"
                                                                step="1"
                                                                placeholder="pcs"
                                                                value={pieceValue}
                                                                onChange={(e) => {
                                                                    const newPieces = [...(editableOrder.loadPieces || [])];
                                                                    // Ensure array is long enough
                                                                    while (newPieces.length < editableOrder.load) {
                                                                        newPieces.push(null);
                                                                    }
                                                                    const numValue = e.target.value === '' ? null : Number(e.target.value);
                                                                    newPieces[loadNum - 1] = numValue;
                                                                    handleFieldChange('loadPieces', newPieces);
                                                                }}
                                                                className="h-7 text-xs border text-center flex-1 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                                                disabled={isSaving}
                                                            />
                                                            <span className="text-xs text-muted-foreground w-10">pcs</span>
                                                        </div>
                                                    );
                                                })}
                                                {(() => {
                                                    const pieces = editableOrder.loadPieces || [];
                                                    const totalPieces = pieces.reduce((sum, p) => sum + (p || 0), 0);
                                                    if (totalPieces > 0) {
                                                        return (
                                                            <div className="text-xs font-semibold text-primary mt-1.5 pt-1 border-t">
                                                                Total: {totalPieces} pcs
                                                            </div>
                                                        );
                                                    }
                                                    return null;
                                                })()}
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-medium">{workingOrder.load} load{workingOrder.load > 1 ? 's' : ''}</span>
                                            {workingOrder.loadPieces && workingOrder.loadPieces.length > 0 && workingOrder.loadPieces.some(p => p !== null && p !== undefined) && (
                                                <div className="text-xs text-muted-foreground">
                                                    ({workingOrder.loadPieces.filter(p => p !== null && p !== undefined).join(', ')} pcs)
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                                <div className="space-y-1.5">
                                    <Label htmlFor={`found-items-mob-${order.id}`} className="flex items-center gap-2">
                                        <Search className="h-3 w-3 text-muted-foreground" />
                                        Found Items
                                    </Label>
                                    {isEditing ? (
                                        <div className="space-y-2">
                                            <div className="space-y-1.5 border rounded-md p-2 bg-muted/30">
                                                {(editableOrder.foundItems || []).map((item, index) => (
                                                    <div key={index} className="flex items-center gap-1.5">
                                                        <Input
                                                            type="text"
                                                            value={item}
                                                            onChange={(e) => {
                                                                const newItems = [...(editableOrder.foundItems || [])];
                                                                newItems[index] = e.target.value;
                                                                handleFieldChange('foundItems', newItems);
                                                            }}
                                                            className="h-7 text-xs border flex-1"
                                                            disabled={isSaving}
                                                            placeholder="Item description"
                                                        />
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant="ghost"
                                                            onClick={() => {
                                                                const newItems = (editableOrder.foundItems || []).filter((_, i) => i !== index);
                                                                handleFieldChange('foundItems', newItems.length > 0 ? newItems : undefined);
                                                            }}
                                                            disabled={isSaving}
                                                            className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive"
                                                        >
                                                            <X className="h-3 w-3" />
                                                        </Button>
                                                    </div>
                                                ))}
                                                <Button
                                                    type="button"
                                                    size="sm"
                                                    variant="outline"
                                                    onClick={() => {
                                                        const newItems = [...(editableOrder.foundItems || []), ''];
                                                        handleFieldChange('foundItems', newItems);
                                                    }}
                                                    disabled={isSaving}
                                                    className="w-full h-7 text-xs"
                                                >
                                                    <Plus className="h-3 w-3 mr-1" />
                                                    Add Item
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-wrap gap-1">
                                            {workingOrder.foundItems && workingOrder.foundItems.length > 0 ? (
                                                workingOrder.foundItems.map((item, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs bg-yellow-50 dark:bg-yellow-950 border-yellow-300 dark:border-yellow-700 text-yellow-800 dark:text-yellow-200">
                                                        {item}
                                                    </Badge>
                                                ))
                                            ) : (
                                                <span className="text-xs text-muted-foreground">No items found</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 items-end">
                                <div className="space-y-1.5">
                                    <Label htmlFor={`total-mob-${order.id}`} className="flex items-center gap-2">
                                        <DollarSign className="h-3 w-3 text-muted-foreground" />
                                        Total (₱)
                                    </Label>
                                    {isEditing ? (
                                        <Input id={`total-mob-${order.id}`} type="number" value={editableOrder.total.toString()} onChange={e => handleFieldChange('total', e.target.value)} className="h-9 border-2 font-semibold" disabled={isSaving} />
                                    ) : (
                                        <div className="flex flex-col gap-1">
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
                                </div>
                                <div className="flex flex-col items-start space-y-1.5">
                                    <Label className="flex items-center gap-2">
                                        <CreditCard className="h-3 w-3 text-muted-foreground" />
                                        Payment
                                    </Label>
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
                                                        `${badgeInfo.color} hover:${badgeInfo.color} text-white cursor-pointer hover:opacity-90 transition-opacity font-semibold shadow-sm px-3 py-1.5`
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
                                                    className={`${badgeInfo.color} text-white font-semibold shadow-sm px-3 py-1.5`}
                                                >
                                                    {badgeInfo.text}
                                                </Badge>
                                            );
                                        })()
                                    )}
                                </div>
                            </div>
                            <div className="space-y-1.5" onClick={(e) => e.stopPropagation()}>
                                <Label className="flex items-center gap-2">
                                    <CheckCircle2 className="h-3 w-3 text-muted-foreground" />
                                    Status
                                </Label>
                                {isEditing ? (
                                    <Select
                                        value={editableOrder.status}
                                        onValueChange={(value) => handleFieldChange('status', value)}
                                        disabled={isSaving}
                                    >
                                        <SelectTrigger className="h-9 border-2 font-semibold">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {statusOptions.map((status) => (
                                                <SelectItem key={status} value={status}>{status}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                ) : (
                                    <Badge 
                                        className={cn(
                                            getStatusColor(workingOrder.status),
                                            "text-white text-xs font-semibold shadow-sm px-3 py-1.5 cursor-pointer",
                                            "hover:opacity-90 hover:scale-105 hover:shadow-md transition-all active:scale-95"
                                        )}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            setIsStatusDialogOpen(true);
                                        }}
                                        onMouseDown={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        onTouchStart={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                        }}
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                setIsStatusDialogOpen(true);
                                            }
                                        }}
                                    >
                                        {workingOrder.status}
                                    </Badge>
                                )}
                            </div>

                            <div className="flex justify-end gap-2 pt-2 border-t">
                                {isEditing ? (
                                    <>
                                        {onDeleteOrder && (
                                            <Button 
                                                variant="outline" 
                                                onClick={() => setIsDeleteDialogOpen(true)} 
                                                disabled={isSaving}
                                                className="gap-2 hover:bg-destructive/10 hover:border-destructive hover:text-destructive"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                                Delete
                                            </Button>
                                        )}
                                        <Button 
                                            variant="outline" 
                                            onClick={handleCancel} 
                                            disabled={isSaving}
                                            className="gap-2"
                                        >
                                            <X className="h-4 w-4" />
                                            Cancel
                                        </Button>
                                        <Button 
                                            onClick={handleSave} 
                                            disabled={isSaving}
                                            className="gap-2 bg-primary hover:bg-primary/90 shadow-sm"
                                        >
                                            {isSaving ? (
                                                <>
                                                    <Loader2 className="h-4 w-4 animate-spin" />
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <Save className="h-4 w-4" />
                                                    Save
                                                </>
                                            )}
                                        </Button>
                                    </>
                                ) : (
                                    <Button 
                                        variant="outline" 
                                        onClick={() => setIsEditing(true)} 
                                        className="gap-2 hover:bg-primary/10 hover:border-primary hover:text-primary"
                                    >
                                        <Edit className="h-4 w-4" />
                                        Edit
                                    </Button>
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
        <StatusDialog
            isOpen={isStatusDialogOpen}
            onClose={() => setIsStatusDialogOpen(false)}
            onConfirm={async (newStatus) => {
                const updatedOrder = {
                    ...workingOrder,
                    status: newStatus,
                    statusHistory: [...(workingOrder.statusHistory || []), { status: newStatus, timestamp: new Date() }]
                };
                await onUpdateOrder(updatedOrder);
            }}
            currentStatus={workingOrder.status}
            orderId={workingOrder.id}
        />
        {onDeleteOrder && (
            <DeleteOrderDialog
                isOpen={isDeleteDialogOpen}
                onClose={() => setIsDeleteDialogOpen(false)}
                onConfirm={async () => {
                    if (onDeleteOrder) {
                        await onDeleteOrder(workingOrder.id);
                        setIsEditing(false);
                    }
                }}
                orderId={workingOrder.id}
            />
        )}
        </>
    );
}

// Re-export types for backward compatibility
export type { Order, StatusHistory, OrderListProps } from './order-list/types';

export function OrderList({
  orders,
  onUpdateOrder,
  onDeleteOrder,
  enablePagination = true,
}: OrderListProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;

  // Calculate pagination - only if enabled
  const totalPages = enablePagination ? Math.ceil(orders.length / ordersPerPage) : 1;
  const startIndex = enablePagination ? (currentPage - 1) * ordersPerPage : 0;
  const endIndex = enablePagination ? startIndex + ordersPerPage : orders.length;
  const paginatedOrders = enablePagination ? orders.slice(startIndex, endIndex) : orders;

  // Reset to page 1 when orders change
  useEffect(() => {
    setCurrentPage(1);
  }, [orders.length, enablePagination]);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxVisible = 5;

    if (totalPages <= maxVisible) {
      // Show all pages if total pages is less than max visible
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      if (totalPages > 1) {
        pages.push(totalPages);
      }
    }

    return pages;
  };

  return (
    <>
      {/* Mobile View - Card List */}
      <div className="md:hidden space-y-4">
        {paginatedOrders.map((order) => (
          <OrderCard key={`${order.id}-${order.balance}-${order.isPaid}`} order={order} onUpdateOrder={onUpdateOrder} onDeleteOrder={onDeleteOrder} />
        ))}
        
        {/* Mobile Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="gap-1"
            >
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <div className="flex items-center gap-1">
              {getPageNumbers().map((page, index) => (
                page === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                ) : (
                  <Button
                    key={page}
                    variant={currentPage === page ? "default" : "outline"}
                    size="sm"
                    onClick={() => goToPage(page as number)}
                    className="min-w-[2.5rem]"
                  >
                    {page}
                  </Button>
                )
              ))}
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="gap-1"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Desktop View - Table */}
      <div className="hidden md:block w-full">
        <Table className="w-full">
          <TableHeader>
            <TableRow className="bg-muted/50 hover:bg-muted/50">
              <TableHead className="w-auto font-semibold px-2">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-primary" />
                  ORDER #
                </div>
              </TableHead>
              <TableHead className="w-auto font-semibold text-center px-2">
                <div className="flex items-center justify-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  Date
                </div>
              </TableHead>
              <TableHead className="w-auto font-semibold px-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Name
                </div>
              </TableHead>
              <TableHead className="w-auto font-semibold px-2">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-primary" />
                  Employee
                </div>
              </TableHead>
              <TableHead className="w-auto font-semibold text-center px-2">
                <div className="flex items-center justify-center gap-2">
                  <Layers className="h-4 w-4 text-primary" />
                  Load
                </div>
              </TableHead>
              <TableHead className="w-auto font-semibold px-2">
                <div className="flex items-center gap-2">
                  <Search className="h-4 w-4 text-primary" />
                  Found Items
                </div>
              </TableHead>
              <TableHead className="w-auto font-semibold text-right px-2">
                <div className="flex items-center justify-end gap-2">
                  <DollarSign className="h-4 w-4 text-primary" />
                  Total (₱)
                </div>
              </TableHead>
              <TableHead className="w-auto font-semibold text-center px-2">
                <div className="flex items-center justify-center gap-2">
                  <CreditCard className="h-4 w-4 text-primary" />
                  Payment
                </div>
              </TableHead>
              <TableHead className="w-auto font-semibold text-center px-2">
                <div className="flex items-center justify-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Status
                </div>
              </TableHead>
              <TableHead className="w-auto font-semibold text-center px-2">
                <div className="flex items-center justify-center gap-2">
                  <MoreVertical className="h-4 w-4 text-primary" />
                  Action
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedOrders.map((order) => (
              <OrderRow key={`${order.id}-${order.balance}-${order.isPaid}`} order={order} onUpdateOrder={onUpdateOrder} onDeleteOrder={onDeleteOrder} />
            ))}
          </TableBody>
        </Table>

        {/* Desktop Pagination */}
        {totalPages > 1 && (
          <div className="flex flex-col items-center gap-4 mt-4 pt-4 border-t">
            <div className="text-sm text-muted-foreground">
              Showing {startIndex + 1} to {Math.min(endIndex, orders.length)} of {orders.length} orders
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage - 1)}
                disabled={currentPage === 1}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <div className="flex items-center gap-1">
                {getPageNumbers().map((page, index) => (
                  page === '...' ? (
                    <span key={`ellipsis-${index}`} className="px-2 text-muted-foreground">...</span>
                  ) : (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      onClick={() => goToPage(page as number)}
                      className="min-w-[2.5rem]"
                    >
                      {page}
                    </Button>
                  )
                ))}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => goToPage(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="gap-1"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
