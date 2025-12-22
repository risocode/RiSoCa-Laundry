'use client';
import { Suspense } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { OrderForm } from '@/components/order-form';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, ShoppingBag, Package, Truck, Sparkles, CheckCircle2, Clock, Info, ArrowRight, WashingMachine, MapPin, Phone, HelpCircle } from 'lucide-react';
import Link from 'next/link';

function CreateOrderForm() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <PromoBanner />
          <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
            <div className="container mx-auto px-4 py-6 sm:py-8">
              <div className="w-full max-w-4xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="text-center space-y-2">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <ShoppingBag className="h-6 w-6 text-primary" />
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-bold">Create New Order</h1>
                  </div>
                  <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                    Select your service package and provide order details to get started. We'll calculate the price instantly.
                  </p>
                </div>

                {/* Service Information Section */}
                <Card className="shadow-lg border-2">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      Our Service Packages
                    </CardTitle>
                    <CardDescription className="text-sm mt-2">
                      Choose the perfect package for your laundry needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2 p-4 rounded-lg border-2 border-blue-200 bg-blue-50/50 dark:bg-blue-950/10">
                        <div className="flex items-center gap-2 mb-2">
                          <WashingMachine className="h-5 w-5 text-blue-600" />
                          <h3 className="font-semibold text-base">Package 1</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">Wash, Dry, & Fold</p>
                        <p className="text-xs text-muted-foreground mt-2">Perfect for customers who can drop off and pick up their laundry at our location. Standard wash, dry, and fold service.</p>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-green-200 bg-green-50/50 dark:bg-green-950/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Truck className="h-5 w-5 text-green-600" />
                          <h3 className="font-semibold text-base">Package 2</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">One-Way Transport</p>
                        <p className="text-xs text-muted-foreground mt-2">Choose either pickup or delivery. We'll handle the transportation one way, and you handle the other.</p>
                      </div>
                      <div className="space-y-2 p-4 rounded-lg border-2 border-purple-200 bg-purple-50/50 dark:bg-purple-950/10">
                        <div className="flex items-center gap-2 mb-2">
                          <Package className="h-5 w-5 text-purple-600" />
                          <h3 className="font-semibold text-base">Package 3</h3>
                        </div>
                        <p className="text-sm text-muted-foreground">All-In Service</p>
                        <p className="text-xs text-muted-foreground mt-2">Complete convenience! We pick up your laundry and deliver it back to you clean and folded.</p>
                      </div>
                    </div>
                    
                    <Separator />
                    
                    <div className="space-y-3">
                      <h3 className="font-semibold text-lg flex items-center gap-2">
                        <CheckCircle2 className="h-5 w-5 text-primary" />
                        Why Choose RKR Laundry?
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Fast Turnaround</p>
                            <p className="text-xs text-muted-foreground">Standard service completed in 24-48 hours</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                            <Sparkles className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Quality Service</p>
                            <p className="text-xs text-muted-foreground">Professional cleaning with attention to detail</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                            <MapPin className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Free First Kilometer</p>
                            <p className="text-xs text-muted-foreground">No delivery fee for the first kilometer</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <div className="p-1.5 rounded bg-primary/10 mt-0.5">
                            <Phone className="h-4 w-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Real-Time Tracking</p>
                            <p className="text-xs text-muted-foreground">Track your order status in real-time</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Order Form */}
                <OrderForm />

                {/* Pricing Information Card */}
                <Card className="shadow-lg border-2 bg-gradient-to-br from-primary/5 to-primary/10">
                  <CardHeader className="border-b">
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                      <Info className="h-5 w-5 text-primary" />
                      Pricing Information
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Transparent pricing with no hidden fees
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Standard Service (per 7.5kg load)</span>
                        </div>
                        <Badge variant="outline" className="text-base font-bold">₱180</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                        <div className="flex items-center gap-2">
                          <Truck className="h-4 w-4 text-green-600" />
                          <span className="text-sm font-medium">First 1 km delivery</span>
                        </div>
                        <Badge variant="outline" className="text-base font-bold text-green-600">Free</Badge>
                      </div>
                      <div className="flex items-center justify-between p-3 rounded-lg bg-background border">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">Each additional kilometer</span>
                        </div>
                        <Badge variant="outline" className="text-base font-bold">₱20</Badge>
                      </div>
                    </div>
                    <div className="pt-2">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> Weight is calculated in loads. One load equals 7.5kg. Any weight up to 7.5kg is considered one load. Additional loads are calculated proportionally.
                      </p>
                    </div>
                    <div className="pt-2">
                      <Link href="/service-rates" className="text-sm text-primary hover:underline flex items-center gap-1">
                        View detailed service rates <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Process Timeline */}
                <Card className="shadow-lg border-2">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" />
                      How It Works
                    </CardTitle>
                    <CardDescription className="text-sm mt-2">
                      Simple steps from order to delivery
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                            1
                          </div>
                          <div className="w-0.5 h-full bg-primary/20 mt-2"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <h3 className="font-semibold text-base mb-1">Place Your Order</h3>
                          <p className="text-sm text-muted-foreground">Select your service package, enter your laundry weight, and provide your details. Our system calculates the price instantly.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                            2
                          </div>
                          <div className="w-0.5 h-full bg-primary/20 mt-2"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <h3 className="font-semibold text-base mb-1">We Process Your Laundry</h3>
                          <p className="text-sm text-muted-foreground">Your laundry goes through our professional washing, drying, and folding process. Track the status in real-time on our website.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                            3
                          </div>
                          <div className="w-0.5 h-full bg-primary/20 mt-2"></div>
                        </div>
                        <div className="flex-1 pb-6">
                          <h3 className="font-semibold text-base mb-1">Ready for Pickup/Delivery</h3>
                          <p className="text-sm text-muted-foreground">Once your laundry is ready, you'll receive a notification. Pick it up at our location or we'll deliver it to your address.</p>
                        </div>
                      </div>
                      <div className="flex gap-4">
                        <div className="flex flex-col items-center">
                          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold text-sm flex-shrink-0">
                            4
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-base mb-1">Enjoy Clean Laundry</h3>
                          <p className="text-sm text-muted-foreground">Receive your clean, fresh, and neatly folded laundry. Standard service typically takes 24-48 hours from drop-off.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick FAQ */}
                <Card className="shadow-lg border-2">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
                    <CardTitle className="text-xl sm:text-2xl flex items-center gap-2">
                      <HelpCircle className="h-5 w-5 text-primary" />
                      Frequently Asked Questions
                    </CardTitle>
                    <CardDescription className="text-sm mt-2">
                      Common questions about our services
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6">
                    <Accordion type="single" collapsible className="w-full">
                      <AccordionItem value="item-1">
                        <AccordionTrigger className="text-left">How is the weight calculated?</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          Our pricing is based on loads, where one load equals 7.5kg. Any weight up to 7.5kg is considered one load. If your laundry exceeds 7.5kg, it will be calculated as additional loads proportionally.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2">
                        <AccordionTrigger className="text-left">What payment methods do you accept?</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          We accept cash payments. Payment can be made when you drop off your laundry or upon delivery. For more details, please contact us directly.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3">
                        <AccordionTrigger className="text-left">How long does it take to complete an order?</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          Standard service typically takes 24-48 hours from when your laundry arrives at the shop. Rush orders may be available upon request - please contact us for availability.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4">
                        <AccordionTrigger className="text-left">Is there a minimum weight requirement?</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          There's no minimum weight requirement. We accept laundry of any size, from a single item to multiple loads. Our pricing is calculated based on the actual weight of your laundry.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-5">
                        <AccordionTrigger className="text-left">Can I track my order status?</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground">
                          Yes! Once you place an order, you can track its real-time status by visiting the 'Order Status' page on our website. You'll see updates from 'Order Placed' all the way to 'Delivered'.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <div className="mt-4 pt-4 border-t">
                      <Link href="/faqs" className="text-sm text-primary hover:underline flex items-center gap-1">
                        View all FAQs <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </main>
          <AppFooter />
        </div>
    )
}

export default function CreateOrderPage() {
  return (
      <Suspense fallback={<div className="h-screen w-screen bg-muted flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>}>
          <CreateOrderForm />
      </Suspense>
  );
}
