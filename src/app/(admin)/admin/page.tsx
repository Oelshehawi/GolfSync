import {
  getOrCreateTeesheet,
  getTimeBlocksForTeesheet,
} from "~/server/teesheet/data";
import { TeesheetView } from "~/components/teesheet/TeesheetView";
import { TeesheetHeader } from "~/components/teesheet/TeesheetHeader";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getTeesheetConfigs } from "~/server/settings/data";
import { formatCalendarDate } from "~/lib/utils";
import { parse } from "date-fns";
import { getAllPaceOfPlayForDate } from "~/server/pace-of-play/actions";

interface PageProps {
  searchParams?: {
    date?: string;
  };
}

export default async function AdminPage({ searchParams }: PageProps) {
  try {
    // Get the date parameter as a string
    const dateParam = (await searchParams)?.date;

    // Log date debugging info - server-side
    const currentServerDate = new Date();
    console.log("[SERVER] Current server date object:", currentServerDate);
    console.log("[SERVER] Server date components:", {
      year: currentServerDate.getFullYear(),
      month: currentServerDate.getMonth() + 1, // +1 for human-readable month
      day: currentServerDate.getDate(),
      hours: currentServerDate.getHours(),
      minutes: currentServerDate.getMinutes(),
      timezone: currentServerDate.getTimezoneOffset() / -60, // Convert to hours and invert
    });

    // Determine the date string to use
    let dateString: string;

    if (dateParam) {
      // If date parameter is provided
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        // It's already in YYYY-MM-DD format, use directly
        dateString = dateParam;
        console.log("[SERVER] Using date param directly:", dateString);
      } else {
        // It's in another format, convert it
        const paramDate = new Date(dateParam);
        console.log("[SERVER] Parsed param date:", paramDate);
        dateString = formatCalendarDate(paramDate);
        console.log("[SERVER] Formatted param date:", dateString);
      }
    } else {
      // No date parameter - get today's date as a string in YYYY-MM-DD format
      // Use UTC date components directly to create the string to avoid timezone issues
      const now = new Date();
      const utcYear = now.getUTCFullYear();
      const utcMonth = (now.getUTCMonth() + 1).toString().padStart(2, "0");
      const utcDay = now.getUTCDate().toString().padStart(2, "0");
      dateString = `${utcYear}-${utcMonth}-${utcDay}`;
      console.log("[SERVER] Created today's date string directly:", dateString);
    }

    // Parse the date string to a Date object for database queries
    // Use a consistent approach that won't be affected by timezone
    const dateParts = dateString.split("-");
    const dateYear = parseInt(dateParts[0] || "0", 10);
    const dateMonth = parseInt(dateParts[1] || "1", 10) - 1; // JS months are 0-indexed
    const dateDay = parseInt(dateParts[2] || "1", 10);

    // Create date object for database operations
    const date = new Date(dateYear, dateMonth, dateDay);

    console.log("[SERVER] Final parsed date for teesheet:", date);

    // Rest of the code accessing database, etc.
    const { teesheet, config } = await getOrCreateTeesheet(date);

    if (!teesheet) {
      return (
        <div className="container mx-auto p-6">
          <Card>
            <CardHeader>
              <CardTitle>Error</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-red-500">Failed to load teesheet</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const timeBlocks = await getTimeBlocksForTeesheet(teesheet.id);
    const configsResult = await getTeesheetConfigs();

    // Fetch pace of play data for all time blocks
    const paceOfPlayData = await getAllPaceOfPlayForDate(date);

    if (!Array.isArray(configsResult)) {
      throw new Error(configsResult.error || "Failed to load configurations");
    }

    console.log("[SERVER] Page rendering with date:", {
      dateString,
      date,
      components: {
        year: date.getFullYear(),
        month: date.getMonth() + 1,
        day: date.getDate(),
      },
    });

    // Pass the date string to the client component
    return (
      <div className="container mx-auto space-y-2 p-6">
        <TeesheetHeader
          dateString={dateString}
          config={config}
          teesheetId={teesheet.id}
          timeBlocks={timeBlocks}
        />
        <Card>
          <CardContent>
            <TeesheetView
              teesheet={teesheet}
              timeBlocks={timeBlocks}
              availableConfigs={configsResult}
              paceOfPlayData={paceOfPlayData}
            />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    console.error("Error in AdminPage:", error);
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">
              {error instanceof Error
                ? error.message
                : "Failed to load teesheet data. Please try again later."}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }
}
