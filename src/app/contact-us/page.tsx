'use client';

import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { ContactCard } from '@/components/contact-card';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Phone, Mail, Facebook, MapPin, Clock, MessageCircle, Send, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const phoneNumbers = [
  '09157079908',
  '09459787490',
  '09154354549',
  '09288112476',
];

export default function ContactUsPage() {
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
                  <MessageCircle className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Contact Us
                </h1>
              </div>
              <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto">
                Get in touch with us. We're here to help! Reach out through any of the channels below.
              </p>
            </div>

            {/* Main Contact Card */}
            <div className="flex justify-center">
              <ContactCard phoneNumbers={phoneNumbers} />
            </div>

            {/* Contact Methods Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Phone Numbers */}
              <Card className="shadow-lg border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
                <CardHeader className="bg-gradient-to-r from-green-500/10 to-green-400/5 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-green-500/20">
                      <Phone className="h-6 w-6 text-green-600 dark:text-green-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Phone Numbers</CardTitle>
                      <CardDescription className="text-sm">Call us anytime</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="space-y-3">
                    {phoneNumbers.map((phone, index) => (
                      <a
                        key={index}
                        href={`tel:${phone}`}
                        className="flex items-center gap-3 p-3 rounded-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                      >
                        <div className="p-1.5 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                          <Phone className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                          {phone}
                        </span>
                      </a>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Email */}
              <Card className="shadow-lg border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
                <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-400/5 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Email</CardTitle>
                      <CardDescription className="text-sm">Send us an email</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <a
                    href="mailto:support@rkrlaundry.com"
                    className="flex items-center gap-3 p-4 rounded-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors break-all">
                      support@rkrlaundry.com
                    </span>
                  </a>
                </CardContent>
              </Card>

              {/* Social Media */}
              <Card className="shadow-lg border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-pink-50/50 to-pink-100/30 dark:from-pink-950/20 dark:to-pink-900/10">
                <CardHeader className="bg-gradient-to-r from-pink-500/10 to-pink-400/5 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-pink-500/20">
                      <Facebook className="h-6 w-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Social Media</CardTitle>
                      <CardDescription className="text-sm">Follow us on Facebook</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <a
                    href="https://facebook.com/rkrlaundry"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-3 p-4 rounded-lg border-2 hover:border-primary/50 hover:bg-primary/5 transition-all group"
                  >
                    <div className="p-2 rounded-lg bg-primary/10 group-hover:bg-primary/20 transition-colors">
                      <Facebook className="h-5 w-5 text-primary" />
                    </div>
                    <span className="text-base font-semibold text-foreground group-hover:text-primary transition-colors">
                      RKR Laundry
                    </span>
                  </a>
                </CardContent>
              </Card>

              {/* Location */}
              <Card className="shadow-lg border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10">
                <CardHeader className="bg-gradient-to-r from-purple-500/10 to-purple-400/5 border-b">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-purple-500/20">
                      <MapPin className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Visit Us</CardTitle>
                      <CardDescription className="text-sm">Our main branch</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="p-4 rounded-lg border-2 bg-background/50">
                    <p className="text-sm font-semibold text-foreground mb-2">Main Branch</p>
                    <p className="text-sm text-muted-foreground mb-4">228 Divisoria Enrile Cagayan</p>
                    <Link href="/branches">
                      <Button variant="outline" size="sm" className="w-full gap-2">
                        <MapPin className="h-4 w-4" />
                        View Location
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Operating Hours */}
            <Card className="shadow-lg border-2 bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/50">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-lg bg-amber-500/20 flex-shrink-0">
                    <Clock className="h-6 w-6 text-amber-600 dark:text-amber-400" />
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-lg text-foreground mb-1">Operating Hours</p>
                    <p className="text-sm text-muted-foreground mb-2">We're available 7 days a week</p>
                    <p className="text-xl font-bold text-primary">Monday to Sunday: 7:30 AM - 7:30 PM</p>
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
                      <Send className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-2xl sm:text-3xl font-bold text-foreground">
                      Need More Help?
                    </h2>
                  </div>
                  <p className="text-muted-foreground max-w-2xl mx-auto">
                    Check out our FAQs or create an order to get started with our services.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                    <Link href="/faqs">
                      <Button size="lg" variant="outline" className="w-full sm:w-auto text-base px-8 py-6 h-auto border-2">
                        <MessageCircle className="mr-2 h-5 w-5" />
                        View FAQs
                      </Button>
                    </Link>
                    <Link href="/create-order">
                      <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6 h-auto">
                        <Send className="mr-2 h-5 w-5" />
                        Create Order
                        <ArrowRight className="ml-2 h-5 w-5" />
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
