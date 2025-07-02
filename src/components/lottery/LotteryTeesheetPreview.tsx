"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { Calendar, CheckCircle } from "lucide-react";
import { formatDate } from "~/lib/dates";

interface TimeBlockWithAssignments {
  id: number;
  startTime: string;
  endTime: string;
  maxMembers: number;
  assignments: any[];
}

interface DroppableTimeBlockProps {
  block: TimeBlockWithAssignments;
}

interface LotteryTeesheetPreviewProps {
  date: string;
  timeBlocks: TimeBlockWithAssignments[];
  totalUnassigned: number;
  isFinalizingResults: boolean;
  onFinalizeLottery: () => void;
  DroppableTimeBlockComponent: React.ComponentType<DroppableTimeBlockProps>;
}

export function LotteryTeesheetPreview({
  date,
  timeBlocks,
  totalUnassigned,
  isFinalizingResults,
  onFinalizeLottery,
  DroppableTimeBlockComponent,
}: LotteryTeesheetPreviewProps) {
  return (
    <div className={totalUnassigned > 0 ? "col-span-9" : "col-span-12"}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Teesheet for {formatDate(date, "EEEE, MMMM do, yyyy")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="max-h-[70vh] space-y-3 overflow-y-auto">
            {timeBlocks.map((block) => (
              <DroppableTimeBlockComponent key={block.id} block={block} />
            ))}
          </div>

          <div className="mt-6 border-t pt-4">
            <Button
              onClick={onFinalizeLottery}
              className="w-full"
              size="lg"
              disabled={isFinalizingResults}
            >
              {isFinalizingResults ? (
                <>
                  <LoadingSpinner className="mr-2 h-4 w-4" />
                  Finalizing Results...
                </>
              ) : (
                <>
                  <CheckCircle className="mr-2 h-4 w-4" />
                  Confirm & Finalize Lottery Results
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
