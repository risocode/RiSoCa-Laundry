'use client';

import { useState, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import L, { LatLng } from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default Leaflet icon path in Next.js
// This needs to be done once in a client component.
const DefaultIcon = L.icon({
    iconUrl: '/marker-icon.png',
    iconRetinaUrl: '/marker-icon-2x.png',
    shadowUrl: '/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;


const SHOP_LATITUDE = 14.5515;
const SHOP_LONGITUDE = 121.0493;

function DraggableMarker({ onPositionChange }: { onPositionChange: (pos: LatLng) => void }) {
  const [position, setPosition] = useState<LatLng>(new LatLng(SHOP_LATITUDE, SHOP_LONGITUDE));

  const map = useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onPositionChange(e.latlng);
    },
    locationfound(e) {
        map.flyTo(e.latlng, map.getZoom());
        setPosition(e.latlng);
        onPositionChange(e.latlng);
    }
  });

  useEffect(() => {
    // Trigger location search on initial load
    map.locate();
  }, [map]);

  const handleDragEnd = (event: L.DragEndEvent) => {
    const marker = event.target;
    const newPosition = marker.getLatLng();
    setPosition(newPosition);
    onPositionChange(newPosition);
  };

  return position === null ? null : (
    <Marker 
        position={position} 
        draggable={true}
        eventHandlers={{
            dragend: handleDragEnd,
        }}
    >
    </Marker>
  );
}

export function LocationMap({ onPositionChange }: { onPositionChange: (pos: LatLng) => void }) {
    const [isClient, setIsClient] = useState(false);
    
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Unique key to force re-mount and avoid container initialization errors
    const mapKey = isClient ? new Date().toISOString() : 'server';

    return (
        <div className="h-64 w-full rounded-lg overflow-hidden relative border">
            {isClient && (
                 <MapContainer
                    key={mapKey}
                    center={[SHOP_LATITUDE, SHOP_LONGITUDE]}
                    zoom={13}
                    scrollWheelZoom={true}
                    style={{ height: '100%', width: '100%' }}
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />
                    <DraggableMarker onPositionChange={onPositionChange} />
                </MapContainer>
            )}
        </div>
    );
}