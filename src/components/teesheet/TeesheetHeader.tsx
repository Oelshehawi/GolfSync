"use client";

import { isSameDay } from "date-fns";
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
import { formatDate } from "~/lib/dates";

interface TeesheetHeaderProps {
  teesheetDate: Date;
  config: TeesheetConfig;
  teesheetId: number;
  timeBlocks: TimeBlockWithMembers[];
  isAdmin?: boolean;
}

export function TeesheetHeader({
  teesheetDate,
  config,
  teesheetId,
  timeBlocks,
  isAdmin,
}: TeesheetHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleDateChange = (days: number) => {
    const newDate = new Date(teesheetDate);
    newDate.setDate(teesheetDate.getDate() + days);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatDate(newDate, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`);
  };

  const today = new Date();

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
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">{formatDate(teesheetDate)}</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
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
            onSelect={(newDate: Date | undefined) => {
              if (newDate) {
                const params = new URLSearchParams(searchParams.toString());
                params.set("date", formatDate(newDate, "yyyy-MM-dd"));
                router.push(`?${params.toString()}`);
              }
            }}
          />
        </Card>
      )}
    </div>
  );
}
