
"use client";

import { useState } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Calculator } from 'lucide-react';

const itemWeights = {
    't-shirt': 0.2,
    'jeans': 0.7,
    'sweater': 0.5,
    'towel': 0.4,
    'bed-sheet': 1.2,
};

type Item = keyof typeof itemWeights;

export default function LaundryCalculatorPage() {
    const [counts, setCounts] = useState<Record<Item, number>>({
        't-shirt': 0,
        'jeans': 0,
        'sweater': 0,
        'towel': 0,
        'bed-sheet': 0,
    });
    const [totalWeight, setTotalWeight] = useState(0);

    const handleCountChange = (item: Item, value: number) => {
        const newCounts = { ...counts, [item]: Math.max(0, value) };
        setCounts(newCounts);
        calculateWeight(newCounts);
    };

    const calculateWeight = (currentCounts: Record<Item, number>) => {
        let weight = 0;
        for (const item in currentCounts) {
            weight += currentCounts[item as Item] * itemWeights[item as Item];
        }
        setTotalWeight(weight);
    };

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center container mx-auto px-4 py-8">
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Calculator /> Laundry Weight Calculator</CardTitle>
                <CardDescription>Estimate the weight of your laundry load before placing an order.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {Object.keys(itemWeights).map((key) => {
                        const item = key as Item;
                        return (
                            <div key={item} className="flex items-center justify-between">
                                <Label htmlFor={item} className="capitalize">{item.replace('-', ' ')}</Label>
                                <Input 
                                    id={item}
                                    type="number"
                                    value={counts[item]}
                                    onChange={(e) => handleCountChange(item, parseInt(e.target.value) || 0)}
                                    className="w-24"
                                />
                            </div>
                        )
                    })}
                </div>
                <div className="mt-8 text-center">
                    <p className="text-muted-foreground">Estimated Total Weight</p>
                    <p className="text-3xl font-bold text-primary">{totalWeight.toFixed(2)} kg</p>
                </div>
            </CardContent>
        </Card>
      </main>
      <AppFooter />
    </div>
  );
}
