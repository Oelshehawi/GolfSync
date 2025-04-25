import { format } from "date-fns";
import { Clock } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Card, CardHeader, CardTitle } from "~/components/ui/card";
import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";

interface TimeBlockHeaderProps {
  timeBlock: TimeBlockWithMembers;
  guestsCount?: number;
  maxPeople?: number;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function TimeBlockHeader({
  timeBlock,
  guestsCount = 0,
  maxPeople = 4,
  theme,
}: TimeBlockHeaderProps) {
  const totalPeople = timeBlock.members.length + guestsCount;

  return (
    <Card theme={theme}>
      <CardHeader className="flex flex-row items-center justify-between">
        <div className="flex items-center space-x-4">
          <div
            className="rounded-lg p-2"
            style={{ backgroundColor: theme?.secondary }}
          >
            <Clock className="h-6 w-6" style={{ color: theme?.primary }} />
          </div>
          <div>
            <CardTitle className="text-xl" theme={theme}>
              {format(new Date(timeBlock.startTime), "h:mm a")}
            </CardTitle>
            <p className="text-sm text-gray-500">
              {totalPeople} / {maxPeople} people booked
              {totalPeople > 0 &&
                ` (${timeBlock.members.length} members, ${guestsCount} guests)`}
            </p>
          </div>
        </div>
        <Badge
          variant={totalPeople >= maxPeople ? "destructive" : "default"}
          theme={theme}
          style={
            totalPeople >= maxPeople
              ? { backgroundColor: "#FEE2E2", color: "#B91C1C" }
              : { backgroundColor: "#D1FAE5", color: "#065F46" }
          }
        >
          {totalPeople >= maxPeople ? "Full" : "Available"}
        </Badge>
      </CardHeader>
    </Card>
  );
}
