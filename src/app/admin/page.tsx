'use client';

import Link from 'next/link';
import { ClipboardList, DollarSign, Wallet, CreditCard } from 'lucide-react';
import { HomePageWrapper } from '@/components/home-page-wrapper';

const adminGridItems = [
  { href: '/admin/orders', label: 'Manage Orders', icon: ClipboardList },
  { href: '/admin/rates', label: 'Manage Service Rates', icon: DollarSign },
  { href: '/admin/salary', label: 'Employee Salary', icon: Wallet },
  { href: '/admin/expenses', label: 'Expenses', icon: CreditCard },
];

export default function AdminDashboardPage() {
  return (
      <HomePageWrapper gridItems={adminGridItems}>
        <div className="flex flex-col h-full select-none">
          <main className="flex-1 overflow-y-auto flex flex-col items-center container mx-auto px-4 text-center pt-8 md:pt-12">
            
            <div className="flex flex-col items-center mb-8">
                <h1 className="font-bold text-primary text-4xl md:text-5xl">Admin Dashboard</h1>
                <p className="text-lg md:text-xl text-muted-foreground mt-1">Select an option to manage the application.</p>
            </div>

            <div className="grid gap-x-2 gap-y-2 sm:gap-x-4 sm:gap-y-4 w-full max-w-sm sm:max-w-md pb-4 grid-cols-3">
              {/* Grid items will be rendered by HomePageWrapper */}
            </div>

          </main>
        </div>
      </HomePageWrapper>
  );
}
