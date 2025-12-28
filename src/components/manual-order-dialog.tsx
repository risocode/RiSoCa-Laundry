'use client';

import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Order } from './order-list';
import { Loader2, Layers, Users, Calendar, User, DollarSign, CreditCard } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';
import { useEmployees } from '@/hooks/use-employees';
import { format } from 'date-fns';

const manualOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required.'),
  orderDate: z.string().min(1, 'Date is required.'),
  loads: z.number().min(1, 'Please select number of loads.').max(10, 'Maximum 10 loads allowed.'),
  total: z.coerce.number().min(0, 'Price must be 0 or greater.'),
  isPaid: z.boolean().optional(),
  assigned_employee_ids: z.array(z.string()).optional(), // Array of employee IDs
});

type ManualOrderFormValues = z.infer<typeof manualOrderSchema>;

type ManualOrderDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (order: Omit<Order, 'id' | 'userId'>) => Promise<void>;
};

type Employee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

export function ManualOrderDialog({ isOpen, onClose, onAddOrder }: ManualOrderDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { employees, loading: loadingEmployees } = useEmployees();
  
  const form = useForm<ManualOrderFormValues>({
    resolver: zodResolver(manualOrderSchema),
    defaultValues: {
      customerName: '',
      orderDate: format(new Date(), 'yyyy-MM-dd'), // Default to today's date
      loads: undefined,
      total: undefined,
      isPaid: undefined,
      assigned_employee_ids: [],
    },
    mode: 'onChange',
  });

  const watchedLoads = form.watch('loads');
  const isPaid = form.watch('isPaid');

  // Calculate weight from loads (each load is 7.5 kg)
  const weight = useMemo(() => {
    if (!watchedLoads || watchedLoads <= 0) return 0;
    return watchedLoads * 7.5;
  }, [watchedLoads]);

  // Calculate distribution for display
  const distribution = useMemo(() => {
    if (!watchedLoads || watchedLoads <= 0) return [];
    const dist: {load: number, weight: number}[] = [];
    for (let i = 1; i <= watchedLoads; i++) {
      dist.push({ load: i, weight: 7.5 });
    }
    return dist;
  }, [watchedLoads]);
  
  useEffect(() => {
    const calculatedPrice = watchedLoads ? watchedLoads * 180 : 0;
    if(calculatedPrice > 0){
        form.setValue('total', calculatedPrice);
    } else {
        form.setValue('total', undefined);
    }
  }, [watchedLoads, form]);

  const onSubmit = async (data: ManualOrderFormValues) => {
    setIsSaving(true);
    const initialStatus = 'Order Placed';
    
    // Store multiple employee IDs as JSON array in assigned_employee_ids
    // For backward compatibility, also set assigned_employee_id to first employee or null
    const assignedEmployeeIds = data.assigned_employee_ids || [];
    const firstEmployeeId = assignedEmployeeIds.length > 0 ? assignedEmployeeIds[0] : null;
    
    // Parse the date string to a Date object
    const orderDate = new Date(data.orderDate);
    
    const newOrder: Omit<Order, 'id' | 'userId'> = {
      customerName: data.customerName,
      contactNumber: 'N/A', // Contact will be added in the dashboard
      load: data.loads,
      weight: weight, // Calculate weight from loads (loads * 7.5)
      status: initialStatus,
      total: data.total,
      isPaid: data.isPaid || false,
      servicePackage: 'package1',
      distance: 0,
      orderDate: orderDate,
      statusHistory: [{ status: initialStatus, timestamp: new Date() }],
      assignedEmployeeId: firstEmployeeId, // For backward compatibility
      assignedEmployeeIds: assignedEmployeeIds.length > 0 ? assignedEmployeeIds : undefined, // New field for multiple employees
    };
    await onAddOrder(newOrder);
    setIsSaving(false);
    form.reset({
      customerName: '',
      orderDate: format(new Date(), 'yyyy-MM-dd'), // Reset to today's date
      loads: undefined,
      total: undefined,
      isPaid: undefined,
      assigned_employee_ids: [],
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) form.reset(); onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold">Create Manual Order</DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            All fields marked with <span className="text-destructive">*</span> are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="customerName" className="text-xs font-medium mb-1 block">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              <Input
                id="customerName"
                placeholder="Name"
                {...form.register('customerName')}
                disabled={isSaving}
                className="h-9 text-sm"
              />
              {form.formState.errors.customerName && (
                <p className="text-xs text-destructive mt-0.5">{form.formState.errors.customerName.message}</p>
              )}
            </div>
            
            <div>
              <Label htmlFor="orderDate" className="text-xs font-medium mb-1 block">
                Date <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Calendar className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                <Input
                  id="orderDate"
                  type="date"
                  {...form.register('orderDate')}
                  disabled={isSaving}
                  className="h-9 pl-8 text-sm"
                />
              </div>
              {form.formState.errors.orderDate && (
                <p className="text-xs text-destructive mt-0.5">{form.formState.errors.orderDate.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              Number of Loads <span className="text-destructive">*</span>
            </Label>
            <Controller
              name="loads"
              control={form.control}
              render={({ field }) => (
                <div className="grid grid-cols-5 gap-1.5">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((loadNum) => {
                    const isSelected = field.value === loadNum;
                    return (
                      <Button
                        key={loadNum}
                        type="button"
                        variant={isSelected ? "default" : "outline"}
                        onClick={() => field.onChange(loadNum)}
                        disabled={isSaving}
                        className={cn(
                          "h-8 p-0 font-semibold text-sm transition-all",
                          isSelected 
                            ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                            : "hover:border-primary hover:text-primary"
                        )}
                      >
                        {loadNum}
                      </Button>
                    );
                  })}
                </div>
              )}
            />
            {form.formState.errors.loads && (
              <p className="text-xs text-destructive mt-0.5">{form.formState.errors.loads.message}</p>
            )}
          </div>

          {watchedLoads && watchedLoads > 0 && (
            <div className="rounded-lg border-2 border-primary/30 bg-gradient-to-r from-primary/10 to-primary/5 p-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex-1">
                  <div className="text-xs text-muted-foreground mb-1">Order Details</div>
                  <div className="flex items-center gap-3 text-xs">
                    <span className="font-medium text-foreground">{watchedLoads} load{watchedLoads > 1 ? 's' : ''}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className="font-medium text-foreground">{weight.toFixed(1)} kg</span>
                  </div>
                </div>
                <div className="flex-1 text-right">
                  <Label htmlFor="total" className="text-xs text-muted-foreground mb-1 block">
                    Total Price
                  </Label>
                  <Controller
                    name="total"
                    control={form.control}
                    render={({ field }) => (
                      <Input
                        id="total"
                        type="number"
                        step="0.01"
                        {...field}
                        value={field.value ?? ''}
                        onChange={(e) => field.onChange(e.target.value)}
                        disabled={isSaving}
                        className="h-10 text-lg text-center text-green-600 dark:text-green-400 font-bold border-0 bg-transparent p-0 focus-visible:ring-0 focus-visible:ring-offset-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0"
                      />
                    )}
                  />
                </div>
              </div>
              {form.formState.errors.total && (
                <p className="text-xs text-destructive mt-1 text-center">{form.formState.errors.total.message}</p>
              )}
            </div>
          )}

          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              Assign Employee <span className="text-xs font-normal text-muted-foreground">(Optional)</span>
            </Label>
            <Controller
              name="assigned_employee_ids"
              control={form.control}
              render={({ field }) => {
                const selectedIds = field.value || [];
                const toggleEmployee = (employeeId: string) => {
                  const currentIds = selectedIds;
                  if (currentIds.includes(employeeId)) {
                    field.onChange(currentIds.filter(id => id !== employeeId));
                  } else {
                    field.onChange([...currentIds, employeeId]);
                  }
                };
                
                return (
                  <div className="grid grid-cols-3 gap-1.5">
                    {loadingEmployees ? (
                      <div className="col-span-full text-center py-2 text-xs text-muted-foreground">
                        Loading...
                      </div>
                    ) : employees.length === 0 ? (
                      <div className="col-span-full text-center py-2 text-xs text-muted-foreground">
                        No employees
                      </div>
                    ) : (
                      employees.map((employee) => {
                        const isSelected = selectedIds.includes(employee.id);
                        return (
                          <Button
                            key={employee.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleEmployee(employee.id)}
                            disabled={isSaving || loadingEmployees}
                            className={cn(
                              "h-8 text-xs font-medium transition-all",
                              isSelected 
                                ? "bg-primary hover:bg-primary/90 text-primary-foreground" 
                                : "hover:border-primary hover:text-primary"
                            )}
                          >
                            {employee.first_name || 'Employee'}
                          </Button>
                        );
                      })
                    )}
                  </div>
                );
              }}
            />
          </div>

          <div>
            <Label className="text-xs font-medium mb-1.5 block">
              Payment Status <span className="text-destructive">*</span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                onClick={() => form.setValue('isPaid', true)}
                className={cn(
                  "h-9 text-sm font-medium transition-all",
                  isPaid === true
                    ? 'bg-green-600 hover:bg-green-700 text-white'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
                disabled={isSaving}
              >
                Paid
              </Button>
              <Button
                type="button"
                onClick={() => form.setValue('isPaid', false)}
                className={cn(
                  "h-9 text-sm font-medium transition-all",
                  isPaid === false
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                )}
                disabled={isSaving}
              >
                Unpaid
              </Button>
            </div>
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { form.reset(); onClose(); }} 
              disabled={isSaving}
              className="h-9 text-sm"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving || isPaid === undefined || !!form.formState.errors.loads || !!form.formState.errors.assigned_employee_ids}
              className="h-9 text-sm bg-primary hover:bg-primary/90"
            >
              {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {isSaving ? 'Creating...' : 'Add Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
