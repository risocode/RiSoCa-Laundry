
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
      <main className="flex-1 flex flex-col items-center justify-center container mx-auto px-4 py-8 text-center">
        
        <div className="flex flex-col items-center justify-center space-y-4 mb-12">
           <WashingMachine className="h-20 w-20 text-primary" />
           <h1 className="text-4xl font-bold tracking-tight text-primary">RKR Laundry</h1>
           <p className="text-lg text-muted-foreground">Fast. Clean. Convenient.</p>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Link href="/login" passHref>
            <Button size="lg" className="w-48 h-14 text-lg rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow">
              <LogIn className="mr-2 h-5 w-5" />
              Log In
            </Button>
          </Link>
          <Link href="/register" passHref>
            <Button size="lg" className="w-48 h-14 text-lg rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg hover:shadow-xl transition-shadow">
              <UserPlus className="mr-2 h-5 w-5" />
              Register
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 md:gap-8 w-full max-w-2xl">
          {gridItems.map((item) => (
            <Link href={item.href} key={item.label} className="relative flex flex-col items-center justify-center gap-2 p-4 bg-card/80 backdrop-blur-sm rounded-2xl shadow-sm hover:shadow-lg hover:bg-card transition-all group">
              <item.icon className="h-10 w-10 text-foreground/80 group-hover:text-primary transition-colors" />
              <span className="text-sm md:text-base font-medium text-foreground/90">{item.label}</span>
              {item.notification && <Badge className="absolute -top-2 -right-2 h-6 w-6 flex items-center justify-center rounded-full bg-red-500 text-white p-0">3</Badge>}
            </Link>
          ))}
        </div>

      </main>
      <AppFooter />
    </div>
  );
}
