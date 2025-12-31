'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useToast } from '@/hooks/use-toast';
import { addExpense, deleteExpense, fetchExpenses, updateExpense, bulkReimburseExpenses, getPendingReimbursements } from '@/lib/api/expenses';
import { useAuthSession } from '@/hooks/use-auth-session';
import { expenseSchema, type ExpenseFormValues, type FilterType, type Expense, type PendingSummary } from './expenses-tracker/types';
import { calculateExpenseTotals, filterExpenses } from './expenses-tracker/calculate-totals';
import { AddExpenseForm } from './expenses-tracker/add-expense-form';
import { PendingReimbursementsCard } from './expenses-tracker/pending-reimbursements-card';
import { ExpenseSummaryCard } from './expenses-tracker/expense-summary-card';
import { ExpenseLogTable } from './expenses-tracker/expense-log-table';
import { ReimbursementDialog } from './expenses-tracker/reimbursement-dialog';

export function ExpensesTracker() {
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthSession();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editingDateId, setEditingDateId] = useState<string | null>(null);
  const [editingDateValue, setEditingDateValue] = useState<string>('');
  const [savingDate, setSavingDate] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [bulkReimbursing, setBulkReimbursing] = useState(false);
  const [pendingSummary, setPendingSummary] = useState<PendingSummary | null>(null);
  const [reimburseDialogOpen, setReimburseDialogOpen] = useState(false);
  const [personToReimburse, setPersonToReimburse] = useState<'Racky' | 'Karaya' | 'Richard' | null>(null);
  const [personExpensesToReimburse, setPersonExpensesToReimburse] = useState<Expense[]>([]);

  const form = useForm<ExpenseFormValues>({
    resolver: zodResolver(expenseSchema),
    defaultValues: {
      title: '',
      amount: 0,
      category: '',
      expense_for: 'RKR',
      incurred_on: new Date().toISOString().slice(0, 10)
    }
  });

  const { reset } = form;

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
    loadPendingSummary();
  }, []);

  const loadPendingSummary = async () => {
    const { data } = await getPendingReimbursements();
    if (data) {
      setPendingSummary(data);
    }
  };

  const onAddExpense = async (data: ExpenseFormValues) => {
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
    loadPendingSummary();
  };

  const handleDelete = async (id: string) => {
    const expense = expenses.find(e => e.id === id);
    if (expense?.reimbursement_status === 'reimbursed') {
      const confirmed = window.confirm('This expense was reimbursed. Are you sure you want to delete it?');
      if (!confirmed) return;
    }
    const { error } = await deleteExpense(id);
    if (error) {
      toast({ variant: 'destructive', title: 'Delete failed', description: error.message });
      return;
    }
    toast({ variant: 'destructive', title: 'Expense Removed' });
    load();
    loadPendingSummary();
  };

  // Filter expenses based on selected filter
  const filteredExpenses = filterExpenses(expenses, filter);

  // Calculate totals
  const {
    totalExpenses,
    pendingTotal,
    reimbursedTotal,
    rackyTotal,
    karayaTotal,
    richardTotal,
    rkrTotal,
    pendingRacky,
    pendingKaraya,
    pendingRichard,
    pendingExpenses,
  } = calculateExpenseTotals(expenses, pendingSummary);

  const handleReimburseByPerson = async (person: 'Racky' | 'Karaya' | 'Richard') => {
    const personPendingExpenses = pendingExpenses.filter(e => e.expense_for === person);
    if (personPendingExpenses.length === 0) {
      toast({ variant: 'destructive', title: 'No pending expenses', description: `${person} has no pending reimbursements.` });
      return;
    }
    if (!user?.id) {
      toast({ variant: 'destructive', title: 'Error', description: 'User not found' });
      return;
    }
    
    // Open dialog with expense details
    setPersonToReimburse(person);
    setPersonExpensesToReimburse(personPendingExpenses);
    setReimburseDialogOpen(true);
  };

  const confirmReimbursement = async () => {
    if (!personToReimburse || personExpensesToReimburse.length === 0 || !user?.id) {
      return;
    }

    setBulkReimbursing(true);
    const expenseIds = personExpensesToReimburse.map(e => e.id);
    const personTotal = personExpensesToReimburse.reduce((sum, e) => sum + (e.amount || 0), 0);
    
    const { error } = await bulkReimburseExpenses(expenseIds, user.id);
    if (error) {
      toast({ variant: 'destructive', title: 'Reimbursement failed', description: error.message });
      setBulkReimbursing(false);
      return;
    }
    
    toast({ 
      title: `${personToReimburse}'s Expenses Reimbursed`, 
      description: `${expenseIds.length} expense(s) totaling ₱${personTotal.toFixed(2)} have been transferred to RKR.` 
    });
    
    setBulkReimbursing(false);
    setReimburseDialogOpen(false);
    setPersonToReimburse(null);
    setPersonExpensesToReimburse([]);
    load();
    loadPendingSummary();
  };

  const handleStartEditDate = (expense: Expense) => {
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

  return (
    <div className="space-y-6">
      <AddExpenseForm 
        form={form} 
        saving={saving} 
        onSubmit={onAddExpense} 
      />

      <PendingReimbursementsCard
        pendingTotal={pendingTotal}
        pendingRacky={pendingRacky}
        pendingKaraya={pendingKaraya}
        pendingRichard={pendingRichard}
        pendingExpenses={pendingExpenses}
        bulkReimbursing={bulkReimbursing}
        onReimburseByPerson={handleReimburseByPerson}
      />

      {expenses.length > 0 && (
        <ExpenseSummaryCard
          rackyTotal={rackyTotal}
          karayaTotal={karayaTotal}
          richardTotal={richardTotal}
          rkrTotal={rkrTotal}
          reimbursedTotal={reimbursedTotal}
          totalExpenses={totalExpenses}
        />
      )}

      <ExpenseLogTable
        expenses={expenses}
        filteredExpenses={filteredExpenses}
        loading={loading}
        filter={filter}
        onFilterChange={setFilter}
        editingDateId={editingDateId}
        editingDateValue={editingDateValue}
        savingDate={savingDate}
        onStartEditDate={handleStartEditDate}
        onCancelEditDate={handleCancelEditDate}
        onSaveDate={handleSaveDate}
        onDelete={handleDelete}
        onEditingDateValueChange={setEditingDateValue}
      />

      <ReimbursementDialog
        open={reimburseDialogOpen}
        onOpenChange={setReimburseDialogOpen}
        personToReimburse={personToReimburse}
        personExpensesToReimburse={personExpensesToReimburse}
        bulkReimbursing={bulkReimbursing}
        onConfirm={confirmReimbursement}
        onCancel={() => {
          setReimburseDialogOpen(false);
          setPersonToReimburse(null);
          setPersonExpensesToReimburse([]);
        }}
      />

    </div>
  );
}
