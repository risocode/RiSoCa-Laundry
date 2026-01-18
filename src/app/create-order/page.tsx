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
import { formatCurrencyWhole } from '@/lib/utils';

function CreateOrderForm() {
    return (
        <div className="flex flex-col h-screen overflow-hidden">
          <AppHeader />
          <PromoBanner />
          <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
            <div className="container mx-auto px-4 py-6 sm:py-8">
              <div className="w-full max-w-4xl mx-auto space-y-6">
                {/* Page Header */}
                <div className="text-center space-y-3 mb-8">
                  <div className="flex items-center justify-center gap-3 mb-3">
                    <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 shadow-lg">
                      <ShoppingBag className="h-7 w-7 text-primary" />
                    </div>
                    <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                      Create New Order
                    </h1>
                  </div>
                  <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                    Select your service package and provide order details to get started. We'll calculate the price instantly.
                  </p>
                </div>

                {/* Main Content - Order Form */}
                <div className="mb-8">
                  <OrderForm />
                </div>

                {/* Divider */}
                <div className="relative my-12">
                  <div className="absolute inset-0 flex items-center">
                    <Separator className="w-full" />
                  </div>
                  <div className="relative flex justify-center">
                    <div className="bg-background px-4">
                      <span className="text-sm text-muted-foreground font-medium">Learn More</span>
                    </div>
                  </div>
                </div>

                {/* Service Information Section */}
                <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border-b p-6">
                    <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Sparkles className="h-6 w-6 text-primary" />
                      </div>
                      Our Service Packages
                    </CardTitle>
                    <CardDescription className="text-sm mt-2 text-base">
                      Choose the perfect package for your laundry needs
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="group space-y-3 p-5 rounded-xl border-2 border-blue-200/50 bg-gradient-to-br from-blue-50/80 to-blue-100/40 dark:from-blue-950/20 dark:to-blue-900/10 hover:border-blue-300 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2.5 rounded-lg bg-blue-500/20 group-hover:bg-blue-500/30 transition-colors">
                            <WashingMachine className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                          </div>
                          <h3 className="font-bold text-lg">Package 1</h3>
                        </div>
                        <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Wash, Dry, & Fold</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Perfect for customers who can drop off and pick up their laundry at our location. Standard wash, dry, and fold service.</p>
                      </div>
                      <div className="group space-y-3 p-5 rounded-xl border-2 border-green-200/50 bg-gradient-to-br from-green-50/80 to-green-100/40 dark:from-green-950/20 dark:to-green-900/10 hover:border-green-300 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2.5 rounded-lg bg-green-500/20 group-hover:bg-green-500/30 transition-colors">
                            <Truck className="h-5 w-5 text-green-600 dark:text-green-400" />
                          </div>
                          <h3 className="font-bold text-lg">Package 2</h3>
                        </div>
                        <p className="text-sm font-medium text-green-700 dark:text-green-300">One-Way Transport</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Choose either pickup or delivery. We'll handle the transportation one way, and you handle the other.</p>
                      </div>
                      <div className="group space-y-3 p-5 rounded-xl border-2 border-purple-200/50 bg-gradient-to-br from-purple-50/80 to-purple-100/40 dark:from-purple-950/20 dark:to-purple-900/10 hover:border-purple-300 hover:shadow-lg transition-all">
                        <div className="flex items-center gap-3 mb-3">
                          <div className="p-2.5 rounded-lg bg-purple-500/20 group-hover:bg-purple-500/30 transition-colors">
                            <Package className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                          </div>
                          <h3 className="font-bold text-lg">Package 3</h3>
                        </div>
                        <p className="text-sm font-medium text-purple-700 dark:text-purple-300">All-In Service</p>
                        <p className="text-xs text-muted-foreground leading-relaxed">Complete convenience! We pick up your laundry and deliver it back to you clean and folded.</p>
                      </div>
                    </div>
                    
                    <Separator className="my-6" />
                    
                    <div className="space-y-4">
                      <h3 className="font-bold text-xl flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                        </div>
                        Why Choose RKR Laundry?
                      </h3>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="p-2.5 rounded-lg bg-primary/15 mt-0.5">
                            <Clock className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm mb-1">Fast Turnaround</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">Standard service completed in 24-48 hours</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="p-2.5 rounded-lg bg-primary/15 mt-0.5">
                            <Sparkles className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm mb-1">Quality Service</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">Professional cleaning with attention to detail</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="p-2.5 rounded-lg bg-primary/15 mt-0.5">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm mb-1">Free First Kilometer</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">No delivery fee for the first kilometer</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                          <div className="p-2.5 rounded-lg bg-primary/15 mt-0.5">
                            <Phone className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm mb-1">Real-Time Tracking</p>
                            <p className="text-xs text-muted-foreground leading-relaxed">Track your order status in real-time</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Pricing Information Card */}
                <Card className="shadow-xl border-2 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 hover:shadow-2xl transition-shadow">
                  <CardHeader className="border-b p-6">
                    <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Info className="h-6 w-6 text-primary" />
                      </div>
                      Pricing Information
                    </CardTitle>
                    <CardDescription className="text-sm mt-2 text-base">
                      Transparent pricing with no hidden fees
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8 space-y-5">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-4 rounded-xl bg-background/80 border-2 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <Package className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-sm font-semibold">Standard Service (per 7.5kg load)</span>
                        </div>
                        <Badge variant="outline" className="text-lg font-bold px-3 py-1">₱{formatCurrencyWhole(180)}</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-background/80 border-2 border-green-200/50 hover:border-green-300 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-green-500/10">
                            <Truck className="h-5 w-5 text-green-600" />
                          </div>
                          <span className="text-sm font-semibold">First 1 km delivery</span>
                        </div>
                        <Badge variant="outline" className="text-lg font-bold text-green-600 px-3 py-1">Free</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-xl bg-background/80 border-2 hover:border-primary/30 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10">
                            <MapPin className="h-5 w-5 text-primary" />
                          </div>
                          <span className="text-sm font-semibold">Each additional kilometer</span>
                        </div>
                        <Badge variant="outline" className="text-lg font-bold px-3 py-1">₱{formatCurrencyWhole(20)}</Badge>
                      </div>
                    </div>
                    <div className="pt-3 p-4 rounded-lg bg-muted/30 border">
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        <strong className="text-foreground">Note:</strong> Weight is calculated in loads. One load equals 7.5kg. Any weight up to 7.5kg is considered one load. Additional loads are calculated proportionally.
                      </p>
                    </div>
                    <div className="pt-2">
                      <Link href="/service-rates" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
                        View detailed service rates <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>

                {/* Process Timeline */}
                <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border-b p-6">
                    <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <Clock className="h-6 w-6 text-primary" />
                      </div>
                      How It Works
                    </CardTitle>
                    <CardDescription className="text-sm mt-2 text-base">
                      Simple steps from order to delivery
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <div className="space-y-8">
                      <div className="flex gap-6">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-base shadow-lg flex-shrink-0">
                            1
                          </div>
                          <div className="w-1 h-full bg-gradient-to-b from-primary/30 to-primary/10 mt-3 rounded-full"></div>
                        </div>
                        <div className="flex-1 pb-8">
                          <h3 className="font-bold text-lg mb-2">Place Your Order</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">Select your service package, enter your laundry weight, and provide your details. Our system calculates the price instantly.</p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-base shadow-lg flex-shrink-0">
                            2
                          </div>
                          <div className="w-1 h-full bg-gradient-to-b from-primary/30 to-primary/10 mt-3 rounded-full"></div>
                        </div>
                        <div className="flex-1 pb-8">
                          <h3 className="font-bold text-lg mb-2">We Process Your Laundry</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">Your laundry goes through our professional washing, drying, and folding process. Track the status in real-time on our website.</p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-base shadow-lg flex-shrink-0">
                            3
                          </div>
                          <div className="w-1 h-full bg-gradient-to-b from-primary/30 to-primary/10 mt-3 rounded-full"></div>
                        </div>
                        <div className="flex-1 pb-8">
                          <h3 className="font-bold text-lg mb-2">Ready for Pickup/Delivery</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">Once your laundry is ready, you'll receive a notification. Pick it up at our location or we'll deliver it to your address.</p>
                        </div>
                      </div>
                      <div className="flex gap-6">
                        <div className="flex flex-col items-center">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/80 text-primary-foreground flex items-center justify-center font-bold text-base shadow-lg flex-shrink-0">
                            4
                          </div>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-2">Enjoy Clean Laundry</h3>
                          <p className="text-sm text-muted-foreground leading-relaxed">Receive your clean, fresh, and neatly folded laundry. Standard service typically takes 24-48 hours from drop-off.</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick FAQ */}
                <Card className="shadow-xl border-2 hover:shadow-2xl transition-shadow">
                  <CardHeader className="bg-gradient-to-r from-primary/15 via-primary/10 to-primary/5 border-b p-6">
                    <CardTitle className="text-2xl sm:text-3xl flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/20">
                        <HelpCircle className="h-6 w-6 text-primary" />
                      </div>
                      Frequently Asked Questions
                    </CardTitle>
                    <CardDescription className="text-sm mt-2 text-base">
                      Common questions about our services
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-6 sm:p-8">
                    <Accordion type="single" collapsible className="w-full space-y-2">
                      <AccordionItem value="item-1" className="border-2 rounded-lg px-4 hover:border-primary/30 transition-colors">
                        <AccordionTrigger className="text-left font-semibold hover:no-underline">How is the weight calculated?</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pt-2 pb-4 leading-relaxed">
                          Our pricing is based on loads, where one load equals 7.5kg. Any weight up to 7.5kg is considered one load. If your laundry exceeds 7.5kg, it will be calculated as additional loads proportionally.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-2" className="border-2 rounded-lg px-4 hover:border-primary/30 transition-colors">
                        <AccordionTrigger className="text-left font-semibold hover:no-underline">What payment methods do you accept?</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pt-2 pb-4 leading-relaxed">
                          We accept cash payments. Payment can be made when you drop off your laundry or upon delivery. For more details, please contact us directly.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-3" className="border-2 rounded-lg px-4 hover:border-primary/30 transition-colors">
                        <AccordionTrigger className="text-left font-semibold hover:no-underline">How long does it take to complete an order?</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pt-2 pb-4 leading-relaxed">
                          Standard service typically takes 24-48 hours from when your laundry arrives at the shop. Rush orders may be available upon request - please contact us for availability.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-4" className="border-2 rounded-lg px-4 hover:border-primary/30 transition-colors">
                        <AccordionTrigger className="text-left font-semibold hover:no-underline">Is there a minimum weight requirement?</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pt-2 pb-4 leading-relaxed">
                          There's no minimum weight requirement. We accept laundry of any size, from a single item to multiple loads. Our pricing is calculated based on the actual weight of your laundry.
                        </AccordionContent>
                      </AccordionItem>
                      <AccordionItem value="item-5" className="border-2 rounded-lg px-4 hover:border-primary/30 transition-colors">
                        <AccordionTrigger className="text-left font-semibold hover:no-underline">Can I track my order status?</AccordionTrigger>
                        <AccordionContent className="text-sm text-muted-foreground pt-2 pb-4 leading-relaxed">
                          Yes! Once you place an order, you can track its real-time status by visiting the 'Order Status' page on our website. You'll see updates from 'Order Placed' all the way to 'Delivered'.
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                    <div className="mt-6 pt-6 border-t">
                      <Link href="/faqs" className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors">
                        View all FAQs <ArrowRight className="h-4 w-4" />
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
