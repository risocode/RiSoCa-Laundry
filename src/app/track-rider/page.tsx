
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrackRiderPage() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="flex flex-col items-center text-center mb-12">
            <h1 className="text-3xl md:text-4xl font-bold text-primary">Track Your Rider</h1>
            <p className="text-base md:text-lg text-muted-foreground mt-2">See your rider's location in real-time.</p>
        </div>
        
        <Card className="max-w-4xl mx-auto">
            <CardHeader>
                <CardTitle>Rider Location</CardTitle>
                <CardDescription>Your order #12345 is on its way!</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Map placeholder</p>
                </div>
            </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
