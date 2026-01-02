'use client';

import { useEffect, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { X } from 'lucide-react';

export function PopupAd({ trigger }: { trigger: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const [adLoaded, setAdLoaded] = useState(false);

  useEffect(() => {
    // Trigger pop-up ad when trigger value changes (button click)
    if (trigger > 0) {
      setIsOpen(true);
    }
  }, [trigger]);

  useEffect(() => {
    if (!isOpen) return;

    // Wait for AdSense script to load
    const initAd = () => {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        try {
          const popupAd = document.getElementById('popup-ad');
          if (popupAd && !adLoaded && popupAd.getAttribute('data-adsbygoogle-status') === null) {
            try {
              ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
              setAdLoaded(true);
            } catch (e) {
              // Ad already initialized or error
            }
          }
        } catch (error) {
          console.error('Error initializing popup ad:', error);
        }
      }
    };

    // Small delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      // Check if AdSense is already loaded
      if ((window as any).adsbygoogle) {
        initAd();
      } else {
        // Wait for AdSense to load
        const checkInterval = setInterval(() => {
          if ((window as any).adsbygoogle) {
            initAd();
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
  }, [isOpen, adLoaded]);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px] p-0 overflow-hidden">
        <div className="relative">
          {/* Close button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsOpen(false)}
            className="absolute top-2 right-2 z-10 h-6 w-6 p-0 rounded-full bg-background/80 hover:bg-background"
            aria-label="Close ad"
          >
            <X className="h-4 w-4" />
          </Button>
          
          {/* Ad container */}
          <div className="w-full min-h-[250px] flex items-center justify-center bg-muted/30">
            <ins
              id="popup-ad"
              className="adsbygoogle"
              style={{ display: 'block', width: '100%', height: '250px' }}
              data-ad-client="ca-pub-1482729173853463"
              data-ad-slot=""
              data-ad-format="rectangle"
              data-full-width-responsive="true"
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
