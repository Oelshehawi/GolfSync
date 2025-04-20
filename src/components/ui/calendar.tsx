"use client";

import * as React from "react";
import { DayPicker, type DayPickerProps } from "react-day-picker";
import { cn } from "~/lib/utils";

export interface CalendarProps
  extends Omit<DayPickerProps, "mode" | "selected" | "onSelect"> {
  selected?: Date;
  onSelect?: (date: Date | undefined) => void;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

function Calendar({
  selected,
  onSelect,
  modifiers,
  modifiersClassNames,
  theme,
}: CalendarProps) {
  const themeStyles = {
    ["--org-primary" as string]: theme?.primary,
    ["--org-secondary" as string]: theme?.secondary,
    ["--org-tertiary" as string]: theme?.tertiary,
  } as React.CSSProperties;

  return (
    <div className="relative w-full max-w-full overflow-hidden">
      <DayPicker
        selected={selected}
        mode="single"
        onSelect={onSelect}
        numberOfMonths={3}
        modifiers={modifiers}
        modifiersClassNames={modifiersClassNames}
        style={themeStyles}
        classNames={{
          months:
            "flex flex-col sm:flex-row justify-between space-y-4 sm:space-y-0 sm:space-x-2 md:space-x-4",
          month: "w-full place-items-center space-y-2 space-x-0 border rounded-md p-2 sm:p-3",
          caption: "flex justify-center pt-1 relative items-center",
          caption_label: "text-sm font-medium",
          nav: "absolute w-full top-[50%] -translate-y-[50%] flex justify-between left-0 right-0 px-2",
          button_next:
            "h-7 w-7 hover:cursor-pointer p-0 hover:bg-[var(--org-primary)] rounded-md",
          button_previous:
            "h-7 w-7 p-0 hover:bg-[var(--org-primary)] hover:cursor-pointer rounded-md",
          day: cn(
            "h-7 w-7 sm:h-8 sm:w-8 p-0 font-normal text-xs sm:text-sm rounded-md",
            "[&:not([data-outside='true'])]:hover:bg-[var(--org-primary)] [&:not([data-outside='true'])]:hover:cursor-pointer [&:not([data-outside='true'])]:hover:text-white",
          ),
          day_button: cn(
            "h-7 w-7 sm:h-8 sm:w-8 p-0 font-normal text-xs sm:text-sm rounded-md",
            "[&:not([data-outside='true'])]:hover:bg-[var(--org-primary)] [&:not([data-outside='true'])]:hover:cursor-pointer [&:not([data-outside='true'])]:hover:text-white",
          ),
          today:
            "[&:not([data-outside='true'])]:bg-[var(--org-secondary)] [&:not([data-outside='true'])]:text-accent-foreground",
          selected:
            "[&:not([data-outside='true'])]:!bg-[var(--org-primary)] [&:not([data-outside='true'])]:text-white [&:not([data-outside='true'])]:text-primary-foreground",
        }}
      />
    </div>
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
