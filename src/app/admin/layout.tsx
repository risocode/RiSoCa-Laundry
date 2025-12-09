'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { useAuthSession } from '@/hooks/use-auth-session';
import { isAdmin } from '@/lib/auth-helpers';
import { Loader2, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

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

      if (!adminStatus) {
        // Not an admin, redirect to home
        router.push('/');
      }
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
        <PromoBanner />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
          <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-full">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Access Denied
                </CardTitle>
                <CardDescription>
                  You do not have permission to access this page.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Only administrators can access the admin dashboard. If you believe this is an error, please contact support.
                </p>
              </CardContent>
            </Card>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-4 sm:py-8 min-h-full">
          {children}
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
