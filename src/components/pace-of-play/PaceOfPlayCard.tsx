import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { PaceOfPlayStatus, getStatusColor } from "./PaceOfPlayStatus";
import {
  TimeBlockWithPaceOfPlay,
  type PaceOfPlayStatus as PaceOfPlayStatusType,
} from "~/server/pace-of-play/data";
import { Button } from "~/components/ui/button";
import { CalendarClock, Clock, Users } from "lucide-react";
import { formatPaceOfPlayTimestamp, formatDisplayTime } from "~/lib/utils";

interface PaceOfPlayCardProps {
  timeBlock: TimeBlockWithPaceOfPlay;
  onUpdateTurn?: (timeBlockId: number) => void;
  onUpdateFinish?: (timeBlockId: number) => void;
  showTurnButton?: boolean;
  showFinishButton?: boolean;
}

export function PaceOfPlayCard({
  timeBlock,
  onUpdateTurn,
  onUpdateFinish,
  showTurnButton = false,
  showFinishButton = false,
}: PaceOfPlayCardProps) {
  const { paceOfPlay, playerNames, numPlayers, startTime } = timeBlock;

  // Format the tee time using our utility function
  const displayStartTime = startTime ? formatDisplayTime(startTime) : "—";

  // Use the safe timestamp formatter for pace of play times
  const displayTurnTime = paceOfPlay
    ? formatPaceOfPlayTimestamp(paceOfPlay.turn9Time)
    : "—";
  const displayFinishTime = paceOfPlay
    ? formatPaceOfPlayTimestamp(paceOfPlay.finishTime)
    : "—";

  const statusColor = paceOfPlay
    ? getStatusColor(paceOfPlay.status as PaceOfPlayStatusType)
    : "text-gray-600";

  return (
    <Card className="mb-4 w-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold">
            {displayStartTime} Tee Time
          </CardTitle>
          {paceOfPlay && (
            <PaceOfPlayStatus
              status={paceOfPlay.status as PaceOfPlayStatusType}
            />
          )}
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <div className="grid gap-2">
          <div className="flex items-center gap-2">
            <Users className="text-muted-foreground h-4 w-4" />
            <span className="text-sm">
              {playerNames || "No players"} ({numPlayers})
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-4">
            <div className="flex flex-col">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <Clock className="h-3 w-3" /> Start
              </span>
              <span className="font-medium">{displayStartTime}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <CalendarClock className="h-3 w-3" /> Turn
              </span>
              <span className="font-medium">{displayTurnTime}</span>
            </div>
            <div className="flex flex-col">
              <span className="text-muted-foreground flex items-center gap-1 text-xs">
                <CalendarClock className="h-3 w-3" /> Finish
              </span>
              <span className="font-medium">{displayFinishTime}</span>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter>
        <div className="flex w-full gap-2">
          {showTurnButton && onUpdateTurn && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onUpdateTurn(timeBlock.id)}
              disabled={paceOfPlay?.turn9Time !== null}
            >
              Record Turn
            </Button>
          )}
          {showFinishButton && onUpdateFinish && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => onUpdateFinish(timeBlock.id)}
              disabled={
                paceOfPlay?.finishTime !== null ||
                paceOfPlay?.turn9Time === null
              }
            >
              Record Finish
            </Button>
          )}
        </div>
      </CardFooter>
    </Card>
  );
}
