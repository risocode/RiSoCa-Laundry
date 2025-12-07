
"use client";

import { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, Package, Truck, AlertCircle, Weight, Layers } from 'lucide-react';
import { Separator } from './ui/separator';

const packages = [
  { id: 'package1', label: 'Package 1', description: 'Wash, Dry, & Fold' },
  { id: 'package2', label: 'Package 2', description: 'One-Way Transport' },
  { id: 'package3', label: 'Package 3', description: 'All-In (Pick Up & Delivery)' },
];

const orderSchema = z.object({
  servicePackage: z.string().min(1, "Please select a package."),
  weight: z.coerce.number().min(0, "Weight cannot be negative.").max(100, "Maximum of 100kg per order.").optional(),
  distance: z.coerce.number().min(0, "Distance cannot be negative.").max(50, "We don't deliver beyond 50 km."),
});

type OrderFormValues = z.infer<typeof orderSchema>;

interface PricingResult {
  computedPrice: number;
}

export function OrderForm() {
  const [isPending, startTransition] = useTransition();
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [calculatedLoads, setCalculatedLoads] = useState(1);

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      servicePackage: 'package1',
      weight: undefined,
      distance: 1,
    },
    mode: 'onChange'
  });

  const { watch } = form;
  const watchedValues = watch();

  const calculatePrice = (values: OrderFormValues) => {
    startTransition(() => {
      const { servicePackage, weight = 0, distance } = values;

      const effectiveWeight = weight < 7.5 ? 7.5 : weight;
      const loads = Math.max(1, Math.ceil(effectiveWeight / 7.5));
      setCalculatedLoads(loads);
      const baseCost = loads * 180;

      let transportFee = 0;
      const billableDistance = Math.max(0, distance - 1);

      if (servicePackage === 'package2') {
        transportFee = billableDistance * 10;
      } else if (servicePackage === 'package3') {
        transportFee = billableDistance * 10 * 2;
      }
      
      const computedPrice = baseCost + transportFee;

      setPricingResult({
        computedPrice,
      });
    });
  };

  useEffect(() => {
    const parsed = orderSchema.safeParse(watchedValues);
    if (parsed.success) {
      calculatePrice(parsed.data);
    } else {
      setPricingResult(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedValues.servicePackage, watchedValues.weight, watchedValues.distance]);


  const onSubmit = (data: OrderFormValues) => {
    console.log('Order submitted:', data, 'with price:', pricingResult?.computedPrice);
    alert(`Order placed! Total cost: ₱${pricingResult?.computedPrice.toFixed(2)}`);
  };

  return (
    <Card className="shadow-lg w-full">
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardHeader className="p-4">
          <CardTitle>Create Order</CardTitle>
          <CardDescription className="text-xs">Select a package to calculate the price.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 p-4 pt-0">
          
          <div className="space-y-2">
            <Label className="text-base font-semibold">1. Select a Package</Label>
            <Controller
              name="servicePackage"
              control={form.control}
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-1 md:grid-cols-2 gap-2"
                >
                  {packages.map((pkg) => (
                    <Label
                      key={pkg.id}
                      htmlFor={pkg.id}
                      className={`flex items-start gap-3 rounded-lg border p-3 transition-all cursor-pointer hover:bg-muted/50 ${field.value === pkg.id ? 'border-primary bg-primary/5' : ''}`}
                    >
                      <RadioGroupItem value={pkg.id} id={pkg.id} className="mt-1"/>
                      <div className="grid gap-0.5">
                        <span className="font-semibold text-sm">{pkg.label}</span>
                        <span className="text-xs text-muted-foreground">{pkg.description}</span>
                      </div>
                    </Label>
                  ))}
                </RadioGroup>
              )}
            />
            {form.formState.errors.servicePackage && (
              <p className="text-xs font-medium text-destructive">{form.formState.errors.servicePackage.message}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
                <Label htmlFor="weight" className="text-base font-semibold">2. Weight (kg)</Label>
                <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                    <Weight className="h-5 w-5 text-muted-foreground" />
                    <div className='flex-grow'>
                        <Label htmlFor="weight" className="text-xs font-medium text-muted-foreground">Weight in KG (Optional)</Label>
                        <Controller
                            name="weight"
                            control={form.control}
                            render={({ field }) => <Input id="weight" type="number" placeholder="e.g., 7.5kg" className="text-center bg-transparent border-0 text-base font-semibold p-0 h-auto focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" {...field} value={field.value ?? ''}/>}
                        />
                    </div>
                </div>
                 {form.formState.errors.weight && (
                    <p className="text-xs font-medium text-destructive">{form.formState.errors.weight.message}</p>
                )}
            </div>
            <div className="space-y-2">
                <Label htmlFor="distance" className="text-base font-semibold">3. Location</Label>
                <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                    <Truck className="h-5 w-5 text-muted-foreground" />
                    <div className='flex-grow'>
                        <Label htmlFor="distance" className="text-xs font-medium text-muted-foreground">Distance (km)</Label>
                        <Controller
                        name="distance"
                        control={form.control}
                        render={({ field }) => <Input id="distance" type="number" placeholder="e.g. 1" className="text-center bg-transparent border-0 text-base font-semibold p-0 h-auto focus-visible:ring-0" {...field} />}
                        />
                    </div>
                </div>
                {form.formState.errors.distance && (
                <p className="text-xs font-medium text-destructive">{form.formState.errors.distance.message}</p>
                )}
            </div>
          </div>


          <Separator />

          <div className="space-y-2">
            <h3 className="text-base font-semibold">Pricing Summary</h3>
            <div className="bg-muted/50 p-3 rounded-lg space-y-2">
                {isPending ? (
                    <div className="flex items-center justify-center text-muted-foreground h-16">
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        <span className="text-sm">Calculating...</span>
                    </div>
                ) : pricingResult ? (
                    <>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-base flex items-center gap-2"><Layers className="h-4 w-4" /> Loads</span>
                             <span className="text-base font-bold">
                                {calculatedLoads}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-muted-foreground text-base">Total</span>
                            <span className="text-2xl font-bold text-primary">
                                ₱{pricingResult.computedPrice.toFixed(2)}
                            </span>
                        </div>
                    </>
                ) : (
                    <div className="text-center text-muted-foreground h-16 flex items-center justify-center text-sm">Select a package to see the price.</div>
                )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button 
            type="submit" 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base py-5"
            disabled={isPending || !form.formState.isValid}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Place Order
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
}
