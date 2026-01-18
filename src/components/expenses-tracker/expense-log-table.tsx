"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Trash2, Loader2, Edit2, Check, X, CheckCircle2, Clock, Inbox } from 'lucide-react';
import { format } from 'date-fns';
import { formatCurrency } from '@/lib/utils';
import type { Expense, FilterType } from './types';

interface ExpenseLogTableProps {
  expenses: Expense[];
  filteredExpenses: Expense[];
  loading: boolean;
  filter: FilterType;
  onFilterChange: (filter: FilterType) => void;
  editingDateId: string | null;
  editingDateValue: string;
  savingDate: boolean;
  onStartEditDate: (expense: Expense) => void;
  onCancelEditDate: () => void;
  onSaveDate: (id: string) => void;
  onDelete: (id: string) => void;
  onEditingDateValueChange: (value: string) => void;
}

export function ExpenseLogTable({
  expenses,
  filteredExpenses,
  loading,
  filter,
  onFilterChange,
  editingDateId,
  editingDateValue,
  savingDate,
  onStartEditDate,
  onCancelEditDate,
  onSaveDate,
  onDelete,
  onEditingDateValueChange,
}: ExpenseLogTableProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <CardTitle>Expense Log</CardTitle>
            <CardDescription>A list of all recorded expenses.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select value={filter} onValueChange={(value) => onFilterChange(value as FilterType)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filter expenses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Expenses</SelectItem>
                <SelectItem value="pending">Pending Reimbursements</SelectItem>
                <SelectItem value="reimbursed">Reimbursed</SelectItem>
                <SelectItem value="rkr">Business Expenses (RKR)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <Loader2 className="h-12 w-12 mb-2 animate-spin" />
            <p>Loading expenses...</p>
          </div>
        ) : filteredExpenses.length > 0 ? (
          <div className="max-h-[400px] overflow-y-auto overflow-x-hidden scrollable">
            <Table>
              <TableHeader className="sticky top-0 bg-muted">
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Who</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead className="text-center">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredExpenses.map((expense) => {
                  const isPending = expense.reimbursement_status === 'pending';
                  const isReimbursed = expense.reimbursement_status === 'reimbursed';
                  
                  return (
                    <TableRow 
                      key={expense.id}
                      className={`
                        ${isPending ? 'bg-orange-50/50 dark:bg-orange-950/10' : ''}
                        ${isReimbursed ? 'bg-green-50/50 dark:bg-green-950/10' : ''}
                      `}
                    >
                      <TableCell className="text-xs">
                        {editingDateId === expense.id ? (
                          <div className="flex items-center gap-1">
                            <Input
                              type="date"
                              value={editingDateValue}
                              onChange={(e) => onEditingDateValueChange(e.target.value)}
                              className="h-8 w-[140px] text-xs"
                              disabled={savingDate}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => onSaveDate(expense.id)}
                              disabled={savingDate || (() => {
                                const originalDate = expense.incurred_on || new Date(expense.date).toISOString().slice(0, 10);
                                return editingDateValue === originalDate;
                              })()}
                            >
                              {savingDate ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Check className="h-3 w-3 text-green-600" />
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={onCancelEditDate}
                              disabled={savingDate}
                            >
                              <X className="h-3 w-3 text-destructive" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span>
                              {format(new Date(expense.incurred_on ?? expense.date!), 'PPP')}
                            </span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => onStartEditDate(expense)}
                            >
                              <Edit2 className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>{expense.title}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {expense.category || '—'}
                      </TableCell>
                      <TableCell className="font-medium">
                        {expense.expense_for || '—'}
                      </TableCell>
                      <TableCell>
                        {isPending && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-950 dark:text-orange-300">
                                  <Clock className="h-3 w-3 mr-1" />
                                  Pending
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Awaiting reimbursement</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {isReimbursed && expense.reimbursed_at && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                <Badge variant="outline" className="bg-green-100 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300">
                                  <CheckCircle2 className="h-3 w-3 mr-1" />
                                  Reimbursed
                                </Badge>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reimbursed on {format(new Date(expense.reimbursed_at), 'PPP')}</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                        {!isPending && !isReimbursed && expense.expense_for === 'RKR' && (
                          <Badge variant="outline" className="text-muted-foreground">
                            Business
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        ₱{formatCurrency(Number(expense.amount))}
                      </TableCell>
                      <TableCell className="text-center">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => onDelete(expense.id)}
                          className="h-8 w-8"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
            <Inbox className="h-12 w-12 mb-2" />
            <p>
              {filter === 'all' && 'No expenses have been logged yet.'}
              {filter === 'pending' && 'No pending reimbursements.'}
              {filter === 'reimbursed' && 'No reimbursed expenses.'}
              {filter === 'rkr' && 'No business expenses (RKR).'}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
