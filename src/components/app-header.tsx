
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, UserCog, Download, Info, LogOut, WashingMachine } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const navLinks = [
  { href: '/login', label: 'Administrator Login', icon: UserCog },
  { href: '/download-app', label: 'Download APK', icon: Download },
  { href: '/about', label: 'About', icon: Info },
  { href: '#', label: 'Exit System', icon: LogOut },
];

export function AppHeader({ showLogo = false }: { showLogo?: boolean }) {
  return (
    <header className="w-full border-b bg-background/95">
      <div className="container flex h-16 items-center justify-between px-4">
        {showLogo ? (
          <Link href="/" className="flex items-center gap-2">
            <WashingMachine className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
            <div className='flex flex-col'>
                <span className="font-bold text-primary text-lg sm:text-xl leading-none">RKR Laundry</span>
                <span className="text-xs sm:text-sm text-muted-foreground leading-none mt-1">Fast. Clean. Convenient.</span>
            </div>
          </Link>
        ) : <div />}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <Menu className="h-8 w-8" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-max mr-4">
            <nav className="grid gap-1">
              {navLinks.map(({ href, label, icon: Icon }) => (
                <DropdownMenuItem key={href} asChild>
                  <Link href={href} className="flex items-center gap-3 text-muted-foreground transition-colors hover:text-foreground hover:bg-muted rounded-md text-base">
                    <Icon className="h-5 w-5" />
                    {label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </nav>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
