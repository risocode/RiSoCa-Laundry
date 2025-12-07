
'use client';

import { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { LocateFixed } from 'lucide-react';

export function LocationConfirmation() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const distanceParam = searchParams.get('distance');
    const [calculatedDistance, setCalculatedDistance] = useState(distanceParam ? parseFloat(distanceParam) : 0);

    const handleConfirm = () => {
        const params = new URLSearchParams();
        params.set('distance', calculatedDistance.toFixed(2));
        router.push(`/create-order?${params.toString()}`);
    };

    return (
        <Card className="h-full w-full rounded-none border-0 md:border-r shadow-none flex flex-col">
            <CardHeader className="p-4">
                <CardTitle className="flex items-center gap-2">
                    <LocateFixed /> Confirm Your Location
                </CardTitle>
                <CardDescription>
                    Distance is calculated from our main branch.
                </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow flex flex-col items-center justify-center p-4">
                <div className="text-center">
                    <p className="text-sm text-muted-foreground">Calculated Distance</p>
                    <p className="text-4xl font-bold text-primary">{calculatedDistance.toFixed(2)} km</p>
                </div>
            </CardContent>
            <CardFooter className="p-4">
                <Button onClick={handleConfirm} className="w-full text-base py-6">
                    Confirm & Save Location
                </Button>
            </CardFooter>
        </Card>
    );
}
