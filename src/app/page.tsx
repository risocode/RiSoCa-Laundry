'use client';

import { useEffect, useState, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
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
  DollarSign,
  Wallet,
  CreditCard,
  TrendingUp,
  Eye,
  EyeOff,
  Users,
  Zap,
  ShoppingBag,
  Gift,
} from 'lucide-react';

import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { HomePageWrapper } from '@/components/home-page-wrapper';
import { PesoCoinIcon } from '@/components/icons/peso-coin-icon';
import { useAuthSession } from '@/hooks/use-auth-session';
import { isAdmin, isEmployee } from '@/lib/auth-helpers';
import { signOut } from '@/lib/auth';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase-client';

const customerGridItems = [
  { href: '/order-status', label: 'Order Status', icon: Package },
  { href: '/create-order', label: 'Create Order', icon: FileText },
  { href: '/service-rates', label: 'Service Rates', icon: PesoCoinIcon },
  { href: '/track-rider', label: 'Track Rider', icon: Bike, comingSoon: true },
  { href: '/download-app', label: 'Download App', icon: Download },
  { href: '/about-us', label: 'About Us', icon: Users },
  { href: '/faqs', label: 'FAQs', icon: HelpCircle },
  { href: '/branches', label: 'Branches', icon: MapPin },
  { href: '/contact-us', label: 'Contact Us', icon: Phone },
];

const adminGridItems = [
  { href: '/admin/orders', label: 'Orders', icon: ClipboardList },
  { href: '/admin/customers', label: 'Customers', icon: Users },
  { href: '/admin/rates', label: 'Service Rates', icon: DollarSign },
  { href: '/admin/salary', label: 'Employee Salary', icon: Wallet },
  { href: '/admin/expenses', label: 'Expenses', icon: CreditCard },
  { href: '/admin/electricity', label: 'Electricity', icon: Zap },
  { href: '/admin/finance', label: 'Finance', icon: TrendingUp },
  { href: '/admin/promo', label: 'Promo', icon: Gift },
];

const employeeGridItems = [
  { href: '/employee', label: 'Orders', icon: ClipboardList },
  { href: '/employee/salary', label: 'Salary', icon: Wallet },
];

