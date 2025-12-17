'use client';

import { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Star, TrendingUp, Users, Award } from 'lucide-react';
import type { RatingWithOrder } from '@/lib/api/ratings';

interface RatingsStatisticsProps {
  ratings: RatingWithOrder[];
}

export function RatingsStatistics({ ratings }: RatingsStatisticsProps) {
  const stats = useMemo(() => {
    if (ratings.length === 0) {
      return {
        total: 0,
        average: 0,
        distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
        fiveStarPercentage: 0,
        thisMonth: 0,
      };
    }

    const total = ratings.length;
    const sum = ratings.reduce((acc, r) => acc + r.overall_rating, 0);
    const average = sum / total;

    const distribution = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    ratings.forEach(r => {
      distribution[r.overall_rating as keyof typeof distribution]++;
    });

    const fiveStarCount = distribution[5];
    const fiveStarPercentage = (fiveStarCount / total) * 100;

    const now = new Date();
    const thisMonth = ratings.filter(r => {
      const ratingDate = new Date(r.created_at);
      return ratingDate.getMonth() === now.getMonth() && 
             ratingDate.getFullYear() === now.getFullYear();
    }).length;

    return {
      total,
      average,
      distribution,
      fiveStarPercentage,
      thisMonth,
    };
  }, [ratings]);

  const maxDistribution = Math.max(...Object.values(stats.distribution));

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total Ratings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Customer reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">Average Rating</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
            <div>
              <p className="text-2xl font-bold">{stats.average.toFixed(1)}</p>
              <p className="text-xs text-muted-foreground">Out of 5.0</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">5-Star Reviews</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-500" />
            <div>
              <p className="text-2xl font-bold">{stats.fiveStarPercentage.toFixed(0)}%</p>
              <p className="text-xs text-muted-foreground">{stats.distribution[5]} reviews</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-500" />
            <div>
              <p className="text-2xl font-bold">{stats.thisMonth}</p>
              <p className="text-xs text-muted-foreground">New ratings</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="md:col-span-2 lg:col-span-4">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium">Rating Distribution</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {[5, 4, 3, 2, 1].map((star) => {
            const count = stats.distribution[star as keyof typeof stats.distribution];
            const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
            const width = maxDistribution > 0 ? (count / maxDistribution) * 100 : 0;

            return (
              <div key={star} className="flex items-center gap-3">
                <div className="flex items-center gap-1 w-20">
                  <span className="text-sm font-medium">{star}</span>
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                </div>
                <div className="flex-1">
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-500"
                      style={{ width: `${width}%` }}
                    />
                  </div>
                </div>
                <div className="text-sm font-medium w-16 text-right">
                  {count} ({percentage.toFixed(0)}%)
                </div>
              </div>
            );
          })}
        </CardContent>
      </Card>
    </div>
  );
}

