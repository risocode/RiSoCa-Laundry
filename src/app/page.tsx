'use client';

import { useEffect, useState, useRef } from 'react';
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
import {
  Package,
  FileText,
  MapPin,
  Phone,
  HelpCircle,
  UserPlus,
  ArrowRight,
  ClipboardList,
  Bike,
  Download,
  WashingMachine,
  User,
  LogOut,
} from 'lucide-react';

import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { HomePageWrapper } from '@/components/home-page-wrapper';
import { PesoCoinIcon } from '@/components/icons/peso-coin-icon';
import { useAuthSession } from '@/hooks/use-auth-session';
import { isAdmin } from '@/lib/auth-helpers';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';

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
  const { user, loading: authLoading, session } = useAuthSession();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [profileData, setProfileData] = useState<{
    displayName: string;
    initial: string;
  } | null>(null);

  const fetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  /* -------------------- Client Mount -------------------- */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* -------------------- Admin Redirect -------------------- */
  useEffect(() => {
    if (authLoading || !user) return;

    isAdmin(user.id).then((isAdminUser) => {
      if (isAdminUser) router.push('/admin');
    });
  }, [authLoading, user, router]);

  /* -------------------- Fetch Profile -------------------- */
  useEffect(() => {
    async function fetchProfile() {
      if (authLoading || !user) return;
      if (user.id === fetchedUserIdRef.current) return;
      if (isFetchingRef.current) return;

      isFetchingRef.current = true;
      fetchedUserIdRef.current = user.id;

      // Immediate fallback from metadata/email
      const baseName =
        user.user_metadata?.first_name ||
        user.user_metadata?.firstName ||
        user.user_metadata?.name ||
        user.email?.split('@')[0] ||
        'Customer';

      setProfileData({
        displayName: baseName,
        initial: baseName.charAt(0).toUpperCase(),
      });

      try {
        const { data } = await supabase
          .from('profiles')
          .select('first_name')
          .eq('id', user.id)
          .single();

        if (data?.first_name) {
          setProfileData({
            displayName: data.first_name,
            initial: data.first_name.charAt(0).toUpperCase(),
          });
        }
      } catch {
        // silently keep fallback
      } finally {
        isFetchingRef.current = false;
      }
    }

    fetchProfile();
  }, [authLoading, user]);

  /* -------------------- Logout -------------------- */
  const handleLogout = async () => {
    try {
      await signOut();
      toast({ title: 'Logged out successfully' });
      router.push('/');
    } catch {
      toast({
        variant: 'destructive',
        title: 'Logout failed',
      });
    }
  };

  /* -------------------- STRICT AUTH LOGIC -------------------- */
  const currentUser = session?.user ?? user;

  const shouldShowProfile =
    mounted &&
    !authLoading &&
    !!session &&
    !!user &&
    !!currentUser;

  const displayName = shouldShowProfile ? profileData?.displayName ?? '' : '';
  const initial = shouldShowProfile ? profileData?.initial ?? '' : '';

  return (
    <HomePageWrapper gridItems={customerGridItems}>
      <div className="flex flex-col h-screen overflow-hidden select-none">
        <AppHeader />

        <main className="flex-1 overflow-y-auto pb-20">
          <div className="container mx-auto px-4 py-6 text-center">

            {/* Logo */}
            <div className="mb-6 flex flex-col items-center">
              <div className="flex items-center gap-3 mb-2">
                <WashingMachine className="h-16 w-16 text-primary" />
                <span className="text-4xl font-bold text-primary">RKR Laundry</span>
              </div>
              <p className="text-muted-foreground">Fast. Clean. Convenient.</p>
            </div>

            {/* Profile / Auth Buttons */}
            <div className="flex justify-center gap-4 min-h-[96px]">
              {shouldShowProfile ? (
                <DropdownMenu>
                  <DropdownMenuTrigger 
                    data-testid="profile-button"
                    className="bg-transparent border-0 p-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                  >
                    <div className="h-14 w-14 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shadow-lg">
                      {initial}
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="center">
                    <DropdownMenuItem asChild>
                      <Link href="/profile" className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        Profile
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="text-destructive flex items-center gap-2"
                    >
                      <LogOut className="h-4 w-4" />
                      Logout
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : mounted && !authLoading ? (
                <>
                  <Link href="/login">
                    <Button>
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Log In
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button variant="secondary">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>

            {/* Grid Menu */}
            <div className="flex justify-center w-full mt-6">
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
