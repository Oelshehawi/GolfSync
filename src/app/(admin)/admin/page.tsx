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
    // Safely handle the date parameter using string representation
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

    let dateString: string;

    if (dateParam) {
      // Validate that the date is in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        dateString = dateParam;
        console.log("[SERVER] Using date param directly:", dateString);
      } else {
        // If not in correct format, convert it
        const paramDate = new Date(dateParam);
        console.log("[SERVER] Parsed param date:", paramDate);
        dateString = formatCalendarDate(paramDate);
        console.log("[SERVER] Formatted param date:", dateString);
      }
    } else {
      // Default to today in YYYY-MM-DD format
      const todayDate = new Date();
      console.log("[SERVER] Creating default today date:", todayDate);
      dateString = formatCalendarDate(todayDate);
      console.log("[SERVER] Formatted default date:", dateString);
    }

    // Parse the date string to a Date object for functions that need it
    const date = parse(dateString, "yyyy-MM-dd", new Date());
    console.log("[SERVER] Final parsed date for teesheet:", date);

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

    return (
      <div className="container mx-auto space-y-2 p-6">
        <TeesheetHeader
          date={date}
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
