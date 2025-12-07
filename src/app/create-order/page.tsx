
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { OrderForm } from '@/components/order-form';

export default function CreateOrderPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-1 overflow-y-auto pt-4 pb-20 flex items-center justify-center container mx-auto px-4">
        <div className="w-full max-w-2xl">
          <OrderForm />
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
