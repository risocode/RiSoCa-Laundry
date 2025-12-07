
'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Loader2 } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (loading) return; // Wait for auth state to be determined

    // If user is not an admin and is trying to access a protected admin page, redirect to login
    if (profile?.role !== 'admin' && !isLoginPage) {
      router.push('/admin/login');
    }
    
    // If user is an admin and is on the login page, redirect to the admin dashboard
    if (profile?.role === 'admin' && isLoginPage) {
      router.push('/admin');
    }
  }, [profile, loading, router, isLoginPage]);

  // If loading and not on the login page, show a loader.
  // We allow rendering the login page even while loading to avoid a flicker.
  if (loading && !isLoginPage) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader showLogo={true} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <AppFooter />
      </div>
    );
  }
  
  // If not loading, but user is not an admin and not on the login page,
  // show a loader while redirecting.
  if (!loading && profile?.role !== 'admin' && !isLoginPage) {
    return (
       <div className="flex flex-col h-screen">
        <AppHeader showLogo={true} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <AppFooter />
      </div>
    )
  }


  // If the user is an admin, or if they are on the login page, render the children.
  return (
    <div className="flex flex-col h-screen">
      <AppHeader showLogo={true} />
      <main className="flex-1 overflow-y-auto container mx-auto px-4 py-8 flex items-center justify-center">
        {children}
      </main>
      <AppFooter />
    </div>
  );
}
