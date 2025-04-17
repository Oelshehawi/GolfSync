import {
  getOrCreateTeesheet,
  getTimeBlocksForTeesheet,
} from "~/server/teesheet/data";
import { TeesheetView } from "~/components/teesheet/TeesheetView";
import { TeesheetHeader } from "~/components/teesheet/TeesheetHeader";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getConfigForDate, getOrganizationTheme } from "~/server/config/data";

interface PageProps {
  searchParams?: {
    date?: string;
  };
}

export default async function AdminPage({ searchParams }: PageProps) {
  try {
    // Safely handle the date parameter
    const dateParam = (await searchParams)?.date;
    let date: Date;
    if (dateParam) {
      const parsedDate = new Date(dateParam);
      if (isNaN(parsedDate.getTime())) {
        throw new Error("Invalid date format");
      }
      date = parsedDate;
    } else {
      date = new Date();
    }

    const [teesheet, config, theme] = await Promise.all([
      getOrCreateTeesheet(date),
      getConfigForDate(date),
      getOrganizationTheme(),
    ]);

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


    return (
      <div
        className={`container mx-auto space-y-2 p-6`}
      >
        <TeesheetHeader date={date} config={config} theme={theme} />
        <Card>
          <CardHeader>
            <CardTitle>Teesheet for {format(date, "MMMM d, yyyy")}</CardTitle>
          </CardHeader>
          <CardContent>
            <TeesheetView teesheet={teesheet} timeBlocks={timeBlocks} />
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
