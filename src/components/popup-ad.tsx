'use client';

import { useEffect, useState, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';
import { getAdSlot } from '@/lib/ads-config';

export function PopupAd({ trigger }: { trigger: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);
  const [adFilled, setAdFilled] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);
  const statusCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Trigger pop-up ad when trigger value changes (button click)
    if (trigger > 0) {
      // Reset states
      setAdLoaded(false);
      setAdFilled(false);
      setIsOpen(true);
    }
  }, [trigger]);

  useEffect(() => {
    if (!isOpen) {
      // Clean up when dialog closes
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
      return;
    }

    // Wait for dialog to be fully rendered in DOM before initializing ad
    const initAd = () => {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        try {
          const popupAd = document.getElementById('popup-ad');
          if (popupAd) {
            // Check if container has actual width before initializing
            const rect = popupAd.getBoundingClientRect();
            if (rect.width === 0 || rect.height === 0) {
              // Container not ready yet, retry after a short delay
              setTimeout(() => initAd(), 100);
              return;
            }
            
            const status = popupAd.getAttribute('data-adsbygoogle-status');
            
            // Initialize if not already initialized
            if (!adLoaded && (status === null || status === 'unfilled')) {
              try {
                if (status === 'unfilled') {
                  popupAd.removeAttribute('data-adsbygoogle-status');
                }
                ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
                setAdLoaded(true);
              } catch (e) {
                // Ad already initialized or error - retry after delay
                setTimeout(() => {
                  if (!adFilled) {
                    initAd();
                  }
                }, 500);
              }
            }
            
            // Check if ad is filled
            if (status === 'filled') {
              setAdFilled(true);
            }
          }
        } catch (error) {
          console.error('Error initializing popup ad:', error);
        }
      }
    };

    // Monitor ad status changes
    const checkAdStatus = () => {
      const popupAd = document.getElementById('popup-ad');
      if (popupAd) {
        const status = popupAd.getAttribute('data-adsbygoogle-status');
        if (status === 'filled') {
          setAdFilled(true);
        }
      }
    };

    // Set up observer to watch for ad status changes
    const setupObserver = () => {
      const popupAd = document.getElementById('popup-ad');
      if (popupAd && !observerRef.current) {
        observerRef.current = new MutationObserver(() => {
          checkAdStatus();
        });
        
        observerRef.current.observe(popupAd, {
          attributes: true,
          attributeFilter: ['data-adsbygoogle-status', 'data-ad-status'],
        });
      }
    };

    // Small delay to ensure dialog is fully rendered in DOM with dimensions
    const timeoutId = setTimeout(() => {
      // Set up observer first
      setupObserver();
      
      // Then initialize ad - but check dimensions first
      const checkDimensionsAndInit = () => {
        const popupAd = document.getElementById('popup-ad');
        if (popupAd) {
          const rect = popupAd.getBoundingClientRect();
          if (rect.width > 0 && rect.height > 0) {
            // Container has dimensions, safe to initialize
            if ((window as any).adsbygoogle) {
              initAd();
              checkAdStatus();
            } else {
              // Wait for AdSense to load
              const checkInterval = setInterval(() => {
                if ((window as any).adsbygoogle) {
                  initAd();
                  checkAdStatus();
                  clearInterval(checkInterval);
                }
              }, 100);

              // Clear interval after 10 seconds
              setTimeout(() => {
                clearInterval(checkInterval);
              }, 10000);
            }
          } else {
            // Container not ready, retry
            setTimeout(checkDimensionsAndInit, 100);
          }
        }
      };
      
      checkDimensionsAndInit();
    }, 500); // Increased delay to ensure dialog has dimensions

    // Periodic check for ad status (in case observer misses it)
    statusCheckIntervalRef.current = setInterval(() => {
      if (isOpen && !adFilled) {
        checkAdStatus();
      } else {
        if (statusCheckIntervalRef.current) {
          clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }
      }
    }, 500); // Check every 500ms

    // Only auto-close if no ad loads after 15 seconds
    timeoutRef.current = setTimeout(() => {
      const popupAd = document.getElementById('popup-ad');
      if (popupAd) {
        const status = popupAd.getAttribute('data-adsbygoogle-status') || popupAd.getAttribute('data-ad-status');
        if (status !== 'filled' && !adFilled) {
          // Only close if still no ad after 15 seconds
          setIsOpen(false);
        }
      }
    }, 15000); // Extended to 15 seconds

    return () => {
      clearTimeout(timeoutId);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
      if (statusCheckIntervalRef.current) {
        clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    };
  }, [isOpen, adLoaded, adFilled]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[90vw] max-w-[500px] p-0 overflow-hidden">
        <DialogTitle className="sr-only">Advertisement</DialogTitle>
        <DialogDescription className="sr-only">Advertisement content</DialogDescription>
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 z-20 h-6 w-6 p-0 rounded-full bg-background/80 hover:bg-background"
            aria-label="Close ad"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Ad container - always visible so ad can load immediately, flexible for any ad size */}
          <div 
            className="w-full min-h-[250px] flex items-center justify-center bg-muted/30 relative"
            style={{ minHeight: '250px' }}
          >
            <ins
              id="popup-ad"
              className="adsbygoogle"
              style={{ 
                display: 'block', 
                width: '100%',
                minHeight: '250px'
              }}
              data-ad-client="ca-pub-1482729173853463"
              data-ad-slot={getAdSlot('POPUP_AD')}
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
            
            {/* Loading state overlay - only show if ad hasn't filled yet */}
            {!adFilled && (
              <div className="absolute inset-0 w-full min-h-[250px] flex items-center justify-center bg-muted/30 z-10">
                <div className="text-center space-y-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-sm text-muted-foreground">Loading ad...</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
