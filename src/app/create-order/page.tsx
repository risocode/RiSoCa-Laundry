'use client';
import { Suspense } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { OrderForm } from '@/components/order-form';
import { Loader2, ShoppingBag } from 'lucide-react';

function CreateOrderForm() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <PromoBanner />
          <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
            <div className="container mx-auto px-4 py-6 sm:py-8">
              <div className="w-full max-w-4xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Create New Order</h1>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                    Select your service package and provide order details to get started. We'll calculate the price instantly.
                  </p>
                </div>

                {/* Order Form */}
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
