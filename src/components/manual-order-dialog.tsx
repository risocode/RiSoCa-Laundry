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
import { Switch } from '@/components/ui/switch';
import type { Order } from './order-list';
import { Loader2, Layers } from 'lucide-react';
import { useState, useMemo, useEffect } from 'react';
import { Separator } from './ui/separator';

const manualOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required.'),
  contactNumber: z.string().optional(),
  weight: z.coerce.number().min(0.1, 'Weight must be greater than 0.'),
  total: z.coerce.number().min(0, 'Price must be 0 or greater.'),
  isPaid: z.boolean(),
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
      isPaid: false,
    },
  });

  const watchedWeight = form.watch('weight');

  const { loads, distribution } = useMemo(() => {
    const weight = watchedWeight || 0;
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
      isPaid: data.isPaid,
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
          <div className="space-y-2">
            <Label htmlFor="customerName">Customer Name</Label>
            <Input
              id="customerName"
              placeholder="e.g., John Doe"
              {...form.register('customerName')}
              disabled={isSaving}
            />
            {form.formState.errors.customerName && (
              <p className="text-xs text-destructive">{form.formState.errors.customerName.message}</p>
            )}
          </div>
           <div className="space-y-2">
            <Label htmlFor="contactNumber">Contact Number (Optional)</Label>
            <Input
              id="contactNumber"
              placeholder="e.g., 09123456789"
              {...form.register('contactNumber')}
              disabled={isSaving}
            />
            {form.formState.errors.contactNumber && (
              <p className="text-xs text-destructive">{form.formState.errors.contactNumber.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="weight">Total Weight (kg)</Label>
            <Input
              id="weight"
              type="number"
              step="0.1"
              placeholder="e.g., 7.5 kg"
              {...form.register('weight')}
              disabled={isSaving}
              className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            {form.formState.errors.weight && (
              <p className="text-xs text-destructive">{form.formState.errors.weight.message}</p>
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

          <div className="space-y-2">
            <Label htmlFor="total">Price to Pay (₱)</Label>
            <Controller
                name="total"
                control={form.control}
                render={({ field }) => (
                     <Input
                        id="total"
                        type="number"
                        step="0.01"
                        placeholder="e.g., 180 / Load"
                        {...field}
                        value={field.value || ''}
                        disabled={isSaving}
                        className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                )}
            />
             {form.formState.errors.total && (
              <p className="text-xs text-destructive">{form.formState.errors.total.message}</p>
            )}
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="isPaid"
              checked={form.watch('isPaid')}
              onCheckedChange={(checked) => form.setValue('isPaid', checked)}
              disabled={isSaving}
            />
            <Label htmlFor="isPaid">Mark as Paid</Label>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => { form.reset(); onClose(); }} disabled={isSaving}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSaving}>
              {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Add Order
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
