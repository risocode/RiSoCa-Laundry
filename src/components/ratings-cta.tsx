'use client';

import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Star, ArrowRight, ShoppingBag } from 'lucide-react';
import { useAuthSession } from '@/hooks/use-auth-session';
import Link from 'next/link';

export function RatingsCTA() {
  const router = useRouter();
  const { user } = useAuthSession();

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      {user ? (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Share Your Experience</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Help others by rating your recent order. Your feedback helps us improve!
                </p>
                <Button
                  variant="outline"
                  onClick={() => router.push('/my-orders')}
                  className="w-full sm:w-auto"
                >
                  Rate Your Order
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="bg-primary/5 border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold mb-2">Join Our Community</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Create an account to leave reviews and track your orders.
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => router.push('/register')}
                    className="flex-1"
                  >
                    Sign Up
                  </Button>
                  <Button
                    onClick={() => router.push('/login')}
                    className="flex-1"
                  >
                    Log In
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold mb-2">Try Our Services</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Experience quality laundry service and join our satisfied customers.
              </p>
              <Link href="/create-order">
                <Button variant="outline" className="w-full sm:w-auto">
                  Create Order
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

