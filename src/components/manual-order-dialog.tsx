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
import { Loader2, Layers, Users } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';
import { supabase } from '@/lib/supabase-client';

const manualOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required.'),
  contactNumber: z.string().optional(),
  weight: z.preprocess(
    (val) => (String(val).trim() === '' ? undefined : Number(val)),
    z.number({invalid_type_error: "Input Valid Weight"}).min(0.1, "Weight must be greater than 0.")
  ),
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  const form = useForm<ManualOrderFormValues>({
    resolver: zodResolver(manualOrderSchema),
    defaultValues: {
      customerName: '',
      contactNumber: '',
      weight: undefined,
      total: undefined,
      isPaid: undefined,
      assigned_employee_ids: [],
    },
    mode: 'onChange',
  });

  const watchedWeight = form.watch('weight');
  const isPaid = form.watch('isPaid');

  const { loads, distribution } = useMemo(() => {
    let weight = watchedWeight || 0;
    if (weight <= 0) {
      return { loads: 0, distribution: [] };
    }

    const numLoads = Math.ceil(weight / 7.5);
    const dist: {load: number, weight: number}[] = [];

    let remainingWeight = weight;
    for (let i = 1; i <= numLoads; i++) {
        const loadWeight = Math.min(remainingWeight, 7.5);
        dist.push({ load: i, weight: loadWeight });
        remainingWeight -= loadWeight;
    }

    return { loads: numLoads, distribution: dist };
  }, [watchedWeight]);
  
  useEffect(() => {
    const calculatedPrice = loads * 180;
    if(calculatedPrice > 0){
        form.setValue('total', calculatedPrice);
    } else {
        form.setValue('total', undefined);
    }
  }, [loads, form]);

  useEffect(() => {
    if (isOpen) {
      fetchEmployees();
    }
  }, [isOpen]);

  const fetchEmployees = async () => {
    setLoadingEmployees(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name')
        .eq('role', 'employee')
        .order('first_name', { ascending: true });

      if (error) {
        console.error("Failed to load employees", error);
        return;
      }
      setEmployees(data || []);
    } catch (error) {
      console.error('Error fetching employees', error);
    } finally {
      setLoadingEmployees(false);
    }
  };

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (isNaN(value)) {
        form.setValue('weight', undefined, { shouldValidate: true, shouldDirty: true });
        return;
    }
    if (value > 75) {
      value = 75;
    }
    form.setValue('weight', value, { shouldValidate: true, shouldDirty: true });
  }

  const onSubmit = async (data: ManualOrderFormValues) => {
    setIsSaving(true);
    const initialStatus = 'Order Placed';
    
    // Store multiple employee IDs as JSON array in assigned_employee_ids
    // For backward compatibility, also set assigned_employee_id to first employee or null
    const assignedEmployeeIds = data.assigned_employee_ids || [];
    const firstEmployeeId = assignedEmployeeIds.length > 0 ? assignedEmployeeIds[0] : null;
    
    const newOrder: Omit<Order, 'id' | 'userId'> = {
      customerName: data.customerName,
      contactNumber: data.contactNumber || 'N/A',
      load: loads,
      weight: data.weight,
      status: initialStatus,
      total: data.total,
      isPaid: data.isPaid || false,
      servicePackage: 'package1',
      distance: 0,
      orderDate: new Date(),
      statusHistory: [{ status: initialStatus, timestamp: new Date() }],
      assignedEmployeeId: firstEmployeeId, // For backward compatibility
      assignedEmployeeIds: assignedEmployeeIds.length > 0 ? assignedEmployeeIds : undefined, // New field for multiple employees
    };
    await onAddOrder(newOrder);
    setIsSaving(false);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) form.reset(); onClose(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Create Manual Order</DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground">
            Fill in the order details below. All fields marked with * are required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
          <div className="space-y-4">
            <div className="form-group">
              <Input
                id="customerName"
                placeholder=" "
                {...form.register('customerName')}
                disabled={isSaving}
                className="form-input text-center"
              />
              <Label htmlFor="customerName" className="form-label">
                Customer Name <span className="text-destructive">*</span>
              </Label>
              {form.formState.errors.customerName && (
                <p className="text-xs text-destructive pt-1">{form.formState.errors.customerName.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <Input
                id="contactNumber"
                placeholder=" "
                {...form.register('contactNumber')}
                disabled={isSaving}
                className="form-input text-center"
              />
              <Label htmlFor="contactNumber" className="form-label">Contact Number (Optional)</Label>
              {form.formState.errors.contactNumber && (
                <p className="text-xs text-destructive pt-1">{form.formState.errors.contactNumber.message}</p>
              )}
            </div>
            
            <div className="form-group">
              <Controller
                name="weight"
                control={form.control}
                render={({ field }) => (
                  <Input
                    id="weight"
                    type="number"
                    step="0.1"
                    placeholder=" "
                    {...field}
                    onChange={handleWeightChange}
                    value={field.value ?? ''}
                    disabled={isSaving}
                    className="form-input text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                )}
              />
              <Label htmlFor="weight" className="form-label">
                Total Weight (kg) <span className="text-destructive">*</span>
              </Label>
              {form.formState.errors.weight && (
                <p className="text-xs text-destructive pt-1">{form.formState.errors.weight.message}</p>
              )}
            </div>
          </div>
            
          {distribution.length > 0 && (
              <div className="space-y-3 rounded-lg bg-muted p-3">
                  <div className="flex justify-between items-center">
                    <h4 className="text-sm font-medium flex items-center gap-2"><Layers className="h-4 w-4" />Calculated Loads</h4>
                    <span className="text-lg font-bold text-primary">{loads}</span>
                  </div>
                  <Separator/>
                   <div className="text-xs text-muted-foreground grid grid-cols-2 gap-x-4 gap-y-1">
                      {distribution.map(d => (
                          <div key={d.load} className="flex justify-between">
                            <span>Load {d.load}:</span>
                            <span className="font-medium text-foreground">{d.weight.toFixed(1)} kg</span>
                          </div>
                      ))}
                   </div>
              </div>
          )}

          <div className="form-group">
            <Controller
                name="total"
                control={form.control}
                render={({ field }) => (
                     <Input
                        id="total"
                        type="number"
                        step="0.01"
                        placeholder=" "
                        {...field}
                        value={field.value ?? ''}
                        disabled={isSaving}
                        className="form-input text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                )}
            />
            <Label htmlFor="total" className="form-label">Price (₱180 / Load)</Label>
             {form.formState.errors.total && (
              <p className="text-xs text-destructive pt-1">{form.formState.errors.total.message}</p>
            )}
          </div>

          <Separator className="my-4" />
          
          <div className="space-y-3">
            <Label className="flex items-center gap-2 text-sm font-medium">
              <Users className="h-4 w-4 text-primary" />
              Assign Employee (Optional)
            </Label>
            <Controller
              name="assigned_employee_ids"
              control={form.control}
              render={({ field }) => {
                const selectedIds = field.value || [];
                
                const toggleEmployee = (employeeId: string) => {
                  const currentIds = selectedIds;
                  if (currentIds.includes(employeeId)) {
                    // Remove employee
                    field.onChange(currentIds.filter(id => id !== employeeId));
                  } else {
                    // Add employee
                    field.onChange([...currentIds, employeeId]);
                  }
                };
                
                return (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {employees.map((employee) => {
                      const isSelected = selectedIds.includes(employee.id);
                      return (
                        <Button
                          key={employee.id}
                          type="button"
                          variant={isSelected ? "default" : "outline"}
                          size="lg"
                          onClick={() => toggleEmployee(employee.id)}
                          disabled={isSaving || loadingEmployees}
                          className={cn(
                            "h-12 font-semibold transition-all",
                            isSelected 
                              ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" 
                              : "hover:border-primary hover:text-primary"
                          )}
                        >
                          {employee.first_name || 'Employee'}
                        </Button>
                      );
                    })}
                  </div>
                );
              }}
            />
          </div>

          <Separator className="my-4" />

          <div className="space-y-3">
            <Label className="text-sm font-medium">Payment Status <span className="text-destructive">*</span></Label>
            <div className="grid grid-cols-2 gap-3">
                <Button
                    type="button"
                    onClick={() => form.setValue('isPaid', true)}
                    className={cn(
                        "h-12 font-semibold transition-all",
                        isPaid === true
                        ? 'bg-green-600 hover:bg-green-700 text-white shadow-md'
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
                        "h-12 font-semibold transition-all",
                        isPaid === false
                        ? 'bg-red-600 hover:bg-red-700 text-white shadow-md'
                        : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                    )}
                    disabled={isSaving}
                >
                    Unpaid
                </Button>
            </div>
          </div>


          <DialogFooter className="gap-2 sm:gap-0">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => { form.reset(); onClose(); }} 
              disabled={isSaving}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isSaving || isPaid === undefined || !!form.formState.errors.weight || !!form.formState.errors.assigned_employee_ids}
              className="w-full sm:w-auto bg-primary hover:bg-primary/90 shadow-md"
            >
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
