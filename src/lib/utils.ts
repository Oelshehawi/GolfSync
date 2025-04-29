import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parse, addMinutes, parseISO } from "date-fns";
import type { TeesheetConfig } from "~/app/types/TeeSheetTypes";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateTimeBlocks(date: Date, config: TeesheetConfig): Date[] {
  if (!config.startTime || !config.endTime || !config.interval) {
    throw new Error("Invalid configuration: missing required time parameters");
  }

  const blocks: Date[] = [];
  const startTime = parse(config.startTime, "HH:mm", date);
  const endTime = parse(config.endTime, "HH:mm", date);

  if (startTime >= endTime) {
    throw new Error(
      "Invalid configuration: start time must be before end time",
    );
  }

  for (
    let time = startTime;
    time <= endTime;
    time = addMinutes(time, config.interval)
  ) {
    blocks.push(new Date(time));
  }

  return blocks;
}

export function formatTimeBlockTime(date: Date): string {
  return format(date, "HH:mm");
}

export function getOrganizationColors(theme?: {
  primary?: string;
  secondary?: string;
  tertiary?: string;
  ["--org-primary"]?: string;
  ["--org-secondary"]?: string;
  ["--org-tertiary"]?: string;
}) {
  // Handle both formats of theme properties
  const primaryColor = theme?.primary || theme?.["--org-primary"] || "#000000";
  const secondaryColor =
    theme?.secondary || theme?.["--org-secondary"] || "#f3f4f6";
  const tertiaryColor =
    theme?.tertiary || theme?.["--org-tertiary"] || "#9ca3af";

  return {
    primary: primaryColor,
    secondary: secondaryColor,
    tertiary: tertiaryColor,
    text: {
      primary: primaryColor,
      secondary: "#4B5563",
    },
    background: {
      primary: "#FFFFFF",
      secondary: secondaryColor,
    },
  };
}

/**
 * Converts a UTC date or ISO string to local timezone Date object
 */
export function convertUTCToLocal(utcDate: Date | string): Date {
  const date = typeof utcDate === "string" ? new Date(utcDate) : utcDate;

  return new Date(date);
}

/**
 * Checks if a timeblock is in the past compared to current time
 * Both dates are compared directly using JS Date object's built-in comparison
 */
export function checkTimeBlockInPast(timeBlockDate: Date | string): boolean {
  const now = new Date();
  const blockTime =
    typeof timeBlockDate === "string" ? new Date(timeBlockDate) : timeBlockDate;

  return blockTime < now;
}

/**
 * Converts a local date to UTC midnight
 * IMPORTANT: This function needs to properly preserve the local date when converting to UTC
 */
export function localToUTCMidnight(date: Date): Date {
  // Create new date at midnight in local time
  const localMidnight = new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate(),
    0,
    0,
    0,
    0,
  );

  // Convert to UTC (this handles timezone offset conversion automatically)
  const utcDate = new Date(localMidnight.toISOString());

  return utcDate;
}

/**
 * Converts a UTC date to local midnight
 */
export function utcToLocalMidnight(date: Date): Date {
  const localDate = new Date(date);
  return new Date(
    localDate.getFullYear(),
    localDate.getMonth(),
    localDate.getDate(),
    0,
    0,
    0,
    0,
  );
}

/**
 * Checks if two dates are on the same day (ignoring time) using UTC components
 * This is useful for server-side date comparisons
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
}

/**
 * Checks if two dates are on the same LOCAL day (ignoring time)
 * This is useful for client-side date comparisons in the user's timezone
 */
export function isSameLocalDay(date1: Date, date2: Date): boolean {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
}

/**
 * Debugging function to log date comparisons in both UTC and local time
 */
export function debugDateComparison(
  date1: Date,
  date2: Date,
  label: string = "Date comparison",
): void {
  const localSame = isSameLocalDay(date1, date2);
  const utcSame = isSameDay(date1, date2);

  console.log({
    label,
    date1: {
      utc: date1.toISOString(),
      local: date1.toLocaleString(),
      localDate: date1.toLocaleDateString(),
      utcComponents: {
        year: date1.getUTCFullYear(),
        month: date1.getUTCMonth(),
        day: date1.getUTCDate(),
      },
      localComponents: {
        year: date1.getFullYear(),
        month: date1.getMonth(),
        day: date1.getDate(),
      },
    },
    date2: {
      utc: date2.toISOString(),
      local: date2.toLocaleString(),
      localDate: date2.toLocaleDateString(),
      utcComponents: {
        year: date2.getUTCFullYear(),
        month: date2.getUTCMonth(),
        day: date2.getUTCDate(),
      },
      localComponents: {
        year: date2.getFullYear(),
        month: date2.getMonth(),
        day: date2.getDate(),
      },
    },
    isSameLocalDay: localSame,
    isSameUTCDay: utcSame,
    timezoneOffset: new Date().getTimezoneOffset(),
  });

  return;
}

/**
 * Formats a date in the local timezone
 */
export function formatLocalDate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/**
 * Formats a time in the local timezone
 */
export function formatLocalTime(date: Date): string {
  return format(date, "HH:mm");
}

/**
 * Formats a date and time in the local timezone
 */
export function formatLocalDateTime(date: Date): string {
  return format(date, "yyyy-MM-dd HH:mm");
}

/**
 * Formats a date for display in the local timezone
 */
export function formatLocalDisplayDate(date: Date): string {
  return format(date, "EEEE, MMMM d, yyyy");
}

/**
 * Formats a month for display in the local timezone
 */
export function formatLocalDisplayMonth(date: Date): string {
  return format(date, "MMMM yyyy");
}

/**
 * Formats a time for display in user-friendly format (e.g., "2:30 PM")
 */
export function formatDisplayTime(date: Date | string): string {
  const localDate = typeof date === "string" ? new Date(date) : date;
  return format(localDate, "h:mm a");
}

/**
 * Stricter version of date comparison that compares dates by their string representation
 * This avoids timezone issues by comparing only the date portion in the same format
 */
export function areDatesEqual(date1: Date, date2: Date): boolean {
  // Convert both dates to YYYY-MM-DD format in local time, then compare
  const formatDate = (date: Date): string => {
    return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
  };

  const dateStr1 = formatDate(date1);
  const dateStr2 = formatDate(date2);

  console.log({
    function: "areDatesEqual",
    date1: date1.toISOString(),
    date2: date2.toISOString(),
    date1Formatted: dateStr1,
    date2Formatted: dateStr2,
    result: dateStr1 === dateStr2,
  });

  return dateStr1 === dateStr2;
}
