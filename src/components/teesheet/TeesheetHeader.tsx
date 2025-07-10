"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Calendar } from "~/components/ui/calendar";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  X,
} from "lucide-react";
import { ConfigInfo } from "../settings/teesheet/ConfigInfo";
import type {
  TeesheetConfig,
  TimeBlockWithMembers,
} from "~/app/types/TeeSheetTypes";
import {
  formatDate,
  isToday,
  formatDateToYYYYMMDD,
  getBCToday,
  isSameDay,
} from "~/lib/dates";
import { addDays, subDays } from "date-fns";
import { useState, useCallback } from "react";

interface TeesheetHeaderProps {
  teesheetDate: Date;
  config: TeesheetConfig;
  teesheetId: number;
  timeBlocks: TimeBlockWithMembers[];
  isAdmin?: boolean;
  onDateChange?: (newDate: Date) => void; // Callback for client-side navigation
}

export function TeesheetHeader({
  teesheetDate,
  config,
  teesheetId,
  timeBlocks,
  isAdmin,
  onDateChange,
}: TeesheetHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleDateChange = useCallback(
    async (days: number) => {
      if (isNavigating) return; // Prevent double-clicks

      setIsNavigating(true);
      const newDate =
        days === 1
          ? addDays(teesheetDate, 1)
          : subDays(teesheetDate, Math.abs(days));

      try {
        if (onDateChange) {
          // Use client-side navigation for faster performance
          await onDateChange(newDate);

          // Update URL without page reload
          const params = new URLSearchParams(searchParams.toString());
          params.set("date", formatDate(newDate, "yyyy-MM-dd"));
          const newUrl = `${window.location.pathname}?${params.toString()}`;
          window.history.pushState({}, "", newUrl);
        } else {
          // Fallback to server-side navigation
          const params = new URLSearchParams(searchParams.toString());
          params.set("date", formatDate(newDate, "yyyy-MM-dd"));
          router.push(`?${params.toString()}`);
        }
      } finally {
        setIsNavigating(false);
      }
    },
    [teesheetDate, onDateChange, router, searchParams, isNavigating],
  );

  const handleCalendarSelect = useCallback(
    async (newDate: Date | undefined) => {
      if (!newDate || isSameDay(newDate, teesheetDate)) return;

      setIsNavigating(true);

      try {
        if (onDateChange) {
          // Use client-side navigation for faster performance
          await onDateChange(newDate);

          // Update URL without page reload
          const params = new URLSearchParams(searchParams.toString());
          params.set("date", formatDate(newDate, "yyyy-MM-dd"));
          const newUrl = `${window.location.pathname}?${params.toString()}`;
          window.history.pushState({}, "", newUrl);
        } else {
          // Fallback to server-side navigation
          const params = new URLSearchParams(searchParams.toString());
          params.set("date", formatDate(newDate, "yyyy-MM-dd"));
          router.push(`?${params.toString()}`);
        }
      } finally {
        setIsNavigating(false);
      }
    },
    [onDateChange, router, searchParams, isNavigating, teesheetDate],
  );

  const today = getBCToday();

  const modifiers = {
    today: (day: Date) => isSameDay(day, today),
    selected: (day: Date) => isSameDay(day, teesheetDate),
  };

  // Determine if calendar should be shown
  // Default to true for admin pages, otherwise check the search param
  const shouldShowCalendar = () => {
    const showCalendarParam = searchParams.get("showCalendar");
    if (showCalendarParam !== null) {
      return showCalendarParam === "true";
    }
    // Default to true for admin pages, false for others
    return isAdmin === true;
  };

  const isCalendarVisible = shouldShowCalendar();

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(-1)}
            disabled={isNavigating}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{formatDate(teesheetDate)}</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(1)}
            disabled={isNavigating}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>

          {/* Loading indicator for navigation */}
          {isNavigating && (
            <div className="text-sm text-gray-500">Loading...</div>
          )}
        </div>
        <Button
          variant={isCalendarVisible ? "default" : "outline"}
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("showCalendar", isCalendarVisible ? "false" : "true");
            router.push(`?${params.toString()}`);
          }}
        >
          {isCalendarVisible ? (
            <X className="mr-2 h-4 w-4" />
          ) : (
            <CalendarIcon className="mr-2 h-4 w-4" />
          )}
          {formatDate(teesheetDate, "yyyy-MM-dd")}
        </Button>
      </div>

      <ConfigInfo
        config={config}
        teesheetId={teesheetId}
        timeBlocks={timeBlocks}
      />

      {isCalendarVisible && (
        <Card className="mt-4 p-4">
          <Calendar
            selected={teesheetDate}
            modifiers={modifiers}
            onSelect={handleCalendarSelect}
            disabled={isNavigating}
          />
        </Card>
      )}
    </div>
  );
}
