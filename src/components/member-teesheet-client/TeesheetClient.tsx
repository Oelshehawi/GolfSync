"use client";

import { useEffect, useRef, useMemo, useCallback, useReducer } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Button } from "~/components/ui/button";
import { addDays } from "date-fns";
import { useDebounce } from "use-debounce";
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
import { PlayerDetailsDrawer } from "./PlayerDetailsDrawer";
import { TeesheetGeneralNotes } from "~/components/teesheet/TeesheetGeneralNotes";
import toast from "react-hot-toast";
import {
  checkTimeBlockInPast,
  formatCalendarDate,
  formatDisplayDate,
} from "~/lib/utils";
import { parse } from "date-fns";
import { Member } from "~/app/types/MemberTypes";
import type {
  TimeBlockMemberView,
  TimeBlockFill,
} from "~/app/types/TeeSheetTypes";
import { Skeleton } from "~/components/ui/skeleton";

// Define proper types that match TimeBlockItem requirements
type ClientTimeBlock = {
  id: number;
  startTime: string;
  endTime: string;
  members: TimeBlockMemberView[];
  fills: TimeBlockFill[];
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

type BookingState = {
  loading: boolean;
  bookingTimeBlockId: number | null;
  cancelTimeBlockId: number | null;
  showDatePicker: boolean;
  showPlayerDetails: boolean;
  selectedTimeBlock: ClientTimeBlock | null;
  swipeLoading: boolean;
};

type BookingAction =
  | { type: "START_BOOKING"; payload: number }
  | { type: "START_CANCELLING"; payload: number }
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "CLEAR_BOOKING" }
  | { type: "CLEAR_CANCELLING" }
  | { type: "TOGGLE_DATE_PICKER"; payload?: boolean }
  | { type: "SHOW_PLAYER_DETAILS"; payload: ClientTimeBlock }
  | { type: "HIDE_PLAYER_DETAILS" }
  | { type: "SET_SWIPE_LOADING"; payload: boolean };

const initialState: BookingState = {
  loading: false,
  bookingTimeBlockId: null,
  cancelTimeBlockId: null,
  showDatePicker: false,
  showPlayerDetails: false,
  selectedTimeBlock: null,
  swipeLoading: false,
};

function bookingReducer(
  state: BookingState,
  action: BookingAction,
): BookingState {
  switch (action.type) {
    case "START_BOOKING":
      return { ...state, bookingTimeBlockId: action.payload };
    case "START_CANCELLING":
      return { ...state, cancelTimeBlockId: action.payload };
    case "SET_LOADING":
      return { ...state, loading: action.payload };
    case "CLEAR_BOOKING":
      return { ...state, bookingTimeBlockId: null, loading: false };
    case "CLEAR_CANCELLING":
      return { ...state, cancelTimeBlockId: null, loading: false };
    case "TOGGLE_DATE_PICKER":
      return {
        ...state,
        showDatePicker: action.payload ?? !state.showDatePicker,
      };
    case "SHOW_PLAYER_DETAILS":
      return {
        ...state,
        showPlayerDetails: true,
        selectedTimeBlock: action.payload,
      };
    case "HIDE_PLAYER_DETAILS":
      return {
        ...state,
        showPlayerDetails: false,
        selectedTimeBlock: null,
      };
    case "SET_SWIPE_LOADING":
      return { ...state, swipeLoading: action.payload };
    default:
      return state;
  }
}

