"use client";

import { useEffect, useState, useRef, useMemo, useCallback } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { addDays } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  bookTeeTime,
  cancelTeeTime,
} from "~/server/members-teesheet-client/actions";
import {
  ChevronLeft,
  ChevronRight,
  CalendarIcon,
  Loader2,
  ClockIcon,
  AlertCircle,
  CheckCircle,
  X,
} from "lucide-react";
import { TimeBlockItem, type TimeBlockItemProps } from "./TimeBlockItem";
import { DatePicker } from "./DatePicker";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import {
  checkTimeBlockInPast,
  formatCalendarDate,
  formatDisplayDate,
} from "~/lib/utils";
import { parse } from "date-fns";
import { Member } from "~/app/types/MemberTypes";
import type { TimeBlockMemberView } from "~/app/types/TeeSheetTypes";
import { Skeleton } from "~/components/ui/skeleton";

// Define proper types that match TimeBlockItem requirements
type ClientTimeBlock = {
  id: number;
  startTime: string;
  endTime: string;
  members: TimeBlockMemberView[];
  restriction?: {
    isRestricted: boolean;
    reason: string;
    violations: any[];
  };
  [key: string]: any;
};

// Simple utility to scroll to a time block on today's date
function scrollToClosestTime(
  now: Date,
  selectedDate: Date | string,
  timeBlocks: ClientTimeBlock[],
) {
  // Parse the date properly
  let parsedSelectedDate: Date;
  if (typeof selectedDate === "string") {
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      const year = parseInt(parts[0] || "0");
      const month = parseInt(parts[1] || "0") - 1;
      const day = parseInt(parts[2] || "0");
      parsedSelectedDate = new Date(year, month, day);
    } else {
      parsedSelectedDate = new Date(selectedDate);
    }
  } else {
    parsedSelectedDate = selectedDate;
  }

  // Only proceed if we're on today's date
  if (
    now.getDate() !== parsedSelectedDate.getDate() ||
    now.getMonth() !== parsedSelectedDate.getMonth() ||
    now.getFullYear() !== parsedSelectedDate.getFullYear()
  ) {
    return;
  }

  // Get current time
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();

  // Skip if no timeblocks
  if (!timeBlocks.length) return;

  // Find timeblock closest to current time
  const currentTimeMinutes = currentHour * 60 + currentMinute;

  let bestBlock = timeBlocks[0];
  let bestDiff = Infinity;

  for (let i = 0; i < timeBlocks.length; i++) {
    const block = timeBlocks[i];
    if (!block || !block.startTime) continue;

    // Parse time from HH:MM format
    const timeParts = block.startTime.split(":");
    if (timeParts.length !== 2) continue;

    const blockHour = parseInt(timeParts[0] || "0", 10);
    const blockMinute = parseInt(timeParts[1] || "0", 10);
    const blockMinutes = blockHour * 60 + blockMinute;
    const diff = Math.abs(blockMinutes - currentTimeMinutes);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestBlock = block;
    }
  }

  // Scroll to element without delay
  const element = document.getElementById(`time-block-${bestBlock?.id}`);
  if (element) {
    element.scrollIntoView({ behavior: "auto", block: "center" });
  }
}

