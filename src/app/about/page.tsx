
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Info } from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader showLogo={true} />
      <main className="flex-1 overflow-hidden container mx-auto px-4 flex flex-col items-center justify-center">
        <Card className="w-full max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Info className="h-8 w-8" /> About RKR Laundry
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              RKR Laundry is committed to providing fast, clean, and convenient laundry services. We use state-of-the-art machines and eco-friendly products to ensure your clothes are handled with care. Our mission is to make laundry day hassle-free for our customers with real-time tracking and excellent customer service.
            </p>
          </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
