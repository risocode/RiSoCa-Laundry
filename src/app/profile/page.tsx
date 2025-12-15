'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/hooks/use-auth-session';
import { supabase } from '@/lib/supabase-client';
import { Loader2, Phone, Trash2 } from 'lucide-react';

export default function ProfilePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuthSession();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      router.push('/login');
      return;
    }

    // Fetch profile data
    const fetchProfile = async () => {
      try {
        setFetching(true);
        
        // Get profile from profiles table
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('first_name, last_name, contact_number')
          .eq('id', user.id)
          .single();

        if (profileError && profileError.code !== 'PGRST116') {
          console.error('Error fetching profile:', profileError);
        }

        // Set values from profile table or fallback to user metadata
        const profileFirstName = profileData?.first_name || 
          (user.user_metadata?.first_name as string | undefined) || 
          (user.user_metadata?.firstName as string | undefined) || 
          '';
        const profileLastName = profileData?.last_name || 
          (user.user_metadata?.last_name as string | undefined) || 
          (user.user_metadata?.lastName as string | undefined) || 
          '';
        const profileContactNumber = profileData?.contact_number || '';

        setFirstName(profileFirstName);
        setLastName(profileLastName);
        setContactNumber(profileContactNumber);
        setEmail(user.email || '');
      } catch (error) {
        console.error('Error fetching profile:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load profile data.',
        });
      } finally {
        setFetching(false);
      }
    };

    fetchProfile();
  }, [user, authLoading, router, toast]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to update your profile.',
      });
      router.push('/login');
      return;
    }

    setLoading(true);

    try {
      // Update profile in profiles table
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email || email, // Include email (required by NOT NULL constraint)
          first_name: firstName.trim() || null,
          last_name: lastName.trim() || null,
          contact_number: contactNumber.trim() || null,
        }, {
          onConflict: 'id'
        });

      if (profileError) {
        throw profileError;
      }

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          first_name: firstName.trim() || undefined,
          last_name: lastName.trim() || undefined,
        }
      });

      if (updateError) {
        throw updateError;
      }

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        variant: 'destructive',
        title: 'Update Failed',
        description: error.message || 'An error occurred while updating your profile. Please try again.',
      });
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || fetching) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader />
        <PromoBanner />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
          <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8 flex items-start justify-center min-h-full">
          <Card className="mx-auto w-full max-w-md">
            <CardHeader className="p-4">
              <CardTitle className="text-xl">Profile Settings</CardTitle>
              <CardDescription>
                Update your personal information
              </CardDescription>
            </CardHeader>
            <CardContent className="p-4 pt-0">
              <form onSubmit={handleSubmit} className="grid gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-1.5">
                    <Label htmlFor="firstName">First name</Label>
                    <Input
                      id="firstName"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="John"
                      disabled={loading}
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="lastName">Last name</Label>
                    <Input
                      id="lastName"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="Doe"
                      disabled={loading}
                    />
                  </div>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="contactNumber" className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Contact Number
                  </Label>
                  <Input
                    id="contactNumber"
                    type="tel"
                    value={contactNumber}
                    onChange={(e) => setContactNumber(e.target.value)}
                    placeholder="09123456789"
                    disabled={loading}
                  />
                  <p className="text-xs text-muted-foreground">
                    This number will be used for order notifications
                  </p>
                </div>

                <div className="grid gap-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full"
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Profile'
                  )}
                </Button>
              </form>

              {/* Delete Account Section */}
              <div className="mt-6 pt-6 border-t">
                <div className="space-y-4">
                  <div>
                    <h3 className="text-lg font-semibold text-destructive mb-1">Danger Zone</h3>
                    <p className="text-sm text-muted-foreground">
                      Permanently delete your account and all associated data. This action cannot be undone.
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => router.push('/delete-account')}
                  >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete Account
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

