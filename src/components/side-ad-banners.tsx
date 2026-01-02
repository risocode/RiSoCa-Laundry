'use client';

import { useEffect, useState } from 'react';

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

    // Wait for AdSense script to load
    const initAds = () => {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        try {
          // Initialize left ad
          const leftAd = document.getElementById('left-side-ad');
          if (leftAd && !leftAdLoaded && leftAd.getAttribute('data-adsbygoogle-status') === null) {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
              setLeftAdLoaded(true);
            } catch (e) {
              // Ad already initialized or error
            }
          }

          // Initialize right ad
          const rightAd = document.getElementById('right-side-ad');
          if (rightAd && !rightAdLoaded && rightAd.getAttribute('data-adsbygoogle-status') === null) {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
              setRightAdLoaded(true);
            } catch (e) {
              // Ad already initialized or error
            }
          }
        } catch (error) {
          console.error('Error initializing side ads:', error);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      // Check if AdSense is already loaded
      if ((window as any).adsbygoogle) {
        initAds();
      } else {
        // Wait for AdSense to load
        const checkInterval = setInterval(() => {
          if ((window as any).adsbygoogle) {
            initAds();
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
        className="fixed left-0 top-0 h-full w-[160px] z-[998] hidden lg:flex items-start justify-center pt-20 pointer-events-none"
        style={{ 
          maxHeight: '100vh',
        }}
      >
        <div className="sticky top-20 w-full flex justify-center pointer-events-auto">
          <ins
            id="left-side-ad"
            className="adsbygoogle"
            style={{ display: 'block', width: '160px', height: '600px' }}
            data-ad-client="ca-pub-1482729173853463"
            data-ad-format="vertical"
            data-full-width-responsive="false"
          />
        </div>
      </div>

      {/* Right Side Ad Banner */}
      <div
        className="fixed right-0 top-0 h-full w-[160px] z-[998] hidden lg:flex items-start justify-center pt-20 pointer-events-none"
        style={{ 
          maxHeight: '100vh',
        }}
      >
        <div className="sticky top-20 w-full flex justify-center pointer-events-auto">
          <ins
            id="right-side-ad"
            className="adsbygoogle"
            style={{ display: 'block', width: '160px', height: '600px' }}
            data-ad-client="ca-pub-1482729173853463"
            data-ad-format="vertical"
            data-full-width-responsive="false"
          />
        </div>
      </div>
    </>
  );
}
