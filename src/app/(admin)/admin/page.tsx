import {
  getOrCreateTeesheet,
  getTimeBlocksForTeesheet,
} from "~/server/teesheet/data";
import { TeesheetView } from "~/components/teesheet/TeesheetView";
import { TeesheetHeader } from "~/components/teesheet/TeesheetHeader";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { getOrganizationTheme } from "~/server/config/data";
import { getTeesheetConfigs } from "~/server/settings/data";
import { ThemeConfig } from "~/app/types/UITypes";

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
    const themeData = await getOrganizationTheme();
    const configsResult = await getTeesheetConfigs();

    // Create a properly typed theme object
    const theme: ThemeConfig = {
      primary: themeData?.primary,
      secondary: themeData?.secondary,
      tertiary: themeData?.tertiary,
    };

    if (!Array.isArray(configsResult)) {
      throw new Error(configsResult.error || "Failed to load configurations");
    }

    return (
      <div className="container mx-auto space-y-2 p-6">
        <TeesheetHeader date={date} config={config} theme={theme} />
        <Card>
          <CardContent>
            <TeesheetView
              teesheet={teesheet}
              timeBlocks={timeBlocks}
              availableConfigs={configsResult}
              theme={theme}
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
