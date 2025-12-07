
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { OrderStatusTracker } from '@/components/order-status-tracker';

export default function OrderStatusPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center container mx-auto px-4 py-8">
        <div className="w-full max-w-2xl">
          <OrderStatusTracker />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
