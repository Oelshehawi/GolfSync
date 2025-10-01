"use client";

import { useState } from "react";
import { TeesheetView } from "~/components/teesheet/TeesheetView";
import { TeesheetHeader } from "~/components/teesheet/TeesheetHeader";
import { TwoDayView } from "~/components/teesheet/TwoDayView";
import { TeesheetControlPanel } from "~/components/teesheet/TeesheetControlPanel";
import { MutationProvider } from "~/hooks/useMutationContext";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { parseDate, formatDate } from "~/lib/dates";
import { useQuery } from "@tanstack/react-query";
import { teesheetQueryOptions } from "~/server/query-options";
import { useTeesheetMutations } from "~/hooks/useTeesheetMutations";

interface TeesheetPageClientProps {
  initialDate: Date;
  initialData: {
    teesheet: any;
    config: any;
    timeBlocks: any[];
    availableConfigs: any[];
    paceOfPlayData: any[];
    lotterySettings?: any;
  };
  isAdmin?: boolean;
}

export function TeesheetPageClient({
  initialDate,
  initialData,
  isAdmin = true,
}: TeesheetPageClientProps) {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [isTwoDayView, setIsTwoDayView] = useState(false);

  // Use TanStack Query instead of SWR
  const dateString = formatDate(currentDate, "yyyy-MM-dd");
  const teesheetQuery = useQuery(teesheetQueryOptions.byDate(dateString));
  const { mutations } = useTeesheetMutations(currentDate);

  // Use TanStack Query data if available, otherwise fall back to initial data
  const displayData = teesheetQuery.data || initialData;
  const error = teesheetQuery.error;
  const isLoading = teesheetQuery.isLoading;

  const handleDateChange = async (newDate: Date) => {
    setCurrentDate(newDate);
    // TanStack Query will automatically fetch data for the new date
  };

  const handleToggleTwoDayView = (enabled: boolean) => {
    setIsTwoDayView(enabled);
  };

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card>
          <CardHeader>
            <CardTitle>Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-500">
              {error.message || "Failed to load teesheet data"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <MutationProvider mutations={mutations}>
      <div className="container mx-auto space-y-2 p-6">
        <TeesheetHeader
          teesheetDate={currentDate}
          config={displayData.config}
          teesheetId={displayData.teesheet?.id}
          timeBlocks={displayData.timeBlocks}
          isAdmin={isAdmin}
          onDateChange={handleDateChange}
        />

        <TeesheetControlPanel
          teesheet={displayData.teesheet}
          availableConfigs={displayData.availableConfigs}
          lotterySettings={displayData.lotterySettings}
          isAdmin={isAdmin}
          isTwoDayView={isTwoDayView}
          onToggleTwoDayView={handleToggleTwoDayView}
          currentDate={currentDate}
          onDateChange={handleDateChange}
          mutations={mutations}
        />

        {isTwoDayView ? (
          <TwoDayView
            currentDate={currentDate}
            initialData={displayData}
            isAdmin={isAdmin}
          />
        ) : (
          <Card>
            <CardContent className="relative">
              {/* Loading overlay */}
              {isLoading && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80">
                  <div className="text-sm text-gray-600">
                    Loading teesheet...
                  </div>
                </div>
              )}

              <TeesheetView
                teesheet={displayData.teesheet}
                timeBlocks={displayData.timeBlocks}
                availableConfigs={displayData.availableConfigs}
                paceOfPlayData={displayData.paceOfPlayData}
                isAdmin={isAdmin}
                mutations={mutations}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </MutationProvider>
  );
}
