'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, Star, Inbox, Heart } from 'lucide-react';
import { fetchAllRatings, type RatingWithOrder } from '@/lib/api/ratings';
import { maskName } from '@/lib/utils/name-mask';
import { format } from 'date-fns';
import { useAuthSession } from '@/hooks/use-auth-session';
import { RatingsFilters } from '@/components/ratings-filters';

interface RatingsListProps {
  showFilters?: boolean;
}

export function RatingsList({ showFilters = false }: RatingsListProps) {
  const router = useRouter();
  const { user } = useAuthSession();
  const [ratings, setRatings] = useState<RatingWithOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [starFilter, setStarFilter] = useState<number | null>(null);
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'highest' | 'lowest' | 'most_liked'>('newest');

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

  const filteredAndSortedRatings = useMemo(() => {
    let filtered = [...ratings];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) =>
          r.customer_name.toLowerCase().includes(query) ||
          (r.feedback_message && r.feedback_message.toLowerCase().includes(query))
      );
    }

    // Star filter
    if (starFilter !== null) {
      filtered = filtered.filter((r) => r.overall_rating === starFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'highest':
          return b.overall_rating - a.overall_rating;
        case 'lowest':
          return a.overall_rating - b.overall_rating;
        case 'most_liked':
          return (b.like_count || 0) - (a.like_count || 0);
        default:
          return 0;
      }
    });

    return filtered;
  }, [ratings, searchQuery, starFilter, sortBy]);

  const handleRatingClick = (ratingId: string) => {
    router.push(`/rating/${ratingId}`);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 mb-2 animate-spin" />
        <p>Loading ratings...</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground">
        <Loader2 className="h-8 w-8 mb-2 animate-spin" />
        <p>Loading ratings...</p>
      </div>
    );
  }

  if (ratings.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border border-dashed rounded-lg p-8">
        <Inbox className="h-12 w-12 mb-2" />
        <p>No ratings yet.</p>
      </div>
    );
  }

  return (
    <>
      {showFilters && (
        <RatingsFilters
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          starFilter={starFilter}
          onStarFilterChange={setStarFilter}
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      )}

      {filteredAndSortedRatings.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-40 text-center text-muted-foreground border border-dashed rounded-lg p-8">
          <Inbox className="h-12 w-12 mb-2" />
          <p>No ratings match your filters.</p>
        </div>
      ) : (
        <div className="space-y-3 max-h-96 overflow-y-auto scrollable">
          {filteredAndSortedRatings.map((rating) => {
        const maskedName = maskName(rating.customer_name);
        const feedbackPreview = rating.feedback_message 
          ? (rating.feedback_message.length > 80 
              ? rating.feedback_message.substring(0, 80) + '...' 
              : rating.feedback_message)
          : 'No feedback';

        return (
          <Card
            key={rating.id}
            className="cursor-pointer hover:border-primary transition-colors"
            onClick={() => handleRatingClick(rating.id)}
          >
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                {/* Profile Icon */}
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <span className="text-primary font-semibold text-sm">
                    {maskedName.charAt(0).toUpperCase()}
                  </span>
                </div>

                {/* Rating Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-sm">{maskedName}</span>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(rating.created_at), 'yyyy-MM-dd')}
                      </span>
                    </div>
                  </div>

                  {/* Stars */}
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

                  {/* Feedback Preview */}
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {feedbackPreview}
                  </p>

                  {/* Like Count */}
                  {rating.like_count > 0 && (
                    <div className="flex items-center gap-1 mt-2 text-xs text-muted-foreground">
                      <Heart className="h-3 w-3" />
                      <span>{rating.like_count} {rating.like_count === 1 ? 'like' : 'likes'}</span>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
        </div>
      )}
    </>
  );
}

