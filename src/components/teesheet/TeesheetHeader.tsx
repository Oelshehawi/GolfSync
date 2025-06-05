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
  Settings,
  Activity,
  RotateCw,
  Bug,
} from "lucide-react";
import { ConfigInfo } from "../settings/teesheet/ConfigInfo";
import type {
  TeesheetConfig,
  TimeBlockWithMembers,
} from "~/app/types/TeeSheetTypes";
import { formatCalendarDate, formatDisplayDate } from "~/lib/utils";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { updateTeesheetConfigForDate } from "~/server/settings/actions";
import toast from "react-hot-toast";
import { populateTimeBlocksWithRandomMembers } from "~/server/teesheet/actions";

// Check if we're in development mode
const isDev = process.env.NODE_ENV === "development";

interface TeesheetHeaderProps {
  dateString: string;
  config: TeesheetConfig;
  teesheetId: number;
  timeBlocks: TimeBlockWithMembers[];
  isAdmin?: boolean;
}

export function TeesheetHeader({
  dateString: initialDateString,
  config,
  teesheetId,
  timeBlocks,
  isAdmin,
}: TeesheetHeaderProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);

  // Use search params date if available, otherwise use initial date string
  const dateFromParams = searchParams.get("date");

  // Determine the active date string
  const activeDateString = dateFromParams || initialDateString;

  // Parse the string to a Date object for display purposes only
  const date = parse(activeDateString, "yyyy-MM-dd", new Date());

  const handleDateChange = (days: number) => {
    const newDate = new Date(date);
    newDate.setDate(date.getDate() + days);
    const params = new URLSearchParams(searchParams.toString());
    const formattedDate = formatCalendarDate(newDate);
    params.set("date", formattedDate);
    router.push(`?${params.toString()}`);
  };

  const today = new Date();

  const modifiers = {
    today: (day: Date) => isSameDay(day, today),
    selected: (day: Date) => isSameDay(day, date),
  };

  const handleConfigChange = async (configId: number) => {
    if (configId === config.id) return;

    setIsUpdating(true);
    try {
      const result = await updateTeesheetConfigForDate(teesheetId, configId);
      if (result.success) {
        toast.success("Teesheet configuration updated successfully");
      } else {
        toast.error(result.error || "Failed to update teesheet configuration");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  // DEBUG: Populate timeblocks with random members
  const handlePopulateTimeBlocks = async () => {
    if (!teesheetId || !activeDateString) return;

    setIsPopulating(true);
    try {
      const result = await populateTimeBlocksWithRandomMembers(
        teesheetId,
        activeDateString,
      );

      if (result.success) {
        toast.success(result.message || "Successfully populated timeblocks");
      } else {
        toast.error(result.error || "Failed to populate timeblocks");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while populating timeblocks");
      console.error(error);
    } finally {
      setIsPopulating(false);
    }
  };

  // Determine if calendar should be shown
  // Default to true for admin pages, otherwise check the search param
  const shouldShowCalendar = () => {
    const showCalendarParam = searchParams.get("showCalendar");
    if (showCalendarParam !== null) {
      return showCalendarParam === "true";
    }
    // Default to true for admin pages, false for others
    return isAdmin === true;
  };

  const isCalendarVisible = shouldShowCalendar();

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
          variant={isCalendarVisible ? "default" : "outline"}
          onClick={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.set("showCalendar", isCalendarVisible ? "false" : "true");
            router.push(`?${params.toString()}`);
          }}
        >
          {isCalendarVisible ? (
            <X className="mr-2 h-4 w-4" />
          ) : (
            <CalendarIcon className="mr-2 h-4 w-4" />
          )}
          {activeDateString}
        </Button>
      </div>

      <ConfigInfo
        config={config}
        teesheetId={teesheetId}
        timeBlocks={timeBlocks}
      />

      {isCalendarVisible && (
        <Card className="mt-4 p-4">
          <Calendar
            selected={date}
            modifiers={modifiers}
            onSelect={(newDate: Date | undefined) => {
              if (newDate) {
                const params = new URLSearchParams(searchParams.toString());
                const formattedDate = formatCalendarDate(newDate);
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
