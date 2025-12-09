'use client';

import { useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
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
  TableFooter
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Trash2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';

const expenseSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  amount: z.coerce.number().min(0.01, 'Amount must be greater than 0'),
  date: z.date(),
});

type Expense = z.infer<typeof expenseSchema>;

const mockExpenses: Expense[] = [
  { description: 'Rent', amount: 5000, date: new Date('2024-07-01') },
  { description: 'Detergent', amount: 800, date: new Date('2024-07-05') },
  { description: 'Fabric Softener', amount: 500, date: new Date('2024-07-05') },
  { description: 'Electricity Bill', amount: 3500, date: new Date('2024-07-15') },
];

export function ExpensesTracker() {
  const { toast } = useToast();
  const [expenses, setExpenses] = useState<Expense[]>(mockExpenses);

  const { register, handleSubmit, reset, formState: { errors } } = useForm<{description: string, amount: string}>({
    defaultValues: {
      description: '',
      amount: ''
    }
  });

  const onAddExpense = (data: {description: string, amount: string}) => {
    const newExpense: Expense = {
      description: data.description,
      amount: parseFloat(data.amount),
      date: new Date(),
    };
    setExpenses(prev => [newExpense, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));
    toast({
        title: "Expense Added",
        description: `${newExpense.description} has been logged.`
    });
    reset();
  };

  const deleteExpense = (index: number) => {
    setExpenses(prev => prev.filter((_, i) => i !== index));
    toast({
        variant: 'destructive',
        title: "Expense Removed",
    });
  }

  const totalExpenses = expenses.reduce((sum, exp) => sum + exp.amount, 0);

  return (
    <div className="space-y-6">
        <Card>
            <CardHeader>
                <CardTitle>Add New Expense</CardTitle>
                <CardDescription>Log a new business expense.</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit(onAddExpense)} className="flex flex-col sm:flex-row gap-4 items-end">
                    <div className="grid w-full gap-1.5">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" placeholder="e.g., Rent, Supplies" {...register('description', { required: 'Description is required' })} />
                        {errors.description && <p className="text-xs text-destructive">{errors.description.message}</p>}
                    </div>
                    <div className="grid w-full sm:w-auto gap-1.5">
                        <Label htmlFor="amount">Amount (₱)</Label>
                        <Input id="amount" type="number" step="0.01" placeholder="0.00" {...register('amount', { required: 'Amount is required', valueAsNumber: true })}/>
                        {errors.amount && <p className="text-xs text-destructive">{errors.amount.message}</p>}
                    </div>
                    <Button type="submit" className="w-full sm:w-auto">
                        <Plus className="mr-2 h-4 w-4" /> Add Expense
                    </Button>
                </form>
            </CardContent>
        </Card>
      
        <Card>
            <CardHeader>
                <CardTitle>Expense Log</CardTitle>
                <CardDescription>A list of all recorded business expenses.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="max-h-[400px] overflow-auto">
                    <Table>
                        <TableHeader className="sticky top-0 bg-muted">
                        <TableRow>
                            <TableHead>Date</TableHead>
                            <TableHead>Description</TableHead>
                            <TableHead className="text-right">Amount</TableHead>
                            <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                        </TableHeader>
                        <TableBody>
                        {expenses.map((expense, index) => (
                            <TableRow key={index}>
                            <TableCell className="text-xs">{format(expense.date, 'PPP')}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell className="text-right">₱{expense.amount.toFixed(2)}</TableCell>
                            <TableCell className="text-center">
                                <Button variant="ghost" size="icon" onClick={() => deleteExpense(index)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                         <TableFooter className="sticky bottom-0 bg-muted/95">
                            <TableRow>
                                <TableCell colSpan={2} className="font-bold text-lg">Total Expenses</TableCell>
                                <TableCell className="text-right font-bold text-lg text-primary">₱{totalExpenses.toFixed(2)}</TableCell>
                                <TableCell />
                            </TableRow>
                        </TableFooter>
                    </Table>
                </div>
            </CardContent>
        </Card>
    </div>
  );
}
