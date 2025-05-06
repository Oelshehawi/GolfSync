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
import { RestrictionViolationAlert } from "~/components/settings/timeblock-restrictions/RestrictionViolationAlert";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";

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
  const [violations, setViolations] = useState<RestrictionViolation[]>([]);
  const [showRestrictionAlert, setShowRestrictionAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);

  // Sort time blocks by start time (string comparison for HH:MM format)
  const sortedTimeBlocks = [...timeBlocks].sort((a, b) =>
    a.startTime.localeCompare(b.startTime),
  );

  const handleConfigChange = async (configId: number) => {
    if (configId === teesheet.configId) return;

    setIsUpdating(true);
    try {
      const result = await updateTeesheetConfigForDate(teesheet.id, configId);
      if (result.success) {
        toast.success("Teesheet configuration updated successfully");
        // The page will be automatically refreshed via revalidatePath
      } else {
        toast.error(result.error || "Failed to update teesheet configuration");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  // Handle restriction alerts for admins
  const handleRestrictionViolations = (violations: RestrictionViolation[]) => {
    if (violations.length > 0) {
      setViolations(violations);
      setShowRestrictionAlert(true);
    }
  };

  // Handle admin override continuation
  const handleOverrideContinue = async () => {
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
    setShowRestrictionAlert(false);
  };

  // Handle cancellation of restriction alert
  const handleRestrictionCancel = () => {
    setPendingAction(null);
    setShowRestrictionAlert(false);
    setViolations([]);
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
              className="cursor-pointer shadow-sm transition-colors hover:text-white"
            >
              <Settings className="mr-2 h-4 w-4" />
              Change Configuration
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="rounded-md border bg-white shadow-lg"
          >
            {availableConfigs.map((config) => (
              <DropdownMenuItem
                key={config.id}
                onClick={() => handleConfigChange(config.id)}
                disabled={config.id === teesheet.configId || isUpdating}
                className="cursor-pointer transition-colors hover:bg-[var(--org-primary)] hover:text-white"
              >
                {config.name}
                {config.id === teesheet.configId && " (Current)"}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {sortedTimeBlocks.map((block) => (
          <TimeBlockComponent
            key={block.id}
            timeBlock={{
              ...block,
              startTime: block.startTime,
              endTime: block.endTime,
              date: block.date || teesheet.date,
              members: block.members || [],
              guests: block.guests || [],
            }}
            onRestrictionViolation={handleRestrictionViolations}
            setPendingAction={setPendingAction}
          />
        ))}
      </div>

      {/* Restriction Violation Alert (Admin only) */}
      <RestrictionViolationAlert
        open={showRestrictionAlert}
        onOpenChange={setShowRestrictionAlert}
        violations={violations}
        onCancel={handleRestrictionCancel}
        onContinue={handleOverrideContinue}
      />
    </div>
  );
}
