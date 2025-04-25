"use client";

import { useState } from "react";
import type {
  TeeSheet,
  TimeBlockWithMembers,
  TeesheetConfig,
} from "~/app/types/TeeSheetTypes";
import { TimeBlock as TimeBlockComponent } from "../timeblock/TimeBlock";
import { Button } from "~/components/ui/button";
import { Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { updateTeesheetConfigForDate } from "~/server/settings/actions";
import toast from "react-hot-toast";

interface TeesheetViewProps {
  teesheet: TeeSheet;
  timeBlocks: TimeBlockWithMembers[];
  availableConfigs: TeesheetConfig[];
}

export function TeesheetView({
  teesheet,
  timeBlocks,
  availableConfigs,
}: TeesheetViewProps) {
  const [isUpdating, setIsUpdating] = useState(false);

  // Sort time blocks by start time
  const sortedTimeBlocks = [...timeBlocks].sort(
    (a, b) => a.startTime.getTime() - b.startTime.getTime(),
  );

  const handleConfigChange = async (configId: number) => {
    if (configId === teesheet.configId) return;

    setIsUpdating(true);
    try {
      const result = await updateTeesheetConfigForDate(teesheet.id, configId);
      if (result.success) {
        toast.success("Teesheet configuration updated successfully");
        // Refresh the page to show new time blocks
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to update teesheet configuration");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="mb-4 flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              size="sm"
              disabled={isUpdating}
              className="cursor-pointer shadow-sm transition-colors hover:bg-[var(--org-secondary)] hover:text-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              Change Configuration
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="rounded-md border bg-white shadow-lg">
            {availableConfigs.map((config) => (
              <DropdownMenuItem
                key={config.id}
                onClick={() => handleConfigChange(config.id)}
                disabled={config.id === teesheet.configId || isUpdating}
                className="cursor-pointer transition-colors hover:bg-[var(--org-secondary)] hover:text-white"
              >
                {config.name}
                {config.id === teesheet.configId && " (Current)"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-1 gap-4">
        {sortedTimeBlocks.map((block) => (
          <TimeBlockComponent
            key={block.id}
            timeBlock={{
              ...block,
              startTime: new Date(block.startTime),
              endTime: new Date(block.endTime),
              members: block.members || [],
            }}
          />
        ))}
      </div>
    </div>
  );
}
