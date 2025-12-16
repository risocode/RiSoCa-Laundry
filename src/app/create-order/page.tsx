
'use client';
import { Suspense } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { OrderForm } from '@/components/order-form';
import { Loader2 } from 'lucide-react';

function CreateOrderForm() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
            <div className="container mx-auto px-4 py-4 sm:py-6 flex items-start justify-center min-h-full">
              <div className="w-full max-w-2xl my-auto">
                <OrderForm />
              </div>
            </div>
          </main>
          <AppFooter />
        </div>
    )
}

export default function CreateOrderPage() {
  return (
      <Suspense fallback={<div className="h-screen w-screen bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <CreateOrderForm />
      </Suspense>
  );
}
