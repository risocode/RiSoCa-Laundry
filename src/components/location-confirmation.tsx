
'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { LocateFixed, Navigation, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react'

interface LocationConfirmationProps {
  coords?: { lat: number; lng: number } | null;
  saving?: boolean
  status?: string | null
  onSave?: () => void
}

export function LocationConfirmation({
  coords,
  saving = false,
  status,
  onSave,
}: LocationConfirmationProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const distanceParam = searchParams.get('distance')
  const calculatedDistance = distanceParam
    ? parseFloat(distanceParam)
    : 0

  // Validate distance - must be > 0 and <= 50km
  const isValidDistance = calculatedDistance > 0 && calculatedDistance <= 50

  const handleConfirm = async () => {
    if (!isValidDistance) {
      return
    }

    if (onSave) {
      await onSave()
    }

    const params = new URLSearchParams(searchParams.toString())
    params.set('distance', calculatedDistance.toFixed(2))
    
    // Ensure servicePackage is preserved
    if (!params.has('servicePackage')) {
      // Try to get from localStorage as fallback, or default to package2
      const storedPackage = typeof window !== 'undefined' 
        ? localStorage.getItem('selectedServicePackage') 
        : null
      params.set('servicePackage', storedPackage || 'package2')
    }
    
    router.push(`/create-order?${params.toString()}`)
  }

  return (
    <Card className="h-full w-full rounded-none border-0 shadow-none flex flex-col">
      <CardHeader className="p-5 border-b bg-gradient-to-r from-primary/5 to-primary/10">
        <CardTitle className="flex items-center gap-2 text-lg">
          <div className="p-2 rounded-lg bg-primary/20">
            <LocateFixed className="h-5 w-5 text-primary" />
          </div>
          Confirm Location
        </CardTitle>
        <CardDescription className="text-sm mt-1">
          Distance calculated from our main branch
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow flex flex-col items-center justify-center p-6 overflow-y-auto scrollable">
        <div className="w-full space-y-6">
          {/* Distance Display */}
          <div className="text-center space-y-2">
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-3">
              <Navigation className="h-4 w-4" />
              <span>Delivery Distance</span>
            </div>
            <div className="relative">
              <p className="text-5xl font-bold text-primary mb-1">
                {calculatedDistance.toFixed(2)}
              </p>
              <p className="text-sm font-medium text-muted-foreground">kilometers</p>
            </div>
          </div>

          {/* Status Messages */}
          {status && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${
              status.includes('✅') 
                ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800' 
                : 'bg-muted'
            }`}>
              {status.includes('✅') ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400 flex-shrink-0" />
              ) : (
                <AlertCircle className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
              <p className={`text-sm ${
                status.includes('✅') 
                  ? 'text-green-700 dark:text-green-300' 
                  : 'text-muted-foreground'
              }`}>
                {status}
              </p>
            </div>
          )}

          {/* Validation Messages */}
          {!isValidDistance && calculatedDistance > 0 && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-semibold text-destructive mb-1">
                    Distance Exceeds Limit
                  </p>
                  <p className="text-xs text-destructive/80">
                    Maximum delivery distance is 50km. Please select a location closer to our branch.
                  </p>
                </div>
              </div>
            </div>
          )}

          {calculatedDistance === 0 && (
            <div className="p-3 rounded-lg bg-muted/50 border border-border">
              <div className="flex items-start gap-2">
                <LocateFixed className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  Click on the map to select your delivery location
                </p>
              </div>
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="p-5 border-t bg-muted/30 flex-shrink-0">
        <Button
          onClick={handleConfirm}
          className="w-full text-base font-semibold py-6 h-auto shadow-lg hover:shadow-xl transition-all"
          disabled={saving || !isValidDistance}
          size="lg"
        >
          {saving ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Saving...
            </>
          ) : !isValidDistance ? (
            calculatedDistance === 0 ? (
              <>
                <LocateFixed className="mr-2 h-5 w-5" />
                Select Location First
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-5 w-5" />
                Distance Too Far
              </>
            )
          ) : (
            <>
              <CheckCircle2 className="mr-2 h-5 w-5" />
              Confirm & Continue
            </>
          )}
        </Button>
      </CardFooter>
    </Card>
  )
}
