import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, parse, addMinutes, parseISO } from "date-fns";
import type { TeesheetConfig } from "~/app/types/TeeSheetTypes";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Generates an array of time strings in "HH:MM" format based on config
 */
export function generateTimeBlocks(config: TeesheetConfig): string[] {
  if (!config.startTime || !config.endTime || !config.interval) {
    throw new Error("Invalid configuration: missing required time parameters");
  }

  const times: string[] = [];
  const baseDate = new Date(); // Just a base date to use for time parsing

  // Parse start and end times
  const startTime = parse(config.startTime, "HH:mm", baseDate);
  const endTime = parse(config.endTime, "HH:mm", baseDate);
  const interval = config.interval || 15; // Default to 15 if interval is somehow undefined

  if (startTime >= endTime) {
    throw new Error(
      "Invalid configuration: start time must be before end time",
    );
  }

  // Generate all time slots
  for (
    let time = startTime;
    time <= endTime;
    time = addMinutes(time, interval)
  ) {
    times.push(format(time, "HH:mm"));
  }

  return times;
}

/**
 * Formats a date in YYYY-MM-DD format
 */
export function formatDateToYYYYMMDD(date: Date | string): string {
  if (typeof date === "string") {
    // If it's already in YYYY-MM-DD format, return it
    if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return date;
    }
    // Otherwise, parse the string to a date
    return format(new Date(date), "yyyy-MM-dd");
  }
  return format(date, "yyyy-MM-dd");
}

/**
 * Formats a display time from HH:MM to user-friendly format (e.g., "2:30 PM")
 */
export function formatDisplayTime(time: string): string {
  const parts = time.split(":");
  const hours = parseInt(parts[0] || "0", 10);
  const minutes = parseInt(parts[1] || "0", 10);

  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  return format(date, "h:mm a");
}

/**
 * Formats a date for display in user-friendly format (e.g., "May 7th, 2025")
 */
export function formatDisplayDate(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMMM do, yyyy");
}

/**
 * Formats a date and time for display (e.g., "May 7th 7:00 AM, 2025")
 */
export function formatDisplayDateTime(
  date: Date | string,
  time?: string,
): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;

  if (time) {
    // If time is provided as a separate HH:MM string
    return `${format(dateObj, "MMMM do")} ${formatDisplayTime(time)}, ${format(dateObj, "yyyy")}`;
  }

  // Otherwise format the date object with its time component
  return format(dateObj, "MMMM do h:mm a, yyyy");
}

/**
 * Formats a month for display (e.g., "May 2025")
 */
export function formatDisplayMonth(date: Date | string): string {
  const dateObj = typeof date === "string" ? new Date(date) : date;
  return format(dateObj, "MMMM yyyy");
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
 * Checks if a timeblock is in the past based on its date and time
 * @param date The date of the timeblock in "YYYY-MM-DD" format or Date object
 * @param time The time of the timeblock in "HH:MM" format (optional)
 * @returns true if the timeblock is in the past
 */
export function checkTimeBlockInPast(
  date: Date | string,
  time?: string,
): boolean {
  const now = new Date();

  // Handle date parameter to ensure consistent timezone handling
  let blockDate: Date;
  if (typeof date === "string") {
    // Parse the YYYY-MM-DD format manually to ensure proper local date
    const dateParts = date.split("-");
    const year = parseInt(dateParts[0] || "0", 10);
    const month = parseInt(dateParts[1] || "0", 10) - 1; // JS months are 0-indexed
    const day = parseInt(dateParts[2] || "0", 10);

    blockDate = new Date(year, month, day);
  } else {
    // Create a new date with just the year, month, and day components
    // to avoid timezone issues
    blockDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  }

  // If time is provided, set the hours and minutes
  if (time) {
    const timeParts = time.split(":");
    const hours = parseInt(timeParts[0] || "0", 10);
    const minutes = parseInt(timeParts[1] || "0", 10);
    blockDate.setHours(hours, minutes, 0, 0);
  } else {
    // If no time provided, set to start of day (midnight)
    blockDate.setHours(0, 0, 0, 0);
  }

  return blockDate < now;
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
 * Formats an array of day numbers (0-6) to readable text representation
 * 0 = Sunday, 1 = Monday, etc.
 */
export function formatDaysOfWeek(days: number[]): string {
  if (!days || days.length === 0) return "None";

  const dayNames = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const sortedDays = [...days].sort((a, b) => a - b);

  if (sortedDays.length === 7) return "Every day";
  if (
    sortedDays.length === 5 &&
    sortedDays.includes(1) &&
    sortedDays.includes(2) &&
    sortedDays.includes(3) &&
    sortedDays.includes(4) &&
    sortedDays.includes(5)
  )
    return "Weekdays";
  if (
    sortedDays.length === 2 &&
    sortedDays.includes(0) &&
    sortedDays.includes(6)
  )
    return "Weekends";

  return sortedDays.map((day) => dayNames[day]).join(", ");
}

/**
 * Universal date formatter that reliably displays a calendar date without time components
 * This function handles any date input (string or Date object) and ensures the correct date
 * is displayed regardless of timezone.
 *
 * @param date - A Date object, ISO string, or YYYY-MM-DD string
 * @param formatString - Optional date-fns format string (default: "yyyy-MM-dd")
 * @returns Formatted date string
 */
export function formatCalendarDate(
  date: Date | string | null,
  formatString: string = "yyyy-MM-dd",
): string {
  if (!date) return "";

  try {
    // For string dates, first validate if it's a valid date string
    if (typeof date === "string") {
      // If it's already in YYYY-MM-DD format and valid, just format it directly
      if (/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        const parts = date.split("-");
        const yearStr = parts[0] || "0";
        const monthStr = parts[1] || "0";
        const dayStr = parts[2] || "0";

        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10) - 1; // JS months are 0-indexed
        const day = parseInt(dayStr, 10);

        // Validate the date components
        if (
          isNaN(year) ||
          isNaN(month) ||
          isNaN(day) ||
          month < 0 ||
          month > 11 ||
          day < 1 ||
          day > 31 ||
          year < 1000 ||
          year > 9999
        ) {
          return date; // Return the original string if it's an invalid date
        }

        // Create a new date in local time and format it
        const safeDate = new Date(year, month, day);
        if (isNaN(safeDate.getTime())) {
          return date; // Return original if it results in invalid date
        }
        return format(safeDate, formatString);
      }

      // For ISO strings, parse carefully
      const parsedDate = new Date(date);
      if (isNaN(parsedDate.getTime())) {
        return date; // Return the original string if parsing fails
      }

      // Extract components from the valid date
      const year = parsedDate.getFullYear();
      const month = parsedDate.getMonth();
      const day = parsedDate.getDate();

      // Create a new date using just the year, month, day (no time)
      const safeDate = new Date(year, month, day);
      return format(safeDate, formatString);
    }

    // For Date objects, first check if it's a valid date
    if (isNaN(date.getTime())) {
      return String(date); // Return string representation of invalid date
    }

    // Extract date components from the valid Date object
    const year = date.getFullYear();
    const month = date.getMonth();
    const day = date.getDate();

    // Create a new date with just the date portion
    const safeDate = new Date(year, month, day);
    return format(safeDate, formatString);
  } catch (error) {
    console.error("Error formatting calendar date:", error);
    return String(date);
  }
}
