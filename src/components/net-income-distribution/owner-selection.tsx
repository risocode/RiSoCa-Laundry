"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckSquare, Square, Users } from 'lucide-react';
import { cn, formatCurrency } from '@/lib/utils';
import { OWNERS, COLORS } from './types';
import type { OwnerDistribution } from './types';

interface OwnerSelectionProps {
  selectedOwners: Set<string>;
  distribution: OwnerDistribution[];
  onToggleOwner: (owner: string) => void;
}

export function OwnerSelection({
  selectedOwners,
  distribution,
  onToggleOwner,
}: OwnerSelectionProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Users className="h-5 w-5" />
          Select Owners for Distribution
        </CardTitle>
        <CardDescription>Choose which owners should receive the distribution</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {OWNERS.map((owner, index) => {
            const isSelected = selectedOwners.has(owner);
            const ownerData = distribution.find(d => d.name === owner);
            const isDisabled = owner === 'Racky';
            return (
              <div
                key={owner}
                className={cn(
                  "flex items-center justify-between p-3 border rounded-lg transition-colors",
                  isDisabled 
                    ? "bg-muted/30 opacity-50 cursor-not-allowed" 
                    : "hover:bg-muted/50 cursor-pointer"
                )}
                onClick={() => !isDisabled && onToggleOwner(owner)}
              >
                <div className="flex items-center gap-3">
                  {isSelected ? (
                    <CheckSquare className={cn("h-5 w-5", isDisabled ? "text-muted-foreground" : "text-primary")} />
                  ) : (
                    <Square className="h-5 w-5 text-muted-foreground" />
                  )}
                  <div
                    className={cn("w-4 h-4 rounded-full", isDisabled && "opacity-50")}
                    style={{ backgroundColor: COLORS[index] }}
                  />
                  <span className={cn("font-semibold", isDisabled && "text-muted-foreground line-through")}>
                    {owner}
                  </span>
                  {isDisabled && (
                    <Badge variant="outline" className="ml-2 text-xs">
                      Unavailable
                    </Badge>
                  )}
                </div>
                {ownerData && ownerData.share > 0 && !isDisabled && (
                  <Badge variant={isSelected ? "default" : "outline"}>
                    {isSelected ? `₱${formatCurrency(ownerData.remainingShare)}` : 'Excluded'}
                  </Badge>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          Distribution will be split equally among {selectedOwners.size} selected owner{selectedOwners.size !== 1 ? 's' : ''}
        </p>
      </CardContent>
    </Card>
  );
}
