'use client';

import { FinanceDashboard } from '@/components/finance-dashboard';

export default function AdminFinancePage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center text-center mb-6 md:mb-8 w-full">
        <h1 className="text-2xl md:text-4xl font-bold text-primary">Finance Dashboard</h1>
        <p className="text-sm md:text-lg text-muted-foreground mt-2">Track revenue, expenses, and financial performance.</p>
      </div>
      
      <div className="w-full max-w-7xl">
        <FinanceDashboard />
      </div>
    </div>
  );
}

