'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { useAuthSession } from '@/hooks/use-auth-session';
import { isEmployee, isAdmin } from '@/lib/auth-helpers';
import { Loader2 } from 'lucide-react';
import { NotFound404 } from '@/components/not-found-404';
import { ErrorBoundary } from '@/components/error-boundary';

export default function EmployeeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isUserEmployee, setIsUserEmployee] = useState(false);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    async function checkEmployeeAccess() {
      if (authLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      const [employeeStatus, adminStatus] = await Promise.all([
        isEmployee(user.id),
        isAdmin(user.id),
      ]);
      setIsUserEmployee(employeeStatus);
      setIsUserAdmin(adminStatus);
      setCheckingRole(false);

      // Allow both employees and admins to access employee pages
      // This allows admins to view employee interface when using "View as Employee"
    }

    checkEmployeeAccess();
  }, [user, authLoading, router]);

  if (authLoading || checkingRole) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  if (!isUserEmployee && !isUserAdmin) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader />
        <PromoBanner />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
          <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-full">
            <NotFound404 />
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      <div className="flex flex-col h-screen">
        <AppHeader />
        <PromoBanner />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
          <div className="container mx-auto px-4 py-4 sm:py-8 min-h-full flex items-center justify-center">
            <div className="w-full max-w-7xl">
          {children}
            </div>
          </div>
        </main>
        <AppFooter />
      </div>
    </ErrorBoundary>
  );
}

