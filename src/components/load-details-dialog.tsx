'use client';

import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Layers, Check, X, Loader2, AlertCircle } from 'lucide-react';
import type { Order } from './order-list/types';
import type { Employee, LoadCompletionData } from './employee-salary/types';
import { cn } from '@/lib/utils';
import { useEmployees } from '@/hooks/use-employees';
import { format, addDays } from 'date-fns';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

type LoadDetailsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  order: Order;
  date: Date;
  employeeId: string;
  loadCompletion?: LoadCompletionData;
  onSave: (loadCompletion: LoadCompletionData) => Promise<void>;
};

export function LoadDetailsDialog({
  isOpen,
  onClose,
  order,
  date,
  employeeId,
  loadCompletion,
  onSave,
}: LoadDetailsDialogProps) {
  const [isSaving, setIsSaving] = useState(false);
  const [loadStatuses, setLoadStatuses] = useState<boolean[]>([]); // true = done, false = not done
  const [nextDayEmployeeId, setNextDayEmployeeId] = useState<string | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingLoadIndex, setPendingLoadIndex] = useState<number | null>(null);
  const { employees, loading: loadingEmployees } = useEmployees();

  // Initialize load statuses when dialog opens
  useEffect(() => {
    if (isOpen && order) {
      const orderCompletion = loadCompletion?.[order.id];
      const statuses: boolean[] = [];
      
      // Initialize all loads as done (true) by default
      for (let i = 0; i < order.load; i++) {
        const loadNum = i + 1; // 1-based index
        if (orderCompletion?.incomplete_loads?.includes(loadNum)) {
          statuses.push(false); // Not done
        } else {
          statuses.push(true); // Done
        }
      }
      
      setLoadStatuses(statuses);
      setNextDayEmployeeId(orderCompletion?.next_day_employee_id || null);
    }
  }, [isOpen, order, loadCompletion]);

  const handleLoadToggle = (loadIndex: number) => {
    const currentStatus = loadStatuses[loadIndex];
    const newStatus = !currentStatus;
    
    // If unchecking (marking as not done), show confirmation dialog
    if (currentStatus && !newStatus) {
      setPendingLoadIndex(loadIndex);
      setShowConfirmDialog(true);
    } else {
      // If checking (marking as done), update immediately
      const newStatuses = [...loadStatuses];
      newStatuses[loadIndex] = newStatus;
      setLoadStatuses(newStatuses);
    }
  };

  const handleConfirmUncheck = () => {
    if (pendingLoadIndex !== null) {
      const newStatuses = [...loadStatuses];
      newStatuses[pendingLoadIndex] = false;
      setLoadStatuses(newStatuses);
      setPendingLoadIndex(null);
    }
    setShowConfirmDialog(false);
  };

  const handleCancelUncheck = () => {
    setPendingLoadIndex(null);
    setShowConfirmDialog(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const incompleteLoads: number[] = [];
      const completedLoads: number[] = [];
      
      loadStatuses.forEach((isDone, index) => {
        const loadNum = index + 1; // 1-based index
        if (isDone) {
          completedLoads.push(loadNum);
        } else {
          incompleteLoads.push(loadNum);
        }
      });

      const completionData: LoadCompletionData = {
        ...loadCompletion,
        [order.id]: {
          completed_loads: completedLoads,
          incomplete_loads: incompleteLoads,
          next_day_employee_id: incompleteLoads.length > 0 ? nextDayEmployeeId : null,
        },
      };

      await onSave(completionData);
      onClose();
    } catch (error) {
      console.error('Error saving load completion:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const hasIncompleteLoads = loadStatuses.some(status => !status);
  const hasChanges = () => {
    const orderCompletion = loadCompletion?.[order.id];
    if (!orderCompletion && loadStatuses.every(s => s)) {
      // All done, no existing data = no changes
      return false;
    }
    const currentIncomplete = loadStatuses
      .map((status, index) => (!status ? index + 1 : null))
      .filter((num): num is number => num !== null);
    const currentCompleted = loadStatuses
      .map((status, index) => (status ? index + 1 : null))
      .filter((num): num is number => num !== null);
    
    const existingIncomplete = orderCompletion?.incomplete_loads || [];
    const existingCompleted = orderCompletion?.completed_loads || [];
    const existingNextDay = orderCompletion?.next_day_employee_id || null;
    
    if (currentIncomplete.length !== existingIncomplete.length) return true;
    if (currentIncomplete.some(load => !existingIncomplete.includes(load))) return true;
    if (nextDayEmployeeId !== existingNextDay) return true;
    
    return false;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader className="pb-2">
          <DialogTitle className="text-base sm:text-lg flex items-center gap-2">
            <Layers className="h-5 w-5 text-primary" />
            Load Completion - {order.id}
          </DialogTitle>
          <DialogDescription className="text-xs">
            Total: {order.load} load{order.load > 1 ? 's' : ''} • Date: {format(date, 'MMM dd, yyyy')}
          </DialogDescription>
        </DialogHeader>
        <Accordion type="single" collapsible className="w-full space-y-2">
          {Array.from({ length: order.load }, (_, i) => i + 1).map(
            (loadNum) => {
              const loadIndex = loadNum - 1;
              const isDone = loadStatuses[loadIndex] ?? true;

              return (
                <AccordionItem
                  key={loadNum}
                  value={`load-${loadNum}`}
                  className={cn(
                    'border rounded-lg overflow-hidden',
                    !isDone
                      ? 'bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800'
                      : 'bg-muted/30'
                  )}
                >
                  <AccordionTrigger className="px-4 py-3 hover:no-underline">
                    <div className="flex items-center gap-3 w-full">
                      <div className={cn(
                        "flex items-center justify-center w-10 h-10 rounded-full font-semibold text-sm flex-shrink-0",
                        isDone
                          ? "bg-primary/10 text-primary"
                          : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400"
                      )}>
                        {loadNum}
                      </div>
                      <div className="flex flex-col items-start flex-1 min-w-0">
                        <span className="font-semibold text-sm">Load {loadNum}</span>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                          <span><span className="font-medium">ORDER #:</span> {order.id}</span>
                          <span><span className="font-medium">Date:</span> {format(order.orderDate, 'MMM dd, yyyy')}</span>
                          <span><span className="font-medium">Name:</span> {order.customerName}</span>
                        </div>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 pt-2">
                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id={`load-${loadNum}-done`}
                          checked={isDone}
                          onCheckedChange={() => handleLoadToggle(loadIndex)}
                          disabled={isSaving}
                        />
                        <label
                          htmlFor={`load-${loadNum}-done`}
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Load {loadNum} is completed
                        </label>
                      </div>
                      {!isDone && (
                        <div className="pl-6 pt-2 space-y-2 border-t">
                          <label className="text-xs font-medium text-muted-foreground">
                            Assign incomplete load to (next day):
                          </label>
                          <Select
                            value={nextDayEmployeeId || ''}
                            onValueChange={(value) => setNextDayEmployeeId(value || null)}
                            disabled={isSaving || loadingEmployees}
                          >
                            <SelectTrigger className="w-full h-8 text-xs">
                              <SelectValue placeholder="Select employee" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Unassigned</SelectItem>
                              {employees.map((emp) => (
                                <SelectItem key={emp.id} value={emp.id}>
                                  {emp.first_name || 'Employee'}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              );
            }
          )}
        </Accordion>
        {hasIncompleteLoads && (
          <div className="pt-4 border-t">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="font-medium">Note:</span>
              <span>Incomplete loads will appear in the next day's salary calculation.</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-end gap-2 pt-4 border-t">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSave}
            disabled={isSaving || !hasChanges()}
          >
            {isSaving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>
      </DialogContent>
      
      {/* Confirmation Dialog for Unchecking Load */}
      <AlertDialog 
        open={showConfirmDialog} 
        onOpenChange={(open) => {
          if (!open) {
            handleCancelUncheck();
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5 text-orange-600" />
              Transfer Load to Tomorrow?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2 pt-2">
              <p>
                This load will be marked as incomplete and transferred to <strong>{format(addDays(date, 1), 'MMM dd, yyyy')}</strong> (tomorrow).
              </p>
              <p className="text-sm text-muted-foreground">
                • The employee assignment can be edited later or tomorrow
                • This load will not count toward today's salary
                • The main order will still show {order.load} load{order.load > 1 ? 's' : ''} total
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelUncheck}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmUncheck} className="bg-orange-600 hover:bg-orange-700">
              Confirm Transfer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Dialog>
  );
}
