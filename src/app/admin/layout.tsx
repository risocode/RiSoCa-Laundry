'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { useAuthSession } from '@/hooks/use-auth-session';
import { isAdmin } from '@/lib/auth-helpers';
import { Loader2 } from 'lucide-react';
import { NotFound404 } from '@/components/not-found-404';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const [checkingRole, setCheckingRole] = useState(true);
  const [isUserAdmin, setIsUserAdmin] = useState(false);

  useEffect(() => {
    async function checkAdminAccess() {
      if (authLoading) return;
      
      if (!user) {
        router.push('/login');
        return;
      }

      const adminStatus = await isAdmin(user.id);
      setIsUserAdmin(adminStatus);
      setCheckingRole(false);

      // Don't redirect if not admin - just show 404
      // This allows admin menu to be visible on all pages
    }

    checkAdminAccess();
  }, [user, authLoading, router]);

  if (authLoading || checkingRole) {
    return (
      <div className="flex flex-col h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  if (!isUserAdmin) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader />
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
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-4 sm:py-8 min-h-full flex items-center justify-center">
          <div className="w-full max-w-7xl">
        {children}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
