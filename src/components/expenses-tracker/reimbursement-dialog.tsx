"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CheckCircle2, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import type { Expense } from './types';
import { formatCurrency } from '@/lib/utils';

interface ReimbursementDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  personToReimburse: 'Racky' | 'Karaya' | 'Richard' | null;
  personExpensesToReimburse: Expense[];
  bulkReimbursing: boolean;
  onConfirm: () => Promise<void>;
  onCancel: () => void;
}

export function ReimbursementDialog({
  open,
  onOpenChange,
  personToReimburse,
  personExpensesToReimburse,
  bulkReimbursing,
  onConfirm,
  onCancel,
}: ReimbursementDialogProps) {
  if (!personToReimburse) return null;

  const totalAmount = personExpensesToReimburse.reduce((sum, e) => sum + (e.amount || 0), 0);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <CheckCircle2 className="h-5 w-5 text-orange-600" />
            Confirm Reimbursement for {personToReimburse}
          </DialogTitle>
          <DialogDescription>
            Review the expenses that will be reimbursed. All expenses will be transferred to RKR.
          </DialogDescription>
        </DialogHeader>
        
        {personExpensesToReimburse.length > 0 && (
          <div className="space-y-4 py-4">
            {/* Summary Header */}
            <div className="bg-orange-50 dark:bg-orange-950/20 border border-orange-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-orange-900 dark:text-orange-100">
                  Total Expenses: {personExpensesToReimburse.length}
                </span>
                <span className="text-lg font-bold text-orange-700 dark:text-orange-300">
                  ₱{formatCurrency(totalAmount)}
                </span>
              </div>
              <p className="text-xs text-orange-700 dark:text-orange-300 mt-1">
                All expenses will be transferred to RKR and counted as business expenses.
              </p>
            </div>

            {/* Expenses List */}
            <div className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2 border-b">
                <h3 className="text-sm font-semibold">Expense Details</h3>
              </div>
              <div className="max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader className="sticky top-0 bg-muted">
                    <TableRow>
                      <TableHead className="w-12">#</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {personExpensesToReimburse.map((expense, index) => (
                      <TableRow key={expense.id}>
                        <TableCell className="text-xs text-muted-foreground">
                          {index + 1}
                        </TableCell>
                        <TableCell className="text-xs">
                          {format(new Date(expense.incurred_on ?? expense.created_at!), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell className="font-medium">{expense.title}</TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {expense.category || '—'}
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          ₱{formatCurrency(Number(expense.amount))}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Total Summary */}
            <div className="bg-primary/5 border-2 border-primary/20 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-muted-foreground">
                    Total Reimbursement Amount
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {personExpensesToReimburse.length} expense{personExpensesToReimburse.length !== 1 ? 's' : ''} for {personToReimburse}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-primary">
                    ₱{formatCurrency(totalAmount)}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={onCancel}
            disabled={bulkReimbursing}
          >
            Cancel
          </Button>
          <Button 
            onClick={onConfirm}
            disabled={bulkReimbursing}
            className="bg-orange-600 hover:bg-orange-700 text-white"
          >
            {bulkReimbursing ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              <>
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Confirm Reimbursement
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
