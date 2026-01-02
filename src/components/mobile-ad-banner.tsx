'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { ChevronUp, ChevronDown, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { getAdSlot } from '@/lib/ads-config';

export function MobileAdBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    // Check if mobile (max-width: 1023px)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    // Check if user has collapsed the ad before
    const adCollapsed = localStorage.getItem('mobile-ad-banner-collapsed');
    if (adCollapsed === 'true') {
      setIsCollapsed(true);
    }

    // Monitor for AdSense ads
    const checkForAds = () => {
      // Only show on mobile
      if (!isMobile) {
        setIsVisible(false);
        return;
      }

      // Check for mobile banner ads
      const mobileAd = document.getElementById('mobile-top-ad');
      if (mobileAd) {
        const adStatus = mobileAd.getAttribute('data-ad-status');
        if (adStatus === 'filled' && !isCollapsed) {
          setIsVisible(true);
        } else {
          setIsVisible(false);
        }
      } else {
        setIsVisible(false);
      }
    };

    // Initial check
    checkForAds();

    // Monitor for ad status changes
    const observer = new MutationObserver(() => {
      checkForAds();
    });

    // Observe body for ad insertions and status changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ad-status'],
    });

    // Initialize ad when component mounts
    const initAd = () => {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        try {
          const mobileAd = document.getElementById('mobile-top-ad');
          if (mobileAd && mobileAd.getAttribute('data-adsbygoogle-status') === null) {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
            } catch (e) {
              // Ad already initialized or error
            }
          }
        } catch (error) {
          console.error('Error initializing mobile ad:', error);
        }
      }
    };

    // Wait for AdSense to load
    if ((window as any).adsbygoogle) {
      setTimeout(initAd, 500);
    } else {
      const checkInterval = setInterval(() => {
        if ((window as any).adsbygoogle) {
          initAd();
          clearInterval(checkInterval);
        }
      }, 100);
      setTimeout(() => clearInterval(checkInterval), 10000);
    }

    // Periodically check for ad creation
    const adCheck = setInterval(() => {
      checkForAds();
    }, 500);

    return () => {
      window.removeEventListener('resize', checkMobile);
      observer.disconnect();
      clearInterval(adCheck);
    };
  }, [isMobile, isCollapsed]);

  const handleCollapse = () => {
    setIsCollapsed(true);
    setIsVisible(false);
    localStorage.setItem('mobile-ad-banner-collapsed', 'true');
  };

  const handleExpand = () => {
    setIsCollapsed(false);
    localStorage.removeItem('mobile-ad-banner-collapsed');
    // Check for ads again
    const mobileAd = document.getElementById('mobile-top-ad');
    if (mobileAd) {
      const adStatus = mobileAd.getAttribute('data-ad-status');
      if (adStatus === 'filled') {
        setIsVisible(true);
      }
    }
  };

  // Don't show on desktop
  if (!isMobile) {
    return null;
  }

  if (!isVisible && isCollapsed) {
    // Show a small expand button when collapsed
    return (
      <div className="fixed left-0 right-0 top-0 z-[9999] bg-background/95 backdrop-blur-sm border-b">
        <div className="container mx-auto px-2 py-1 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="h-6 px-2 text-xs"
            aria-label="Show ad banner"
          >
            <ChevronDown className="h-3 w-3" />
          </Button>
        </div>
      </div>
    );
  }

  if (!isVisible) {
    return null;
  }

  return (
    <div
      className={cn(
        'fixed left-0 right-0 top-0 z-[9999] bg-background/95 backdrop-blur-sm border-b transition-all duration-300',
        isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
    >
      <div className="container mx-auto px-2 py-2 flex items-center justify-between gap-2">
        {/* Ad container */}
        <div className="flex-1 flex justify-center min-h-[50px]">
          <ins
            id="mobile-top-ad"
            className="adsbygoogle"
            style={{ display: 'block', width: '100%', height: '50px' }}
            data-ad-client="ca-pub-1482729173853463"
            data-ad-slot={getAdSlot('MOBILE_TOP_BANNER')}
            data-ad-format="horizontal"
            data-full-width-responsive="true"
          />
        </div>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCollapse}
          className="h-6 w-6 p-0 flex-shrink-0"
          aria-label="Collapse ad banner"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
