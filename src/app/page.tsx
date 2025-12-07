
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { WashingMachine, Package, FileText, MapPin, Phone, HelpCircle, UserPlus, LogIn, Calculator, Bike, Download } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const gridItems = [
  { href: '/order-status', label: 'Order Status', icon: Package, notification: true },
  { href: '/create-order', label: 'Create Order', icon: FileText },
  { href: '/service-rates', label: 'Service Rates', icon: FileText },
  { href: '/track-rider', label: 'Track Rider', icon: Bike },
  { href: '/download-app', label: 'Download App', icon: Download },
  { href: '/laundry-calculator', label: 'Laundry Calculator', icon: Calculator },
  { href: '/faqs', label: 'FAQs', icon: HelpCircle },
  { href: '/branches', label: 'Branches', icon: MapPin },
  { href: '/contact-us', label: 'Contact Us', icon: Phone },
];

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 py-4 md:py-8 text-center">
        
        <div className="flex items-center justify-center space-x-4 mb-8">
           <WashingMachine className="h-12 w-12 md:h-16 md:w-16 text-primary" />
           <div>
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-primary text-left">RKR Laundry</h1>
            <p className="text-sm md:text-md text-muted-foreground text-left">Fast. Clean. Convenient.</p>
           </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-12">
          <Link href="/login" passHref>
            <Button size="lg" className="w-40 h-12 text-base rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <LogIn className="mr-2 h-4 w-4" />
              Log In
            </Button>
          </Link>
          <Link href="/register" passHref>
            <Button size="lg" className="w-40 h-12 text-base rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg hover:shadow-xl transition-shadow">
              <UserPlus className="mr-2 h-4 w-4" />
              Register
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-x-4 gap-y-6 sm:gap-x-8 w-full max-w-xs sm:max-w-lg">
          {gridItems.map((item) => (
            <Link href={item.href} key={item.label} className="relative flex flex-col items-center justify-center gap-2 p-2 rounded-lg group">
              <item.icon className="h-7 w-7 md:h-8 md:w-8 text-foreground/80 group-hover:text-primary transition-colors" />
              <span className="text-xs font-medium text-foreground/90 text-center">{item.label}</span>
              {item.notification && <Badge className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center rounded-full bg-red-500 text-white p-0 text-xs">3</Badge>}
            </Link>
          ))}
        </div>

      </main>
      <AppFooter />
    </div>
  );
}
