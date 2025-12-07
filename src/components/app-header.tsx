
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, UserCog, Download, Info, LogOut } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

const navLinks = [
  { href: '/login', label: 'Administrator Login', icon: UserCog },
  { href: '/download-app', label: 'Download APK', icon: Download },
  { href: '/about', label: 'About', icon: Info },
  { href: '#', label: 'Exit System', icon: LogOut },
];

export function AppHeader() {
  return (
    <header className="w-full border-b bg-background/95">
      <div className="container flex h-14 items-center justify-end px-4 relative">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-8 w-8" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-max max-w-fit sm:w-full sm:max-w-fit h-auto top-14 right-4 rounded-lg p-2">
             <SheetHeader>
              <SheetTitle className="sr-only">Menu</SheetTitle>
            </SheetHeader>
            <nav className="grid gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <Link key={href} href={href} className="flex items-center gap-3 px-3 py-2 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted rounded-md text-base">
                  <Icon className="h-5 w-5" />
                  {label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
