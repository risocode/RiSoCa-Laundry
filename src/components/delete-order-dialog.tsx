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
import { Loader2, AlertTriangle } from 'lucide-react';
import { cn } from '@/lib/utils';

type DeleteOrderDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  orderId: string;
};

export function DeleteOrderDialog({
  isOpen,
  onClose,
  onConfirm,
  orderId,
}: DeleteOrderDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmText, setConfirmText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setConfirmText('');
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (confirmText.toLowerCase() !== 'delete') {
      return;
    }
    setIsProcessing(true);
    try {
      await onConfirm();
      setConfirmText('');
      onClose();
    } catch (error) {
      console.error('Delete order error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  const isConfirmValid = confirmText.toLowerCase() === 'delete';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Delete Order
          </DialogTitle>
          <DialogDescription className="text-xs">
            This action cannot be undone. This will permanently delete order <span className="font-semibold text-foreground">{orderId}</span> and all associated data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="confirm-delete" className="text-sm font-medium">
              Type <span className="font-bold text-destructive">delete</span> to confirm:
            </Label>
            <Input
              id="confirm-delete"
              type="text"
              value={confirmText}
              onChange={(e) => setConfirmText(e.target.value)}
              disabled={isProcessing}
              placeholder="Type 'delete' to confirm"
              className={cn(
                "h-10",
                confirmText && !isConfirmValid && "border-destructive focus-visible:ring-destructive"
              )}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && isConfirmValid && !isProcessing) {
                  handleConfirm();
                }
              }}
            />
            {confirmText && !isConfirmValid && (
              <p className="text-xs text-destructive">
                Please type "delete" exactly to confirm deletion.
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 h-10 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || !isConfirmValid}
              variant="destructive"
              className="flex-1 h-10 text-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Order'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
