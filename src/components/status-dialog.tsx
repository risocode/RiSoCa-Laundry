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
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusOptions = [
  'Order Created',
  'Order Placed',
  'Pickup Scheduled',
  'Washing',
  'Drying',
  'Folding',
  'Ready for Pick Up',
  'Out for Delivery',
  'Delivered',
  'Success',
  'Canceled',
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered':
    case 'Success':
      return 'bg-green-500';
    case 'Out for Delivery':
    case 'Ready for Pick Up':
      return 'bg-blue-500';
    case 'Washing':
    case 'Drying':
    case 'Folding':
      return 'bg-yellow-500';
    case 'Pickup Scheduled':
    case 'Order Placed':
      return 'bg-orange-500';
    case 'Order Created':
      return 'bg-gray-500';
    case 'Canceled':
      return 'bg-red-500';
    default:
      return 'bg-gray-500';
  }
};

type StatusDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (status: string) => Promise<void>;
  currentStatus: string;
  orderId: string;
};

export function StatusDialog({
  isOpen,
  onClose,
  onConfirm,
  currentStatus,
  orderId,
}: StatusDialogProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setSelectedStatus(null);
    }
  }, [isOpen]);

  const handleConfirm = async () => {
    if (!selectedStatus || selectedStatus === currentStatus) {
      return;
    }
    setIsProcessing(true);
    try {
      await onConfirm(selectedStatus);
      setSelectedStatus(null);
      onClose();
    } catch (error) {
      console.error('Status update error:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Update Order Status - {orderId}</DialogTitle>
          <DialogDescription>
            Select a new status for this order
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Current Status */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Current Status</label>
            <div className="flex items-center justify-center p-3 bg-muted rounded-md">
              <span className={cn(
                "text-sm font-semibold px-3 py-1.5 rounded text-white",
                getStatusColor(currentStatus)
              )}>
                {currentStatus}
              </span>
            </div>
          </div>

          {/* Status Options */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select New Status</label>
            <div className="grid grid-cols-2 gap-2 max-h-[300px] overflow-y-auto">
              {statusOptions.map((status) => (
                <Button
                  key={status}
                  type="button"
                  variant={selectedStatus === status ? "default" : "outline"}
                  onClick={() => setSelectedStatus(status)}
                  disabled={isProcessing || status === currentStatus}
                  className={cn(
                    "h-auto py-3 font-semibold transition-all",
                    selectedStatus === status 
                      ? "bg-primary hover:bg-primary/90 text-primary-foreground shadow-md" 
                      : status === currentStatus
                      ? "opacity-50 cursor-not-allowed"
                      : "hover:border-primary hover:text-primary"
                  )}
                >
                  {status}
                </Button>
              ))}
            </div>
          </div>

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
              disabled={isProcessing || !selectedStatus || selectedStatus === currentStatus}
              className="flex-1"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update Status'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

