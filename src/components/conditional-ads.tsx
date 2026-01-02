'use client';

import { usePathname } from 'next/navigation';
import { SideAdBanners } from './side-ad-banners';
import { AdBanner } from './ad-banner';
import { MobileAdBanner } from './mobile-ad-banner';

export function ConditionalAds() {
  const pathname = usePathname();
  
  // Hide ads on admin and employee pages
  const isAdminPage = pathname?.startsWith('/admin');
  const isEmployeePage = pathname?.startsWith('/employee');
  
  if (isAdminPage || isEmployeePage) {
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
