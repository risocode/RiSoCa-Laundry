'use client';

import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { DollarSign, Package, Truck, Sparkles, CheckCircle2, ArrowRight, Info } from 'lucide-react';
import Link from 'next/link';

const services = [
    { service: 'Wash, Dry, Fold (per 7.5kg load)', price: '180.00' },
];

const deliverySurcharges = [
    { distance: 'First 1 km', price: 'Free' },
    { distance: 'Each additional km', price: '20.00' },
];

export default function ServiceRatesPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <DollarSign className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Service Rates
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Transparent pricing for all our services. No hidden fees, no surprises.
              </p>
            </div>

            {/* Quick Info Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
                <CardContent className="p-5 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Package className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">₱180</div>
                  <div className="text-xs text-muted-foreground">Per 7.5kg Load</div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
                <CardContent className="p-5 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Truck className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">Free</div>
                  <div className="text-xs text-muted-foreground">First 1 km</div>
                </CardContent>
              </Card>

              <Card className="border-2 bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10">
                <CardContent className="p-5 text-center">
                  <div className="flex justify-center mb-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <Sparkles className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                  </div>
                  <div className="text-2xl font-bold text-primary mb-1">₱20</div>
                  <div className="text-xs text-muted-foreground">Per Additional km</div>
                </CardContent>
              </Card>
            </div>

            {/* Service Rates Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Standard Services */}
              <Card className="shadow-xl border-2 hover:border-primary/50 transition-all">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Package className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl">Standard Services</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Wash, dry, and fold pricing
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-10 font-semibold">Service</TableHead>
                        <TableHead className="text-right h-10 font-semibold">Price (₱)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {services.map((item) => (
                        <TableRow key={item.service} className="hover:bg-muted/50">
                          <TableCell className="py-4 text-sm font-medium">{item.service}</TableCell>
                          <TableCell className="text-right py-4">
                            <Badge variant="secondary" className="text-base font-bold px-3 py-1">
                              {item.price}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Delivery Surcharges */}
              <Card className="shadow-xl border-2 hover:border-primary/50 transition-all">
                <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-6">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-primary/20">
                      <Truck className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl sm:text-2xl">Delivery Surcharges</CardTitle>
                      <CardDescription className="text-sm mt-1">
                        Distance-based pricing
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="h-10 font-semibold">Distance</TableHead>
                        <TableHead className="text-right h-10 font-semibold">Price (₱)</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {deliverySurcharges.map((item) => (
                        <TableRow key={item.distance} className="hover:bg-muted/50">
                          <TableCell className="py-4 text-sm font-medium">{item.distance}</TableCell>
                          <TableCell className="text-right py-4">
                            {item.price === 'Free' ? (
                              <Badge className="text-base font-bold px-3 py-1 bg-green-500 hover:bg-green-600">
                                {item.price}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-base font-bold px-3 py-1">
                                {item.price}
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>

            {/* Additional Information */}
            <Card className="shadow-lg border-2 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-amber-500/20 flex-shrink-0">
                    <Info className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <h3 className="font-semibold text-lg text-foreground">Important Notes</h3>
                    <ul className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>One load equals 7.5kg. Any excess weight is calculated as additional loads.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>The first kilometer of delivery is always free.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>Final pricing may vary based on actual weight confirmed at the shop.</span>
                      </li>
                      <li className="flex items-start gap-2">
                        <CheckCircle2 className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                        <span>All prices are in Philippine Peso (₱) and are subject to change without prior notice.</span>
                      </li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Call to Action */}
            <Card className="shadow-xl border-2 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <div className="flex items-center justify-center gap-3 mb-2">
                    <div className="p-3 rounded-full bg-primary/20">
                      <Sparkles className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                      Ready to Get Started?
                    </h2>
                  </div>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Create an order now and experience our fast, clean, and convenient laundry service.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                    <Link href="/create-order">
                      <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6 h-auto">
                        <Package className="mr-2 h-5 w-5" />
                        Create Order
                        <ArrowRight className="ml-2 h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/faqs">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-6 h-auto border-2">
                        <Info className="mr-2 h-5 w-5" />
                        View FAQs
                      </Button>
                    </Link>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}
