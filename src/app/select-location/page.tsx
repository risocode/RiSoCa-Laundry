
'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Loader2 } from 'lucide-react';
import { LocationConfirmation } from '@/components/location-confirmation';

const LocationMap = dynamic(
  () => import('@/components/location-map').then((mod) => mod.LocationMap),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-muted flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        <p className="ml-3 text-muted-foreground">Loading Map...</p>
      </div>
    ),
  }
);

function SelectLocationContent() {
  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-background">
      <div className="w-full md:w-1/4 h-1/3 md:h-full order-2 md:order-1">
        <Suspense fallback={<div className="h-full w-full bg-muted flex items-center justify-center"><Loader2 className="animate-spin" /></div>}>
         <LocationConfirmation />
        </Suspense>
      </div>
      <div className="w-full md:w-3/4 h-2/3 md:h-full order-1 md:order-2">
        <LocationMap />
      </div>
    </div>
  );
}

export default function SelectLocationPage() {
    return (
        <Suspense fallback={<div className="h-screen w-screen bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
            <SelectLocationContent />
        </Suspense>
    )
}
