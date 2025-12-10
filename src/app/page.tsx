'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Package, FileText, MapPin, Phone, HelpCircle, UserPlus, ArrowRight, ClipboardList, Bike, Download, WashingMachine, User, LogOut } from 'lucide-react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { HomePageWrapper } from '@/components/home-page-wrapper';
import { PesoCoinIcon } from '@/components/icons/peso-coin-icon';
import { useAuthSession } from '@/hooks/use-auth-session';
import { isAdmin } from '@/lib/auth-helpers';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';

const customerGridItems = [
  { href: '/order-status', label: 'Order Status', icon: Package },
  { href: '/create-order', label: 'Create Order', icon: FileText },
  { href: '/service-rates', label: 'Service Rates', icon: PesoCoinIcon },
  { href: '/track-rider', label: 'Track Rider', icon: Bike, comingSoon: true },
  { href: '/download-app', label: 'Download APK', icon: Download, comingSoon: true },
  { href: '/terms-and-conditions', label: 'Terms & Conditions', icon: ClipboardList },
  { href: '/faqs', label: 'FAQs', icon: HelpCircle },
  { href: '/branches', label: 'Branches', icon: MapPin },
  { href: '/contact-us', label: 'Contact Us', icon: Phone },
];

export default function Home() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuthSession();
  const { toast } = useToast();
  const gridItems = customerGridItems;

  useEffect(() => {
    async function checkAdminRedirect() {
      if (authLoading || !user) return;
      
      const adminStatus = await isAdmin(user.id);
      if (adminStatus) {
        router.push('/admin');
      }
    }

    checkAdminRedirect();
  }, [user, authLoading, router]);

  const handleLogout = async () => {
    try {
      await signOut();
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
      router.push('/');
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Logout failed',
        description: 'An error occurred while logging out. Please try again.',
      });
    }
  };

  const firstName = (user?.user_metadata?.first_name as string | undefined) || (user?.user_metadata?.firstName as string | undefined) || '';
  const displayName = firstName || (user?.user_metadata?.name as string | undefined) || user?.email || 'Customer';
  const initial = (firstName || displayName || 'C').charAt(0).toUpperCase();

  return (
      <HomePageWrapper gridItems={gridItems}>
        <div className="flex flex-col h-screen select-none overflow-hidden">
          <AppHeader />
          <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
            <div className="container mx-auto px-4 py-2 md:py-4 flex flex-col items-center text-center min-h-full">
            {/* Logo in body - homepage only */}
            <div className="flex flex-col items-center mb-4 pt-4 md:pt-8">
              <div className="flex items-center gap-2 md:gap-3 mb-2">
                <WashingMachine className="h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 text-primary" />
                <span className="font-bold text-primary text-3xl sm:text-4xl md:text-5xl">RKR Laundry</span>
                </div>
              <p className="text-sm sm:text-base md:text-lg text-muted-foreground">Fast. Clean. Convenient.</p>
            </div>

            <div className="flex flex-col items-center mb-4 w-full">
              <div className="flex flex-row items-center justify-center gap-2 sm:gap-3 md:gap-4 mb-4 min-h-[4rem]">
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1">
                        <div className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-600 text-white text-xl sm:text-2xl font-bold shadow-lg">
                          {initial}
                        </div>
                        <div className="text-xs sm:text-sm font-semibold text-primary text-center px-2">{displayName}</div>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48">
                      <DropdownMenuItem asChild>
                        <Link href="/profile" className="flex items-center gap-2 cursor-pointer">
                          <User className="h-4 w-4" />
                          <span>Profile</span>
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleLogout} className="flex items-center gap-2 cursor-pointer text-destructive focus:text-destructive">
                        <LogOut className="h-4 w-4" />
                        <span>Logout</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link href="/login" passHref className="flex-shrink-0">
                      <Button size="lg" className="w-28 sm:w-32 h-10 sm:h-11 text-sm sm:text-base rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg hover:shadow-xl transition-shadow">
                        <ArrowRight className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Log In
                      </Button>
                    </Link>
                    <Link href="/register" passHref className="flex-shrink-0">
                      <Button size="lg" className="w-28 sm:w-32 h-10 sm:h-11 text-sm sm:text-base rounded-full bg-gradient-to-r from-amber-400 to-yellow-500 text-white shadow-lg hover:shadow-xl transition-shadow">
                        <UserPlus className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        Register
                      </Button>
                    </Link>
                  </>
                )}
            </div>

            <div className="grid grid-cols-3 gap-2 md:gap-4 w-full max-w-md">
              {/* Grid items will be rendered by HomePageWrapper */}
            </div>
            </div>
            </div>
          </main>
          <AppFooter />
        </div>
      </HomePageWrapper>
  );
}
