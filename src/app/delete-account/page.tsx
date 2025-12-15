'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuthSession } from '@/hooks/use-auth-session';
import { supabase } from '@/lib/supabase-client';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

export default function DeleteAccountPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user, session, loading: authLoading } = useAuthSession();
  const [confirmText, setConfirmText] = useState('');
  const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const CONFIRM_TEXT = 'DELETE';

  const handleDeleteAccount = async () => {
    if (!user || !session) {
      toast({
        variant: 'destructive',
        title: 'Not Authenticated',
        description: 'You must be logged in to delete your account.',
      });
      router.push('/login');
      return;
    }

    if (confirmText !== CONFIRM_TEXT) {
      toast({
        variant: 'destructive',
        title: 'Confirmation Required',
        description: `Please type "${CONFIRM_TEXT}" to confirm account deletion.`,
      });
      return;
    }

    setLoading(true);

    try {
      // Get the access token from the session
      const accessToken = session.access_token;
      
      // Call API route to delete account with authorization token
      const response = await fetch('/api/delete-account', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete account');
      }

      toast({
        title: 'Account Deleted',
        description: 'Your account and all associated data have been permanently deleted.',
      });

      // Sign out and redirect to home page after a short delay
      await supabase.auth.signOut();
      setTimeout(() => {
        router.push('/');
      }, 2000);
    } catch (error: any) {
      toast({
        variant: 'destructive',
        title: 'Deletion Failed',
        description: error.message || 'An error occurred while deleting your account. Please try again or contact support.',
      });
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader />
        <PromoBanner />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
          <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-full">
            <Card className="w-full max-w-md">
              <CardContent className="p-8 text-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Loading...</p>
              </CardContent>
            </Card>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col h-screen">
        <AppHeader />
        <PromoBanner />
        <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
          <div className="container mx-auto px-4 py-8 flex items-center justify-center min-h-full">
            <Card className="w-full max-w-md">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-destructive">
                  <AlertTriangle className="h-5 w-5" />
                  Authentication Required
                </CardTitle>
                <CardDescription>
                  You must be logged in to delete your account.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={() => router.push('/login')} className="w-full">
                  Go to Login
                </Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <AppFooter />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <Card className="w-full">
            <CardHeader>
              <CardTitle className="text-2xl md:text-3xl flex items-center gap-2 text-destructive">
                <Trash2 className="h-6 w-6" />
                Delete Account
              </CardTitle>
              <CardDescription>
                Permanently delete your account and all associated data
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning: This action cannot be undone</AlertTitle>
                <AlertDescription>
                  Deleting your account will permanently remove:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Your account and profile information</li>
                    <li>All your order history</li>
                    <li>All associated data stored in our system</li>
                  </ul>
                  This action is irreversible.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="confirm" className="text-base font-semibold">
                    Type <strong className="text-destructive">{CONFIRM_TEXT}</strong> to confirm:
                  </Label>
                  <Input
                    id="confirm"
                    type="text"
                    value={confirmText}
                    onChange={(e) => setConfirmText(e.target.value)}
                    placeholder={CONFIRM_TEXT}
                    className="mt-2"
                    disabled={loading}
                  />
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    variant="destructive"
                    onClick={() => setShowConfirmDialog(true)}
                    disabled={confirmText !== CONFIRM_TEXT || loading}
                    className="flex-1"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Deleting...
                      </>
                    ) : (
                      <>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete My Account
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    disabled={loading}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  If you have any questions or concerns, please{' '}
                  <a href="/contact-us" className="text-primary hover:underline font-semibold">
                    contact us
                  </a>{' '}
                  before deleting your account.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
      <AppFooter />

      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your account and all your data. This action cannot be undone.
              <br />
              <br />
              Are you sure you want to proceed?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Yes, Delete My Account'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

