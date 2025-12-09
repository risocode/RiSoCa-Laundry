'use client';

import Link from 'next/link';
import { ClipboardList, DollarSign, Wallet, CreditCard } from 'lucide-react';
import { HomePageWrapper } from '@/components/home-page-wrapper';

const adminGridItems = [
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/rates', label: 'Service Rates', icon: DollarSign },
  { href: '/admin/salary', label: 'Employee Salary', icon: Wallet },
  { href: '/admin/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/admin/branches', label: 'Branches', icon: ClipboardList },
];

export default function AdminDashboardPage() {
  return (
      <HomePageWrapper gridItems={adminGridItems}>
        <div className="flex flex-col h-full select-none">
          <main className="flex-1 scrollable flex flex-col items-center container mx-auto px-4 text-center pt-8 md:pt-12 pb-14">
            
            <div className="flex flex-col items-center mb-8">
                <h1 className="font-bold text-primary text-4xl md:text-5xl">Admin Dashboard</h1>
                <p className="text-lg md:text-xl text-muted-foreground mt-1 max-w-sm">Select an option to manage the application.</p>
            </div>

            <div className="grid grid-cols-3 gap-4 w-full max-w-md">
              {/* Grid items will be rendered by HomePageWrapper */}
            </div>

          </main>
        </div>
      </HomePageWrapper>
  );
}
