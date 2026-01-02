'use client';

import { useEffect, useState } from 'react';
import { getAdSlot } from '@/lib/ads-config';

export function SideAdBanners() {
  const [isDesktop, setIsDesktop] = useState(false);
  const [leftAdLoaded, setLeftAdLoaded] = useState(false);
  const [rightAdLoaded, setRightAdLoaded] = useState(false);

  useEffect(() => {
    // Check if desktop (min-width: 1024px for sidebars)
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };

    checkDesktop();
    window.addEventListener('resize', checkDesktop);

    return () => {
      window.removeEventListener('resize', checkDesktop);
    };
  }, []);

  useEffect(() => {
    if (!isDesktop) return;

    // Initialize left ad
    const initLeftAd = () => {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        try {
          const leftAd = document.getElementById('left-side-ad');
          if (leftAd && !leftAdLoaded && leftAd.getAttribute('data-adsbygoogle-status') === null) {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
              setLeftAdLoaded(true);
            } catch (e) {
              // Ad already initialized or error
            }
          }
        } catch (error) {
          console.error('Error initializing left ad:', error);
        }
      }
    };

    // Initialize right ad
    const initRightAd = () => {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        try {
          const rightAd = document.getElementById('right-side-ad');
          if (rightAd) {
            const status = rightAd.getAttribute('data-adsbygoogle-status');
            if (!rightAdLoaded && (status === null || status === 'unfilled')) {
              try {
                // Force re-initialization if needed
                if (status === 'unfilled') {
                  rightAd.removeAttribute('data-adsbygoogle-status');
                }
                ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                setRightAdLoaded(true);
              } catch (e) {
                // Ad already initialized or error - retry after delay
                if (!rightAdLoaded) {
                  setTimeout(() => {
                    initRightAd();
                  }, 1000);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error initializing right ad:', error);
          // Retry after delay
          if (!rightAdLoaded) {
            setTimeout(() => {
              initRightAd();
            }, 1000);
          }
        }
      } else if (!rightAdLoaded) {
        // AdSense not loaded yet, retry
        setTimeout(() => {
          initRightAd();
        }, 500);
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      // Check if AdSense is already loaded
      if ((window as any).adsbygoogle) {
        // Initialize left ad first
        initLeftAd();
        // Initialize right ad after a small delay to ensure they're separate
        setTimeout(() => {
          initRightAd();
        }, 100);
      } else {
        // Wait for AdSense to load
        const checkInterval = setInterval(() => {
          if ((window as any).adsbygoogle) {
            initLeftAd();
            setTimeout(() => {
              initRightAd();
            }, 100);
            clearInterval(checkInterval);
          }
        }, 100);

        // Clear interval after 10 seconds
        setTimeout(() => {
          clearInterval(checkInterval);
        }, 10000);
      }
    }, 500);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [isDesktop, leftAdLoaded, rightAdLoaded]);

  // Don't show on mobile
  if (!isDesktop) {
    return null;
  }

  return (
    <>
      {/* Left Side Ad Banner */}
      <div
        className="fixed left-0 w-[160px] z-[10] hidden lg:flex items-start justify-center pointer-events-none"
        style={{ 
          top: '64px', // Start below header (header height is typically 64px)
          height: 'calc(100vh - 64px)', // Full height minus header
          maxHeight: 'calc(100vh - 64px)',
        }}
      >
        <div className="sticky top-4 w-full flex justify-center pointer-events-auto">
          <ins
            id="left-side-ad"
            className="adsbygoogle"
            style={{ display: 'block', width: '160px', height: '600px', minHeight: '600px' }}
            data-ad-client="ca-pub-1482729173853463"
            data-ad-slot={getAdSlot('LEFT_SIDEBAR')}
            data-ad-format="vertical"
            data-full-width-responsive="false"
          />
        </div>
      </div>

      {/* Right Side Ad Banner */}
      <div
        id="right-side-ad-container"
        className="fixed right-0 w-[160px] z-[10] hidden lg:flex items-start justify-center pointer-events-none"
        style={{ 
          top: '64px', // Start below header (header height is typically 64px)
          height: 'calc(100vh - 64px)', // Full height minus header
          maxHeight: 'calc(100vh - 64px)',
        }}
      >
        <div className="sticky top-4 w-full flex justify-center pointer-events-auto">
          <ins
            id="right-side-ad"
            className="adsbygoogle"
            style={{ display: 'block', width: '160px', height: '600px', minHeight: '600px' }}
            data-ad-client="ca-pub-1482729173853463"
            data-ad-slot={getAdSlot('RIGHT_SIDEBAR')}
            data-ad-format="vertical"
            data-full-width-responsive="false"
          />
        </div>
      </div>
    </>
  );
}
