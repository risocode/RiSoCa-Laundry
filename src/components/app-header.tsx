
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, WashingMachine } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: '/order-status', label: 'Order Status' },
  { href: '/create-order', label: 'Create Order' },
  { href: '/service-rates', label: 'Service Rates' },
  { href: '/laundry-calculator', label: 'Calculator' },
  { href: '/faqs', label: 'FAQs' },
  { href: '/branches', label: 'Branches' },
  { href: '/contact-us', label: 'Contact Us' },
  { href: '/login', label: 'Login' },
  { href: '/register', label: 'Register' },
];

export function AppHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-14 items-center justify-center px-4 relative">
        <Link href="/" className="flex flex-col items-center">
            <div className="flex items-center gap-2">
              <WashingMachine className="h-6 w-6 text-primary" />
              <span className="font-bold text-primary text-lg">RKR Laundry</span>
            </div>
            <p className="text-xs text-muted-foreground">Fast. Clean. Convenient.</p>
        </Link>
        <div className="absolute right-4">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle Menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent>
               <SheetHeader>
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <nav className="grid gap-4 text-base font-medium mt-8">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold text-primary mb-4">
                  Home
                </Link>
                {navLinks.map(({ href, label }) => (
                  <Link key={href} href={href} className="text-muted-foreground transition-colors hover:text-foreground">
                    {label}
                  </Link>
                ))}
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
