'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuthSession } from '@/hooks/use-auth-session';
import { isAdmin } from '@/lib/auth-helpers';
import { SideAdBanners } from './side-ad-banners';
import { AdBanner } from './ad-banner';
import { MobileAdBanner } from './mobile-ad-banner';

export function ConditionalAds() {
  const pathname = usePathname();
  const { user, loading: authLoading } = useAuthSession();
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);
  
  // Check if user is admin
  useEffect(() => {
    async function checkAdminRole() {
      if (authLoading) return;
      if (!user) {
        setUserIsAdmin(false);
        setCheckingRole(false);
        return;
      }
      const adminStatus = await isAdmin(user.id);
      setUserIsAdmin(adminStatus);
      setCheckingRole(false);
    }
    checkAdminRole();
  }, [user, authLoading]);
  
  // Hide ads on admin and employee pages, or if user is admin on any page
  const isAdminPage = pathname?.startsWith('/admin');
  const isEmployeePage = pathname?.startsWith('/employee');
  
  // If still checking role, don't show ads to be safe
  if (checkingRole || isAdminPage || isEmployeePage || userIsAdmin) {
    return null;
  }

  return (
    <>
      <SideAdBanners />
      <AdBanner />
      <MobileAdBanner />
    </>
  );
}
