'use client';

import { useState, useEffect } from 'react';
import { AppHeader } from '@/components/app-header';
import { AppFooter } from '@/components/app-footer';
import { PromoBanner } from '@/components/promo-banner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { RatingsList } from '@/components/ratings-list';
import { RatingsStatistics } from '@/components/ratings-statistics';
import { FeaturedRatings } from '@/components/featured-ratings';
import { RatingsCTA } from '@/components/ratings-cta';
import { fetchAllRatings, type RatingWithOrder } from '@/lib/api/ratings';
import { useAuthSession } from '@/hooks/use-auth-session';
import { Loader2 } from 'lucide-react';

export default function CustomerRatingsPage() {
  const { user } = useAuthSession();
  const [ratings, setRatings] = useState<RatingWithOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadRatings() {
      setLoading(true);
      const { data, error } = await fetchAllRatings(user?.id);
      
      if (error) {
        console.error('Failed to load ratings:', error);
        setLoading(false);
        return;
      }

      setRatings(data || []);
      setLoading(false);
    }

    loadRatings();
  }, [user?.id]);

  return (
    <div className="flex flex-col h-screen">
      <AppHeader />
      <PromoBanner />
      <main className="flex-1 overflow-y-auto overflow-x-hidden scrollable pb-20">
        <div className="container mx-auto px-4 py-8">
          <div className="w-full max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Customer Ratings & Reviews</h1>
              <p className="text-muted-foreground">
                See what our customers are saying about RKR Laundry. Real reviews from real customers.
              </p>
            </div>

            {loading ? (
              <div className="flex flex-col items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
                <p className="text-muted-foreground">Loading ratings...</p>
              </div>
            ) : (
              <>
                {/* Statistics Dashboard */}
                <RatingsStatistics ratings={ratings} />

                {/* Featured Ratings */}
                <FeaturedRatings ratings={ratings} />

                {/* Main Ratings List */}
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg sm:text-xl">All Customer Reviews</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Browse through all customer reviews and ratings. Click on any review to see full details.
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <RatingsList showFilters={true} />
                  </CardContent>
                </Card>

                {/* Call-to-Action Section */}
                <RatingsCTA />
              </>
            )}
          </div>
        </div>
      </main>
      <AppFooter />
    </div>
  );
}

