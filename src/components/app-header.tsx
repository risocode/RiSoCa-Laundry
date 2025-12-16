'use client';

import Link from 'next/link';
import { Gift, WashingMachine, Sparkles, Clock } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { getActivePromo, type Promo } from '@/lib/api/promos';

function CountdownTimer({ promo }: { promo: Promo }) {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
    isDuringPromo?: boolean;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const promoStart = new Date(promo.start_date);
      const promoEnd = new Date(promo.end_date);
      
      let targetDate: Date;
      let isDuringPromo = false;
      
      if (now < promoStart) {
        // Before promo starts: countdown to start
        targetDate = promoStart;
      } else if (now >= promoStart && now < promoEnd) {
        // During promo: countdown to end
        targetDate = promoEnd;
        isDuringPromo = true;
      } else {
        // After promo ends: hide countdown
        return null;
      }

      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds, isDuringPromo };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, [promo]);

  if (!timeLeft) {
    return null;
  }

  const label = timeLeft.isDuringPromo ? 'Promo Ends In:' : 'Promo Starts In:';

  return (
    <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
      <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-red-700" />
      <div className="flex flex-col">
        <span className="text-[9px] sm:text-[10px] text-yellow-900 font-semibold leading-tight">
          {label}
        </span>
        <div className="flex items-center gap-1 text-[10px] sm:text-xs font-bold text-red-700">
          {timeLeft.days > 0 && (
            <>
              <span>{timeLeft.days}d</span>
              <span>:</span>
            </>
          )}
          <span>{String(timeLeft.hours).padStart(2, '0')}h</span>
          <span>:</span>
          <span>{String(timeLeft.minutes).padStart(2, '0')}m</span>
          <span>:</span>
          <span>{String(timeLeft.seconds).padStart(2, '0')}s</span>
        </div>
      </div>
    </div>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const isHome = pathname === '/';
  const [promo, setPromo] = useState<Promo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPromo = async () => {
      const { data } = await getActivePromo();
      setPromo(data);
      setLoading(false);
    };

    fetchPromo();
    // Refresh every minute to check for new/ended promos
    const interval = setInterval(fetchPromo, 60000);

    return () => clearInterval(interval);
  }, []);

  const now = new Date();
  const hidePromoBanner = loading || !promo || now >= new Date(promo.end_date);

  return (
    <>
      <header className="w-full border-b bg-background/95">
        {isHome && !hidePromoBanner ? (
          /* Homepage: Full-width promo banner with no margins */
          <div className="w-full flex items-center justify-center h-auto relative overflow-hidden">
            {/* Animated background gradient */}
            <div 
              className="absolute inset-0 opacity-100"
              style={{
                background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 15%, #fbbf24 30%, #f59e0b 45%, #dc2626 60%, #b91c1c 75%, #991b1b 90%, #7c2d12 100%)',
                backgroundSize: '200% 200%',
                animation: 'gradientShift 8s ease infinite',
              }}
            />
            
            {/* Sparkle overlay */}
            <div className="absolute inset-0 opacity-30">
              <div className="absolute top-2 left-[10%] animate-pulse">
                <Sparkles className="h-3 w-3 text-yellow-300" />
              </div>
              <div className="absolute top-1 left-[30%] animate-pulse delay-75">
                <Sparkles className="h-2 w-2 text-yellow-200" />
              </div>
              <div className="absolute top-3 left-[50%] animate-pulse delay-150">
                <Sparkles className="h-3 w-3 text-yellow-300" />
              </div>
              <div className="absolute top-1 left-[70%] animate-pulse delay-200">
                <Sparkles className="h-2 w-2 text-yellow-200" />
              </div>
              <div className="absolute top-2 left-[90%] animate-pulse delay-300">
                <Sparkles className="h-3 w-3 text-yellow-300" />
              </div>
            </div>

            <div
              className={cn(
                "flex items-center gap-2 sm:gap-3 w-full px-4 py-3 relative z-10",
                "text-xs sm:text-sm"
              )}
            >
              <div
                className={cn(
                  "flex items-center gap-2 sm:gap-3 rounded-lg border-2 border-yellow-400/50 px-3 sm:px-4 py-2 shadow-lg w-full",
                  "bg-gradient-to-r from-yellow-50 via-orange-50 to-red-50",
                  "backdrop-blur-sm"
                )}
                style={{
                  boxShadow: '0 4px 20px rgba(251, 191, 36, 0.4), 0 0 40px rgba(239, 68, 68, 0.2)',
                }}
              >
                {/* Shimmer effect */}
                <div 
                  className="absolute inset-0 -translate-x-full animate-shimmer"
                  style={{
                    background: 'linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.4), transparent)',
                  }}
                />
                
                {/* Limited Time Badge with Countdown */}
                <div className="flex flex-col items-center gap-1.5 sm:gap-2 flex-shrink-0">
                  <div className="bg-gradient-to-r from-red-600 to-orange-600 text-white px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider shadow-md animate-pulse">
                    Once a Year Only!
                  </div>
                  <CountdownTimer promo={promo} />
                  {/* Date for mobile only */}
                  <span className="text-yellow-900 font-semibold text-xs sm:text-sm text-center sm:hidden">
                    <strong className="text-red-700">{promo.display_date}</strong>
                  </span>
                </div>

                {/* Gift Icon with animation */}
                <div className="flex-shrink-0 animate-bounce" style={{ animationDuration: '2s' }}>
                  <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 drop-shadow-lg" fill="currentColor" />
                </div>

                {/* Main Text */}
                <div className="flex flex-col items-center gap-1 sm:gap-2 flex-1 w-full min-w-0">
                  <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
                    <span className="text-yellow-900 font-bold text-xs sm:text-sm">
                      ✨ <strong className="text-red-700 text-sm sm:text-base">Special Offer!</strong> ✨
                    </span>
                    <span className="text-yellow-900 font-bold text-xs sm:text-sm">
                      — Only <strong className="text-red-700 text-base sm:text-lg">₱{promo.price_per_load} per load</strong>! 🎉
                    </span>
                  </div>
                  {/* Date for desktop only - below Special Offer */}
                  <span className="text-yellow-900 font-semibold text-xs sm:text-sm text-center hidden sm:block">
                    <strong className="text-red-700">{promo.display_date}</strong>
                  </span>
                </div>

                {/* Right side sparkle */}
                <div className="flex-shrink-0 animate-pulse">
                  <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
                </div>
              </div>
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
