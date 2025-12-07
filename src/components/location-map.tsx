'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { GoogleMap, MarkerF } from '@react-google-maps/api';

const SHOP_LATITUDE = 17.522928;
const SHOP_LONGITUDE = 121.775073;
const SHOP_POSITION = { lat: SHOP_LATITUDE, lng: SHOP_LONGITUDE };

// Function to calculate distance between two lat/lng points in kilometers
function getDistanceInKm(
  pos1: google.maps.LatLng,
  pos2: google.maps.LatLng
) {
  const R = 6371; // Radius of the Earth in km
  const dLat = (pos2.lat() - pos1.lat()) * (Math.PI / 180);
  const dLon = (pos2.lng() - pos1.lng()) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(pos1.lat() * (Math.PI / 180)) *
      Math.cos(pos2.lat() * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export function LocationMap() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [markerPosition, setMarkerPosition] = useState(SHOP_POSITION);

  // Update URL with the new distance
  const updateURL = useCallback(
    (pos: google.maps.LatLng) => {
      const shopLatLng = new google.maps.LatLng(SHOP_LATITUDE, SHOP_LONGITUDE);
      const distanceInKm = getDistanceInKm(shopLatLng, pos);
      
      const params = new URLSearchParams(searchParams.toString());
      params.set('distance', distanceInKm.toFixed(2));
      router.replace(`/select-location?${params.toString()}`);
    },
    [router, searchParams]
  );
  
  // Set initial position and update URL on first load
  useEffect(() => {
    updateURL(new google.maps.LatLng(markerPosition.lat, markerPosition.lng))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleMarkerDragEnd = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const newPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        setMarkerPosition(newPosition);
        updateURL(event.latLng);
      }
    },
    [updateURL]
  );

  const handleMapClick = useCallback(
    (event: google.maps.MapMouseEvent) => {
      if (event.latLng) {
        const newPosition = { lat: event.latLng.lat(), lng: event.latLng.lng() };
        setMarkerPosition(newPosition);
        updateURL(event.latLng);
      }
    },
    [updateURL]
  );

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      clickableIcons: true,
      scrollwheel: true,
    }),
    []
  );

  return (
    <GoogleMap
      options={mapOptions}
      zoom={14}
      center={SHOP_POSITION}
      mapTypeId={google.maps.MapTypeId.ROADMAP}
      mapContainerStyle={{ width: '100%', height: '100%' }}
      onClick={handleMapClick}
    >
      <MarkerF
        position={markerPosition}
        draggable={true}
        onDragEnd={handleMarkerDragEnd}
      />
      <MarkerF position={SHOP_POSITION} icon={{ url: "http://maps.google.com/mapfiles/ms/icons/blue-dot.png" }} />
    </GoogleMap>
  );
}
