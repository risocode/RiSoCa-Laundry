'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, UserCog, Download, Info, LogOut, WashingMachine, LayoutDashboard, Megaphone } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useRouter, usePathname } from 'next/navigation';

export function AppHeader({ showLogo = false }: { showLogo?: boolean }) {
    const router = useRouter();
    const pathname = usePathname();

    const user = false; // Mock user state
    const isAdminPage = pathname.startsWith('/admin');

    const handleSignOut = async () => {
      // Mock sign out
      router.push('/login');
    };

    const navLinks = [
      isAdminPage 
        ? { href: '/admin', label: 'Admin Dashboard', icon: LayoutDashboard }
        : { href: '/admin/login', label: 'Administrator Login', icon: UserCog },
      { href: '/download-app', label: 'Download APK', icon: Download },
      { href: '/about', label: 'About', icon: Info },
    ];


  return (
    <header className="w-full border-b bg-background/95">
      <div className="container flex h-16 items-center justify-between px-4">
        {showLogo ? (
          <Link href={isAdminPage ? "/admin" : "/"} className="flex items-center gap-2">
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
               {user && (
                <>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onSelect={handleSignOut} className="flex items-center gap-3 text-destructive transition-colors hover:text-destructive hover:bg-destructive/10 rounded-md text-base cursor-pointer">
                        <LogOut className="h-5 w-5" />
                        Log Out
                    </DropdownMenuItem>
                </>
              )}
            </nav>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {!isAdminPage && (
        <div className="bg-gradient-to-r from-purple-500 to-indigo-600 text-white py-2 px-4 text-center text-xs sm:text-sm shadow-inner">
            <div className="container mx-auto flex items-center justify-center gap-2">
                <Megaphone className="h-5 w-5" />
                <p>
                    <span className="font-medium">PROMO:</span> On <span className="font-bold text-yellow-300 underline">December 17, 2025</span>, our price will be <span className="font-bold text-yellow-300">₱150 per load!</span>
                </p>
            </div>
        </div>
      )}
    </header>
  );
}
