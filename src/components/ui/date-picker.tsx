"use client";

import * as React from "react";
import { Calendar as CalendarIcon } from "lucide-react";
import { formatDate, getBCToday, parseDate } from "~/lib/dates";
import { Button } from "~/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { type DateRange } from "~/app/types/UITypes";
import { DatePickerCalendar } from "./date-picker-calendar";
import { DatePickerCalendarRange } from "./date-picker-calendar-range";

export interface DatePickerProps {
  date?: Date | string;
  setDate: (date?: Date) => void;
  placeholder?: string;
  className?: string;
  dateRange?: DateRange;
  setDateRange?: (range?: DateRange) => void;
  isRangePicker?: boolean;
}

export function DatePicker({
  date,
  setDate,
  placeholder = "Pick a date",
  className,
  dateRange,
  setDateRange,
  isRangePicker = false,
}: DatePickerProps) {
  // State to track if the popover is open
  const [isOpen, setIsOpen] = React.useState(false);

  // Convert string date to Date object if needed
  const getDateObject = (dateInput?: Date | string): Date | undefined => {
    if (!dateInput) return undefined;
    if (typeof dateInput === "string") {
      return parseDate(dateInput);
    }
    return dateInput;
  };

  // Formatting function for various date displays
  const getFormattedDate = () => {
    if (isRangePicker && dateRange) {
      const fromDate = dateRange.from
        ? formatDate(dateRange.from, "MMMM do, yyyy")
        : "";
      const toDate = dateRange.to
        ? formatDate(dateRange.to, "MMMM do, yyyy")
        : "";

      if (fromDate && toDate) {
        return `${fromDate} - ${toDate}`;
      } else if (fromDate) {
        return `${fromDate} - Select end date`;
      }
      return placeholder;
    }

    const dateObj = getDateObject(date);
    return dateObj ? formatDate(dateObj, "MMMM do, yyyy") : placeholder;
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant={"outline"}
          className={cn(
            "w-full cursor-pointer justify-start text-left font-normal",
            !getDateObject(date) && !dateRange?.from && "text-muted-foreground",
            "hover:bg-opacity-20 hover:border-org-primary hover:bg-org-secondary",
            className,
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getFormattedDate()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        {isRangePicker && setDateRange ? (
          <DatePickerCalendarRange
            selected={dateRange}
            onSelect={(range?: DateRange) => {
              setDateRange(range);
              if (range?.to) {
                setIsOpen(false);
              }
            }}
          />
        ) : (
          <DatePickerCalendar
            selected={getDateObject(date)}
            onSelect={(selectedDate?: Date) => {
              setDate(selectedDate);
              setIsOpen(false);
            }}
          />
        )}
      </PopoverContent>
    </Popover>
  );
}
