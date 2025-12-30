'use client';

import * as React from 'react';
import { Calendar } from '@/components/ui/calendar';
import { Button } from '@/components/ui/button';
import { format, isSameDay } from 'date-fns';
import type { DateRange } from 'react-day-picker';

type StaticDateRangePickerProps = {
  value?: DateRange;
  onChange?: (range: DateRange | undefined) => void;
  onCancel?: () => void;
  onConfirm?: (range: DateRange | undefined) => void;
  className?: string;
};

export function StaticDateRangePicker({
  value,
  onChange,
  onCancel,
  onConfirm,
  className,
}: StaticDateRangePickerProps) {
  const [dateRange, setDateRange] = React.useState<DateRange | undefined>(value);

  React.useEffect(() => {
    setDateRange(value);
  }, [value]);

  const handleSelect = (range: DateRange | undefined) => {
    if (!range) {
      setDateRange(undefined);
      onChange?.(undefined);
      return;
    }

    // If user clicks the same date twice (from and to are the same), treat as single date
    if (range.from && range.to && isSameDay(range.from, range.to)) {
      const singleDate = { from: range.from, to: undefined };
      setDateRange(singleDate);
      onChange?.(singleDate);
    } else {
      setDateRange(range);
      onChange?.(range);
    }
  };

  const handleCancel = () => {
    setDateRange(undefined);
    onChange?.(undefined);
    onCancel?.();
  };

  const handleConfirm = () => {
    onConfirm?.(dateRange);
  };

  const formatDateRange = () => {
    if (!dateRange?.from) return '';
    
    if (dateRange.to && !isSameDay(dateRange.from, dateRange.to)) {
      return `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d, yyyy')}`;
    }
    
    return format(dateRange.from, 'MMM d, yyyy');
  };

  return (
    <div className={`flex flex-col bg-background rounded-xl shadow-xl border border-border overflow-hidden ${className || ''}`}>
      {/* Simple Selected Date Display */}
      {dateRange?.from && (
        <div className="px-5 py-3.5 border-b border-border bg-background">
          <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-1">Selected</div>
          <div className="text-lg font-semibold text-foreground">
            {formatDateRange()}
          </div>
        </div>
      )}

      {/* Calendar */}
      <div className="p-5 bg-background">
        <Calendar
          mode="range"
          selected={dateRange}
          onSelect={handleSelect}
          numberOfMonths={1}
        />
      </div>

      {/* Simple Buttons */}
      <div className="flex gap-2 px-5 py-3.5 border-t border-border bg-background">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          className="flex-1 h-9 text-sm"
        >
          Cancel
        </Button>
        <Button
          type="button"
          onClick={handleConfirm}
          className="flex-1 h-9 text-sm"
          disabled={!dateRange?.from}
        >
          OK
        </Button>
      </div>
    </div>
  );
}
