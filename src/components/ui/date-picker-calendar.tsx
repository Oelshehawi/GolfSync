"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "~/lib/utils";
import { buttonVariants } from "~/components/ui/button";
import {
  addDays,
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  getDay,
  isSameDay,
  isSameMonth,
  isToday,
  parse,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export interface DatePickerCalendarProps {
  selected?: Date;
  onSelect: (date: Date | undefined) => void;
  className?: string;
  showOutsideDays?: boolean;
}

export function DatePickerCalendar({
  selected,
  onSelect,
  className,
  showOutsideDays = true,
}: DatePickerCalendarProps) {
  const [currentMonth, setCurrentMonth] = React.useState(
    format(new Date(), "MMM-yyyy"),
  );
  const firstDayCurrentMonth = parse(currentMonth, "MMM-yyyy", new Date());

  const days = React.useMemo(() => {
    return eachDayOfInterval({
      start: startOfWeek(startOfMonth(firstDayCurrentMonth)),
      end: endOfWeek(endOfMonth(firstDayCurrentMonth)),
    });
  }, [firstDayCurrentMonth]);

  // Navigation handlers
  const previousMonth = () => {
    const firstDayPreviousMonth = subMonths(firstDayCurrentMonth, 1);
    setCurrentMonth(format(firstDayPreviousMonth, "MMM-yyyy"));
  };

  const nextMonth = () => {
    const firstDayNextMonth = addMonths(firstDayCurrentMonth, 1);
    setCurrentMonth(format(firstDayNextMonth, "MMM-yyyy"));
  };

  return (
    <div className={cn("p-3", className)}>
      <div className="relative flex items-center justify-center pt-1">
        <button
          onClick={previousMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "absolute left-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          )}
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <h2 className="text-sm font-medium">
          {format(firstDayCurrentMonth, "MMMM yyyy")}
        </h2>
        <button
          onClick={nextMonth}
          className={cn(
            buttonVariants({ variant: "outline" }),
            "absolute right-1 h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
          )}
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      <div className="mt-4 grid grid-cols-7 text-center">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day, index) => (
          <div key={day} className="text-muted-foreground text-xs">
            {day}
          </div>
        ))}
      </div>

      <div className="mt-2 grid grid-cols-7 gap-1">
        {days.map((day, dayIdx) => {
          const isCurrentMonth = isSameMonth(day, firstDayCurrentMonth);
          const isSelectedDay = selected && isSameDay(day, selected);
          const isCurrentDay = isToday(day);

          // Skip rendering days from other months if showOutsideDays is false
          if (!showOutsideDays && !isCurrentMonth) {
            return <div key={dayIdx} />;
          }

          return (
            <button
              key={dayIdx}
              type="button"
              onClick={() => onSelect(day)}
              className={cn(
                "h-9 w-9 rounded-md p-0 text-center text-sm font-normal",
                isCurrentMonth
                  ? "text-foreground"
                  : "text-muted-foreground opacity-50",
                isSelectedDay && "bg-primary text-primary-foreground",
                isCurrentDay &&
                  !isSelectedDay &&
                  "bg-accent text-accent-foreground",
                !isSelectedDay &&
                  !isCurrentDay &&
                  "hover:bg-accent hover:text-accent-foreground",
              )}
            >
              {format(day, "d")}
            </button>
          );
        })}
      </div>
    </div>
  );
}
