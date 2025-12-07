'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useUser } from '@/firebase'; // Updated import
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Loader2 } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { useFirestore } from '@/firebase';
import { useState } from 'react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isUserLoading } = useUser();
  const firestore = useFirestore();
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null);
  const router = useRouter();
  const pathname = usePathname();

  const isLoginPage = pathname === '/admin/login';

  useEffect(() => {
    if (isUserLoading) return; // Wait for auth state to be determined

    if (!user) {
      if (!isLoginPage) {
        router.push('/admin/login');
      }
      return;
    }

    const checkAdminRole = async () => {
      const userDocRef = doc(firestore, 'users', user.uid);
      const userDoc = await getDoc(userDocRef);
      if (userDoc.exists() && userDoc.data().role === 'admin') {
        setIsAdmin(true);
        if (isLoginPage) {
          router.push('/admin');
        }
      } else {
        setIsAdmin(false);
        if (!isLoginPage) {
          router.push('/admin/login');
        }
      }
    };

    checkAdminRole();

  }, [user, isUserLoading, router, isLoginPage, firestore]);

  const isLoading = isUserLoading || isAdmin === null;

  // If loading and not on the login page, show a loader.
  if (isLoading && !isLoginPage) {
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
  if (!isLoading && !isAdmin && !isLoginPage) {
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
