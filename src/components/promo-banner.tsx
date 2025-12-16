'use client';

import { Gift, Sparkles, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

function CountdownTimer() {
  const [timeLeft, setTimeLeft] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const promoDate = new Date('2025-12-17');
      promoDate.setHours(23, 59, 59, 999); // End of day on Dec 17
      
      // If it's Dec 17, countdown to end of day, otherwise countdown to Dec 17 start
      const targetDate = now.getDate() === 17 && now.getMonth() === 11
        ? new Date('2025-12-17T23:59:59')
        : new Date('2025-12-17T00:00:00');

      const difference = targetDate.getTime() - now.getTime();

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        return { days, hours, minutes, seconds };
      }
      return null;
    };

    setTimeLeft(calculateTimeLeft());
    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  if (!timeLeft) {
    return null;
  }

  const isPromoDay = new Date().getDate() === 17 && new Date().getMonth() === 11;
  const label = isPromoDay ? 'Promo Ends In:' : 'Promo Starts In:';

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

export function PromoBanner() {
  return (
    <div className="w-full border-b bg-background/95 relative overflow-hidden">
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

      <div className="container flex items-center justify-center px-4 py-3 relative z-10">
        <div
          className={cn(
            "flex items-center flex-wrap sm:flex-nowrap gap-2 sm:gap-3 rounded-lg border-2 border-yellow-400/50 px-3 sm:px-4 py-2 shadow-lg",
            "text-xs sm:text-sm w-full max-w-5xl relative overflow-visible sm:overflow-hidden",
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
            <CountdownTimer />
          </div>

          {/* Gift Icon with animation */}
          <div className="flex-shrink-0 animate-bounce" style={{ animationDuration: '2s' }}>
            <Gift className="h-5 w-5 sm:h-6 sm:w-6 text-yellow-600 drop-shadow-lg" fill="currentColor" />
          </div>

          {/* Main Text */}
          <div className="flex flex-col sm:flex-row items-center gap-1 sm:gap-2 flex-1 w-full min-w-0">
            <div className="flex items-center gap-1 sm:gap-2 flex-wrap justify-center">
              <span className="text-yellow-900 font-bold text-xs sm:text-sm">
                ✨ <strong className="text-red-700 text-sm sm:text-base">Special Offer!</strong> ✨
              </span>
              <span className="text-yellow-900 font-bold text-xs sm:text-sm">
                — Only <strong className="text-red-700 text-base sm:text-lg">₱150 per load</strong>! 🎉
              </span>
            </div>
            <span className="text-yellow-900 font-semibold text-xs sm:text-sm text-center w-full sm:w-auto border-t sm:border-t-0 border-yellow-300/30 sm:border-0 pt-1 sm:pt-0">
              <strong className="text-red-700">December 17, 2025</strong>
            </span>
          </div>

          {/* Right side sparkle */}
          <div className="flex-shrink-0 animate-pulse">
            <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 text-yellow-500" />
          </div>
        </div>
      </div>

    </div>
  );
}

