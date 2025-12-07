
'use client';

import { Button } from './ui/button';
import { MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Label } from './ui/label';

export function LocationPicker({ onLocationSelect, currentDistance }: { onLocationSelect: (distance: number) => void, currentDistance: number }) {
  const router = useRouter();

  const handleLocationSelect = () => {
    router.push('/select-location');
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="distance" className="text-base font-semibold">3. Location</Label>
      <div className="flex flex-col gap-2">
        <Button type="button" variant="outline" onClick={handleLocationSelect} className="w-full">
          <MapPin className="mr-2 h-4 w-4" />
          Select Location on Map
        </Button>
        {currentDistance > 0 && (
          <div className="text-xs text-center text-muted-foreground">
            Distance: {currentDistance.toFixed(2)} km
          </div>
        )}
      </div>
    </div>
  );
}
