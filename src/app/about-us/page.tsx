'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { 
  WashingMachine, 
  Users, 
  MapPin, 
  Phone, 
  Mail, 
  Facebook, 
  Clock, 
  Target, 
  Heart,
  Sparkles,
  Award,
  CheckCircle2,
  ArrowRight,
  Building2,
  TrendingUp,
  Package,
  Truck,
  Star,
  Calendar,
  Zap,
  Shield,
  Globe,
  Handshake,
  BarChart3,
  Smile,
  Loader2
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase-client';
import { getAverageRating } from '@/lib/api/ratings';

export default function AboutUsPage() {
  const [stats, setStats] = useState([
    { label: 'Orders Completed', value: '...', icon: Package, color: 'text-blue-600', loading: true },
    { label: 'Happy Customers', value: '...', icon: Smile, color: 'text-green-600', loading: true, subtitle: '' },
    { label: 'Service Packages', value: '3', icon: Sparkles, color: 'text-purple-600', loading: false },
    { label: 'Operating Days', value: '...', icon: Calendar, color: 'text-orange-600', loading: true },
  ]);

  useEffect(() => {
    async function fetchStats() {
      try {
        // Calculate operating days from December 5, 2025
        const businessStartDate = new Date('2025-12-05');
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - businessStartDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        const operatingDays = diffDays.toString();

        // Fetch total orders count (all orders)
        const { count: totalOrdersCount, error: ordersError } = await supabase
          .from('orders')
          .select('*', { count: 'exact', head: true });

        if (ordersError) {
          console.error('Error fetching total orders:', ordersError);
        }

        // Fetch unique customers count (distinct customer_ids from orders)
        const { data: ordersData, error: ordersDataError } = await supabase
          .from('orders')
          .select('customer_id');

        let uniqueCustomers = 0;
        if (!ordersDataError && ordersData) {
          const uniqueCustomerIds = new Set(ordersData.map(o => o.customer_id).filter(Boolean));
          uniqueCustomers = uniqueCustomerIds.size;
        }

        // Fetch average rating
        const { average, count: ratingCount } = await getAverageRating();
        const averageRating = average > 0 ? Math.round(average * 10) / 10 : 0;
        const ratingDisplay = average > 0 ? `${averageRating}/5` : '';

        setStats([
          { 
            label: 'Orders Completed', 
            value: totalOrdersCount ? totalOrdersCount.toString() : '0', 
            icon: Package, 
            color: 'text-blue-600',
            loading: false
          },
          { 
            label: 'Happy Customers', 
            value: uniqueCustomers > 0 ? uniqueCustomers.toString() : '0', 
            icon: Smile, 
            color: 'text-green-600',
            loading: false,
            subtitle: ratingDisplay ? `⭐ ${ratingDisplay}` : ''
          },
          { 
            label: 'Service Packages', 
            value: '3', 
            icon: Sparkles, 
            color: 'text-purple-600',
            loading: false
          },
          { 
            label: 'Operating Days', 
            value: operatingDays, 
            icon: Calendar, 
            color: 'text-orange-600',
            loading: false
          },
        ]);
      } catch (error) {
        console.error('Error fetching stats:', error);
      }
    }

    fetchStats();
  }, []);

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-6 sm:py-8">
          <div className="max-w-6xl mx-auto space-y-8">
          
          {/* Hero Section */}
          <div className="text-center space-y-4 mb-12">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="p-3 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border-2 border-primary/30 shadow-lg">
                <WashingMachine className="h-10 w-10 text-primary" />
              </div>
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                About RKR Laundry
              </h1>
            </div>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Zap className="h-3 w-3 mr-1" />
                Fast
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Shield className="h-3 w-3 mr-1" />
                Clean
              </Badge>
              <Badge variant="secondary" className="text-sm px-3 py-1">
                <Truck className="h-3 w-3 mr-1" />
                Convenient
              </Badge>
            </div>
            <p className="text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Your trusted laundry service partner in <strong className="text-foreground">Enrile, Cagayan</strong>, 
              providing reliable wash, dry, and fold services with convenient pickup and delivery options. 
              We combine modern technology with traditional care to deliver exceptional results.
            </p>
          </div>

          {/* Statistics Section */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="text-center border-2 hover:border-primary/50 transition-all hover:shadow-lg">
                  <CardContent className="p-6">
                    <div className={`flex justify-center mb-3 ${stat.color}`}>
                      {stat.loading ? (
                        <Loader2 className="h-8 w-8 animate-spin" />
                      ) : (
                        <Icon className="h-8 w-8" />
                      )}
                    </div>
                    <div className="text-3xl font-bold text-primary mb-1">
                      {stat.loading ? '...' : stat.value}
                    </div>
                    <div className="text-xs sm:text-sm text-muted-foreground font-medium">{stat.label}</div>
                    {stat.subtitle && (
                      <div className="text-xs text-primary font-semibold mt-1">{stat.subtitle}</div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Our Story Section */}
          <Card className="shadow-xl border-2 overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl">Our Story</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    From vision to reality - our journey
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="relative pl-6 border-l-2 border-primary/30 space-y-6">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-primary border-2 border-background"></div>
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-5 w-5 text-primary" />
                    <Badge variant="outline" className="font-semibold">December 5, 2025</Badge>
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    RKR Laundry was founded by three passionate entrepreneurs: 
                    <strong className="text-foreground"> Racky Carag</strong>, <strong className="text-foreground">Kriszelle Anne Carag</strong>, 
                    and <strong className="text-foreground">Richard Carag</strong>. The name "RKR" stands for <strong className="text-foreground">Richard Karaya Racky</strong>, 
                    representing the founders' commitment to quality service and family values.
                  </p>
                </div>
                
                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <Handshake className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">With Special Support</span>
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    With the generous support and guidance of <strong className="text-foreground">Mr. Raymundo Carag</strong> and 
                    <strong className="text-foreground"> Mrs. Elizabeth Carag</strong> as our architects, designers, and sponsors, 
                    we built a modern laundry service that combines cutting-edge technology with traditional care and attention to detail.
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    <span className="font-semibold text-foreground">Serving Our Community</span>
                  </div>
                  <p className="leading-relaxed text-muted-foreground">
                    From our main branch located at <strong className="text-foreground">228 Divisoria Enrile Cagayan</strong>, 
                    we serve our community with reliable, efficient, and affordable laundry solutions that make everyday life easier.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Mission & Vision Section */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-2 hover:border-primary/50 transition-all shadow-lg bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
              <CardHeader className="bg-gradient-to-r from-blue-500/10 to-blue-400/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-500/20">
                    <Target className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Our Mission</CardTitle>
                    <CardDescription className="text-sm">What drives us every day</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="leading-relaxed text-muted-foreground">
                  To provide <strong className="text-foreground">fast, clean, and convenient</strong> laundry services that save our customers time while delivering exceptional quality results. 
                  We use modern equipment and proven processes to ensure every item is handled with the utmost care and attention.
                </p>
              </CardContent>
            </Card>

            <Card className="border-2 hover:border-primary/50 transition-all shadow-lg bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10">
              <CardHeader className="bg-gradient-to-r from-purple-500/10 to-purple-400/5 border-b">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-purple-500/20">
                    <Award className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <CardTitle className="text-xl sm:text-2xl">Our Vision</CardTitle>
                    <CardDescription className="text-sm">Where we're heading</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <p className="leading-relaxed text-muted-foreground">
                  To become the <strong className="text-foreground">most trusted and preferred</strong> laundry service provider in Enrile and beyond, 
                  known for our reliability, quality, and unwavering commitment to customer satisfaction.
                </p>
              </CardContent>
            </Card>
          </div>

          {/* What We Offer Section */}
          <Card className="shadow-xl border-2">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <WashingMachine className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl">What We Offer</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Comprehensive laundry solutions tailored to your needs
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Our Service Packages
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-green-500/20 flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground mb-1">Package 1</p>
                          <p className="text-sm text-muted-foreground mb-2">Wash, Dry, and Fold (Drop-off)</p>
                          <Badge variant="secondary" className="text-xs">₱180 per 7.5kg load</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground mb-1">Package 2</p>
                          <p className="text-sm text-muted-foreground mb-2">One-Way Transport</p>
                          <Badge variant="secondary" className="text-xs">Pickup or Delivery</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10 md:col-span-2">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-purple-500/20 flex-shrink-0">
                          <CheckCircle2 className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold text-foreground mb-1">Package 3</p>
                          <p className="text-sm text-muted-foreground mb-2">All-In Service (Pickup & Delivery)</p>
                          <Badge variant="secondary" className="text-xs">Complete Convenience</Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 border border-amber-200/50 dark:border-amber-800/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-amber-500/20 flex-shrink-0">
                      <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Operating Hours</p>
                      <p className="text-sm text-muted-foreground">Monday to Sunday</p>
                      <p className="text-base font-bold text-primary mt-1">7:30 AM - 7:30 PM</p>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-gradient-to-br from-indigo-50/50 to-indigo-100/30 dark:from-indigo-950/20 dark:to-indigo-900/10 border border-indigo-200/50 dark:border-indigo-800/50">
                  <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-indigo-500/20 flex-shrink-0">
                      <Zap className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-foreground mb-1">Service Speed</p>
                      <p className="text-sm text-muted-foreground">Standard turnaround</p>
                      <p className="text-base font-bold text-primary mt-1">24-48 Hours</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Key Features
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    'Real-time order tracking',
                    'Online ordering system',
                    'Convenient pickup and delivery',
                    'Transparent pricing',
                    'Modern equipment',
                    'Quality assurance'
                  ].map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
                      <CheckCircle2 className="h-5 w-5 text-primary flex-shrink-0" />
                      <span className="text-sm font-medium text-foreground">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Our Values Section */}
          <Card className="shadow-xl border-2">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Heart className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl">What Sets Us Apart</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    The values that drive everything we do
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { 
                    title: 'Quality', 
                    desc: 'We handle every item with care using modern equipment and proven techniques.',
                    icon: Shield,
                    color: 'from-blue-500/20 to-blue-400/10',
                    iconColor: 'text-blue-600 dark:text-blue-400'
                  },
                  { 
                    title: 'Convenience', 
                    desc: 'Order online, track in real-time, and enjoy pickup and delivery services.',
                    icon: Zap,
                    color: 'from-yellow-500/20 to-yellow-400/10',
                    iconColor: 'text-yellow-600 dark:text-yellow-400'
                  },
                  { 
                    title: 'Reliability', 
                    desc: 'Consistent service quality and clear communication at every step.',
                    icon: CheckCircle2,
                    color: 'from-green-500/20 to-green-400/10',
                    iconColor: 'text-green-600 dark:text-green-400'
                  },
                  { 
                    title: 'Transparency', 
                    desc: 'Clear pricing with no hidden fees and real-time status updates.',
                    icon: Globe,
                    color: 'from-purple-500/20 to-purple-400/10',
                    iconColor: 'text-purple-600 dark:text-purple-400'
                  },
                  { 
                    title: 'Customer Focus', 
                    desc: 'Responsive customer support and commitment to your satisfaction.',
                    icon: Smile,
                    color: 'from-pink-500/20 to-pink-400/10',
                    iconColor: 'text-pink-600 dark:text-pink-400'
                  },
                  { 
                    title: 'Community', 
                    desc: 'Locally owned and operated, serving our community with pride.',
                    icon: Users,
                    color: 'from-orange-500/20 to-orange-400/10',
                    iconColor: 'text-orange-600 dark:text-orange-400'
                  },
                ].map((value, index) => {
                  const Icon = value.icon;
                  return (
                    <Card key={index} className={`border-2 hover:border-primary/50 transition-all bg-gradient-to-br ${value.color}`}>
                      <CardContent className="p-5">
                        <div className="flex items-start gap-3 mb-3">
                          <div className={`p-2 rounded-lg bg-gradient-to-br ${value.color}`}>
                            <Icon className={`h-5 w-5 ${value.iconColor}`} />
                          </div>
                          <h3 className="font-semibold text-foreground text-lg">{value.title}</h3>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {value.desc}
                        </p>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Our Team Section */}
          <Card className="shadow-xl border-2">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl">Meet the Founders</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    The passionate team behind RKR Laundry
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Owners & Founders
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { name: 'Racky Carag', initial: 'RC' },
                    { name: 'Kriszelle Anne Carag', initial: 'KC' },
                    { name: 'Richard Carag', initial: 'RC' },
                  ].map((founder, index) => (
                    <Card key={index} className="border-2 hover:border-primary/50 transition-all text-center bg-gradient-to-br from-primary/5 to-primary/10">
                      <CardContent className="p-6">
                        <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4">
                          <span className="text-2xl font-bold text-primary">{founder.initial}</span>
                        </div>
                        <p className="font-semibold text-foreground text-base">{founder.name}</p>
                        <Badge variant="secondary" className="mt-2 text-xs">Founder</Badge>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="pt-2">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                  <Heart className="h-5 w-5 text-primary" />
                  Special Thanks
                </h3>
                <Card className="bg-gradient-to-br from-amber-50/50 to-amber-100/30 dark:from-amber-950/20 dark:to-amber-900/10 border-amber-200/50 dark:border-amber-800/50">
                  <CardContent className="p-5">
                    <p className="text-muted-foreground leading-relaxed">
                      We extend our heartfelt gratitude to <strong className="text-foreground">Mr. Raymundo Carag</strong> and 
                      <strong className="text-foreground"> Mrs. Elizabeth Carag</strong> for their invaluable architectural and design contributions, 
                      and for their unwavering support as sponsors in making RKR Laundry a reality. Their vision and guidance have been instrumental 
                      in shaping our business.
                    </p>
                    <div className="flex items-center gap-2 mt-4 pt-4 border-t border-amber-200/50 dark:border-amber-800/50">
                      <Award className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                      <span className="text-sm font-semibold text-foreground">Architects, Designers & Sponsors</span>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Visit Us Section */}
          <Card className="shadow-xl border-2">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5 border-b">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/20">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-2xl sm:text-3xl">Find Us</CardTitle>
                  <CardDescription className="text-sm mt-1">
                    Visit us or get in touch
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-blue-50/50 to-blue-100/30 dark:from-blue-950/20 dark:to-blue-900/10">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-blue-500/20 flex-shrink-0">
                        <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground mb-1">Main Branch</p>
                        <p className="text-sm text-muted-foreground">228 Divisoria Enrile Cagayan</p>
                      </div>
                    </div>
                    <Link href="/branches">
                      <Button variant="outline" size="sm" className="w-full">
                        View Location
                        <ArrowRight className="ml-2 h-4 w-4" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-green-50/50 to-green-100/30 dark:from-green-950/20 dark:to-green-900/10">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-green-500/20 flex-shrink-0">
                        <Phone className="h-5 w-5 text-green-600 dark:text-green-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground mb-2">Contact Numbers</p>
                        <div className="space-y-1">
                          {['09157079908', '09459787490', '09154354549', '09288112476'].map((phone, index) => (
                            <a 
                              key={index}
                              href={`tel:${phone}`} 
                              className="block text-sm text-muted-foreground hover:text-primary transition-colors"
                            >
                              {phone}
                            </a>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-purple-50/50 to-purple-100/30 dark:from-purple-950/20 dark:to-purple-900/10">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-purple-500/20 flex-shrink-0">
                        <Mail className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground mb-1">Email</p>
                        <a 
                          href="mailto:support@rkrlaundry.com" 
                          className="text-sm text-muted-foreground hover:text-primary transition-colors break-all"
                        >
                          support@rkrlaundry.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-2 hover:border-primary/50 transition-all bg-gradient-to-br from-pink-50/50 to-pink-100/30 dark:from-pink-950/20 dark:to-pink-900/10">
                  <CardContent className="p-5">
                    <div className="flex items-start gap-3 mb-4">
                      <div className="p-2 rounded-lg bg-pink-500/20 flex-shrink-0">
                        <Facebook className="h-5 w-5 text-pink-600 dark:text-pink-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-foreground mb-1">Social Media</p>
                        <a 
                          href="https://facebook.com/rkrlaundry" 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary transition-colors"
                        >
                          Facebook: RKR Laundry
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </CardContent>
          </Card>

          {/* Call to Action Section */}
          <Card className="shadow-xl border-2 bg-gradient-to-br from-primary/10 via-primary/5 to-primary/10 border-primary/30">
            <CardContent className="p-8">
              <div className="text-center space-y-6">
                <div className="flex items-center justify-center gap-3 mb-2">
                  <div className="p-3 rounded-full bg-primary/20">
                    <Sparkles className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-foreground">
                    Experience RKR Laundry Today
                  </h2>
                </div>
                <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
                  Ready to experience <strong className="text-foreground">fast, clean, and convenient</strong> laundry service? 
                  Place your order online or visit us at our branch. We're here to make laundry simple.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center pt-2">
                  <Link href="/create-order">
                    <Button size="lg" className="w-full sm:w-auto text-base px-8 py-6 h-auto shadow-lg hover:shadow-xl transition-all">
                      <Package className="mr-2 h-5 w-5" />
                      Create Order
                      <ArrowRight className="ml-2 h-5 w-5" />
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

          {/* Footer Note */}
          <div className="text-center py-4">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-muted/50 border">
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
              <p className="text-xs sm:text-sm text-muted-foreground">
                Last updated: {new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>
          </div>
          
        </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

