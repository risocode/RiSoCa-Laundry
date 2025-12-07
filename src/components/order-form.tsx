
"use client";

import { useState, useEffect, useTransition } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter, useSearchParams } from 'next/navigation';
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
import { Loader2, Weight, Layers, Info, MapPin } from 'lucide-react';
import { Separator } from './ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useOrders } from '@/context/OrderContext';

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
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [calculatedLoads, setCalculatedLoads] = useState(1);
  const [showDistancePrompt, setShowDistancePrompt] = useState(false);
  const { addOrder } = useOrders();
  
  const distanceParam = searchParams.get('distance');
  const packageParam = searchParams.get('servicePackage');

  const form = useForm<OrderFormValues>({
    resolver: zodResolver(orderSchema),
    defaultValues: {
      servicePackage: packageParam || 'package1',
      weight: undefined,
      distance: distanceParam ? parseFloat(distanceParam) : 0,
    },
    mode: 'onChange'
  });

  const { watch, setValue, trigger, control } = form;
  const watchedValues = watch();
  const servicePackage = watch('servicePackage');
  const needsLocation = servicePackage === 'package2' || servicePackage === 'package3';
  const isFreeDelivery = needsLocation && watchedValues.distance > 0 && watchedValues.distance <= 0.5;

  // Effect to update form distance when URL param changes
  useEffect(() => {
    if (distanceParam) {
      const numericDistance = parseFloat(distanceParam);
      if (!isNaN(numericDistance)) {
        setValue('distance', numericDistance, { shouldValidate: true });
      }
    }
  }, [distanceParam, setValue]);

  const handleLocationSelect = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('servicePackage', watchedValues.servicePackage);
    router.push(`/select-location?${params.toString()}`);
  };

  useEffect(() => {
    // When package changes, reset distance if it's not needed
    if (!needsLocation && !distanceParam) { // Keep distance if it came from URL
        setValue('distance', 0);
    }
    // Re-trigger validation when the dependency changes
    trigger();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [needsLocation, setValue, trigger]);


  const calculatePrice = (values: OrderFormValues) => {
    startTransition(() => {
      const { servicePackage, weight, distance } = values;

      const needsLocationForCalc = servicePackage === 'package2' || servicePackage === 'package3';
      
      if (needsLocationForCalc && (!distance || distance <= 0)) {
        setPricingResult(null);
        setShowDistancePrompt(true);
        return;
      }
      setShowDistancePrompt(false);
      
      const isFree = needsLocationForCalc && distance > 0 && distance <= 0.5;
      
      let effectiveWeight = 0;
      if (isFree) {
        effectiveWeight = 7.5;
      } else if (weight && weight > 0) {
        effectiveWeight = weight;
      } else if (servicePackage === 'package1' && (weight === undefined || weight === 0)) {
        effectiveWeight = 7.5;
      }

      const loads = Math.max(1, Math.ceil(effectiveWeight / 7.5));
      setCalculatedLoads(loads);
      const baseCost = loads * 180;

      let transportFee = 0;
      if (!isFree && needsLocationForCalc) {
        const billableDistance = Math.max(0, distance - 1);
        if (servicePackage === 'package2') {
            transportFee = billableDistance * 10;
        } else if (servicePackage === 'package3') {
            transportFee = billableDistance * 10 * 2;
        }
      }
      
      const computedPrice = baseCost + transportFee;

      setPricingResult({
        computedPrice,
      });
    });
  };

  useEffect(() => {
    const subscription = watch((values) => {
        const parsed = orderSchema.safeParse(values);
        if (parsed.success) {
            calculatePrice(parsed.data);
        } else {
            const needsDistance = (values.servicePackage === 'package2' || values.servicePackage === 'package3');
            if (needsDistance && (!values.distance || values.distance <= 0)) {
                setPricingResult(null);
                setShowDistancePrompt(true);
            } else if (values.servicePackage === 'package1') {
                calculatePrice(values as OrderFormValues); // Calculate even if weight is missing for package1
            } else {
                setPricingResult(null);
                setShowDistancePrompt(false);
            }
        }
    });
    
    // Manually trigger calculation on initial load
    calculatePrice(form.getValues());
    
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);


  const onSubmit = (data: OrderFormValues) => {
    if (!pricingResult) return;
    
    let finalWeight = data.weight;
    if (data.servicePackage === 'package1' && (finalWeight === undefined || finalWeight === 0)) {
        finalWeight = 7.5;
    } else if (isFreeDelivery) {
        finalWeight = 7.5;
    }

    const newOrder = {
        id: `ORD${String(Date.now()).slice(-3)}${String(Math.floor(Math.random() * 100)).padStart(2, '0')}`,
        customer: 'Jane Doe', // Placeholder
        contact: '09123456789', // Placeholder
        load: calculatedLoads,
        weight: finalWeight || 0,
        status: 'Order Placed',
        total: pricingResult.computedPrice,
    };
    addOrder(newOrder);
    router.push('/order-status');
  };

  return (
    <>
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
              control={control}
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

          <div className={`grid gap-4 ${needsLocation ? 'grid-cols-2' : 'grid-cols-1'}`}>
            <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Label htmlFor="weight" className="text-base font-semibold">2. Weight (kg)</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Info className="h-4 w-4 text-muted-foreground cursor-pointer" />
                    </PopoverTrigger>
                    <PopoverContent className="w-auto">
                      <p className="max-w-xs text-sm">
                        Final weight will be confirmed at the shop. One load is 7.5kg. Any excess is considered a new load.
                      </p>
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="flex items-center gap-2 bg-muted/50 p-2 rounded-md">
                    <Weight className="h-5 w-5 text-muted-foreground" />
                    <div className='flex-grow'>
                        <Label htmlFor="weight" className="text-xs font-medium text-muted-foreground">Weight in KG (Optional)</Label>
                        <Controller
                            name="weight"
                            control={control}
                            render={({ field }) => <Input id="weight" type="number" placeholder="e.g., 7.5" className="text-center bg-transparent border-0 text-base font-semibold p-0 h-auto focus-visible:ring-0 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" {...field} value={field.value ?? ''} disabled={isFreeDelivery}/>}
                        />
                    </div>
                </div>
                 {form.formState.errors.weight && (
                    <p className="text-xs font-medium text-destructive">{form.formState.errors.weight.message}</p>
                )}
                 {isFreeDelivery && <p className="text-xs text-center text-primary font-semibold">Free delivery applied! Weight set to 7.5kg.</p>}
            </div>
            {needsLocation && (
              <div className="space-y-2">
                  <Label htmlFor="distance" className="text-base font-semibold">3. Location</Label>
                  <div className="flex flex-col gap-2">
                      <Button type="button" variant="outline" onClick={handleLocationSelect} className="w-full">
                        <MapPin className="mr-2 h-4 w-4"/>
                        {watchedValues.distance > 0 ? `Distance: ${watchedValues.distance.toFixed(2)} km (Change)` : 'Select Location'}
                      </Button>
                  </div>
                  {form.formState.errors.distance && !watchedValues.distance ? (
                  <p className="text-xs font-medium text-destructive">Please select a location.</p>
                  ): null}
              </div>
            )}
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
                ) : showDistancePrompt ? (
                    <div className="text-center text-primary h-16 flex items-center justify-center text-sm font-semibold">
                        {servicePackage === 'package2'
                            ? 'Please select a location for delivery or Pick Up.'
                            : 'Please select a location for delivery.'}
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
                     <div className="text-center text-muted-foreground h-16 flex items-center justify-center text-sm">Enter weight and select package.</div>
                )}
            </div>
          </div>
        </CardContent>
        <CardFooter className="p-4 pt-0">
          <Button 
            type="submit" 
            className="w-full bg-accent text-accent-foreground hover:bg-accent/90 text-base py-5"
            disabled={isPending || !form.formState.isValid || showDistancePrompt}
          >
            {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Place Order
          </Button>
        </CardFooter>
      </form>
    </Card>
    </>
  );
}