// Client component to handle interactive elements
export default function TeesheetClient({
  config,
  timeBlocks: initialTimeBlocks,
  selectedDate,
  member,
}: {
  teesheet: any;
  config: any;
  timeBlocks: ClientTimeBlock[];
  selectedDate: string | Date;
  member: Member;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [bookingTimeBlockId, setBookingTimeBlockId] = useState<number | null>(
    null,
  );
  const [cancelTimeBlockId, setCancelTimeBlockId] = useState<number | null>(
    null,
  );
  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);

  // Use a sorted version of the timeBlocks without extra state management
  const sortedTimeBlocks = useMemo(() => {
    const sorted = [...initialTimeBlocks].sort((a, b) => {
      // First sort by sortOrder
      const orderDiff = (a.sortOrder || 0) - (b.sortOrder || 0);
      if (orderDiff !== 0) return orderDiff;

      // If sortOrder is the same, use startTime as fallback
      return a.startTime.localeCompare(b.startTime);
    });

    return sorted;
  }, [initialTimeBlocks]);

  // Create a ref for the time blocks container to enable scrolling
  const timeBlocksContainerRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current time once when time blocks load
  useEffect(() => {
    if (sortedTimeBlocks.length > 0) {
      scrollToClosestTime(new Date(), selectedDate, sortedTimeBlocks);
    }
  }, [sortedTimeBlocks, selectedDate]);

  // Memoize date parsing to prevent unnecessary recalculations
  const date = useMemo(() => {
    return typeof selectedDate === "string"
      ? parse(selectedDate, "yyyy-MM-dd", new Date())
      : selectedDate;
  }, [selectedDate]);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // Navigation functions wrapped in useCallback
  const navigateToDate = useCallback(
    (newDate: Date) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("date", formatCalendarDate(newDate));
      replace(`${pathname}?${params.toString()}`);
    },
    [pathname, searchParams, replace],
  );

  const goToPreviousDay = useCallback(() => {
    const newDate = addDays(date, -1);
    // Set to start of day to avoid timezone issues
    const adjustedDate = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      0,
      0,
      0,
      0,
    );
    navigateToDate(adjustedDate);
  }, [date, navigateToDate]);

  const goToNextDay = useCallback(() => {
    const newDate = addDays(date, 1);
    // Set to start of day to avoid timezone issues
    const adjustedDate = new Date(
      newDate.getFullYear(),
      newDate.getMonth(),
      newDate.getDate(),
      0,
      0,
      0,
      0,
    );
    navigateToDate(adjustedDate);
  }, [date, navigateToDate]);

  const handleDateChange = useCallback(
    (newDate: Date) => {
      // Set to start of day to avoid timezone issues
      const adjustedDate = new Date(
        newDate.getFullYear(),
        newDate.getMonth(),
        newDate.getDate(),
        0,
        0,
        0,
        0,
      );
      navigateToDate(adjustedDate);
      setShowDatePicker(false);
    },
    [navigateToDate],
  );

  // Check for booking restrictions
  const checkBookingRestrictions = useCallback(
    async (timeBlockId: number) => {
      if (!timeBlockId) return;

      const timeBlock = sortedTimeBlocks.find((tb) => tb.id === timeBlockId);
      if (!timeBlock) return;

      // Check if the timeblock is restricted (pre-checked from server)
      if (timeBlock.restriction && timeBlock.restriction.isRestricted) {
        toast.error(
          timeBlock.restriction.reason ||
            "This timeblock is not available for booking",
          {
            icon: <AlertCircle className="h-5 w-5 text-red-500" />,
          },
        );
        return;
      }

      // No restrictions, proceed with booking
      setBookingTimeBlockId(timeBlockId);
    },
    [sortedTimeBlocks],
  );

  // Booking functions
  const handleBookTeeTime = async () => {
    if (!bookingTimeBlockId) return;

    setLoading(true);
    try {
      const result = await bookTeeTime(bookingTimeBlockId, member);

      if (result.success) {
        toast.success("Tee time booked successfully", {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
      } else {
        if (result.violations && result.violations.length > 0) {
          toast.error(result.error || "Failed to book tee time", {
            icon: <X className="h-5 w-5 text-red-500" />,
          });
        } else {
          toast.error(result.error || "Failed to book tee time", {
            icon: <X className="h-5 w-5 text-red-500" />,
          });
        }
      }
    } catch (error) {
      console.error("Error booking tee time", error);
      toast.error("An unexpected error occurred", {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setLoading(false);
      setBookingTimeBlockId(null);
    }
  };

  const handleCancelTeeTime = async () => {
    if (!cancelTimeBlockId) return;

    setLoading(true);
    try {
      const result = await cancelTeeTime(cancelTimeBlockId, member);

      if (result.success) {
        toast.success("Tee time cancelled successfully", {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
        });
      } else {
        toast.error(result.error || "Failed to cancel tee time", {
          icon: <X className="h-5 w-5 text-red-500" />,
        });
      }
    } catch (error) {
      console.error("Error cancelling tee time", error);
      toast.error("An unexpected error occurred", {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
      });
    } finally {
      setLoading(false);
      setCancelTimeBlockId(null);
    }
  };

  // Memoized utility functions
  const isTimeBlockBooked = useCallback(
    (timeBlock: ClientTimeBlock) => {
      if (!member || !timeBlock?.members) return false;
      return timeBlock.members.some((m) => m.id === member.id);
    },
    [member],
  );

  const isTimeBlockAvailable = useCallback(
    (timeBlock: ClientTimeBlock) => {
      if (!timeBlock?.members) return true;
      const maxMembers = config?.maxMembersPerBlock || 4;
      const totalPeople =
        timeBlock.members.length + (timeBlock.fills?.length || 0);
      return totalPeople < maxMembers;
    },
    [config],
  );

  const isTimeBlockInPast = useCallback(
    (timeBlock: ClientTimeBlock) => {
      if (!timeBlock || !timeBlock.startTime) return false;
      // Use both date and time parameters for accurate past checking
      return checkTimeBlockInPast(selectedDate, timeBlock.startTime);
    },
    [selectedDate],
  );

  const hasTimeBlocks = sortedTimeBlocks.length > 0;

  return (
    <div className="space-y-6 pt-20">
      <Toaster position="top-right" />

      {/* Date navigation */}
      <div className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
        <Button
          variant="outline"
          size="icon"
          onClick={goToPreviousDay}
          disabled={loading}
          className="hover:bg-[var(--org-primary)] hover:text-white"
          aria-label="Previous day"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">{formatDisplayDate(date)}</h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDatePicker(true)}
            disabled={loading}
            className="hover:bg-[var(--org-primary)] hover:text-white"
            aria-label="Open date picker"
          >
            <CalendarIcon className="h-4 w-4" />
          </Button>
        </div>

        <Button
          variant="outline"
          size="icon"
          onClick={goToNextDay}
          disabled={loading}
          className="hover:bg-[var(--org-primary)] hover:text-white"
          aria-label="Next day"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Time blocks */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <ClockIcon className="h-5 w-5 text-[var(--org-primary)]" />
            Available Tee Times
          </h3>
        </div>

        <div
          ref={timeBlocksContainerRef}
          className="max-h-[60vh] space-y-3 overflow-y-auto scroll-smooth p-1"
          aria-live="polite"
        >
          {hasTimeBlocks ? (
            sortedTimeBlocks.map((timeBlock) => (
              <TimeBlockItem
                key={timeBlock.id}
                timeBlock={
                  timeBlock as unknown as TimeBlockItemProps["timeBlock"]
                }
                isBooked={isTimeBlockBooked(timeBlock)}
                isAvailable={isTimeBlockAvailable(timeBlock)}
                isPast={isTimeBlockInPast(timeBlock)}
                onBook={() => checkBookingRestrictions(timeBlock.id)}
                onCancel={() => setCancelTimeBlockId(timeBlock.id)}
                disabled={loading}
                member={member}
                id={`time-block-${timeBlock.id}`}
                isRestricted={timeBlock.restriction?.isRestricted || false}
                restrictionReason={timeBlock.restriction?.reason || ""}
              />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <CalendarIcon className="mb-2 h-10 w-10 text-gray-300" />
              <p className="text-gray-500">
                No tee times available for this date.
              </p>
              <p className="mt-2 text-sm text-gray-400">
                Try selecting a different date.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Date Picker Dialog */}
      {showDatePicker && (
        <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Date</DialogTitle>
            </DialogHeader>
            <DatePicker selected={date} onChange={handleDateChange} />
          </DialogContent>
        </Dialog>
      )}

      {/* Booking Confirmation Dialog */}
      <Dialog
        open={bookingTimeBlockId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setBookingTimeBlockId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Confirm Tee Time Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to book this tee time?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="space-y-2 sm:space-x-4">
            <Button
              variant="outline"
              onClick={() => setBookingTimeBlockId(null)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleBookTeeTime}
              disabled={loading}
              className="hover:bg-opacity-90 w-full bg-[var(--org-primary)] sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelTimeBlockId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setCancelTimeBlockId(null);
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Tee Time Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this tee time booking?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="space-y-2 sm:space-x-4">
            <Button
              variant="outline"
              onClick={() => setCancelTimeBlockId(null)}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelTeeTime}
              disabled={loading}
              className="w-full sm:w-auto"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
