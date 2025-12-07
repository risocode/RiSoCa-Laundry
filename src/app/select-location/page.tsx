'use client';

import { Suspense } from 'react';
import { useLoadScript } from '@react-google-maps/api';
import { Loader2 } from 'lucide-react';
import { LocationConfirmation } from '@/components/location-confirmation';
import { LocationMap } from '@/components/location-map';

const libraries: ('places' | 'drawing' | 'geometry' | 'localContext' | 'visualization')[] = ['geometry'];

function SelectLocationContent() {
  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    libraries,
  });

  if (loadError) {
    return (
        <div className="h-full w-full bg-muted flex items-center justify-center">
            <p className="text-destructive-foreground">Error loading map</p>
        </div>
    )
  }

  if (!isLoaded) {
    return (
        <div className="h-full w-full bg-muted flex items-center justify-center">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="ml-3 text-muted-foreground">Loading Map...</p>
        </div>
    );
  }
  
  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-background">
      {/* Side panel for confirmation */}
      <div className="w-full md:w-1/4 h-1/3 md:h-full order-2 md:order-1">
        <LocationConfirmation />
      </div>
      
      {/* Main area for the map */}
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
