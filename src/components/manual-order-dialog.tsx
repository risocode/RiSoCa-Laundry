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
import { Loader2, Layers } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Separator } from './ui/separator';
import { cn } from '@/lib/utils';

const manualOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required.'),
  contactNumber: z.string().optional(),
  weight: z.coerce.number().min(0.1, 'Weight must be greater than 0.').max(75, "Maximum of 10 loads (75kg) per order."),
  total: z.coerce.number().min(0, 'Price must be 0 or greater.'),
  isPaid: z.boolean().optional(),
});

type ManualOrderFormValues = z.infer<typeof manualOrderSchema>;

type ManualOrderDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onAddOrder: (order: Omit<Order, 'id' | 'orderDate' | 'userId'>) => Promise<void>;
};

export function ManualOrderDialog({ isOpen, onClose, onAddOrder }: ManualOrderDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const form = useForm<ManualOrderFormValues>({
    resolver: zodResolver(manualOrderSchema),
    defaultValues: {
      customerName: '',
      contactNumber: '',
      weight: undefined,
      total: undefined,
      isPaid: undefined,
    },
  });

  const watchedWeight = form.watch('weight');
  const isPaid = form.watch('isPaid');

  const { loads, distribution } = useMemo(() => {
    let weight = watchedWeight || 0;
    if (weight > 75) weight = 75;
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
  }, [loads, form])

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseFloat(e.target.value);
    if (value > 75) {
      value = 75;
    }
    form.setValue('weight', value, { shouldValidate: true });
  }

  const onSubmit = async (data: ManualOrderFormValues) => {
    setIsSaving(true);
    const initialStatus = 'Order Placed';
    const newOrder: Omit<Order, 'id' | 'orderDate' | 'userId'> = {
      customerName: data.customerName,
      contactNumber: data.contactNumber || 'N/A',
      load: loads,
      weight: data.weight,
      status: initialStatus,
      total: data.total,
      isPaid: data.isPaid || false,
      servicePackage: 'package1',
      distance: 0,
      statusHistory: [{ status: initialStatus, timestamp: new Date() }],
    };
    await onAddOrder(newOrder);
    setIsSaving(false);
    form.reset();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) form.reset(); onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Manual Order</DialogTitle>
          <DialogDescription>
            Enter the details for the new order.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div className="form-group">
            <Input
              id="customerName"
              placeholder=" "
              {...form.register('customerName')}
              disabled={isSaving}
              className="form-input"
            />
            <Label htmlFor="customerName" className="form-label">Customer Name</Label>
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
              className="form-input"
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
                  onChange={(e) => {
                    handleWeightChange(e)
                    field.onChange(e);
                  }}
                  value={field.value || ''}
                  disabled={isSaving}
                  className="form-input text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
              )}
            />
            <Label htmlFor="weight" className="form-label">Total Weight (kg)</Label>
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
                name="total"
                control={form.control}
                render={({ field }) => (
                     <Input
                        id="total"
                        type="number"
                        step="0.01"
                        placeholder=" "
                        {...field}
                        value={field.value || ''}
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
          
          <div className="space-y-2 text-center">
            <Label>Payment Status</Label>
            <div className="flex justify-center gap-2">
                <Button
                    type="button"
                    onClick={() => form.setValue('isPaid', true)}
                    className={cn(
                        "w-24",
                        isPaid === true
                        ? 'bg-green-500 hover:bg-green-600'
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                    )}
                    disabled={isSaving}
                >
                    Paid
                </Button>
                <Button
                    type="button"
                    onClick={() => form.setValue('isPaid', false)}
                     className={cn(
                        "w-24",
                        isPaid === false
                        ? 'bg-red-500 hover:bg-red-600'
                        : 'bg-gray-300 hover:bg-gray-400 text-gray-800'
                    )}
                    disabled={isSaving}
                >
                    Unpaid
                </Button>
            </div>
          </div>


          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { form.reset(); onClose(); }} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving || isPaid === undefined}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
