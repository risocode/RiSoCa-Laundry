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
import { Label } from '@/components/ui/label';
import type { Order } from './order-list';
import { Loader2, Shirt, Users } from 'lucide-react';
import { useState, useMemo } from 'react';
import { useEmployees } from '@/hooks/use-employees';
import { cn } from '@/lib/utils';

const internalOrderSchema = z.object({
  loads: z.number().min(1, 'Please select number of loads.').max(10, 'Maximum 10 loads allowed.'),
  assigned_employee_ids: z.array(z.string()).optional(), // Array of employee IDs
});

type InternalOrderFormValues = z.infer<typeof internalOrderSchema>;

type Employee = {
  id: string;
  first_name: string | null;
  last_name: string | null;
};

type InternalOrderDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (order: Omit<Order, 'id' | 'userId'>) => Promise<void>;
};

export function InternalOrderDialog({ isOpen, onClose, onAddOrder }: InternalOrderDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const { employees, loading: loadingEmployees } = useEmployees();
  
  const form = useForm<InternalOrderFormValues>({
    resolver: zodResolver(internalOrderSchema),
    defaultValues: {
      loads: undefined,
      assigned_employee_ids: [],
    },
    mode: 'onChange',
  });

  const watchedLoads = form.watch('loads');

  // Calculate weight from loads (each load is 7.5 kg)
  const weight = useMemo(() => {
    if (!watchedLoads || watchedLoads <= 0) return 0;
    return watchedLoads * 7.5;
  }, [watchedLoads]);

  const onSubmit = async (data: InternalOrderFormValues) => {
    setIsSaving(true);
    const initialStatus = 'Success';
    
    // Store multiple employee IDs as JSON array in assigned_employee_ids
    // For backward compatibility, also set assigned_employee_id to first employee or null
    const assignedEmployeeIds = data.assigned_employee_ids || [];
    const firstEmployeeId = assignedEmployeeIds.length > 0 ? assignedEmployeeIds[0] : null;
    
    const newOrder: Omit<Order, 'id' | 'userId'> = {
      customerName: 'RKR Laundry',
      contactNumber: 'N/A',
      load: data.loads,
      weight: weight, // Calculate weight from loads (loads * 7.5)
      status: initialStatus,
      total: 0,
      isPaid: true,
      servicePackage: 'package1',
      distance: 0,
      orderDate: new Date(),
      statusHistory: [{ status: initialStatus, timestamp: new Date() }],
      orderType: 'internal',
      assignedEmployeeId: firstEmployeeId, // For backward compatibility
      assignedEmployeeIds: assignedEmployeeIds.length > 0 ? assignedEmployeeIds : undefined, // New field for multiple employees
    };
    await onAddOrder(newOrder);
    setIsSaving(false);
    form.reset({
      loads: undefined,
      assigned_employee_ids: [],
    });
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) form.reset(); onClose(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <Shirt className="h-5 w-5 text-primary" />
            Create Internal Order
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Create an order for RKR Laundry's own laundry. No payment required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
                  <div className="text-xs text-muted-foreground mb-1">Total</div>
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">₱0.00</div>
                </div>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs font-medium mb-1.5 block flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-primary" />
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
            {form.watch('assigned_employee_ids') && form.watch('assigned_employee_ids')!.length > 0 && (
              <p className="text-xs text-muted-foreground mt-1">
                Selected employee(s) will receive +₱30 bonus per load
              </p>
            )}
          </div>

          <div className="rounded-lg border border-primary/20 bg-primary/5 p-2.5 space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Order Type:</span>
              <span className="font-medium">Internal</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-green-600 dark:text-green-400">Success</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Payment:</span>
              <span className="font-medium text-green-600 dark:text-green-400">Paid</span>
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
              disabled={isSaving || !!form.formState.errors.loads}
              className="h-9 text-sm bg-primary hover:bg-primary/90"
            >
              {isSaving && <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />}
              {isSaving ? 'Creating...' : 'Create Order'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

