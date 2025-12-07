
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { LocateFixed } from 'lucide-react';

// Fix for default Leaflet icon path in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require('leaflet/dist/images/marker-icon-2x.png').default.src,
  iconUrl: require('leaflet/dist/images/marker-icon.png').default.src,
  shadowUrl: require('leaflet/dist/images/marker-shadow.png').default.src,
});

const SHOP_LATITUDE = 14.5515;
const SHOP_LONGITUDE = 121.0493;

interface LocationPickerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLocationSelect: (distance: number) => void;
}

function DraggableMarker({ onPositionChange }: { onPositionChange: (pos: L.LatLng) => void }) {
  const [position, setPosition] = useState<L.LatLng>(new L.LatLng(SHOP_LATITUDE, SHOP_LONGITUDE));

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onPositionChange(e.latlng);
    },
  });

  useEffect(() => {
    map.locate().on('locationfound', function (e) {
      map.flyTo(e.latlng, map.getZoom());
      setPosition(e.latlng);
      onPositionChange(e.latlng);
    });
  }, [map, onPositionChange]);

  return position === null ? null : (
    <Marker position={position} draggable={true}></Marker>
  );
}

export function LocationPicker({ open, onOpenChange, onLocationSelect }: LocationPickerProps) {
  const [isClient, setIsClient] = useState(false);
  const [selectedPosition, setSelectedPosition] = useState<L.LatLng | null>(null);
  const [calculatedDistance, setCalculatedDistance] = useState<number>(0);

  useEffect(() => {
    setIsClient(true);
  }, []);

  const handlePositionChange = useCallback((pos: L.LatLng) => {
    setSelectedPosition(pos);
    const shopLatLng = L.latLng(SHOP_LATITUDE, SHOP_LONGITUDE);
    const distanceInMeters = shopLatLng.distanceTo(pos);
    const distanceInKm = distanceInMeters / 1000;
    setCalculatedDistance(distanceInKm);
  }, []);
  
  const handleConfirm = () => {
    onLocationSelect(calculatedDistance);
    onOpenChange(false);
  };
  
  const Map = useMemo(() => {
    if (!isClient) {
      return () => null;
    }
    return function MapComponent() {
      return (
        <div className="h-64 w-full rounded-lg overflow-hidden relative border">
          <MapContainer center={[SHOP_LATITUDE, SHOP_LONGITUDE]} zoom={13} scrollWheelZoom={true} style={{ height: '100%', width: '100%' }} >
              <TileLayer
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <DraggableMarker onPositionChange={handlePositionChange} />
          </MapContainer>
        </div>
      );
    }
  }, [isClient, handlePositionChange]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <LocateFixed /> Select Your Location
          </DialogTitle>
        </DialogHeader>
        <div className="py-4 space-y-4">
            <p className="text-sm text-muted-foreground">Click on the map to place a pin or use your current location.</p>
            {isClient ? <Map /> : <div className="h-64 w-full bg-muted rounded-lg flex items-center justify-center"><p>Loading map...</p></div>}
             <div className="text-center">
                <p className="text-sm text-muted-foreground">Calculated Distance</p>
                <p className="text-lg font-bold">{calculatedDistance.toFixed(2)} km</p>
            </div>
        </div>
        <DialogFooter>
          <Button onClick={handleConfirm} className="w-full">Confirm Location</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