// Client component to handle interactive elements
export default function TeesheetClient({
  teesheet,
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
  const [state, dispatch] = useReducer(bookingReducer, initialState);
  const {
    loading,
    bookingTimeBlockId,
    cancelTimeBlockId,
    showDatePicker,
    showPlayerDetails,
    selectedTimeBlock,
    swipeLoading,
  } = state;

  // Use sorted timeBlocks from server
  const timeBlocks = initialTimeBlocks;

  // Create a ref for the time blocks container to enable scrolling
  const timeBlocksContainerRef = useRef<HTMLDivElement>(null);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  // Auto-scroll to current time once when time blocks load
  useEffect(() => {
    if (timeBlocks.length > 0) {
      scrollToClosestTime(new Date(), selectedDate, timeBlocks);
    }
  }, [timeBlocks, selectedDate]);

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

  const goToPreviousDay = useCallback(async () => {
    dispatch({ type: "SET_SWIPE_LOADING", payload: true });
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
    // Clear loading after a short delay to show feedback
    setTimeout(() => {
      dispatch({ type: "SET_SWIPE_LOADING", payload: false });
    }, 500);
  }, [date, navigateToDate]);

  const goToNextDay = useCallback(async () => {
    dispatch({ type: "SET_SWIPE_LOADING", payload: true });
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
    // Clear loading after a short delay to show feedback
    setTimeout(() => {
      dispatch({ type: "SET_SWIPE_LOADING", payload: false });
    }, 500);
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
      dispatch({ type: "TOGGLE_DATE_PICKER", payload: false });
    },
    [navigateToDate],
  );

  // Touch/Swipe handlers for date navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (touch) {
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
    }
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) return;

      const deltaX = touch.clientX - touchStartRef.current.x;
      const deltaY = touch.clientY - touchStartRef.current.y;

      // Only trigger if horizontal swipe is dominant
      if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 50) {
        if (deltaX > 0) {
          // Swipe right - go to previous day
          goToPreviousDay();
        } else {
          // Swipe left - go to next day
          goToNextDay();
        }
      }

      touchStartRef.current = null;
    },
    [goToPreviousDay, goToNextDay],
  );

  // Debounced booking handlers
  const [debouncedBooking] = useDebounce(async (timeBlockId: number) => {
    if (!timeBlockId) return;

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const result = await bookTeeTime(timeBlockId, member);

      if (result.success) {
        toast.success("Tee time booked successfully!", {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          id: `book-${timeBlockId}`,
          duration: 3000,
        });
      } else {
        toast.error(result.error || "Failed to book tee time", {
          icon: <X className="h-5 w-5 text-red-500" />,
          id: `book-error-${timeBlockId}`,
        });
      }
    } catch (error) {
      console.error("Error booking tee time", error);
      toast.error("An unexpected error occurred", {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        id: `book-error-unexpected-${timeBlockId}`,
      });
    } finally {
      dispatch({ type: "CLEAR_BOOKING" });
    }
  }, 300);

  const [debouncedCancelling] = useDebounce(async (timeBlockId: number) => {
    if (!timeBlockId) return;

    dispatch({ type: "SET_LOADING", payload: true });
    try {
      const result = await cancelTeeTime(timeBlockId, member);

      if (result.success) {
        toast.success("Tee time cancelled successfully!", {
          icon: <CheckCircle className="h-5 w-5 text-green-500" />,
          id: `cancel-${timeBlockId}`,
          duration: 3000,
        });
      } else {
        toast.error(result.error || "Failed to cancel tee time", {
          icon: <X className="h-5 w-5 text-red-500" />,
          id: `cancel-error-${timeBlockId}`,
        });
      }
    } catch (error) {
      console.error("Error cancelling tee time", error);
      toast.error("An unexpected error occurred", {
        icon: <AlertCircle className="h-5 w-5 text-red-500" />,
        id: `cancel-error-unexpected-${timeBlockId}`,
      });
    } finally {
      dispatch({ type: "CLEAR_CANCELLING" });
    }
  }, 300);

  // Booking handlers
  const handleBookTeeTime = useCallback(() => {
    if (bookingTimeBlockId) {
      debouncedBooking(bookingTimeBlockId);
    }
  }, [bookingTimeBlockId, debouncedBooking]);

  const handleCancelTeeTime = useCallback(() => {
    if (cancelTimeBlockId) {
      debouncedCancelling(cancelTimeBlockId);
    }
  }, [cancelTimeBlockId, debouncedCancelling]);

  // Show player details handler
  const handleShowPlayerDetails = useCallback((timeBlock: ClientTimeBlock) => {
    dispatch({ type: "SHOW_PLAYER_DETAILS", payload: timeBlock });
  }, []);

  // Check for booking restrictions
  const checkBookingRestrictions = useCallback(
    (timeBlockId: number) => {
      if (!timeBlockId) return;

      const timeBlock = timeBlocks.find((tb) => tb.id === timeBlockId);
      if (!timeBlock) return;

      // Check if the timeblock is restricted (pre-checked from server)
      if (timeBlock.restriction && timeBlock.restriction.isRestricted) {
        const violations = timeBlock.restriction.violations || [];

        // Check for AVAILABILITY restrictions first (highest priority)
        const hasAvailabilityViolation = violations.some(
          (v: any) => v.type === "AVAILABILITY",
        );

        if (hasAvailabilityViolation) {
          // AVAILABILITY restrictions block booking completely
          toast.error(
            timeBlock.restriction.reason ||
              "Course is not available during this time",
            {
              icon: <AlertCircle className="h-5 w-5 text-red-500" />,
              id: `availability-restriction-${timeBlockId}`,
            },
          );
          return;
        }

        // Check for TIME restrictions second (high priority)
        const hasTimeViolation = violations.some((v: any) => v.type === "TIME");

        if (hasTimeViolation) {
          // TIME restrictions block booking completely
          toast.error(
            timeBlock.restriction.reason ||
              "This time slot is restricted for your member class",
            {
              icon: <AlertCircle className="h-5 w-5 text-red-500" />,
              id: `time-restriction-${timeBlockId}`,
            },
          );
          return;
        }

        // Check for FREQUENCY restrictions (lower priority)
        const hasFrequencyViolation = violations.some(
          (v: any) => v.type === "FREQUENCY",
        );

        if (hasFrequencyViolation) {
          // For frequency restrictions, show a friendly warning but allow booking
          const frequencyInfo = violations.find(
            (v: any) => v.type === "FREQUENCY",
          )?.frequencyInfo;

          if (frequencyInfo) {
            toast(
              `You've played ${frequencyInfo.currentCount}/${frequencyInfo.maxCount} times this month.`,
              {
                icon: <AlertCircle className="h-5 w-5 text-yellow-500" />,
                id: `frequency-warning-${timeBlockId}`,
                duration: 4000,
                style: {
                  background: "#FEF3C7",
                  border: "1px solid #F59E0B",
                  color: "#92400E",
                },
              },
            );
          }
          // Proceed with booking despite frequency limit
          dispatch({ type: "START_BOOKING", payload: timeBlockId });
        } else {
          // For other restrictions, block the booking
          toast.error(
            timeBlock.restriction.reason ||
              "This timeblock is not available for booking",
            {
              icon: <AlertCircle className="h-5 w-5 text-red-500" />,
              id: `restriction-${timeBlockId}`,
            },
          );
          return;
        }
      } else {
        // No restrictions, proceed with booking
        dispatch({ type: "START_BOOKING", payload: timeBlockId });
      }
    },
    [timeBlocks],
  );

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

  const hasTimeBlocks = timeBlocks.length > 0;

  return (
    <div className="space-y-4 px-3 pb-6">
      {/* Sticky Date Navigation Header - Now the only sticky element */}
      <div className="sticky top-2 z-30 mb-4 rounded-xl border border-gray-200 bg-white/95 p-3 shadow-lg backdrop-blur-sm">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={goToPreviousDay}
            disabled={loading || swipeLoading}
            className="h-10 w-10 rounded-full hover:bg-org-primary/10 hover:text-org-primary"
            aria-label="Previous day"
          >
            {swipeLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </Button>

          <div className="flex items-center gap-2">
            <h2 className="text-lg font-bold text-gray-900">
              {formatDisplayDate(date)}
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => dispatch({ type: "TOGGLE_DATE_PICKER" })}
              disabled={loading || swipeLoading}
              className="h-8 w-8 rounded-full hover:bg-org-primary/10 hover:text-org-primary"
              aria-label="Open date picker"
            >
              <CalendarIcon className="h-4 w-4" />
            </Button>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={goToNextDay}
            disabled={loading || swipeLoading}
            className="h-10 w-10 rounded-full hover:bg-org-primary/10 hover:text-org-primary"
            aria-label="Next day"
          >
            {swipeLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </Button>
        </div>

        {/* Swipe Loading Indicator */}
        {swipeLoading && (
          <div className="mt-2 flex items-center justify-center">
            <div className="flex items-center gap-2 text-sm text-org-primary">
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Loading new date...</span>
            </div>
          </div>
        )}
      </div>

      {/* General Notes Section */}
      {teesheet?.generalNotes && (
        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-100 bg-blue-50 p-4">
            <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
              <AlertCircle className="h-5 w-5 text-blue-600" />
              Important Information
            </h3>
          </div>
          <div className="p-4">
            <div className="border-l-4 border-blue-500 pl-4 text-sm leading-relaxed text-gray-700">
              {teesheet.generalNotes}
            </div>
          </div>
        </div>
      )}

      {/* Tee Sheet Grid - No internal scrolling */}
      <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 bg-org-primary/5 p-4">
          <h3 className="flex items-center gap-2 text-lg font-bold text-gray-900">
            <ClockIcon className="h-5 w-5 text-org-primary" />
            Tee Sheet - {formatDisplayDate(date)}
          </h3>
          {config?.disallowMemberBooking && (
            <div className="mt-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              <AlertCircle className="mr-2 inline-block h-4 w-4" />
              Member booking is currently disabled
            </div>
          )}
        </div>

        <div
          ref={timeBlocksContainerRef}
          className="p-4"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          aria-live="polite"
        >
          {hasTimeBlocks ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {timeBlocks.map((timeBlock) => (
                <TimeBlockItem
                  key={timeBlock.id}
                  timeBlock={
                    timeBlock as unknown as TimeBlockItemProps["timeBlock"]
                  }
                  isBooked={isTimeBlockBooked(timeBlock)}
                  isAvailable={isTimeBlockAvailable(timeBlock)}
                  isPast={isTimeBlockInPast(timeBlock)}
                  onBook={() => checkBookingRestrictions(timeBlock.id)}
                  onCancel={() =>
                    dispatch({
                      type: "START_CANCELLING",
                      payload: timeBlock.id,
                    })
                  }
                  onShowDetails={() => handleShowPlayerDetails(timeBlock)}
                  disabled={loading || config?.disallowMemberBooking}
                  member={member}
                  id={`time-block-${timeBlock.id}`}
                  isRestricted={timeBlock.restriction?.isRestricted || false}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <CalendarIcon className="mb-4 h-16 w-16 text-gray-300" />
              <p className="mb-2 text-lg font-medium text-gray-500">
                No tee times available
              </p>
              <p className="text-sm text-gray-400">
                Try selecting a different date to see available times.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Date Picker Dialog */}
      {showDatePicker && (
        <Dialog
          open={showDatePicker}
          onOpenChange={(isOpen) =>
            dispatch({ type: "TOGGLE_DATE_PICKER", payload: isOpen })
          }
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Select Date</DialogTitle>
            </DialogHeader>
            <DatePicker selected={date} onChange={handleDateChange} />
          </DialogContent>
        </Dialog>
      )}

      {/* Player Details Drawer */}
      <PlayerDetailsDrawer
        isOpen={showPlayerDetails}
        onClose={() => dispatch({ type: "HIDE_PLAYER_DETAILS" })}
        timeBlock={selectedTimeBlock}
      />

      {/* Streamlined Booking Confirmation */}
      <Dialog
        open={bookingTimeBlockId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) dispatch({ type: "CLEAR_BOOKING" });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Tee Time</DialogTitle>
            <DialogDescription>
              Confirm your booking for this tee time?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "CLEAR_BOOKING" })}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleBookTeeTime}
              disabled={loading}
              className="flex-1 bg-org-primary hover:bg-org-primary/90"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelTimeBlockId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) dispatch({ type: "CLEAR_CANCELLING" });
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this tee time?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => dispatch({ type: "CLEAR_CANCELLING" })}
              disabled={loading}
              className="flex-1"
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={handleCancelTeeTime}
              disabled={loading}
              className="flex-1"
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
