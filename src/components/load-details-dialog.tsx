'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Layers } from 'lucide-react';

type LoadDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  orderId: string;
  loadCount: number;
  loadPieces?: number[];
};

export function LoadDetailsDialog({
  isOpen,
  onClose,
  orderId,
  loadCount,
  loadPieces,
}: LoadDetailsDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Load Details - {orderId}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Total: {loadCount} load{loadCount > 1 ? 's' : ''}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {Array.from({ length: loadCount }, (_, i) => i + 1).map((loadNum) => {
            const pieceCount = loadPieces?.[loadNum - 1] ?? null;
            return (
              <div
                key={loadNum}
                className="flex items-center justify-between p-3 border rounded-md bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm">
                    {loadNum}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-medium text-sm">Load {loadNum}</span>
                    {pieceCount !== null && pieceCount !== undefined ? (
                      <span className="text-xs text-muted-foreground">
                        {pieceCount} {pieceCount === 1 ? 'piece' : 'pieces'}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground italic">
                        No piece count recorded
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
}
