'use client';

import { NetIncomeDistribution } from '@/components/net-income-distribution';

export default function NetIncomeDistributionPage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center text-center mb-6 md:mb-8 w-full">
        <h1 className="text-2xl md:text-4xl font-bold text-primary">Net Income Distribution</h1>
        <p className="text-sm md:text-lg text-muted-foreground mt-2">
          View how net income is distributed among owners (Racky, Karaya, Richard).
        </p>
      </div>
      
      <div className="w-full max-w-7xl">
        <NetIncomeDistribution />
      </div>
    </div>
  );
}

