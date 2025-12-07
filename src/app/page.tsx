
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, FileText, MapPin, Phone, HelpCircle, UserPlus, ArrowRight, ClipboardList, Bike, Download, WashingMachine, DollarSign, User, ShieldCheck, Loader2 } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { HomePageWrapper } from '@/components/home-page-wrapper';
import { useAuth } from '@/context/AuthContext';

const customerGridItems = [
  { href: '/order-status', label: 'Order Status', icon: Package },
  { href: '/create-order', label: 'Create Order', icon: FileText },
  { href: '/service-rates', label: 'Service Rates', icon: DollarSign },
  { href: '/track-rider', label: 'Track Rider', icon: Bike, comingSoon: true },
  { href: '/download-app', label: 'Download App', icon: Download, comingSoon: true },
  { href: '/terms-and-conditions', label: 'Terms & Conditions', icon: ClipboardList },
  { href: '/faqs', label: 'FAQs', icon: HelpCircle },
  { href: '/branches', label: 'Branches', icon: MapPin },
  { href: '/contact-us', label: 'Contact Us', icon: Phone },
];

const adminGridItems = [
  { href: '/admin/orders', label: 'Manage Orders', icon: ClipboardList },
  { href: '/admin/rates', label: 'Manage Service Rates', icon: DollarSign },
];


export default function Home() {
  const { user, profile, loading } = useAuth();
  const isAdmin = profile?.role === 'admin';
  const gridItems = isAdmin ? adminGridItems : customerGridItems;
  
  if (loading) {
     return (
      <div className="flex flex-col h-screen">
        <AppHeader showLogo={true} />
        <main className="flex-1 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
      <HomePageWrapper gridItems={gridItems}>
        <div className="flex flex-col h-screen select-none">
          <AppHeader showLogo={false} />
          <main className="flex-1 overflow-y-auto flex flex-col items-center container mx-auto px-4 text-center pt-2 md:pt-4">
            
            <div className="flex flex-col items-center mb-4 pt-8">
                <div className="flex items-center gap-2 md:gap-3">
                  <WashingMachine className="h-20 w-20 md:h-28 md:w-28 text-primary" />
                  <span className="font-bold text-primary text-5xl md:text-7xl">RKR Laundry</span>
                </div>
                <p className="text-lg md:text-2xl text-muted-foreground mt-1">Fast. Clean. Convenient.</p>
            </div>

            <div className="flex flex-row items-center justify-center gap-4 mb-4 h-11">
              {isAdmin ? (
                <div className="flex items-center gap-2 text-foreground">
                    <ShieldCheck className="h-7 w-7 text-primary"/>
                    <span className="font-bold text-xl text-primary">ADMIN</span>
                </div>
              ) : user ? (
                 <div className="flex items-center gap-2 text-foreground">
                    <User className="h-6 w-6"/>
                    <span className="font-semibold text-lg">Welcome, {profile?.first_name || user.email}!</span>
                </div>
              ) : (
                <>
                  <Link href="/login" passHref>
                    <Button size="lg" className="w-32 h-11 text-base rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                      <ArrowRight className="mr-2 h-4 w-4" />
                      Log In
                    </Button>
                  </Link>
                  <Link href="/register" passHref>
                    <Button size="lg" className="w-32 h-11 text-base rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg hover:shadow-xl transition-shadow">
                      <UserPlus className="mr-2 h-4 w-4" />
                      Register
                    </Button>
                  </Link>
                </>
              )}
            </div>

            <div className={`grid gap-x-2 gap-y-2 sm:gap-x-4 sm:gap-y-4 w-full max-w-sm sm:max-w-md pb-4 ${isAdmin ? 'grid-cols-2' : 'grid-cols-3'}`}>
              {/* Grid items will be rendered by HomePageWrapper */}
            </div>

          </main>
          <AppFooter />
        </div>
      </HomePageWrapper>
  );
}