function HomeContent({ viewAsCustomer: initialViewAsCustomer }: { viewAsCustomer: boolean }) {
  const router = useRouter();
  const { user, loading: authLoading, session } = useAuthSession();
  const { toast } = useToast();

  const [mounted, setMounted] = useState(false);
  const [profileData, setProfileData] = useState<{
    displayName: string;
    initial: string;
  } | null>(null);
  const [userIsAdmin, setUserIsAdmin] = useState(false);
  const [userIsEmployee, setUserIsEmployee] = useState(false);
  const [viewAsCustomer, setViewAsCustomer] = useState(initialViewAsCustomer);

  const fetchedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef(false);

  /* -------------------- Client Mount -------------------- */
  useEffect(() => {
    setMounted(true);
  }, []);

  /* -------------------- Email Confirmation Handler -------------------- */
  useEffect(() => {
    if (!mounted) return;
    
    // Check if this is an email confirmation (type=signup in hash)
    if (typeof window !== 'undefined' && window.location.hash.includes('type=signup')) {
      // Wait a moment for session to be established
      setTimeout(() => {
        toast({
          title: 'Email Confirmed!',
          description: 'Your email has been successfully verified. You are now logged in.',
        });
        // Clean up the hash from URL
        window.history.replaceState(null, '', window.location.pathname);
      }, 500);
    }
  }, [mounted, toast]);

  /* -------------------- Check User Roles -------------------- */
  useEffect(() => {
    async function checkRoles() {
      if (authLoading || !user) {
        setUserIsAdmin(false);
        setUserIsEmployee(false);
        return;
      }

      const [adminStatus, employeeStatus] = await Promise.all([
        isAdmin(user.id),
        isEmployee(user.id),
      ]);
      setUserIsAdmin(adminStatus);
      setUserIsEmployee(employeeStatus);
    }
    checkRoles();
  }, [authLoading, user]);

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

  // Toggle customer view
  const handleToggleCustomerView = () => {
    setViewAsCustomer(!viewAsCustomer);
    // Update URL without navigation
    const newUrl = viewAsCustomer ? '/' : '/?view=customer';
    window.history.pushState({}, '', newUrl);
  };

  // Combine grid items based on user role
  const gridItems = viewAsCustomer
    ? customerGridItems // Show customer items if view=customer is toggled
    : [
        ...(userIsAdmin ? adminGridItems : []),
        ...(userIsEmployee ? employeeGridItems : []),
        ...(userIsAdmin || userIsEmployee ? [] : customerGridItems), // Only show customer items if not admin/employee
      ];

  return (
    <HomePageWrapper gridItems={gridItems}>
      <div className="flex flex-col h-screen overflow-hidden select-none">
        <AppHeader />

        <main className="flex-1 overflow-y-auto sm:overflow-hidden pb-20">
          <div className="container mx-auto px-4 py-3 sm:py-4 text-center h-full flex flex-col sm:justify-center">

            {/* Logo */}
            <div className="mb-4 sm:mb-6 flex flex-col items-center">
              <div className="flex items-center gap-3 mb-2">
                <WashingMachine className="h-16 w-16 text-primary" />
                <span className="text-4xl font-bold text-primary">RKR Laundry</span>
              </div>
              <p className="text-muted-foreground">Fast. Clean. Convenient.</p>
            </div>

            {/* Profile / Auth Buttons */}
            <div className="flex justify-center gap-4 min-h-[96px]">
              {shouldShowProfile ? (
                <div className="flex flex-col items-center gap-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger 
                      data-testid="profile-button"
                      className="bg-transparent border-0 p-0 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
                    >
                      <div className="h-14 w-14 rounded-full bg-blue-600 text-white text-2xl font-bold flex items-center justify-center shadow-lg">
                        {initial}
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="center" className="w-48">
                      <DropdownMenuItem
                        onClick={() => router.push('/profile')}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <User className="h-4 w-4" />
                        Profile
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => router.push('/my-orders')}
                        className="flex items-center gap-2 cursor-pointer"
                      >
                        <ShoppingBag className="h-4 w-4" />
                        My Orders
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="text-destructive flex items-center gap-2 cursor-pointer"
                      >
                        <LogOut className="h-4 w-4" />
                        Log Out
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                  <span className="text-sm font-semibold text-primary">
                    {displayName}
                  </span>
                </div>
              ) : mounted && !authLoading ? (
                <>
                  <Link href="/login">
                    <Button className="h-12 w-32 sm:w-36 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 text-white hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all">
                      <ArrowRight className="h-4 w-4 mr-2" />
                      Log in
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button className="h-12 w-32 sm:w-36 rounded-full bg-gradient-to-r from-yellow-400 to-yellow-500 text-white hover:from-yellow-500 hover:to-yellow-600 shadow-lg hover:shadow-xl transition-all">
                      <UserPlus className="h-4 w-4 mr-2" />
                      Register
                    </Button>
                  </Link>
                </>
              ) : null}
            </div>

            {/* Customer View Toggle Button (Admin Only) */}
            {userIsAdmin && !viewAsCustomer && (
              <div className="flex justify-center w-full mt-4">
                <Button
                  onClick={handleToggleCustomerView}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" />
                  View as Customer
                </Button>
              </div>
            )}

            {/* Admin View Toggle Button (When viewing as customer) */}
            {userIsAdmin && viewAsCustomer && (
              <div className="flex justify-center w-full mt-4">
                <Button
                  onClick={handleToggleCustomerView}
                  variant="outline"
                  className="flex items-center gap-2"
                >
                  <EyeOff className="h-4 w-4" />
                  Back to Admin View
                </Button>
              </div>
            )}

            {/* Grid Menu */}
            <div className="flex justify-center w-full mt-4 sm:mt-6">
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

function HomeWithSearchParams() {
  const searchParams = useSearchParams();
  const viewAsCustomer = searchParams?.get('view') === 'customer';
  return <HomeContent viewAsCustomer={viewAsCustomer} />;
}

export default function Home() {
  return (
    <Suspense fallback={
      <div className="flex flex-col h-screen items-center justify-center">
        <div className="text-muted-foreground">Loading...</div>
      </div>
    }>
      <HomeWithSearchParams />
    </Suspense>
  );
}
