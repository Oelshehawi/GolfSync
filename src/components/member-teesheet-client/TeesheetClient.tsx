"use client";

import { useEffect, useState, useRef } from "react";
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
import { checkRestrictionsAction } from "~/server/restrictions/actions";
import { ChevronLeft, ChevronRight, CalendarIcon, Loader2 } from "lucide-react";
import { TimeBlockItem } from "./TimeBlockItem";
import { DatePicker } from "./DatePicker";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import {
  formatLocalDate,
  formatLocalDisplayDate,
  checkTimeBlockInPast,
  formatDisplayTime,
  isSameLocalDay,
  debugDateComparison,
  areDatesEqual,
} from "~/lib/utils";
import { parse } from "date-fns";
import { Member } from "~/app/types/MemberTypes";
import { RestrictionViolationAlert } from "./RestrictionViolationAlert";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";

// Define proper types
type TimeBlock = {
  id: number;
  startTime: Date;
  endTime: Date;
  members: Array<{
    id: number;
    firstName: string;
    lastName: string;
  }>;
  [key: string]: any;
};

type RestrictionCheckResult =
  | { success: false; error: string }
  | { hasViolations: boolean; violations: RestrictionViolation[] };

// Simple utility to scroll to a time block on today's date
function scrollToClosestTime(
  now: Date,
  selectedDate: Date | string,
  timeBlocks: TimeBlock[],
) {
  // Parse the date properly
  let parsedSelectedDate: Date;
  if (typeof selectedDate === "string") {
    const parts = selectedDate.split("-");
    if (parts.length === 3) {
      parsedSelectedDate = new Date(
        parseInt(parts[0] as string),
        parseInt(parts[1] as string) - 1,
        parseInt(parts[2] as string),
      );
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
    console.log("Not today's date - skipping auto-scroll");
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
    const blockTime = new Date(block?.startTime as Date);
    const blockMinutes = blockTime.getHours() * 60 + blockTime.getMinutes();
    const diff = Math.abs(blockMinutes - currentTimeMinutes);

    if (diff < bestDiff) {
      bestDiff = diff;
      bestBlock = block;
    }
  }

  // Scroll to element
  setTimeout(() => {
    const element = document.getElementById(`time-block-${bestBlock?.id}`);
    if (element) {
      element.scrollIntoView({ behavior: "auto", block: "center" });
    }
  }, 100);
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
  timeBlocks: TimeBlock[];
  selectedDate: string | Date;
  member: Member;
}) {
  const [loading, setLoading] = useState<boolean>(false);
  const [timeBlocks, setTimeBlocks] = useState<TimeBlock[]>(
    // Sort timeBlocks by startTime to ensure proper order
    [...initialTimeBlocks].sort((a, b) => {
      const dateA = new Date(a.startTime);
      const dateB = new Date(b.startTime);
      return dateA.getTime() - dateB.getTime();
    }),
  );

  // Create a ref for the time blocks container to enable scrolling
  const timeBlocksContainerRef = useRef<HTMLDivElement>(null);

  // Update timeBlocks when initialTimeBlocks prop changes
  useEffect(() => {
    setTimeBlocks(
      [...initialTimeBlocks].sort((a, b) => {
        const dateA = new Date(a.startTime);
        const dateB = new Date(b.startTime);
        return dateA.getTime() - dateB.getTime();
      }),
    );
  }, [initialTimeBlocks]);

  // Auto-scroll to current time when time blocks load
  useEffect(() => {
    // Small delay to ensure DOM is ready
    if (timeBlocks.length > 0) {
      scrollToClosestTime(new Date(), selectedDate, timeBlocks);
    }
  }, [timeBlocks, selectedDate]);

  const [showDatePicker, setShowDatePicker] = useState<boolean>(false);
  const [bookingTimeBlockId, setBookingTimeBlockId] = useState<number | null>(
    null,
  );
  const [cancelTimeBlockId, setCancelTimeBlockId] = useState<number | null>(
    null,
  );
  const [violations, setViolations] = useState<RestrictionViolation[]>([]);
  const [showRestrictionAlert, setShowRestrictionAlert] =
    useState<boolean>(false);
  const [restrictionCheckedTimeBlockId, setRestrictionCheckedTimeBlockId] =
    useState<number | null>(null);

  // Parse selected date if it's a string, otherwise use as-is
  const date =
    typeof selectedDate === "string"
      ? parse(selectedDate, "yyyy-MM-dd", new Date())
      : selectedDate;

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { replace } = useRouter();

  // Navigate to a new date using URL params
  const navigateToDate = (newDate: Date) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("date", formatLocalDate(newDate));
    replace(`${pathname}?${params.toString()}`);
  };

  // Date navigation functions
  const goToPreviousDay = () => {
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
  };

  const goToNextDay = () => {
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
  };

  const handleDateChange = (newDate: Date) => {
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
  };

  // Check for booking restrictions
  const checkBookingRestrictions = async (timeBlockId: number) => {
    if (!timeBlockId) return;

    const timeBlock = timeBlocks.find((tb) => tb.id === timeBlockId);
    if (!timeBlock) return;

    setLoading(true);
    try {
      const result = (await checkRestrictionsAction({
        memberId: member.id,
        memberClass: member.class,
        bookingTime: new Date(timeBlock.startTime),
      })) as RestrictionCheckResult;

      // Check if result is an error
      if ("success" in result && result.success === false) {
        toast.error(result.error || "Failed to check booking restrictions");
        return;
      }

      // Now result is the success case
      if (
        "hasViolations" in result &&
        result.hasViolations &&
        result.violations.length > 0
      ) {
        setViolations(result.violations);
        setShowRestrictionAlert(true);
        setRestrictionCheckedTimeBlockId(timeBlockId);
        setBookingTimeBlockId(null);
      } else {
        // No violations, proceed with booking
        setBookingTimeBlockId(timeBlockId);
      }
    } catch (error) {
      console.error("Error checking restrictions:", error);
      toast.error("Failed to check booking restrictions");
    } finally {
      setLoading(false);
    }
  };

  // Booking functions
  const handleBookTeeTime = async () => {
    if (!bookingTimeBlockId) return;

    setLoading(true);
    try {
      const result = await bookTeeTime(bookingTimeBlockId, member);

      if (result.success) {
        toast.success("Tee time booked successfully");
      } else {
        if (result.violations && result.violations.length > 0) {
          setViolations(result.violations);
          setShowRestrictionAlert(true);
        } else {
          toast.error(result.error || "Failed to book tee time");
        }
      }
    } catch (error) {
      console.error("Error booking tee time", error);
      toast.error("An unexpected error occurred");
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
        toast.success("Tee time cancelled successfully");
      } else {
        toast.error(result.error || "Failed to cancel tee time");
      }
    } catch (error) {
      console.error("Error cancelling tee time", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
      setCancelTimeBlockId(null);
    }
  };

  // Handle restriction cancel
  const handleRestrictionCancel = () => {
    setShowRestrictionAlert(false);
    setRestrictionCheckedTimeBlockId(null);
    setViolations([]);
  };

  // Check if a time block is already booked by this member
  const isTimeBlockBooked = (timeBlock: TimeBlock) => {
    if (!member || !timeBlock?.members) return false;
    return timeBlock.members.some((m) => m.id === member.id);
  };

  // Check if a time block is available (has space)
  const isTimeBlockAvailable = (timeBlock: TimeBlock) => {
    if (!timeBlock?.members) return true;
    const maxMembers = config?.maxMembersPerBlock || 4;
    return timeBlock.members.length < maxMembers;
  };

  // Check if a time block is in the past
  const isTimeBlockInPast = (timeBlock: TimeBlock) => {
    // Make sure we pass a Date to the utility function
    if (!timeBlock || !timeBlock.startTime) return false;
    return checkTimeBlockInPast(timeBlock.startTime);
  };

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
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-2">
          <h2 className="text-lg font-semibold">
            {formatLocalDisplayDate(date)}
          </h2>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setShowDatePicker(true)}
            disabled={loading}
            className="hover:bg-[var(--org-primary)] hover:text-white"
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
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Time blocks */}
      <div className="rounded-lg bg-white p-6 shadow-sm">
        <div className="mb-4">
          <h3 className="text-lg font-semibold">Available Tee Times</h3>
        </div>

        <div
          ref={timeBlocksContainerRef}
          className="max-h-[60vh] space-y-3 overflow-y-auto scroll-smooth p-1"
        >
          {timeBlocks.length > 0 ? (
            timeBlocks.map((timeBlock) => (
              <TimeBlockItem
                key={timeBlock.id}
                timeBlock={timeBlock}
                isBooked={isTimeBlockBooked(timeBlock)}
                isAvailable={isTimeBlockAvailable(timeBlock)}
                isPast={isTimeBlockInPast(timeBlock)}
                onBook={() => checkBookingRestrictions(timeBlock.id)}
                onCancel={() => setCancelTimeBlockId(timeBlock.id)}
                disabled={loading}
                id={`time-block-${timeBlock.id}`}
              />
            ))
          ) : (
            <p className="text-gray-500">
              No tee times available for this date.
            </p>
          )}
        </div>
      </div>

      {/* Date Picker Dialog */}
      {showDatePicker && (
        <Dialog open={showDatePicker} onOpenChange={setShowDatePicker}>
          <DialogContent>
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
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Tee Time Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to book this tee time?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setBookingTimeBlockId(null)}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              variant="default"
              onClick={handleBookTeeTime}
              disabled={loading}
              className="hover:bg-opacity-90 bg-[var(--org-primary)]"
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

      {/* Restriction Violation Alert */}
      <RestrictionViolationAlert
        open={showRestrictionAlert}
        onOpenChange={setShowRestrictionAlert}
        violations={violations}
        onCancel={handleRestrictionCancel}
        memberClass={member.class}
      />

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelTimeBlockId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) setCancelTimeBlockId(null);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel Tee Time Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this tee time booking?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCancelTimeBlockId(null)}
              disabled={loading}
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelTeeTime}
              disabled={loading}
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
