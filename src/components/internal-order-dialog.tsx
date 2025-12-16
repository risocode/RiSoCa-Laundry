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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { Order } from './order-list';
import { Loader2, Layers, Shirt } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Separator } from './ui/separator';
import { supabase } from '@/lib/supabase-client';

const internalOrderSchema = z.object({
  weight: z.preprocess(
    (val) => (String(val).trim() === '' ? undefined : Number(val)),
    z.number({invalid_type_error: "Input Valid Weight"}).min(0.1, "Weight must be greater than 0.")
  ),
  assigned_employee_id: z.string().optional(),
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
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loadingEmployees, setLoadingEmployees] = useState(false);
  
  const form = useForm<InternalOrderFormValues>({
    resolver: zodResolver(internalOrderSchema),
    defaultValues: {
      weight: undefined,
      assigned_employee_id: undefined,
    },
    mode: 'onChange',
  });

  const watchedWeight = form.watch('weight');
  const assignedEmployeeId = form.watch('assigned_employee_id');

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

  const onSubmit = async (data: InternalOrderFormValues) => {
    setIsSaving(true);
    const initialStatus = 'Success';
    
    const newOrder: Omit<Order, 'id' | 'userId'> = {
      customerName: 'RKR Laundry',
      contactNumber: 'N/A',
      load: loads,
      weight: data.weight,
      status: initialStatus,
      total: 0,
      isPaid: true,
      servicePackage: 'package1',
      distance: 0,
      orderDate: new Date(),
      statusHistory: [{ status: initialStatus, timestamp: new Date() }],
      orderType: 'internal',
      assignedEmployeeId: data.assigned_employee_id || null,
    };
    await onAddOrder(newOrder);
    setIsSaving(false);
    form.reset();
    onClose();
  };

  const selectedEmployee = employees.find(emp => emp.id === assignedEmployeeId);
  const employeeName = selectedEmployee 
    ? `${selectedEmployee.first_name || ''} ${selectedEmployee.last_name || ''}`.trim()
    : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) form.reset(); onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Shirt className="h-5 w-5 text-primary" />
            <DialogTitle>Create Internal Order</DialogTitle>
          </div>
          <DialogDescription>
            Create an order for RKR Laundry's own laundry. No payment required.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <Label htmlFor="weight" className="form-label">Total Weight (kg) *</Label>
            {form.formState.errors.weight && (
              <p className="text-xs text-destructive pt-1">{form.formState.errors.weight.message}</p>
            )}
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
              name="assigned_employee_id"
              control={form.control}
              render={({ field }) => (
                <Select
                  value={field.value || 'none'}
                  onValueChange={(value) => field.onChange(value === 'none' ? undefined : value)}
                  disabled={isSaving || loadingEmployees}
                >
                  <SelectTrigger className="form-input text-center">
                    <SelectValue placeholder="Select Employee (Optional)" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {`${employee.first_name || ''} ${employee.last_name || ''}`.trim() || 'Unnamed Employee'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <Label className="form-label">Employee (Optional)</Label>
            {assignedEmployeeId && employeeName && (
              <p className="text-xs text-muted-foreground pt-1">
                Employee will receive +₱30 bonus for this order
              </p>
            )}
          </div>

          <div className="rounded-lg bg-primary/10 p-3 space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Order Type:</span>
              <span className="font-medium">Internal</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Status:</span>
              <span className="font-medium text-green-600">Success</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Payment:</span>
              <span className="font-medium text-green-600">Paid</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total:</span>
              <span className="font-medium">₱0.00</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { form.reset(); onClose(); }} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || !!form.formState.errors.weight}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

