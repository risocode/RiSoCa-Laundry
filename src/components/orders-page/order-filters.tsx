'use client';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Filter, Calendar as CalendarIcon } from 'lucide-react';

interface OrderFiltersProps {
  searchQuery: string;
  onSearchChange: (value: string) => void;
  statusFilter: string;
  onStatusFilterChange: (value: string) => void;
  paymentFilter: string;
  onPaymentFilterChange: (value: string) => void;
  datePreset: string;
  onDatePresetChange: (value: 'all' | 'today') => void;
  filteredCount: number;
  totalCount: number;
  isLoading: boolean;
}

export function OrderFilters({
  searchQuery,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  paymentFilter,
  onPaymentFilterChange,
  datePreset,
  onDatePresetChange,
  filteredCount,
  totalCount,
  isLoading,
}: OrderFiltersProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search orders..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="completed">Completed</option>
          <option value="Order Created">Order Created</option>
          <option value="Order Placed">Order Placed</option>
          <option value="Washing">Washing</option>
          <option value="Drying">Drying</option>
          <option value="Folding">Folding</option>
          <option value="Ready for Pick Up">Ready for Pick Up</option>
          <option value="Out for Delivery">Out for Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Success">Success</option>
          <option value="Partial Complete">Partial Complete</option>
          <option value="Canceled">Canceled</option>
        </select>
        <select
          value={paymentFilter}
          onChange={(e) => onPaymentFilterChange(e.target.value)}
          className="px-3 py-2 rounded-md border bg-background text-sm"
        >
          <option value="all">All Payments</option>
          <option value="paid">Paid</option>
          <option value="unpaid">Unpaid</option>
          <option value="partial">Partially Paid</option>
        </select>
      </div>

      {/* Date Filter */}
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
          <CalendarIcon className="h-4 w-4" />
          <span>Date Filter</span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant={datePreset === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDatePresetChange('all')}
            className="h-8 text-xs flex-shrink-0"
          >
            All Time
          </Button>
          <Button
            type="button"
            variant={datePreset === 'today' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onDatePresetChange('today')}
            className="h-8 text-xs flex-shrink-0"
          >
            Today
          </Button>
        </div>
      </div>

      {/* Results Summary */}
      {!isLoading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
          <Filter className="h-4 w-4" />
          <span>
            Showing <strong className="text-foreground">{filteredCount}</strong>{' '}
            of <strong className="text-foreground">{totalCount}</strong> orders
          </span>
        </div>
      )}
    </div>
  );
}
