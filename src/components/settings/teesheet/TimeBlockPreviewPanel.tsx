"use client";

import { ScrollArea } from "~/components/ui/scroll-area";
import type { TimeBlock } from "~/app/types/TeeSheetTypes";
import { formatTimeStringTo12Hour } from "~/lib/utils";

interface TimeBlockPreviewPanelProps {
  blocks: TimeBlock[];
}

export function TimeBlockPreviewPanel({ blocks }: TimeBlockPreviewPanelProps) {
  return (
    <ScrollArea className="h-[600px] rounded-lg border">
      <div className="space-y-2 p-4">
        {blocks.map((block) => (
          <div
            key={block.id}
            className="flex items-center justify-between rounded-lg border bg-white p-3 shadow-sm transition-colors hover:bg-gray-50"
          >
            <div>
              <div className="font-medium">
                {block.displayName
                  ? block.displayName
                  : formatTimeStringTo12Hour(block.startTime)}
              </div>
              <div className="text-sm text-gray-500">
                {formatTimeStringTo12Hour(block.startTime)}
              </div>
            </div>
          </div>
        ))}

        {blocks.length === 0 && (
          <div className="flex h-[200px] items-center justify-center text-sm text-gray-500">
            No time blocks to preview
          </div>
        )}
      </div>
    </ScrollArea>
  );
}
