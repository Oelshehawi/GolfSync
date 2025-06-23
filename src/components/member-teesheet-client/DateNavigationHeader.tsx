"use client";

import { Button } from "~/components/ui/button";
import { ChevronLeft, ChevronRight, CalendarIcon, Loader2 } from "lucide-react";
import { formatDateWithDay } from "~/lib/dates";

interface DateNavigationHeaderProps {
  date: Date;
  onPreviousDay: () => void;
  onNextDay: () => void;
  onDatePickerToggle: () => void;
  loading?: boolean;
  swipeLoading?: boolean;
}

export function DateNavigationHeader({
  date,
  onPreviousDay,
  onNextDay,
  onDatePickerToggle,
  loading = false,
  swipeLoading = false,
}: DateNavigationHeaderProps) {
  return (
    <div className="sticky top-2 z-30 mb-4 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          size="sm"
          onClick={onPreviousDay}
          disabled={loading || swipeLoading}
          className="hover:bg-org-primary/10 hover:text-org-primary h-10 w-10 rounded-full"
          aria-label="Previous day"
        >
          {swipeLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ChevronLeft className="h-5 w-5" />
          )}
        </Button>

        <div className="flex items-center gap-2">
          <h2 className="text-lg font-bold text-gray-900">
            {formatDateWithDay(date)}
          </h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onDatePickerToggle}
            disabled={loading || swipeLoading}
            className="hover:bg-org-primary/10 hover:text-org-primary h-8 w-8 rounded-full"
            aria-label="Open date picker"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={onNextDay}
          disabled={loading || swipeLoading}
          className="hover:bg-org-primary/10 hover:text-org-primary h-10 w-10 rounded-full"
          aria-label="Next day"
        >
          {swipeLoading ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : (
            <ChevronRight className="h-5 w-5" />
          )}
        </Button>
      </div>

      {/* Swipe Loading Indicator */}
      {swipeLoading && (
        <div className="mt-2 flex items-center justify-center">
          <div className="text-org-primary flex items-center gap-2 text-sm">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Loading new date...</span>
          </div>
        </div>
      )}
    </div>
  );
}
