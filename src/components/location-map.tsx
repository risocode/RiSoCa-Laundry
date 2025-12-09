'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { GoogleMap, MarkerF } from '@react-google-maps/api'

const SHOP_POSITION = { lat: 17.522928, lng: 121.775073 }

interface LocationMapProps {
  onSelectLocation?: (lat: number, lng: number) => void
}

export function LocationMap({ onSelectLocation }: LocationMapProps) {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [markerPosition, setMarkerPosition] =
    useState(SHOP_POSITION)
  const [mapCenter, setMapCenter] =
    useState(SHOP_POSITION)

  const updateURL = useCallback(
    (pos: google.maps.LatLng) => {
      const shopLatLng = new google.maps.LatLng(
        SHOP_POSITION.lat,
        SHOP_POSITION.lng
      )

      const distanceInKm =
        google.maps.geometry.spherical.computeDistanceBetween(
          shopLatLng,
          pos
        ) / 1000

      const params = new URLSearchParams(searchParams.toString())
      params.set('distance', distanceInKm.toFixed(2))
      router.replace(`/select-location?${params.toString()}`)

      onSelectLocation?.(pos.lat(), pos.lng())
    },
    [router, searchParams, onSelectLocation]
  )

  useEffect(() => {
    if (!navigator.geolocation) return

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        }
        setMapCenter(userPos)
        setMarkerPosition(userPos)
        updateURL(new google.maps.LatLng(userPos.lat, userPos.lng))
      },
      () => {
        updateURL(
          new google.maps.LatLng(
            SHOP_POSITION.lat,
            SHOP_POSITION.lng
          )
        )
      }
    )
  }, [updateURL])

  const mapOptions = useMemo<google.maps.MapOptions>(
    () => ({
      disableDefaultUI: true,
      scrollwheel: true,
    }),
    []
  )

  return (
    <GoogleMap
      zoom={14}
      center={mapCenter}
      options={mapOptions}
      mapContainerStyle={{ width: '100%', height: '100%' }}
      onClick={(e) => e.latLng && updateURL(e.latLng)}
    >
      <MarkerF
        position={markerPosition}
        draggable
        onDragEnd={(e) =>
          e.latLng && updateURL(e.latLng)
        }
      />

      <MarkerF
        position={SHOP_POSITION}
        icon={{
          url: 'http://maps.google.com/mapfiles/ms/icons/blue-dot.png',
        }}
      />
    </GoogleMap>
  )
}
