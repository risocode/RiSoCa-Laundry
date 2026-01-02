'use client';

import { useEffect, useState } from 'react';
import { ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

export function AdBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(64);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    // Check if desktop (min-width: 768px)
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 768);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    // Get header height
    const updateHeaderHeight = () => {
      const header = document.querySelector('header');
      if (header) {
        setHeaderHeight(header.offsetHeight);
      }
    };

    updateHeaderHeight();
    window.addEventListener('resize', updateHeaderHeight);

    // Check if user has collapsed the ad before
    const adCollapsed = localStorage.getItem('ad-banner-collapsed');
    if (adCollapsed === 'true') {
      setIsCollapsed(true);
    }

    // Monitor for AdSense ads
    const checkForAds = () => {
      // Only show on desktop
      if (!isDesktop) {
        setIsVisible(false);
        return;
      }

      const adContainer = document.getElementById('ad-banner-container');
      if (!adContainer) {
        setIsVisible(false);
        return;
      }

      // Check for ads in the container
      const ads = adContainer.querySelectorAll('ins.adsbygoogle');
      let hasFilledAd = false;

      ads.forEach((ad) => {
        const adStatus = ad.getAttribute('data-ad-status');
        if (adStatus === 'filled') {
          hasFilledAd = true;
        }
      });

      // Also check body for new ads that need to be moved
      const bodyAds = document.querySelectorAll('body > ins.adsbygoogle');
      bodyAds.forEach((ad) => {
        const adStatus = ad.getAttribute('data-ad-status');
        if (adStatus === 'filled') {
          hasFilledAd = true;
        }
      });

      if (hasFilledAd && !isCollapsed) {
        setIsVisible(true);
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

    // Observe body and ad container for ad insertions and status changes
    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['data-ad-status'],
    });

    const adContainer = document.getElementById('ad-banner-container');
    if (adContainer) {
      observer.observe(adContainer, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ['data-ad-status'],
      });
    }

    // Periodically check for container creation
    const containerCheck = setInterval(() => {
      const container = document.getElementById('ad-banner-container');
      if (container) {
        observer.observe(container, {
          childList: true,
          subtree: true,
          attributes: true,
          attributeFilter: ['data-ad-status'],
        });
        checkForAds();
        clearInterval(containerCheck);
      }
    }, 100);

    return () => {
      window.removeEventListener('resize', checkDesktop);
      window.removeEventListener('resize', updateHeaderHeight);
      observer.disconnect();
      clearInterval(containerCheck);
    };
  }, [isCollapsed, isDesktop]);

  const handleCollapse = () => {
    setIsCollapsed(true);
    setIsVisible(false);
    localStorage.setItem('ad-banner-collapsed', 'true');
  };

  const handleExpand = () => {
    setIsCollapsed(false);
    localStorage.removeItem('ad-banner-collapsed');
    // Check for ads again
    const adContainer = document.getElementById('ad-banner-container');
    if (adContainer) {
      const ads = adContainer.querySelectorAll('ins.adsbygoogle');
      ads.forEach((ad) => {
        const adStatus = ad.getAttribute('data-ad-status');
        if (adStatus === 'filled') {
          setIsVisible(true);
        }
      });
    }
  };

  // Don't show on mobile
  if (!isDesktop) {
    return null;
  }

  if (!isVisible && isCollapsed) {
    // Show a small expand button when collapsed
    return (
      <div
        className="fixed left-0 right-0 z-[999] bg-background/95 backdrop-blur-sm border-b"
        style={{ top: `${headerHeight}px` }}
      >
        <div className="container mx-auto px-4 py-1 flex justify-center">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleExpand}
            className="h-6 px-2 text-xs"
            aria-label="Show ad banner"
          >
            <ChevronUp className="h-3 w-3 rotate-180" />
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
        'fixed left-0 right-0 z-[999] bg-background/95 backdrop-blur-sm border-b transition-all duration-300',
        isCollapsed ? 'opacity-0 pointer-events-none' : 'opacity-100'
      )}
      style={{ top: `${headerHeight}px` }}
    >
      <div className="container mx-auto px-4 py-2 flex items-center justify-between gap-4">
        {/* Ad container */}
        <div className="flex-1 flex justify-center min-h-[90px]">
          {/* AdSense ads will be inserted here */}
          <div id="ad-banner-container" className="w-full" />
        </div>

        {/* Collapse button */}
        <Button
          variant="ghost"
          size="sm"
          onClick={handleCollapse}
          className="h-8 w-8 p-0 flex-shrink-0"
          aria-label="Collapse ad banner"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
