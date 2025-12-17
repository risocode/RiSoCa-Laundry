'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Star, Loader2 } from 'lucide-react';
import { getAverageRating } from '@/lib/api/ratings';

export function AverageRatingCard() {
  const router = useRouter();
  const [average, setAverage] = useState<number>(0);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadAverage() {
      setLoading(true);
      const { average: avg, count: cnt } = await getAverageRating();
      setAverage(avg);
      setCount(cnt);
      setLoading(false);
    }

    loadAverage();
  }, []);

  const handleClick = () => {
    router.push('/customer-ratings');
  };

  if (loading) {
    return (
      <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-center">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (count === 0) {
    return (
      <Card className="cursor-pointer hover:border-primary transition-colors" onClick={handleClick}>
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Average Rating</p>
              <p className="text-lg font-semibold">No ratings yet</p>
            </div>
            <Star className="h-6 w-6 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  const fullStars = Math.floor(average);
  const hasHalfStar = average % 1 >= 0.5;

  return (
    <Card className="cursor-pointer hover:border-primary hover:shadow-md transition-all duration-200 bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20" onClick={handleClick}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">Customer Ratings</p>
            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
              <div className="flex items-center gap-1.5">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-5 w-5 ${
                      star <= fullStars
                        ? 'fill-yellow-400 text-yellow-400'
                        : star === fullStars + 1 && hasHalfStar
                        ? 'fill-yellow-400/50 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                ))}
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-primary">{average.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">/ 5.0</span>
              </div>
              <span className="text-sm text-muted-foreground">
                ({count} {count === 1 ? 'review' : 'reviews'})
              </span>
            </div>
          </div>
          <div className="flex-shrink-0 ml-4">
            <div className="p-3 rounded-full bg-primary/20">
              <Star className="h-6 w-6 text-primary fill-primary" />
            </div>
          </div>
        </div>
        <p className="text-xs text-muted-foreground mt-3 text-center sm:text-left">
          Click to view all customer reviews →
        </p>
      </CardContent>
    </Card>
  );
}

