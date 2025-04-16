import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import type { TimeBlock } from "~/app/types/TeeSheetTypes";

interface TimeBlockHeaderProps {
  timeBlock: TimeBlock;
}

export function TimeBlockHeader({ timeBlock }: TimeBlockHeaderProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="rounded-lg bg-blue-100 p-2">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <div>
            <CardTitle className="text-xl">
              {format(new Date(timeBlock.startTime), "h:mm a")}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {timeBlock.members.length} / 4 members booked
            </p>
          </div>
        </div>
        <Badge
          variant={timeBlock.members.length >= 4 ? "destructive" : "default"}
          className={
            timeBlock.members.length >= 4
              ? "bg-red-100 text-red-700"
              : "bg-green-100 text-green-700"
          }
        >
          {timeBlock.members.length >= 4 ? "Full" : "Available"}
        </Badge>
      </CardHeader>
    </Card>
  );
}
