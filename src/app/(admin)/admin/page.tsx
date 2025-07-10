import {
  getOrCreateTeesheet,
  getTimeBlocksForTeesheet,
} from "~/server/teesheet/data";
import { TeesheetPageClient } from "~/components/teesheet/TeesheetPageClient";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getTeesheetConfigs } from "~/server/settings/data";
import { getAllPaceOfPlayForDate } from "~/server/pace-of-play/actions";
import { getBCToday, parseDate } from "~/lib/dates";

interface PageProps {
  searchParams: Promise<{
    date?: string;
  }>;
}

export default async function AdminPage({ searchParams }: PageProps) {
  try {
    // Get the date parameter as a string
    const params = await searchParams;

    // If no date provided, use today in BC timezone
    const dateString = params?.date ?? getBCToday();

    // Parse the string into a Date object (will be in BC timezone)
    const date = parseDate(dateString);

    // Get teesheet data - pass the Date object
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

    // Fetch pace of play data for all time blocks - pass the Date object
    const paceOfPlayData = await getAllPaceOfPlayForDate(date);

    if (!Array.isArray(configsResult)) {
      throw new Error("Failed to load configurations");
    }

    // Pass the initial data to the client component for SWR optimization
    const initialData = {
      teesheet,
      config,
      timeBlocks,
      availableConfigs: configsResult,
      paceOfPlayData,
    };

    return (
      <TeesheetPageClient
        initialDate={date}
        initialData={initialData}
        isAdmin={true}
      />
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
