
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Package, FileText, MapPin, Phone, HelpCircle, UserPlus, ArrowRight, Calculator, Bike, Download, WashingMachine } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const gridItems = [
  { href: '/order-status', label: 'Order Status', icon: Package, notification: true },
  { href: '/create-order', label: 'Create Order', icon: FileText },
  { href: '/service-rates', label: 'Service Rates', icon: FileText },
  { href: '/track-rider', label: 'Track Rider', icon: Bike },
  { href: '/download-app', label: 'Download App', icon: Download },
  { href: '/laundry-calculator', label: 'Calculator', icon: Calculator },
  { href: '/faqs', label: 'FAQs', icon: HelpCircle },
  { href: '/branches', label: 'Branches', icon: MapPin },
  { href: '/contact-us', label: 'Contact Us', icon: Phone },
];

export default function Home() {
  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <main className="flex-1 overflow-auto flex flex-col items-center justify-center container mx-auto px-4 text-center pb-20 pt-8">
        
        <div className="flex flex-col items-center mb-6">
            <div className="flex items-center gap-3">
              <WashingMachine className="h-16 w-16 md:h-20 md:w-20 text-primary" />
              <span className="font-bold text-primary text-4xl md:text-6xl">RKR Laundry</span>
            </div>
            <p className="text-base md:text-xl text-muted-foreground mt-1">Fast. Clean. Convenient.</p>
        </div>

        <div className="flex flex-row items-center gap-4 mb-6">
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

        <div className="grid grid-cols-3 gap-x-2 gap-y-2 sm:gap-x-4 sm:gap-y-4 w-full max-w-sm sm:max-w-md">
          {gridItems.map((item) => (
            <Link href={item.href} key={item.label} className="relative flex flex-col items-center justify-center gap-1 p-1 rounded-lg group">
              <item.icon className="h-10 w-10 md:h-14 md:w-14 text-foreground/80 group-hover:text-primary transition-colors" />
              <span className="text-sm sm:text-base font-medium text-foreground/90 text-center">{item.label}</span>
              {item.notification && <Badge className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center rounded-full bg-red-500 text-white p-0 text-[10px]">3</Badge>}
            </Link>
          ))}
        </div>

      </main>
      <AppFooter />
    </div>
  );
}
