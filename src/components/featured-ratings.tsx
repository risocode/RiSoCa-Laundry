'use client';

import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, Heart, Sparkles } from 'lucide-react';
import { maskName } from '@/lib/utils/name-mask';
import { format } from 'date-fns';
import type { RatingWithOrder } from '@/lib/api/ratings';

interface FeaturedRatingsProps {
  ratings: RatingWithOrder[];
}

export function FeaturedRatings({ ratings }: FeaturedRatingsProps) {
  const router = useRouter();

  const featured = useMemo(() => {
    // Get top 3 most liked ratings
    const sortedByLikes = [...ratings]
      .sort((a, b) => (b.like_count || 0) - (a.like_count || 0))
      .slice(0, 3);

    return sortedByLikes;
  }, [ratings]);

  if (featured.length === 0) return null;

  return (
    <div className="mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-lg font-semibold">Featured Reviews</h3>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {featured.map((rating) => {
          const maskedName = maskName(rating.customer_name);
          const initial = maskedName.charAt(0).toUpperCase();

          return (
            <Card
              key={rating.id}
              className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => router.push(`/rating/${rating.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0 w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-semibold text-lg">{initial}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-sm font-semibold">{maskedName}</CardTitle>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(rating.created_at), 'MMM dd, yyyy')}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-1 mb-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-4 w-4 ${
                        star <= rating.overall_rating
                          ? 'fill-yellow-400 text-yellow-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                {rating.feedback_message && (
                  <p className="text-sm text-muted-foreground line-clamp-3 mb-2">
                    {rating.feedback_message}
                  </p>
                )}
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Heart className="h-3 w-3" />
                  <span>{rating.like_count || 0} likes</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

