'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Inbox, Loader2, Edit2, Check, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { addExpense, deleteExpense, fetchExpenses, updateExpense } from '@/lib/api/expenses';
import { useAuthSession } from '@/hooks/use-auth-session';

const expenseSchema = z.object({
  title: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  category: z.string().optional(),
  expense_for: z.enum(['Racky', 'Karaya', 'Richard', 'RKR'], {
    required_error: 'Please select who this expense is for',
  }),
  incurred_on: z.string().optional(),
});

export function ExpensesTracker() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthSession();
  const [expenses, setExpenses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [savingDate, setSavingDate] = useState(false);

  const { register, handleSubmit, reset, formState: { errors }, setValue, watch } = useForm<z.infer<typeof expenseSchema>>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: 0,
      category: '',
      expense_for: 'RKR',
      incurred_on: new Date().toISOString().slice(0, 10)
    }
  });

  const expenseFor = watch('expense_for');

  const load = async () => {
    setLoading(true);
    const { data, error } = await fetchExpenses();
    if (error) {
      toast({ variant: 'destructive', title: 'Load failed', description: error.message });
      setLoading(false);
      return;
    }
    setExpenses((data ?? []).map(e => ({ ...e, date: new Date(e.incurred_on ?? e.created_at) })));
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const onAddExpense = async (data: z.infer<typeof expenseSchema>) => {
    if (authLoading || !user) {
      toast({ variant: 'destructive', title: 'Please log in', description: 'Admin sign-in required.' });
      return;
    }
    setSaving(true);
    const { error } = await addExpense({
      title: data.title,
      amount: data.amount,
      category: data.category ?? null,
      expense_for: data.expense_for,
      incurred_on: data.incurred_on || new Date().toISOString().slice(0, 10),
    });
    if (error) {
      toast({ variant: 'destructive', title: 'Save failed', description: error.message });
      setSaving(false);
      return;
    }
    toast({ title: 'Expense Added', description: `${data.title} has been logged.` });
    reset();
    setSaving(false);
    load();
  };

  const handleDelete = async (id: string) => {
    const { error } = await deleteExpense(id);
    if (error) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
      return;
    }
    toast({ variant: 'destructive', title: 'Expense Removed' });
    load();
  };

  const handleStartEditDate = (expense: any) => {
    setEditingDateId(expense.id);
    setEditingDateValue(expense.incurred_on || new Date(expense.date).toISOString().slice(0, 10));
  };

  const handleCancelEditDate = () => {
    setEditingDateId(null);
    setEditingDateValue('');
  };

  const handleSaveDate = async (id: string) => {
    if (!editingDateValue) {
      toast({ variant: 'destructive', title: 'Date required', description: 'Please enter a valid date.' });
      return;
    }
    setSavingDate(true);
    const { error } = await updateExpense(id, { incurred_on: editingDateValue });
    if (error) {
      toast({ variant: 'destructive', title: 'Update failed', description: error.message });
      setSavingDate(false);
      return;
    }
    toast({ title: 'Date Updated', description: 'Expense date has been updated.' });
    setEditingDateId(null);
    setEditingDateValue('');
    setSavingDate(false);
    load();
  };

  const totalExpenses = expenses.reduce((sum, exp) => sum + (exp.amount ?? 0), 0);
  
  // Calculate totals per person
  const totalsByPerson = expenses.reduce((acc, exp) => {
    const person = exp.expense_for || 'Unknown';
    acc[person] = (acc[person] || 0) + (exp.amount ?? 0);
    return acc;
  }, {} as Record<string, number>);

  const rackyTotal = totalsByPerson['Racky'] || 0;
  const karayaTotal = totalsByPerson['Karaya'] || 0;
  const richardTotal = totalsByPerson['Richard'] || 0;
  const rkrTotal = totalsByPerson['RKR'] || 0;

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Add New Expense</CardTitle>
                <CardDescription>Log a new business expense.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onAddExpense)} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="grid w-full sm:w-48 gap-1.5">
                        <Label htmlFor="title">Description</Label>
                        <Input id="title" placeholder="e.g., Rent, Supplies" {...register('title', { required: 'Description is required' })} />
                        {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
                    </div>
                    <div className="grid w-full sm:w-auto gap-1.5">
                        <Label htmlFor="amount">Amount (₱)</Label>
                        <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount', { required: 'Amount is required', valueAsNumber: true })} />
                        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                    </div>
                    <div className="grid w-full sm:w-auto gap-1.5">
                        <Label htmlFor="category">Category (optional)</Label>
                        <Input id="category" placeholder="e.g., utilities" {...register('category')} />
                    </div>
                    <div className="grid w-full sm:w-auto gap-1.5">
                        <Label htmlFor="expense_for">Expense By</Label>
                        <Select value={expenseFor} onValueChange={(value) => setValue('expense_for', value as 'Racky' | 'Karaya' | 'Richard' | 'RKR')}>
                            <SelectTrigger id="expense_for" className="w-full sm:w-[140px]">
                                <SelectValue placeholder="Select person" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Racky">Racky</SelectItem>
                                <SelectItem value="Karaya">Karaya</SelectItem>
                                <SelectItem value="Richard">Richard</SelectItem>
                                <SelectItem value="RKR">RKR</SelectItem>
                            </SelectContent>
                        </Select>
                        {errors.expense_for && <p className="text-xs text-destructive">{errors.expense_for.message}</p>}
                    </div>
                    <div className="grid w-full sm:w-auto gap-1.5">
                        <Label htmlFor="incurred_on">Date</Label>
                        <Input id="incurred_on" type="date" {...register('incurred_on')} />
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        <Plus className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </form>
            </CardContent>
        </Card>

        {/* Summary Card */}
        {expenses.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Expense Summary</CardTitle>
              <CardDescription>Personal expenses (reimbursement) and business expenses (RKR)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground">Racky:</span>
                  <span className="font-bold text-primary">₱{rackyTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground">Karaya:</span>
                  <span className="font-bold text-primary">₱{karayaTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground">Richard:</span>
                  <span className="font-bold text-primary">₱{richardTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-muted-foreground">RKR:</span>
                  <span className="font-bold text-orange-600">₱{rkrTotal.toFixed(2)}</span>
                </div>
                <div className="flex items-center gap-2 ml-auto border-l pl-4">
                  <span className="font-semibold text-muted-foreground">Total:</span>
                  <span className="font-bold text-lg text-primary">₱{totalExpenses.toFixed(2)}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      
        <Card>
            <CardHeader>
                <CardTitle>Expense Log</CardTitle>
                <CardDescription>A list of all recorded business expenses.</CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                  <Loader2 className="h-12 w-12 mb-2 animate-spin" />
                  <p>Loading expenses...</p>
                </div>
              ) : expenses.length > 0 ? (
                <div className="max-h-[400px] overflow-y-auto overflow-x-hidden scrollable">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead>Category</TableHead>
                            <TableHead>Who</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {expenses.map((expense) => (
                            <TableRow key={expense.id}>
                            <TableCell className="text-xs">
                              {editingDateId === expense.id ? (
                                <div className="flex items-center gap-1">
                                  <Input
                                    type="date"
                                    value={editingDateValue}
                                    onChange={(e) => setEditingDateValue(e.target.value)}
                                    className="h-8 w-[140px] text-xs"
                                    disabled={savingDate}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => handleSaveDate(expense.id)}
                                    disabled={savingDate}
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
                                    onClick={handleCancelEditDate}
                                    disabled={savingDate}
                                  >
                                    <X className="h-3 w-3 text-destructive" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center gap-1">
                                  <span>{format(new Date(expense.incurred_on ?? expense.date), 'PPP')}</span>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => handleStartEditDate(expense)}
                                  >
                                    <Edit2 className="h-3 w-3 text-muted-foreground" />
                                  </Button>
                                </div>
                              )}
                            </TableCell>
                            <TableCell>{expense.title}</TableCell>
                            <TableCell className="text-xs text-muted-foreground">{expense.category || '—'}</TableCell>
                            <TableCell className="font-medium">{expense.expense_for || '—'}</TableCell>
                            <TableCell className="text-right">₱{Number(expense.amount).toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" onClick={() => handleDelete(expense.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
                  <Inbox className="h-12 w-12 mb-2" />
                  <p>No expenses have been logged yet.</p>
                </div>
              )}
            </CardContent>
        </Card>
    </div>
  );
}
