import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parse, addMinutes } from "date-fns";
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
}) {
  return {
    primary: theme?.primary || "#000000",
    secondary: theme?.secondary || "#f3f4f6",
    tertiary: theme?.tertiary || "#9ca3af",
    text: {
      primary: theme?.primary || "#000000",
      secondary: "#4B5563",
    },
    background: {
      primary: "#FFFFFF",
      secondary: theme?.secondary || "#f3f4f6",
    },
  };
}

/**
 * Converts a local date to UTC midnight
 */
export function localToUTCMidnight(date: Date): Date {
  return new Date(
    Date.UTC(
      date.getUTCFullYear(),
      date.getUTCMonth(),
      date.getUTCDate(),
      0,
      0,
      0,
      0,
    ),
  );
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
 * Checks if two dates are on the same day (ignoring time)
 */
export function isSameDay(date1: Date, date2: Date): boolean {
  return (
    date1.getUTCFullYear() === date2.getUTCFullYear() &&
    date1.getUTCMonth() === date2.getUTCMonth() &&
    date1.getUTCDate() === date2.getUTCDate()
  );
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
