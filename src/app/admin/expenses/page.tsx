'use client';

import { ExpensesTracker } from '@/components/expenses-tracker';

export default function AdminExpensesPage() {
  return (
    <div className="w-full max-w-4xl px-2 sm:px-0">
      <div className="flex flex-col items-center text-center mb-8">
        <h1 className="text-2xl md:text-4xl font-bold text-primary">Expenses Tracker</h1>
        <p className="text-sm md:text-lg text-muted-foreground mt-2">Log and view all business expenses.</p>
      </div>
      
      <ExpensesTracker />
    </div>
  );
}
