
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function TrackRiderPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8 flex flex-col items-center justify-start min-h-full">
        <div className="flex flex-col items-center text-center mb-8">
            <h1 className="text-2xl md:text-4xl font-bold text-primary">Track Your Rider</h1>
            <p className="text-sm md:text-lg text-muted-foreground mt-2">See your rider's location in real-time.</p>
        </div>
        
        <Card className="max-w-4xl mx-auto w-full">
            <CardHeader className="p-4">
                <CardTitle className="text-lg">Rider Location</CardTitle>
                <CardDescription className="text-sm">Your order #12345 is on its way!</CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                    <p className="text-muted-foreground">Map placeholder</p>
                </div>
            </CardContent>
        </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
