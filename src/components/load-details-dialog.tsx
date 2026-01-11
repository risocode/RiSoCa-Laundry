'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Layers, Edit2, Check, X, Loader2 } from 'lucide-react';
import type { Order } from './order-list/types';
import { cn } from '@/lib/utils';

type LoadDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  onUpdateOrder: (order: Order) => Promise<void>;
};

export function LoadDetailsDialog({
  isOpen,
  onClose,
  order,
  onUpdateOrder,
}: LoadDetailsDialogProps) {
  const [editingLoadIndex, setEditingLoadIndex] = useState<number | null>(null);
  const [editingPieceValue, setEditingPieceValue] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadPieces, setLoadPieces] = useState<(number | null)[]>([]);

  // Initialize loadPieces array when dialog opens or order changes
  useEffect(() => {
    if (isOpen && order) {
      const pieces: (number | null)[] = [];
      for (let i = 0; i < order.load; i++) {
        pieces.push(order.loadPieces?.[i] ?? null);
      }
      setLoadPieces(pieces);
    }
  }, [isOpen, order]);

  const handleEditStart = (loadIndex: number) => {
    setEditingLoadIndex(loadIndex);
    setEditingPieceValue(
      loadPieces[loadIndex] !== null && loadPieces[loadIndex] !== undefined
        ? String(loadPieces[loadIndex])
        : ''
    );
  };

  const handleEditCancel = () => {
    setEditingLoadIndex(null);
    setEditingPieceValue('');
  };

  const handleSave = async (loadIndex: number) => {
    setIsSaving(true);
    try {
      const numericValue =
        editingPieceValue.trim() === ''
          ? null
          : Number(editingPieceValue);
      
      if (numericValue !== null && (isNaN(numericValue) || numericValue < 0)) {
        // Invalid number, reset to current value
        handleEditCancel();
        setIsSaving(false);
        return;
      }

      const newLoadPieces = [...loadPieces];
      newLoadPieces[loadIndex] = numericValue;

      // Clean up array: if all are null, set to undefined, otherwise keep array with nulls
      const hasAnyPieces = newLoadPieces.some(
        (p) => p !== null && p !== undefined
      );

      const updatedOrder: Order = {
        ...order,
        loadPieces: hasAnyPieces ? newLoadPieces : undefined,
      };

      await onUpdateOrder(updatedOrder);
      setLoadPieces(newLoadPieces);
      setEditingLoadIndex(null);
      setEditingPieceValue('');
    } catch (error) {
      console.error('Error saving load pieces:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Get employee names for display
  const employeeDisplayText = order.assignedEmployeeIds?.length
    ? order.assignedEmployeeIds.length === 1
      ? '1 employee'
      : `${order.assignedEmployeeIds.length} employees`
    : order.assignedEmployeeId
    ? '1 employee'
    : 'No employees assigned';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[500px]">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Load Details - {order.id}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Total: {order.load} load{order.load > 1 ? 's' : ''} • {employeeDisplayText}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 py-4">
          {Array.from({ length: order.load }, (_, i) => i + 1).map(
            (loadNum) => {
              const loadIndex = loadNum - 1;
              const pieceCount = loadPieces[loadIndex];
              const isEditing = editingLoadIndex === loadIndex;

              return (
                <div
                  key={loadNum}
                  className={cn(
                    'flex items-center justify-between p-3 border rounded-md transition-colors',
                    isEditing
                      ? 'bg-primary/5 border-primary'
                      : 'bg-muted/30 hover:bg-muted/50'
                  )}
                >
                  <div className="flex items-center gap-3 flex-1">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10 text-primary font-semibold text-sm flex-shrink-0">
                      {loadNum}
                    </div>
                    <div className="flex flex-col flex-1 min-w-0">
                      <span className="font-medium text-sm">Load {loadNum}</span>
                      {isEditing ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            type="number"
                            min="0"
                            step="1"
                            value={editingPieceValue}
                            onChange={(e) => setEditingPieceValue(e.target.value)}
                            placeholder="Enter pieces"
                            className="h-8 text-xs w-24"
                            disabled={isSaving}
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                handleSave(loadIndex);
                              } else if (e.key === 'Escape') {
                                e.preventDefault();
                                handleEditCancel();
                              }
                            }}
                          />
                          <span className="text-xs text-muted-foreground">
                            pcs
                          </span>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {pieceCount !== null && pieceCount !== undefined ? (
                            `${pieceCount} ${pieceCount === 1 ? 'piece' : 'pieces'}`
                          ) : (
                            <span className="italic">No piece count recorded</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {isEditing ? (
                      <>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={() => handleSave(loadIndex)}
                          disabled={isSaving}
                        >
                          {isSaving ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin" />
                          ) : (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          )}
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          onClick={handleEditCancel}
                          disabled={isSaving}
                        >
                          <X className="h-3.5 w-3.5 text-red-600" />
                        </Button>
                      </>
                    ) : (
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7 hover:bg-primary/10 hover:text-primary"
                        onClick={() => handleEditStart(loadIndex)}
                        title="Edit piece count"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </div>
              );
            }
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
