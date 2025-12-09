'use client';

import { useForm } from 'react-hook-form';
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
import { Loader2 } from 'lucide-react';
import { useState } from 'react';

const manualOrderSchema = z.object({
  customerName: z.string().min(2, 'Name is required.'),
  contactNumber: z.string().optional(),
  load: z.coerce.number().min(0.1, 'Load must be greater than 0.'),
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
      load: undefined,
      weight: undefined,
      total: undefined,
      isPaid: false,
    },
  });

  const onSubmit = async (data: ManualOrderFormValues) => {
    setIsSaving(true);
    const initialStatus = 'Order Placed';
    const newOrder: Omit<Order, 'id' | 'orderDate' | 'userId'> = {
      customerName: data.customerName,
      contactNumber: data.contactNumber || 'N/A',
      load: data.load,
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
    <Dialog open={isOpen} onOpenChange={onClose}>
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
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="load">Load</Label>
              <Input
                id="load"
                type="number"
                step="1"
                placeholder="e.g., 1"
                {...form.register('load')}
                disabled={isSaving}
                className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
               {form.formState.errors.load && (
                <p className="text-xs text-destructive">{form.formState.errors.load.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="weight">Weight (kg)</Label>
              <Input
                id="weight"
                type="number"
                step="0.1"
                placeholder="e.g., 7.5"
                {...form.register('weight')}
                disabled={isSaving}
                className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
              />
              {form.formState.errors.weight && (
                <p className="text-xs text-destructive">{form.formState.errors.weight.message}</p>
              )}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="total">Price to Pay (₱)</Label>
            <Input
              id="total"
              type="number"
              step="0.01"
              placeholder="e.g., 180"
              {...form.register('total')}
              disabled={isSaving}
              className="text-center [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
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
            <Button type="button" variant="outline" onClick={onClose} disabled={isSaving}>
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
