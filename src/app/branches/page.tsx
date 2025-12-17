'use client';

import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { MapPin, Phone, Link as LinkIcon, Building2, Clock, Navigation, ExternalLink, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

const branches = [
    { 
        name: "Main Branch", 
        address: "228 Divisoria Enrile Cagayan", 
        mapLink: "https://maps.app.goo.gl/CDcYYu91x34uhuHm9",
        phoneNumbers: [
            "09157079908",
            "09459787490",
            "09154354549",
            "09288112476"
        ] 
    },
]

export default function BranchesPage() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-5xl mx-auto space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-3">
              <div className="flex items-center justify-center gap-3 mb-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Our Branches
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Find an RKR Laundry location near you. Visit us for drop-off or schedule a pickup.
              </p>
            </div>

            {/* Branch Cards */}
            <div className="grid grid-cols-1 gap-6">
              {branches.map((branch, index) => (
                <Card key={branch.name} className="shadow-xl border-2 hover:border-primary/50 transition-all overflow-hidden">
                  <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/20">
                          <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-2xl sm:text-3xl">{branch.name}</CardTitle>
                          <CardDescription className="text-sm mt-1">
                            Main location serving Enrile, Cagayan
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className="text-sm px-3 py-1">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Open
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="p-6 space-y-6">
                    {/* Address Section */}
                    <Card className="border-2 bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
                      <CardContent className="p-5">
                        <div className="flex items-start gap-4">
                          <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
                            <MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground mb-1">Address</p>
                            <p className="text-sm text-muted-foreground leading-relaxed">{branch.address}</p>
                            <Link href={branch.mapLink} target="_blank" rel="noopener noreferrer">
                              <Button variant="outline" size="sm" className="mt-3 gap-2">
                                <Navigation className="h-4 w-4" />
                                View on Map
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Separator />

                    {/* Contact Section */}
                    <div>
                      <div className="flex items-center gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-green-500/20">
                          <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <h3 className="font-semibold text-lg text-foreground">Contact Numbers</h3>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {branch.phoneNumbers.map((phone, phoneIndex) => (
                          <a
                            key={phoneIndex}
                            href={`tel:${phone}`}
                            className="flex items-center gap-3 p-3 rounded-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                          >
                            <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                              <Phone className="h-4 w-4 text-primary" />
                            </div>
                            <span className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                              {phone}
                            </span>
                          </a>
                        ))}
                      </div>
                    </div>

                    <Separator />

                    {/* Operating Hours */}
                    <Card className="bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/50">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-amber-500/20 flex-shrink-0">
                            <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-foreground mb-1">Operating Hours</p>
                            <p className="text-sm text-muted-foreground">Monday to Sunday</p>
                            <p className="text-base font-bold text-primary mt-1">7:30 AM - 7:30 PM</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Call to Action */}
            <Card className="shadow-xl border-2 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border-primary/30">
              <CardContent className="p-8 text-center">
                <div className="space-y-4">
                  <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                    Ready to Visit Us?
                  </h2>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Drop off your laundry or schedule a pickup. We're here to serve you!
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                    <Link href="/create-order">
                      <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6 h-auto">
                        <Navigation className="mr-2 h-5 w-5" />
                        Create Order
                      </Button>
                    </Link>
                    <Link href="/contact-us">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-6 h-auto border-2">
                        <Phone className="mr-2 h-5 w-5" />
                        Contact Us
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
