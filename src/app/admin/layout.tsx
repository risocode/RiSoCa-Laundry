import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader showLogo={true} />
      <main className="flex-1 overflow-y-auto container mx-auto px-4 py-8">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
