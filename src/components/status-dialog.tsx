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
  'Partial Complete',
  'Canceled',
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Delivered':
    case 'Success':
      return 'bg-green-500';
    case 'Partial Complete':
      return 'bg-orange-400';
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
      <DialogContent className="w-[95vw] max-w-[500px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg">Update Status</DialogTitle>
          <DialogDescription className="text-xs">
            {orderId} • Current: <span className={cn("font-semibold px-2 py-0.5 rounded text-white text-xs", getStatusColor(currentStatus))}>{currentStatus}</span>
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-2">
          {/* Status Options */}
          <div className="grid grid-cols-2 gap-2 max-h-[50vh] overflow-y-auto">
            {statusOptions.map((status) => (
              <Button
                key={status}
                type="button"
                variant={selectedStatus === status ? "default" : "outline"}
                onClick={() => setSelectedStatus(status)}
                disabled={isProcessing || status === currentStatus}
                className={cn(
                  "h-9 py-1.5 px-3 text-xs font-medium transition-all",
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

          {/* Action Buttons */}
          <div className="flex gap-2 pt-1">
            <Button
              variant="outline"
              onClick={onClose}
              disabled={isProcessing}
              className="flex-1 h-9 text-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isProcessing || !selectedStatus || selectedStatus === currentStatus}
              className="flex-1 h-9 text-sm"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Updating...
                </>
              ) : (
                'Update'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

