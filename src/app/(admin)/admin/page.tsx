import {
  getOrCreateTeesheet,
  getTimeBlocksForTeesheet,
} from "~/server/teesheet/data";
import { TeesheetView } from "~/components/teesheet/TeesheetView";
import { TeesheetHeader } from "~/components/teesheet/TeesheetHeader";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getTeesheetConfigs } from "~/server/settings/data";
import { formatCalendarDate, preserveDate } from "~/lib/utils";
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

    // Determine the date string to use
    let dateString: string;

    if (dateParam) {
      // If date parameter is provided
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        // It's already in YYYY-MM-DD format, use directly
        dateString = dateParam;
      } else {
        // It's in another format, convert it
        const paramDate = new Date(dateParam);
        dateString = formatCalendarDate(paramDate);
      }
    } else {
      // No date parameter - get today's date as a string in YYYY-MM-DD format
      // Use UTC date components directly to create the string to avoid timezone issues
      const now = new Date();
      const utcYear = now.getUTCFullYear();
      const utcMonth = (now.getUTCMonth() + 1).toString().padStart(2, "0");
      const utcDay = now.getUTCDate().toString().padStart(2, "0");
      dateString = `${utcYear}-${utcMonth}-${utcDay}`;
    }

    // Create a Date object from the string using preserveDate to handle timezone consistently
    const date = preserveDate(dateString) || new Date();

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
      throw new Error("Failed to load configurations");
    }

    // Pass the date string to the client component
    return (
      <div className="container mx-auto space-y-2 p-6">
        <TeesheetHeader
          dateString={dateString}
          config={config}
          teesheetId={teesheet.id}
          timeBlocks={timeBlocks}
          isAdmin={true}
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
