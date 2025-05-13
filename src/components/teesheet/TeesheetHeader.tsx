"use client";

import { parse, isSameDay } from "date-fns";
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
import { formatCalendarDate, formatDisplayDate } from "~/lib/utils";
import { useEffect, useState } from "react";

interface TeesheetHeaderProps {
  dateString: string;
  config: TeesheetConfig;
  teesheetId: number;
  timeBlocks: TimeBlockWithMembers[];
}

export function TeesheetHeader({
  dateString: initialDateString,
  config,
  teesheetId,
  timeBlocks,
}: TeesheetHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use search params date if available, otherwise use initial date string
  const dateFromParams = searchParams.get("date");

  // Determine the active date string
  const activeDateString = dateFromParams || initialDateString;

  // Parse the string to a Date object for display purposes only
  const date = parse(activeDateString, "yyyy-MM-dd", new Date());

  const handleDateChange = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    const params = new URLSearchParams(searchParams.toString());
    const formattedDate = formatCalendarDate(newDate);
    params.set("date", formattedDate);
    router.push(`?${params.toString()}`);
  };

  const today = new Date();

  const modifiers = {
    today: (day: Date) => isSameDay(day, today),
    selected: (day: Date) => isSameDay(day, date),
  };

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
          <h1 className="text-2xl font-bold">{formatDisplayDate(date)}</h1>
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <Button
          variant={
            searchParams.get("showCalendar") === "true" ? "default" : "outline"
          }
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set(
              "showCalendar",
              params.get("showCalendar") === "true" ? "false" : "true",
            );
            router.push(`?${params.toString()}`);
          }}
        >
          {searchParams.get("showCalendar") === "true" ? (
            <X className="mr-2 h-4 w-4" />
          ) : (
            <CalendarIcon className="mr-2 h-4 w-4" />
          )}
          {activeDateString}
        </Button>
      </div>

      <ConfigInfo
        config={config}
        teesheetId={teesheetId}
        timeBlocks={timeBlocks}
      />

      {searchParams.get("showCalendar") === "true" && (
        <Card className="mt-4 p-4">
          <Calendar
            selected={date}
            modifiers={modifiers}
            onSelect={(newDate: Date | undefined) => {
              if (newDate) {
                const params = new URLSearchParams(searchParams.toString());
                const formattedDate = formatCalendarDate(newDate);
                params.set("date", formattedDate);
                router.push(`?${params.toString()}`);
              }
            }}
          />
        </Card>
      )}
    </div>
  );
}
