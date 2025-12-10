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
import { Package, FileText, MapPin, Phone, HelpCircle, UserPlus, ArrowRight, ClipboardList, Bike, Download, WashingMachine, User, LogOut } from 'lucide-react';
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
  const gridItems = customerGridItems;
  const [profileData, setProfileData] = useState<{ firstName: string; displayName: string; initial: string } | null>(null);
  const fetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);
  const [mounted, setMounted] = useState(false);

  // Ensure we're on client side
  useEffect(() => {
    setMounted(true);
  }, []);

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

  // Fetch profile data from profiles table
  useEffect(() => {
    async function fetchProfile() {
      if (!user || authLoading) {
        if (user === null && fetchedUserIdRef.current !== null) {
          setProfileData(null);
          fetchedUserIdRef.current = null;
          isFetchingRef.current = false;
        }
        return;
      }

      // Prevent refetching if we already have data for this user
      if (user.id === fetchedUserIdRef.current) {
        return;
      }

      // Prevent multiple simultaneous fetches
      if (isFetchingRef.current) {
        return;
      }

      isFetchingRef.current = true;
      fetchedUserIdRef.current = user.id;

      // Set initial profile data from user metadata/email immediately
      const initialFirstName = (user.user_metadata?.first_name as string | undefined) || 
        (user.user_metadata?.firstName as string | undefined) || 
        '';
      const initialDisplayName = initialFirstName || 
        (user.user_metadata?.name as string | undefined) || 
        user.email?.split('@')[0] || 
        'Customer';
      const initialInitial = (initialFirstName || initialDisplayName || user.email?.[0] || 'C').charAt(0).toUpperCase();
      
      // Set immediately so it shows right away
      const initialProfileData = { 
        firstName: initialFirstName, 
        displayName: initialDisplayName, 
        initial: initialInitial 
      };
      setProfileData(initialProfileData);

      try {
        // Fetch from profiles table to get updated data
        const { data: profileDataFromDb, error } = await supabase
          .from('profiles')
          .select('first_name, last_name')
          .eq('id', user.id)
          .single();

        // If profile exists, use it; otherwise keep the initial data
        if (!error && profileDataFromDb) {
          const firstName = profileDataFromDb.first_name || initialFirstName;
          const displayName = firstName || 
            (user.user_metadata?.name as string | undefined) || 
            user.email?.split('@')[0] || 
            'Customer';
          const initial = (firstName || displayName || user.email?.[0] || 'C').charAt(0).toUpperCase();
          
          setProfileData({ firstName, displayName, initial });
        }
        // If error is "no rows" (PGRST116), that's fine - profile doesn't exist yet
        // We already set the initial data above, so we keep it
      } catch (error) {
        // Error fetching profile - keep the initial data we already set
        console.error('Error fetching profile:', error);
      } finally {
        isFetchingRef.current = false;
      }
    }

    if (!authLoading && user) {
      fetchProfile();
    } else if (!authLoading && !user) {
      setProfileData(null);
      fetchedUserIdRef.current = null;
      isFetchingRef.current = false;
    }
  }, [user?.id, authLoading]);

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

  // Get user data - use session user if available, fallback to user from hook
  const currentUser = session?.user || user;
  
  // Strict condition: only render when ALL auth states are ready
  const hasSession = !!session;
  const hasUser = !!user;
  const hasCurrentUser = !!currentUser;
  
  // Simplified condition: if we have a user and auth is loaded, show profile
  // currentUser will always be set if user exists (it's session?.user || user)
  const shouldShowProfile = 
    mounted &&
    !authLoading &&
    !!currentUser; // If currentUser exists, we have everything we need
  
  // Only calculate display name when we're actually going to render
  // This prevents fallback values from being computed prematurely
  const displayName = shouldShowProfile
    ? (profileData?.displayName || 
       (currentUser?.user_metadata?.first_name as string | undefined) || 
       (currentUser?.user_metadata?.firstName as string | undefined) || 
       (currentUser?.user_metadata?.name as string | undefined) || 
       currentUser?.email?.split('@')[0] || 
       'Customer')
    : '';
  
  const initial = shouldShowProfile
    ? (profileData?.initial || 
       (displayName || currentUser?.email?.[0] || 'C').charAt(0).toUpperCase())
    : '';
  
  // Enhanced debug logging - always enabled for troubleshooting
  useEffect(() => {
    if (mounted) {
      const conditionBreakdown = {
        'mounted': mounted,
        '!authLoading': !authLoading,
        'hasSession': hasSession,
        'hasUser': hasUser,
        'hasCurrentUser': hasCurrentUser,
        'ALL_TRUE': mounted && !authLoading && hasSession && hasUser && hasCurrentUser
      };
      
      console.log('🔍 Profile Debug:', {
        mounted,
        authLoading,
        hasSession,
        hasUser,
        hasCurrentUser,
        hasProfileData: !!profileData,
        shouldShowProfile,
        displayName: shouldShowProfile ? displayName : '(not calculated)',
        initial: shouldShowProfile ? initial : '(not calculated)',
        userEmail: user?.email,
        sessionUserEmail: session?.user?.email,
        currentUserEmail: currentUser?.email,
        conditionBreakdown
      });
      
      // Warn if condition should be true but isn't
      if (!shouldShowProfile && !authLoading && (hasUser || hasSession)) {
        console.warn('⚠️ Profile should show but condition failed:', conditionBreakdown);
      }
      
      // Log when profile should render
      if (shouldShowProfile && currentUser) {
        console.log('✅ Profile SHOULD be rendering now!', {
          displayName,
          initial,
          currentUserId: currentUser.id
        });
      }
    }
  }, [mounted, authLoading, hasSession, hasUser, hasCurrentUser, profileData, shouldShowProfile, displayName, initial, user, session, currentUser]);

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
                {/* Strict condition: only render when ALL auth states are ready */}
                {shouldShowProfile && currentUser ? (
                  <div className="flex flex-col items-center">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button 
                          className="flex flex-col items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg p-1"
                          data-testid="profile-button"
                          type="button"
                          aria-label="User profile menu"
                        >
                          <div className="flex items-center justify-center h-12 w-12 sm:h-14 sm:w-14 rounded-full bg-blue-600 text-white text-xl sm:text-2xl font-bold shadow-lg">
                            {initial}
                          </div>
                          <div className="text-xs sm:text-sm font-semibold text-primary text-center px-2">
                            {displayName}
                          </div>
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
                  </div>
                ) : mounted && !authLoading && !currentUser ? (
                  // Show login/register buttons only when auth is fully loaded and user is not logged in
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
                ) : null}
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
