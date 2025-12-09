'use client'

import { Suspense, useCallback, useState } from 'react'
import { useLoadScript, Libraries } from '@react-google-maps/api'
import { Loader2, AlertTriangle } from 'lucide-react'

import { LocationConfirmation } from '@/components/location-confirmation'
import { LocationMap } from '@/components/location-map'

const libraries: Libraries = ['geometry']

function SelectLocationContent() {
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey!,
    libraries,
    preventGoogleFontsLoading: true,
  })

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  /**
   * Called by LocationMap when user picks a location
   */
  const handleLocationSelect = useCallback(
    (lat: number, lng: number) => {
      setCoords({ lat, lng })
      setStatus(null)
    },
    []
  )

  /**
   * Save selected coords
   */
  async function saveLocation() {
    if (!coords) {
      setStatus('Please select a location on the map.')
      return
    }

    setSaving(true)
    setStatus(null)

    // Simulate saving
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    setSaving(false)
    setStatus('✅ Location saved successfully.')
  }

  /* ---------- ENV / LOAD STATES ---------- */

  if (!googleMapsApiKey || googleMapsApiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="h-full w-full bg-muted flex flex-col items-center justify-center p-4 text-center">
        <AlertTriangle className="h-12 w-12 text-destructive mb-4" />
        <h2 className="text-xl font-semibold text-destructive">
          Google Maps API Key is Missing
        </h2>
        <p className="text-muted-foreground mt-2">
          Add your API key to{' '}
          <code className="font-mono bg-muted-foreground/20 px-1 py-0.5 rounded">
            .env
          </code>
        </p>
      </div>
    )
  }

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
    )
  }

  /* ---------- MAIN UI ---------- */

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-background">
      {/* Side panel */}
      <div className="w-full md:w-1/4 h-1/3 md:h-full order-2 md:order-1 border-t md:border-t-0 md:border-r">
        <LocationConfirmation
          coords={coords}
          saving={saving}
          status={status}
          onSave={saveLocation}
        />
      </div>

      {/* Map */}
      <div className="w-full md:w-3/4 h-2/3 md:h-full order-1 md:order-2">
        <LocationMap onSelectLocation={handleLocationSelect} />
      </div>
    </div>
  )
}

export default function SelectLocationPage() {
  return (
    <Suspense
      fallback={
        <div className="h-screen w-screen bg-muted flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      }
    >
      <SelectLocationContent />
    </Suspense>
  )
}
