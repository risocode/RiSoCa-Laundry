'use client';

import Link from 'next/link';
import { Gift, WashingMachine } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AppHeader() {
    const pathname = usePathname();
    const isHome = pathname === '/';

  return (
    <>
      <header className="w-full border-b bg-background/95">
        {isHome ? (
          /* Homepage: Full-width promo banner with no margins */
          <div className="w-full flex items-center justify-center h-16">
            <div
              className={cn(
                "flex items-center gap-2 w-full px-4 py-2",
                "text-xs sm:text-sm"
              )}
              style={{
                background: 'linear-gradient(90deg, #ede9fe 0%, #e0e7ff 100%)',
              }}
            >
              <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700 flex-shrink-0" />
              <span className="text-purple-900 font-medium text-center flex items-center gap-1 flex-wrap justify-center flex-1">
                🎉 Special Offer! <strong>December 17, 2025</strong> — Only <strong>₱150 per load</strong>! 🎉
              </span>
            </div>
          </div>
        ) : (
          /* Other pages: Logo only */
          <div className="container flex h-16 items-center px-4">
            <Link href="/" className="flex items-center gap-2 flex-shrink-0">
              <WashingMachine className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
              <div className='flex flex-col'>
                  <span className="font-bold text-primary text-lg sm:text-xl leading-none">RKR Laundry</span>
                  <span className="text-xs sm:text-sm text-muted-foreground leading-none mt-1">Fast. Clean. Convenient.</span>
              </div>
            </Link>
          </div>
        )}
      </header>
    </>
  );
}
