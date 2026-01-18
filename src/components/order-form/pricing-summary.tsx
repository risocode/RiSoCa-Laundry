"use client";

import { Layers, MapPin, Loader2 } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { PricingResult } from './calculate-price';
import { formatCurrencyWhole } from '@/lib/utils';

interface PricingSummaryProps {
  isPending: boolean;
  showDistancePrompt: boolean;
  pricingResult: PricingResult | null;
  calculatedLoads: number;
  servicePackage: string;
}

export function PricingSummary({
  isPending,
  showDistancePrompt,
  pricingResult,
  calculatedLoads,
  servicePackage,
}: PricingSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
          <span className="text-primary font-bold text-sm">$</span>
        </div>
        <h3 className="text-base font-semibold">Pricing Summary</h3>
      </div>
      <div className="bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 p-5 rounded-lg border-2 border-primary/20 space-y-4">
        {isPending ? (
          <div className="flex items-center justify-center text-muted-foreground h-20">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-primary" />
            <span className="text-sm font-medium">Calculating price...</span>
          </div>
        ) : showDistancePrompt ? (
          <div className="text-center text-primary h-20 flex flex-col items-center justify-center gap-2">
            <MapPin className="h-5 w-5" />
            <p className="text-sm font-semibold">
              {servicePackage === 'package2'
                ? 'Please select a location for delivery or Pick Up.'
                : 'Please select a location for delivery.'}
            </p>
          </div>
        ) : pricingResult ? (
          <>
            <div className="flex justify-between items-center p-3 bg-background/50 rounded-lg">
              <span className="text-muted-foreground text-sm font-medium flex items-center gap-2">
                <Layers className="h-4 w-4" /> 
                Number of Loads
              </span>
              <span className="text-lg font-bold text-foreground">
                {calculatedLoads} {calculatedLoads === 1 ? 'load' : 'loads'}
              </span>
            </div>
            <Separator />
            <div className="flex justify-between items-center pt-2">
              <span className="text-base font-semibold text-foreground">Total Amount</span>
              <span className="text-3xl font-bold text-primary">
                ₱{formatCurrencyWhole(pricingResult.computedPrice)}
              </span>
            </div>
            <p className="text-xs text-muted-foreground text-center pt-2 border-t">
              Final price may vary based on actual weight at the shop
            </p>
          </>
        ) : (
          <div className="text-center text-muted-foreground h-20 flex items-center justify-center text-sm">
            <p>Select a package and enter details to see pricing</p>
          </div>
        )}
      </div>
    </div>
  );
}
