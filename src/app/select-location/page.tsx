'use client'

import { Suspense, useCallback, useState } from 'react'
import { useLoadScript, Libraries } from '@react-google-maps/api'
import { useRouter } from 'next/navigation'
import { Loader2, AlertTriangle, ArrowLeft, MapPin } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'

import { LocationConfirmation } from '@/components/location-confirmation'
import { LocationMap } from '@/components/location-map'

const libraries: Libraries = ['geometry']

function SelectLocationContent() {
  const router = useRouter()
  const googleMapsApiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY

  const { isLoaded, loadError } = useLoadScript({
    googleMapsApiKey: googleMapsApiKey!,
    libraries,
    preventGoogleFontsLoading: true,
  })

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const [status, setStatus] = useState<string | null>(null)

  const handleGoBack = () => {
    router.back()
  }

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
   * Save selected coords (optional - can be used for localStorage or other persistence)
   */
  async function saveLocation() {
    if (!coords) {
      setStatus('Please select a location on the map.')
      return
    }

    setSaving(true)
    setStatus(null)

    // Optionally save to localStorage for persistence
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedLocation', JSON.stringify(coords))
    }
    
    // Small delay for UX feedback
    await new Promise(resolve => setTimeout(resolve, 300));
    
    setSaving(false)
    setStatus('✅ Location saved successfully.')
  }

  /* ---------- ENV / LOAD STATES ---------- */

  if (!googleMapsApiKey || googleMapsApiKey === 'YOUR_GOOGLE_MAPS_API_KEY') {
    return (
      <div className="h-screen w-screen flex flex-col bg-background">
        <div className="p-4 border-b">
          <Button variant="ghost" onClick={handleGoBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
          <Card className="max-w-md p-8">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-destructive mb-2">
              Google Maps API Key is Missing
            </h2>
            <p className="text-muted-foreground">
              Add your API key to{' '}
              <code className="font-mono bg-muted-foreground/20 px-1 py-0.5 rounded">
                .env
              </code>
            </p>
          </Card>
        </div>
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="h-screen w-screen flex flex-col bg-background">
        <div className="p-4 border-b">
          <Button variant="ghost" onClick={handleGoBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <Card className="max-w-md p-8 text-center">
            <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive-foreground font-medium">Error loading map</p>
            <Button onClick={handleGoBack} variant="outline" className="mt-4">
              Go Back
            </Button>
          </Card>
        </div>
      </div>
    )
  }

  if (!isLoaded) {
    return (
      <div className="h-screen w-screen flex flex-col bg-background">
        <div className="p-4 border-b">
          <Button variant="ghost" onClick={handleGoBack} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </Button>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Loading Map...</p>
          </div>
        </div>
      </div>
    )
  }

  /* ---------- MAIN UI ---------- */

  return (
    <div className="h-screen w-screen flex flex-col bg-background overflow-hidden">
      {/* Header with Back Button */}
      <div className="flex-shrink-0 border-b bg-card shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button 
              variant="ghost" 
              onClick={handleGoBack} 
              className="gap-2 hover:bg-muted"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Go Back</span>
            </Button>
            <div className="h-6 w-px bg-border" />
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-primary/10">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h1 className="text-lg font-semibold">Select Delivery Location</h1>
                <p className="text-xs text-muted-foreground hidden sm:block">
                  Click on the map or use your current location
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        {/* Side panel */}
        <div className="w-full md:w-96 lg:w-[400px] h-64 md:h-full order-2 md:order-1 border-t md:border-t-0 md:border-r flex flex-col overflow-hidden bg-card">
          <LocationConfirmation
            coords={coords}
            saving={saving}
            status={status}
            onSave={saveLocation}
          />
        </div>

        {/* Map */}
        <div className="w-full md:flex-1 h-[calc(100vh-200px)] md:h-full order-1 md:order-2">
          <LocationMap onSelectLocation={handleLocationSelect} />
        </div>
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
