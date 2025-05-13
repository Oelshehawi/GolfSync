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
import { useEffect } from "react";

interface TeesheetHeaderProps {
  date: Date;
  config: TeesheetConfig;
  teesheetId: number;
  timeBlocks: TimeBlockWithMembers[];
}

export function TeesheetHeader({
  date: initialDate,
  config,
  teesheetId,
  timeBlocks,
}: TeesheetHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Debug initial props date
  console.log("[CLIENT] initialDate from props:", initialDate, {
    year: initialDate.getFullYear(),
    month: initialDate.getMonth() + 1,
    day: initialDate.getDate(),
  });

  // Debug current client date
  const clientNow = new Date();
  console.log("[CLIENT] Current client browser date:", clientNow, {
    year: clientNow.getFullYear(),
    month: clientNow.getMonth() + 1,
    day: clientNow.getDate(),
    hours: clientNow.getHours(),
    minutes: clientNow.getMinutes(),
    timezone: clientNow.getTimezoneOffset() / -60,
  });

  // Use search params date if available, otherwise use initial date
  const dateFromParams = searchParams.get("date");
  console.log("[CLIENT] Date from search params:", dateFromParams);

  const date = dateFromParams
    ? parse(dateFromParams, "yyyy-MM-dd", new Date())
    : initialDate;

  console.log("[CLIENT] Final date after params check:", date, {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
  });

  // Log on component mount
  useEffect(() => {
    console.log("[CLIENT] TeesheetHeader mounted with date:", date, {
      formattedDisplay: formatDisplayDate(date),
      formattedCalendar: formatCalendarDate(date),
    });

    // Check today's date in client
    const today = new Date();
    console.log("[CLIENT] Today's date in client:", today, {
      year: today.getFullYear(),
      month: today.getMonth() + 1,
      day: today.getDate(),
    });
  }, [date]);

  const handleDateChange = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    console.log("[CLIENT] Changed date:", newDate);
    const params = new URLSearchParams(searchParams.toString());
    const formattedDate = formatCalendarDate(newDate);
    console.log("[CLIENT] Formatted date for URL:", formattedDate);
    params.set("date", formattedDate);
    router.push(`?${params.toString()}`);
  };

  const today = new Date();
  console.log("[CLIENT] Today for calendar modifier:", today);

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
          {formatCalendarDate(date)}
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
                console.log("[CLIENT] Calendar selected date:", newDate);
                const params = new URLSearchParams(searchParams.toString());
                const formattedDate = formatCalendarDate(newDate);
                console.log(
                  "[CLIENT] Formatted calendar selection:",
                  formattedDate,
                );
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
