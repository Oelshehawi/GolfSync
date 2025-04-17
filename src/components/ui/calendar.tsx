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
  month,
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
    <DayPicker
      animate
      mode="single"
      selected={selected}
      month={month}
      onSelect={onSelect}
      numberOfMonths={3}
      modifiers={modifiers}
      modifiersClassNames={modifiersClassNames}
      style={themeStyles}
      classNames={{
        months:
          "flex flex-col justify-evenly sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4 space-x-0 border rounded-md p-6",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-sm font-medium",
        nav: "hidden",
        day: "h-12 w-12 hover:bg-[var(--org-primary)] hover:cursor-pointer rounded-xl text-center font-normal ",
        day_button:
          "h-12 w-12  hover:bg-[var(--org-primary)] hover:cursor-pointer rounded-xl text-center font-normal",
        today: "bg-[var(--org-primary)] text-white text-accent-foreground",
        selected: "!bg-[var(--org-tertiary)] text-white  text-primary-foreground",
      }}
    />
  );
}
Calendar.displayName = "Calendar";

export { Calendar };
