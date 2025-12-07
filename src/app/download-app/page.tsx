
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import Image from 'next/image';

export default function DownloadAppPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Download Our App</h1>
            <p className="text-base md:text-lg text-muted-foreground mt-2 max-w-2xl">Get the full RKR Laundry experience on your mobile device. Track orders, get exclusive deals, and more.</p>

            <div className="mt-12 flex flex-col md:flex-row items-center gap-8">
                <div className="flex flex-col gap-4">
                    <Button size="lg" className="h-14 text-base md:h-16 md:text-lg w-64 bg-black text-white hover:bg-gray-800">
                       <Download className="mr-3" /> Download for iOS
                    </Button>
                    <Button size="lg" className="h-14 text-base md:h-16 md:text-lg w-64 bg-black text-white hover:bg-gray-800">
                        <Download className="mr-3" /> Download for Android
                    </Button>
                </div>
                <div className="relative w-48 h-48 md:w-64 md:h-64">
                   <p className="text-muted-foreground">QR Code placeholder</p>
                </div>
            </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
