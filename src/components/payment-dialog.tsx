'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type PaymentDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (amountPaid: number, balance: number) => Promise<void>;
  orderTotal: number;
  currentBalance?: number;
  orderId: string;
};

export function PaymentDialog({
  isOpen,
  onClose,
  onConfirm,
  orderTotal,
  currentBalance,
  orderId,
}: PaymentDialogProps) {
  const [amountPaid, setAmountPaid] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  // Calculate amount due (use current balance if it exists and is > 0, otherwise use total)
  // For unpaid orders, if balance is 0 or undefined, use the order total
  const amountDue = (currentBalance !== undefined && currentBalance > 0) ? currentBalance : orderTotal;
  
  // Calculate change or balance
  const numericAmountPaid = parseFloat(amountPaid) || 0;
  const change = numericAmountPaid > amountDue ? numericAmountPaid - amountDue : 0;
  const balance = numericAmountPaid < amountDue ? amountDue - numericAmountPaid : 0;

  useEffect(() => {
    if (!isOpen) {
      setAmountPaid('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (numericAmountPaid <= 0) {
      return;
    }
    setIsProcessing(true);
    try {
      await onConfirm(numericAmountPaid, balance);
      setAmountPaid('');
      onClose();
    } catch (error) {
      console.error('Payment error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Process Payment - {orderId}</DialogTitle>
          <DialogDescription>
            Enter the amount received from the customer
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Amount Due */}
          <div className="space-y-2">
            <Label>Amount Due</Label>
            <div className="flex items-center justify-between p-3 bg-muted rounded-md">
              <span className="text-sm font-medium">₱{amountDue.toFixed(2)}</span>
            </div>
          </div>

          {/* Amount Paid Input */}
          <div className="space-y-2">
            <Label htmlFor="amountPaid">Amount Paid</Label>
            <Input
              id="amountPaid"
              type="number"
              step="0.01"
              min="0"
              value={amountPaid}
              onChange={(e) => setAmountPaid(e.target.value)}
              placeholder="0.00"
              className="text-lg font-semibold"
              disabled={isProcessing}
              autoFocus
            />
          </div>

          {/* Change Display */}
          {change > 0 && (
            <div className="space-y-2">
              <Label className="text-green-600 font-medium">Change</Label>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  ₱{change.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Balance Display */}
          {balance > 0 && (
            <div className="space-y-2">
              <Label className="text-red-600 font-medium">Remaining Balance</Label>
              <div className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950 rounded-md border border-red-200 dark:border-red-800">
                <span className="text-sm font-semibold text-red-700 dark:text-red-300">
                  ₱{balance.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Summary when fully paid */}
          {balance === 0 && change === 0 && numericAmountPaid > 0 && (
            <div className="space-y-2">
              <Label className="text-green-600 font-medium">Status</Label>
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-md border border-green-200 dark:border-green-800">
                <span className="text-sm font-medium text-green-700 dark:text-green-300">
                  Fully Paid
                </span>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || numericAmountPaid <= 0}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                'Done'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

