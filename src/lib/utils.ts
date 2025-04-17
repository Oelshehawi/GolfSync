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
