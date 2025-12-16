'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Button } from '@/components/ui/button';
import { Download, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function DownloadAppPage() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isInstallable, setIsInstallable] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Check if app is already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
      return;
    }

    // Listen for the beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if app was installed after page load
    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      toast({
        title: 'App Installed',
        description: 'Thank you for installing RKR Laundry!',
      });
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, [toast]);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      toast({
        variant: 'destructive',
        title: 'Installation Not Available',
        description: 'Your browser does not support app installation, or the app is already installed.',
      });
      return;
    }

    // Show the install prompt
    deferredPrompt.prompt();

    // Wait for the user to respond
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      toast({
        title: 'Installation Started',
        description: 'The app is being installed. Please follow the prompts.',
      });
    } else {
      toast({
        title: 'Installation Cancelled',
        description: 'You can install the app anytime from your browser menu.',
      });
    }

    // Clear the prompt
    setDeferredPrompt(null);
    setIsInstallable(false);
  };

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-full">
          <div className="flex flex-col items-center text-center max-w-md">
            <h1 className="text-2xl md:text-4xl font-bold text-primary mb-4">Install App</h1>
            <p className="text-sm md:text-base text-muted-foreground mb-8">
              Install RKR Laundry on your device for a better experience. Track orders, get notifications, and more.
            </p>

            {isInstalled ? (
              <div className="flex flex-col items-center gap-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
                <p className="text-lg font-semibold text-primary">Thank You for Installing!</p>
                <p className="text-sm text-muted-foreground text-center">
                  RKR Laundry is already installed on your device. You can access it from your home screen or app drawer for quick and easy access to all our services.
                </p>
              </div>
            ) : isInstallable ? (
              <Button
                size="lg"
                onClick={handleInstallClick}
                className="h-14 w-full max-w-xs text-lg bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-600 hover:to-indigo-700"
              >
                <Download className="mr-3 h-5 w-5" />
                Install App
              </Button>
            ) : (
              <div className="flex flex-col items-center gap-4">
                <p className="text-muted-foreground text-center">
                  To install RKR Laundry on your device, please use your browser's install option.
                </p>
                <p className="text-sm text-muted-foreground text-center">
                  On mobile devices, look for the install icon in your browser's address bar. On desktop, check your browser menu for "Install" or "Add to Home Screen" options.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
