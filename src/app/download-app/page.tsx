
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Image from 'next/image';

export default function DownloadAppPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto flex items-center justify-center container mx-auto px-4 pb-14">
        <div className="flex flex-col items-center text-center">
            <h1 className="text-2xl md:text-4xl font-bold text-primary">Download Our App</h1>
            <p className="text-sm md:text-lg text-muted-foreground mt-2 max-w-2xl">Get the full RKR Laundry experience on your mobile device. Track orders, get exclusive deals, and more.</p>

            <div className="mt-8 flex flex-col md:flex-row items-center gap-6">
                <div className="flex flex-col gap-3">
                    <Button size="lg" className="h-12 text-base md:h-14 w-56 bg-black text-white hover:bg-gray-800">
                       <Download className="mr-3" /> Download for iOS
                    </Button>
                    <Button size="lg" className="h-12 text-base md:h-14 w-56 bg-black text-white hover:bg-gray-800">
                        <Download className="mr-3" /> Download for Android
                    </Button>
                </div>
                <div className="relative w-32 h-32 md:w-48 md:h-48 flex items-center justify-center bg-muted rounded-lg">
                   <p className="text-muted-foreground text-sm">QR Code</p>
                </div>
            </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
