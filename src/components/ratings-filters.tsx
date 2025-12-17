'use client';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, X, Filter } from 'lucide-react';

interface RatingsFiltersProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  starFilter: number | null;
  onStarFilterChange: (stars: number | null) => void;
  sortBy: 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_liked';
  onSortChange: (sort: 'newest' | 'oldest' | 'highest' | 'lowest' | 'most_liked') => void;
}

export function RatingsFilters({
  searchQuery,
  onSearchChange,
  starFilter,
  onStarFilterChange,
  sortBy,
  onSortChange,
}: RatingsFiltersProps) {
  return (
    <div className="space-y-4 mb-6">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search by customer name or feedback..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="pl-10 pr-10"
        />
        {searchQuery && (
          <button
            type="button"
            onClick={() => onSearchChange('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter:</span>
        </div>
        
        <div className="flex flex-wrap gap-2">
          <Button
            variant={starFilter === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => onStarFilterChange(null)}
          >
            All
          </Button>
          {[5, 4, 3, 2, 1].map((stars) => (
            <Button
              key={stars}
              variant={starFilter === stars ? 'default' : 'outline'}
              size="sm"
              onClick={() => onStarFilterChange(stars)}
            >
              {stars}★
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-2 ml-auto">
          <span className="text-sm text-muted-foreground">Sort:</span>
          <Select value={sortBy} onValueChange={onSortChange}>
            <SelectTrigger className="w-[150px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="highest">Highest Rated</SelectItem>
              <SelectItem value="lowest">Lowest Rated</SelectItem>
              <SelectItem value="most_liked">Most Liked</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}

