
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// This is the correct way to fix the default icon issue in Next.js
// It should be done once at the module level.
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon.src,
    iconRetinaUrl: markerIcon2x.src,
    shadowUrl: markerShadow.src,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});


const SHOP_LATITUDE = 17.522928;
const SHOP_LONGITUDE = 121.775073;

function DraggableMarker() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [position, setPosition] = useState<LatLng>(new LatLng(SHOP_LATITUDE, SHOP_LONGITUDE));

  const updateURL = (pos: LatLng) => {
    const shopLatLng = new L.LatLng(SHOP_LATITUDE, SHOP_LONGITUDE);
    const distanceInMeters = shopLatLng.distanceTo(pos);
    const distanceInKm = distanceInMeters / 1000;
    
    const params = new URLSearchParams(searchParams.toString());
    params.set('distance', distanceInKm.toFixed(2));
    router.replace(`/select-location?${params.toString()}`);
  };

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      updateURL(e.latlng);
    },
    locationfound(e) {
        map.flyTo(e.latlng, map.getZoom());
        setPosition(e.latlng);
        updateURL(e.latlng);
    }
  });

  useEffect(() => {
    map.locate();
  }, [map]);

  const handleDragEnd = (event: L.DragEndEvent) => {
    const marker = event.target;
    const newPosition = marker.getLatLng();
    setPosition(newPosition);
    updateURL(newPosition);
  };

  return position === null ? null : (
    <Marker 
        position={position} 
        draggable={true}
        eventHandlers={{
            dragend: handleDragEnd,
        }}
    />
  );
}

export function LocationMap() {
    return (
        <MapContainer
            center={[SHOP_LATITUDE, SHOP_LONGITUDE]}
            zoom={13}
            scrollWheelZoom={true}
            style={{ height: '100%', width: '100%' }}
        >
            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <DraggableMarker />
        </MapContainer>
    );
}
