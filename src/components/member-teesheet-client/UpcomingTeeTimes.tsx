import Link from "next/link";
import {
  formatDateStringToWords,
  formatTimeStringTo12Hour,
  formatCalendarDate,
} from "~/lib/utils";

type UpcomingTeeTime = {
  id: number;
  timeBlockId: number;
  memberId: number;
  checkedIn: boolean | null;
  checkedInAt: Date | null;
  startTime: string;
  endTime: string;
  date: string;
  teesheetId: number;
};

interface UpcomingTeeTimesProps {
  teeTimes: UpcomingTeeTime[];
}

export function UpcomingTeeTimes({ teeTimes }: UpcomingTeeTimesProps) {
  if (!teeTimes || teeTimes.length === 0) {
    return (
      <div>
        <p className="text-gray-500">No upcoming tee times found.</p>
        <Link
          href="/members/teesheet"
          className="mt-4 inline-block text-sm text-green-700 hover:underline"
        >
          Book a tee time →
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {teeTimes.map((teeTime) => {
        // Use the date string directly from the database - avoid creating Date objects
        const bookingDateStr = teeTime.date;

        // Get today and tomorrow's date strings in YYYY-MM-DD format
        // Using formatCalendarDate to ensure consistent formatting
        const today = new Date();
        const todayStr = formatCalendarDate(today);

        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowStr = formatCalendarDate(tomorrow);

        // Compare date strings directly to avoid timezone issues
        let dateDisplay;
        if (bookingDateStr === todayStr) {
          dateDisplay = "Today";
        } else if (bookingDateStr === tomorrowStr) {
          dateDisplay = "Tomorrow";
        } else {
          // Use our timezone-safe function for dates
          dateDisplay = formatDateStringToWords(bookingDateStr);
        }

        // Format the time using our timezone-safe function for times
        const displayTime = formatTimeStringTo12Hour(teeTime.startTime);

        return (
          <div
            key={teeTime.id}
            className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4 shadow-sm"
          >
            <div>
              <p className="font-medium text-gray-900">
                {dateDisplay}, {displayTime}
              </p>
              <p className="text-sm text-gray-500">Tee time confirmed</p>
            </div>
          </div>
        );
      })}

      <Link
        href="/members/teesheet"
        className="mt-2 inline-block text-sm text-green-700 hover:underline"
      >
        Book more tee times →
      </Link>
    </div>
  );
}
