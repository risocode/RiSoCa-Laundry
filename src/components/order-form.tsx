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
import { Loader2, Weight, Layers, Info, MapPin, User, Phone, Bike, PersonStanding } from 'lucide-react';
import { Separator } from './ui/separator';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import type { Order } from './order-list';
import { useAuthSession } from '@/hooks/use-auth-session';
import { createOrderWithHistory, generateTemporaryOrderId, countCustomerOrdersToday, cancelOrderByCustomer } from '@/lib/api/orders';
import { supabase } from '@/lib/supabase-client';

const packages = [
  { id: 'package1', label: 'Package 1', description: 'Wash, Dry, & Fold' },
  { id: 'package2', label: 'Package 2', description: 'One-Way Transport' },
  { id: 'package3', label: 'Package 3', description: 'All-In (Pick Up & Delivery)' },
];

const orderSchema = z.object({
  servicePackage: z.string().min(1, "Please select a package."),
  weight: z.coerce.number().min(0, "Weight cannot be negative.").max(75, "Maximum of 10 loads (75kg) per order.").optional(),
  distance: z.coerce.number().min(0, "Distance cannot be negative.").max(50, "We don't deliver beyond 50 km."),
});

const customerInfoSchema = z.object({
    customerName: z.string().min(2, "Name is required."),
    contactNumber: z.string().min(10, "A valid contact number is required."),
    deliveryOption: z.string().optional(),
});

type OrderFormValues = z.infer<typeof orderSchema>;
type CustomerFormValues = z.infer<typeof customerInfoSchema>;

interface PricingResult {
  computedPrice: number;
}

type PendingOrder = {
    orderData: OrderFormValues;
    pricing: PricingResult;
    loads: number;
};

