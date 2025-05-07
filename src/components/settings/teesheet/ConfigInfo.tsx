import { Card, CardContent } from "~/components/ui/card";
import { Clock, Users } from "lucide-react";
import type {
  TeesheetConfig,
  TimeBlockWithMembers,
} from "~/app/types/TeeSheetTypes";
import { BagReportDialog } from "./BagReportDialog";

interface ConfigInfoProps {
  config: TeesheetConfig;
  teesheetId: number;
  timeBlocks: TimeBlockWithMembers[];
}

export function ConfigInfo({
  config,
  timeBlocks,
}: ConfigInfoProps) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between p-4">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>
              {config.startTime} - {config.endTime}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            <span>{config.maxMembersPerBlock} per block</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-muted-foreground text-sm">
              {config.interval} min intervals
            </span>
          </div>
        </div>
        <BagReportDialog timeBlocks={timeBlocks} />
      </CardContent>
    </Card>
  );
}
