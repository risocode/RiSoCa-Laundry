
'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, FileText, MapPin, Phone, HelpCircle, UserPlus, ArrowRight, Calculator, Bike, Download, WashingMachine, DollarSign } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { HomePageWrapper } from '@/components/home-page-wrapper';

const gridItems = [
  { href: '/order-status', label: 'Order Status', icon: Package },
  { href: '/create-order', label: 'Create Order', icon: FileText },
  { href: '/service-rates', label: 'Service Rates', icon: DollarSign },
  { href: '#', label: 'Track Rider', icon: Bike, comingSoon: true },
  { href: '#', label: 'Download App', icon: Download, comingSoon: true },
  { href: '/laundry-calculator', label: 'Calculator', icon: Calculator },
  { href: '/faqs', label: 'FAQs', icon: HelpCircle },
  { href: '/branches', label: 'Branches', icon: MapPin },
  { href: '/contact-us', label: 'Contact Us', icon: Phone },
];

export default function Home() {
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

            <div className="flex flex-row items-center gap-4 mb-4">
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
            </div>

            <div className="grid grid-cols-3 gap-x-2 gap-y-2 sm:gap-x-4 sm:gap-y-4 w-full max-w-sm sm:max-w-md pb-4">
              {/* Grid items will be rendered by HomePageWrapper */}
            </div>

          </main>
          <AppFooter />
        </div>
      </HomePageWrapper>
  );
}