export function OrderForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthSession();
  const [isPending, startTransition] = useTransition();
  const [pricingResult, setPricingResult] = useState<PricingResult | null>(null);
  const [calculatedLoads, setCalculatedLoads] = useState(1);
  const [showDistancePrompt, setShowDistancePrompt] = useState(false);

  const [isCustomerInfoDialogOpen, setIsCustomerInfoDialogOpen] = useState(false);
  const [pendingOrder, setPendingOrder] = useState<PendingOrder | null>(null);
  const [showAccountPromptDialog, setShowAccountPromptDialog] = useState(false);
  const [orderCount, setOrderCount] = useState<number | null>(null);
  const [loadingOrderCount, setLoadingOrderCount] = useState(false);
  
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

  const customerForm = useForm<CustomerFormValues>({
    resolver: zodResolver(customerInfoSchema),
    defaultValues: {
        customerName: '',
        contactNumber: '',
        deliveryOption: 'drop-off',
    }
  });

  const { watch, setValue, trigger, control } = form;
  const watchedValues = watch();
  const servicePackage = watch('servicePackage');
  const needsLocation = servicePackage === 'package2' || servicePackage === 'package3';
  const isFreeDelivery = needsLocation && watchedValues.distance > 0 && watchedValues.distance <= 0.5;

  // Auto-populate customer info from profile when dialog opens
  useEffect(() => {
    async function loadCustomerProfile() {
      if (!isCustomerInfoDialogOpen || !user) return;
      
      try {
        // Fetch profile data
        const { data: profileData, error } = await supabase
          .from('profiles')
          .select('first_name, contact_number')
          .eq('id', user.id)
          .maybeSingle();
        
        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching profile:', error);
          return;
        }
        
        // Auto-fill form with profile data
        if (profileData) {
          if (profileData.first_name) {
            customerForm.setValue('customerName', profileData.first_name);
          }
          if (profileData.contact_number) {
            customerForm.setValue('contactNumber', profileData.contact_number);
          }
        } else {
          // Fallback to user metadata if profile doesn't exist
          const firstName = user.user_metadata?.first_name || 
                           user.user_metadata?.firstName || 
                           '';
          if (firstName) {
            customerForm.setValue('customerName', firstName);
          }
        }
      } catch (error) {
        console.error('Error loading customer profile:', error);
      }
    }
    
    loadCustomerProfile();
  }, [isCustomerInfoDialogOpen, user, customerForm]);

  useEffect(() => {
    if (distanceParam) {
      const numericDistance = parseFloat(distanceParam);
      if (!isNaN(numericDistance)) {
        setValue('distance', numericDistance, { shouldValidate: true });
        // Trigger validation after setting value
        trigger('distance');
      }
    } else if (needsLocation) {
      // If needs location but no distance param, reset to 0
      setValue('distance', 0, { shouldValidate: true });
      trigger('distance');
    }
  }, [distanceParam, setValue, trigger, needsLocation]);

  // Load order count for logged-in users
  useEffect(() => {
    async function loadOrderCount() {
      if (!user || authLoading) {
        setOrderCount(null);
        return;
      }
      
      setLoadingOrderCount(true);
      const count = await countCustomerOrdersToday(user.id);
      setOrderCount(count);
      setLoadingOrderCount(false);
    }

    loadOrderCount();
  }, [user, authLoading]);

  const handleLocationSelect = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('servicePackage', watchedValues.servicePackage);
    
    // Store servicePackage in localStorage as backup
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedServicePackage', watchedValues.servicePackage);
    }
    
    router.push(`/select-location?${params.toString()}`);
  };

  useEffect(() => {
    if (!needsLocation && !distanceParam) { 
        setValue('distance', 0);
    }
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
            transportFee = billableDistance * 20;
        } else if (servicePackage === 'package3') {
            transportFee = billableDistance * 20 * 2;
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
                calculatePrice(values as OrderFormValues);
            } else {
                setPricingResult(null);
                setShowDistancePrompt(false);
            }
        }
    });
    
    calculatePrice(form.getValues());
    
    return () => subscription.unsubscribe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch]);

  const onOrderSubmit = (data: OrderFormValues) => {
    if (authLoading) return;
    if (!user) {
        // Show dialog prompting to create account first
        setShowAccountPromptDialog(true);
        return;
    }
    if (!pricingResult) return;
    setPendingOrder({
        orderData: data,
        pricing: pricingResult,
        loads: calculatedLoads
    });
    setIsCustomerInfoDialogOpen(true);
  };

  const onCustomerInfoSubmit = async (customerData: CustomerFormValues) => {
    if (!pendingOrder || !user) return;

    // Check daily order limit (5 orders per day, including canceled)
    const currentOrderCount = await countCustomerOrdersToday(user.id);
    setOrderCount(currentOrderCount);
    if (currentOrderCount >= 5) {
      toast({
        variant: 'destructive',
        title: 'Daily Order Limit Reached',
        description: "You've reached the maximum of 5 orders today. Please try again tomorrow. If you need to place more orders, please contact us or give us a call.",
      });
      setIsCustomerInfoDialogOpen(false);
      // Navigate to contact page
      router.push('/contact-us');
      return;
    }

    // Note: Contact number is NOT saved to profile - only used for this order
    // Generate temporary ID - will be replaced with RKR format when status changes to "Order Placed"
    const tempOrderId = await generateTemporaryOrderId();
    const initialStatus = 'Order Created';

    const newOrder: Order = {
        id: tempOrderId,
        userId: user.id,
        customerName: customerData.customerName,
        contactNumber: customerData.contactNumber,
        load: pendingOrder.loads,
        weight: pendingOrder.orderData.weight || 7.5,
        status: initialStatus,
        total: pendingOrder.pricing.computedPrice,
        orderDate: new Date(),
        isPaid: false,
        servicePackage: pendingOrder.orderData.servicePackage,
        distance: pendingOrder.orderData.distance ?? 0,
        deliveryOption: customerData.deliveryOption,
        statusHistory: [{ status: initialStatus, timestamp: new Date() }],
    };

    const { error } = await createOrderWithHistory({
        id: tempOrderId,
        customer_id: user.id,
        customer_name: newOrder.customerName,
        contact_number: newOrder.contactNumber,
        service_package: pendingOrder.orderData.servicePackage as 'package1' | 'package2' | 'package3',
        weight: newOrder.weight,
        loads: newOrder.load,
        distance: newOrder.distance,
        delivery_option: newOrder.deliveryOption,
        status: initialStatus,
        total: newOrder.total,
        is_paid: newOrder.isPaid,
    });

    if (error) {
        // Handle duplicate ID error (race condition) - retry with new temp ID
        if (error.code === '23505' || error.message?.includes('duplicate') || error.message?.includes('unique')) {
          const retryTempId = await generateTemporaryOrderId();
          const { error: retryCreateError } = await createOrderWithHistory({
            id: retryTempId,
            customer_id: user.id,
            customer_name: newOrder.customerName,
            contact_number: newOrder.contactNumber,
            service_package: pendingOrder.orderData.servicePackage as 'package1' | 'package2' | 'package3',
            weight: newOrder.weight,
            loads: newOrder.load,
            distance: newOrder.distance,
            delivery_option: newOrder.deliveryOption,
            status: initialStatus,
            total: newOrder.total,
            is_paid: newOrder.isPaid,
          });
          if (retryCreateError) {
            console.error("Failed to save order to Supabase (retry)", retryCreateError);
            toast({
              variant: "destructive",
              title: 'Save Error!',
              description: `Could not save your order. Please try again.`
            });
            return;
          }
          toast({
            title: 'Order Created!',
            description: `Your order has been created. Please wait for approval. Your laundry must first arrive at the shop before this order can be processed.`
          });
          // Optimistically update order count
          setOrderCount(prev => (prev !== null ? prev + 1 : 1));
          setTimeout(async () => {
            const newCount = await countCustomerOrdersToday(user.id);
            setOrderCount(newCount);
          }, 500);
          setIsCustomerInfoDialogOpen(false);
          customerForm.reset();
          form.reset();
          startTransition(() => {
            router.push('/order-status');
          });
          return;
        }
        console.error("Failed to save order to Supabase", error);
        toast({
          variant: "destructive",
          title: 'Save Error!',
          description: `Could not save your order. Please try again.`
        });
        return;
    }
    
    toast({
      title: 'Order Created!',
      description: `Your order has been created. Please wait for approval. Your laundry must first arrive at the shop before this order can be processed.`
    });

    // Optimistically update order count (increment by 1)
    // Then refresh from server to ensure accuracy
    setOrderCount(prev => (prev !== null ? prev + 1 : 1));
    
    // Refresh order count from server after a short delay to ensure DB consistency
    setTimeout(async () => {
      const newCount = await countCustomerOrdersToday(user.id);
      setOrderCount(newCount);
    }, 500);

    setIsCustomerInfoDialogOpen(false);
    customerForm.reset();
    form.reset();
    
    startTransition(() => {
        router.push('/order-status');
    });
  }

  return (
    <>
    <Card className="shadow-lg w-full flex flex-col">
      <form onSubmit={form.handleSubmit(onOrderSubmit)} className="flex flex-col">
        <CardHeader className="p-4 flex-shrink-0">
          <div className="flex items-start justify-between">
            <div>
              <CardTitle>Create Order</CardTitle>
              <CardDescription className="text-xs">Select a package to calculate the price.</CardDescription>
            </div>
            {user && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Orders today</p>
                {loadingOrderCount ? (
                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                ) : orderCount !== null ? (
                  <p className={`text-sm font-semibold ${orderCount >= 5 ? 'text-destructive' : ''}`}>
                    {orderCount}/5
                  </p>
                ) : null}
              </div>
            )}
          </div>
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
                      <Button type="button" variant="outline" onClick={handleLocationSelect} className="w-full whitespace-normal h-auto justify-start text-left">
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
        <CardFooter className="p-4 pt-0 flex-shrink-0 border-t">
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
    
    {/* Account Required Dialog */}
    <Dialog open={showAccountPromptDialog} onOpenChange={setShowAccountPromptDialog}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create an Account to Continue</DialogTitle>
          <DialogDescription>
            Creating an account allows you to easily track your orders and view your order history. It only takes a minute!
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="bg-muted/50 p-4 rounded-lg space-y-2">
            <p className="text-sm font-semibold">Benefits of creating an account:</p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
              <li>Track all your orders in one place</li>
              <li>View order history and status updates</li>
              <li>Faster checkout for future orders</li>
              <li>Receive order notifications</li>
            </ul>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <Button 
              asChild
              className="flex-1 bg-gradient-to-r from-amber-400 to-yellow-500 text-white hover:from-amber-500 hover:to-yellow-600"
              onClick={() => setShowAccountPromptDialog(false)}
            >
              <Link href="/register">
                Create Account
              </Link>
            </Button>
            <Button 
              asChild
              variant="outline"
              className="flex-1"
              onClick={() => setShowAccountPromptDialog(false)}
            >
              <Link href="/login">
                Already have an account? Log in
              </Link>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>

    <Dialog open={isCustomerInfoDialogOpen} onOpenChange={setIsCustomerInfoDialogOpen}>
        <DialogContent>
            <DialogHeader>
                <DialogTitle>Customer Information</DialogTitle>
                <DialogDescription>Please enter your details to complete the order.</DialogDescription>
            </DialogHeader>
            <form onSubmit={customerForm.handleSubmit(onCustomerInfoSubmit)} className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="customerName" className="flex items-center gap-2"><User className="h-4 w-4"/>Customer Name</Label>
                    <Input 
                      id="customerName" 
                      placeholder="e.g., Jane Doe" 
                      {...customerForm.register('customerName')} 
                      disabled
                      className="bg-muted cursor-not-allowed"
                    />
                    <p className="text-xs text-muted-foreground">
                      Name is taken from your profile
                    </p>
                     {customerForm.formState.errors.customerName && (
                        <p className="text-xs font-medium text-destructive">{customerForm.formState.errors.customerName.message}</p>
                    )}
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="contactNumber" className="flex items-center gap-2"><Phone className="h-4 w-4"/>Contact Number</Label>
                    <Input id="contactNumber" type="tel" placeholder="e.g., 09123456789" {...customerForm.register('contactNumber')} />
                    <p className="text-xs text-muted-foreground">
                      You can edit this number for this order only (won't update your profile)
                    </p>
                    {customerForm.formState.errors.contactNumber && (
                        <p className="text-xs font-medium text-destructive">{customerForm.formState.errors.contactNumber.message}</p>
                    )}
                </div>
                {pendingOrder?.orderData.servicePackage === 'package2' && (
                    <div className="space-y-2">
                        <Label className="flex items-center gap-2">Transport Option</Label>
                        <Controller
                            name="deliveryOption"
                            control={customerForm.control}
                            render={({ field }) => (
                                <RadioGroup
                                value={field.value}
                                onValueChange={field.onChange}
                                className="grid grid-cols-2 gap-2"
                                >
                                    <Label htmlFor="drop-off" className={`flex items-center gap-2 rounded-lg border p-3 transition-all cursor-pointer hover:bg-muted/50 ${field.value === 'drop-off' ? 'border-primary bg-primary/5' : ''}`}>
                                        <RadioGroupItem value="drop-off" id="drop-off"/>
                                        <PersonStanding className="h-4 w-4" />
                                        <span className="font-semibold text-sm">Customer Drop-off</span>
                                    </Label>
                                    <Label htmlFor="pick-up" className={`flex items-center gap-2 rounded-lg border p-3 transition-all cursor-pointer hover:bg-muted/50 ${field.value === 'pick-up' ? 'border-primary bg-primary/5' : ''}`}>
                                        <RadioGroupItem value="pick-up" id="pick-up"/>
                                        <Bike className="h-4 w-4" />
                                        <span className="font-semibold text-sm">Rider Pick-up</span>
                                    </Label>
                                </RadioGroup>
                            )}
                        />
                    </div>
                )}
                {(pendingOrder?.orderData.servicePackage === 'package2' || 
                  pendingOrder?.orderData.servicePackage === 'package3') && 
                  (!pendingOrder?.orderData.weight || pendingOrder.orderData.weight <= 7.5) && (
                    <div className="space-y-2 p-4 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                      <div className="flex items-start gap-2">
                        <Info className="h-5 w-5 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" />
                        <div className="space-y-2 flex-1">
                          <p className="text-sm font-semibold text-amber-900 dark:text-amber-100">
                            Important: Price May Change
                          </p>
                          <div className="text-xs text-amber-800 dark:text-amber-200 space-y-1">
                            <p>
                              • The current price is based on estimated weight (1 load = 7.5kg).
                            </p>
                            <p>
                              • <strong>If your actual weight exceeds 7.5kg</strong>, the final price will be adjusted accordingly.
                            </p>
                            <p>
                              • We will contact you via phone to confirm the updated weight and price before processing your order.
                            </p>
                            <p className="mt-2 font-medium">
                              📱 Please track your order status to see the confirmed weight and loads once your laundry arrives at the shop.
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                <DialogFooter>
                    <Button type="submit">Confirm Order</Button>
                </DialogFooter>
            </form>
        </DialogContent>
    </Dialog>
    </>
  );
}
