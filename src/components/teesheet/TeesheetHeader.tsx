"use client";

import { format, parse, isSameDay } from "date-fns";
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
import { ConfigInfo } from "./ConfigInfo";
import type { TeesheetConfig } from "~/app/types/TeeSheetTypes";

interface TeesheetHeaderProps {
  date: Date;
  config: TeesheetConfig;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function TeesheetHeader({
  date: initialDate,
  config,
  theme,
}: TeesheetHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  // Use search params date if available, otherwise use initial date
  const date = searchParams.get("date")
    ? parse(searchParams.get("date")!, "yyyy-MM-dd", new Date())
    : initialDate;

  const handleDateChange = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", format(newDate, "yyyy-MM-dd"));
    router.push(`?${params.toString()}`);
  };

  const today = new Date();
  const modifiers = {
    today: (day: Date) => isSameDay(day, today),
    selected: (day: Date) => isSameDay(day, date),
  };

  const themeStyles = {
    ["--org-primary" as string]: theme?.primary,
    ["--org-secondary" as string]: theme?.secondary,
    ["--org-tertiary" as string]: theme?.tertiary,
  } as React.CSSProperties;



  return (
    <div className="space-y-4" style={themeStyles}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => handleDateChange(-1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-2xl font-bold">
            {format(date, "EEEE, MMMM d, yyyy")}
          </h1>
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
          {format(date, "MMMM yyyy")}
        </Button>
      </div>

      <ConfigInfo config={config} />

      {searchParams.get("showCalendar") === "true" && (
        <Card className="mt-4 p-4">
          <Calendar
            selected={date}
            month={date}
            modifiers={modifiers}
            theme={theme}
            onSelect={(newDate: Date | undefined) => {
              if (newDate) {
                const params = new URLSearchParams(searchParams.toString());
                params.set("date", format(newDate, "yyyy-MM-dd"));
                router.push(`?${params.toString()}`);
              }
            }}
            numberOfMonths={3}
            showOutsideDays
          />
        </Card>
      )}
    </div>
  );
}
