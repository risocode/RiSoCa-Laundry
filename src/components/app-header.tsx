'use client';

import Link from 'next/link';
import { Download, Gift, WashingMachine } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

export function AppHeader() {
    const pathname = usePathname();
    const isHome = pathname === '/';

  return (
    <header className="w-full border-b bg-background/95">
      <div className="container flex h-16 items-center justify-between px-4 gap-4">
        {/* Logo - always visible */}
        <Link href="/" className="flex items-center gap-2 flex-shrink-0">
          <WashingMachine className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
          <div className='flex flex-col'>
              <span className="font-bold text-primary text-lg sm:text-xl leading-none">RKR Laundry</span>
              <span className="text-xs sm:text-sm text-muted-foreground leading-none mt-1">Fast. Clean. Convenient.</span>
          </div>
        </Link>

        {/* Promo Banner - centered, homepage only */}
        {isHome && (
          <div className="flex-1 flex items-center justify-center px-2">
            <div
              className={cn(
                "flex items-center gap-2 rounded-full border px-3 py-1.5 shadow-sm",
                "text-xs sm:text-sm max-w-full"
              )}
              style={{
                background: 'linear-gradient(90deg, #ede9fe 0%, #e0e7ff 100%)',
              }}
            >
              <Gift className="h-4 w-4 sm:h-5 sm:w-5 text-purple-700 flex-shrink-0" />
              <span className="text-purple-900 font-medium text-center flex items-center gap-1 flex-wrap justify-center">
                🎉 Special Offer! <strong>December 17, 2025</strong> — Only <strong>₱150 per load</strong>! 🎉
              </span>
            </div>
          </div>
        )}

        {/* Navigation - inline menu */}
        <nav className="flex items-center gap-3 flex-shrink-0">
          <Link
            href="/download-app"
            className="flex items-center gap-2 text-sm sm:text-base font-medium text-foreground hover:text-primary transition-colors whitespace-nowrap"
          >
            <Download className="h-4 w-4 sm:h-5 sm:w-5" />
            <span className="hidden sm:inline">Download APK</span>
            <span className="sm:hidden">Download</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
