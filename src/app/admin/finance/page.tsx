'use client';

import { FinanceDashboard } from '@/components/finance-dashboard';
import { Button } from '@/components/ui/button';
import { Share2 } from 'lucide-react';
import Link from 'next/link';

export default function AdminFinancePage() {
  return (
    <div className="w-full flex flex-col items-center">
      <div className="flex flex-col items-center text-center mb-6 md:mb-8 w-full">
        <div className="flex items-center gap-4 justify-center flex-wrap">
          <h1 className="text-2xl md:text-4xl font-bold text-primary">Finance Dashboard</h1>
          <Link href="/admin/finance/distribution">
            <Button variant="outline" className="gap-2">
              <Share2 className="h-4 w-4" />
              Net Income Distribution
            </Button>
          </Link>
        </div>
        <p className="text-sm md:text-lg text-muted-foreground mt-2">Track revenue, expenses, and financial performance.</p>
      </div>
      
      <div className="w-full max-w-7xl">
        <FinanceDashboard />
      </div>
    </div>
  );
}

