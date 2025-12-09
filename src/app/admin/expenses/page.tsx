'use client';

import { ExpensesTracker } from '@/components/expenses-tracker';

export default function AdminExpensesPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center text-center mb-6 md:mb-8 w-full">
        <h1 className="text-2xl md:text-4xl font-bold text-primary">Expenses Tracker</h1>
        <p className="text-sm md:text-lg text-muted-foreground mt-2">Log and view all business expenses.</p>
      </div>
      
      <div className="w-full max-w-4xl">
      <ExpensesTracker />
      </div>
    </div>
  );
}
