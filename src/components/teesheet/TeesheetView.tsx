import { format } from "date-fns";
import type { TeeSheet, TimeBlock } from "~/app/types/TeeSheetTypes";
import { TimeBlock as TimeBlockComponent } from "./TimeBlock";

interface TeesheetViewProps {
  teesheet: TeeSheet;
  timeBlocks: TimeBlock[];
}

export function TeesheetView({ teesheet, timeBlocks }: TeesheetViewProps) {
  // Sort time blocks by start time
  const sortedTimeBlocks = [...timeBlocks].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="grid grid-cols-1 gap-4">
        {sortedTimeBlocks.map((block) => (
          <TimeBlockComponent key={block.id} timeBlock={block} />
        ))}
      </div>
    </div>
  );
}
