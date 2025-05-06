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

interface PageProps {
  searchParams?: {
    date?: string;
  };
}

export default async function AdminPage({ searchParams }: PageProps) {
  try {
    // Safely handle the date parameter using string representation
    const dateParam = (await searchParams)?.date;
    let dateString: string;

    if (dateParam) {
      // Validate that the date is in YYYY-MM-DD format
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateParam)) {
        dateString = dateParam;
      } else {
        // If not in correct format, convert it
        dateString = formatCalendarDate(new Date(dateParam));
      }
    } else {
      // Default to today in YYYY-MM-DD format
      dateString = formatCalendarDate(new Date());
    }

    // Parse the date string to a Date object for functions that need it
    const date = parse(dateString, "yyyy-MM-dd", new Date());

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


    if (!Array.isArray(configsResult)) {
      throw new Error(configsResult.error || "Failed to load configurations");
    }

    return (
      <div className="container mx-auto space-y-2 p-6">
        <TeesheetHeader date={date} config={config} />
        <Card>
          <CardContent>
            <TeesheetView
              teesheet={teesheet}
              timeBlocks={timeBlocks}
              availableConfigs={configsResult}
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
