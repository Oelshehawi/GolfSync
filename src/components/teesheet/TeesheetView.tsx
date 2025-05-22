"use client";

import { useState, useMemo } from "react";
import type {
  TeeSheet,
  TimeBlockWithMembers,
  TeesheetConfig,
} from "~/app/types/TeeSheetTypes";
import { Button } from "~/components/ui/button";
import { LayoutGrid, List } from "lucide-react";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";
import type { TimeBlockWithPaceOfPlay } from "~/server/pace-of-play/data";
import { GridTeesheetView } from "./GridTeesheetView";
import { VerticalTeesheetView } from "./VerticalTeesheetView";
import { toast } from "react-hot-toast";
import {
  removeTimeBlockMember,
  removeTimeBlockGuest,
  checkInMember,
  checkInGuest,
  checkInAllTimeBlockParticipants,
  updateTimeBlockNotes,
} from "~/server/teesheet/actions";

// Extended ActionResult type to include violations
type ExtendedActionResult = {
  success: boolean;
  error?: string;
  violations?: RestrictionViolation[];
};

interface TeesheetViewProps {
  teesheet: TeeSheet;
  timeBlocks: TimeBlockWithMembers[];
  availableConfigs: TeesheetConfig[];
  paceOfPlayData?: TimeBlockWithPaceOfPlay[];
  isAdmin?: boolean;
}

export function TeesheetView({
  teesheet,
  timeBlocks,
  availableConfigs,
  paceOfPlayData = [],
  isAdmin = true,
}: TeesheetViewProps) {
  const [viewMode, setViewMode] = useState<"grid" | "vertical">("vertical");
  const [violations, setViolations] = useState<RestrictionViolation[]>([]);
  const [showRestrictionAlert, setShowRestrictionAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);

  // Sort time blocks by start time (string comparison for HH:MM format)
  const sortedTimeBlocks = useMemo(() => {
    return [...timeBlocks].sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );
  }, [timeBlocks]);

  // Create a map of timeBlockId to pace of play data for quick lookup
  const paceOfPlayMap = useMemo(() => {
    return paceOfPlayData.reduce((map, item) => {
      if (item.id && item.paceOfPlay) {
        map.set(item.id, item.paceOfPlay);
      }
      return map;
    }, new Map());
  }, [paceOfPlayData]);

  // Handle restriction alerts for admins
  const handleRestrictionViolations = (violations: RestrictionViolation[]) => {
    if (violations.length > 0) {
      setViolations(violations);
      setShowRestrictionAlert(true);
    }
  };

  // Handle removing a member from a timeblock
  const handleRemoveMember = async (timeBlockId: number, memberId: number) => {
    try {
      const result = (await removeTimeBlockMember(
        timeBlockId,
        memberId,
      )) as ExtendedActionResult;
      if (result.success) {
        toast.success("Member removed successfully");
      } else {
        // Check if there are restriction violations
        if (result.violations) {
          handleRestrictionViolations(result.violations);

          // Set the pending action for override
          setPendingAction(() => async () => {
            await removeTimeBlockMember(timeBlockId, memberId);
            toast.success("Member removed successfully (override)");
          });
          return;
        }

        toast.error(result.error || "Failed to remove member");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  // Handle removing a guest from a timeblock
  const handleRemoveGuest = async (timeBlockId: number, guestId: number) => {
    try {
      const result = (await removeTimeBlockGuest(
        timeBlockId,
        guestId,
      )) as ExtendedActionResult;
      if (result.success) {
        toast.success("Guest removed successfully");
      } else {
        // Check if there are restriction violations
        if (result.violations) {
          handleRestrictionViolations(result.violations);

          // Set the pending action for override
          setPendingAction(() => async () => {
            await removeTimeBlockGuest(timeBlockId, guestId);
            toast.success("Guest removed successfully (override)");
          });
          return;
        }

        toast.error(result.error || "Failed to remove guest");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  // Handle checking in a member
  const handleCheckInMember = async (
    timeBlockId: number,
    memberId: number,
    isCheckedIn: boolean,
  ) => {
    try {
      const result = (await checkInMember(
        timeBlockId,
        memberId,
        !isCheckedIn,
      )) as ExtendedActionResult;
      if (result.success) {
        toast.success(
          `Member ${!isCheckedIn ? "checked in" : "check-in removed"} successfully`,
        );
      } else {
        // Check if there are restriction violations
        if (result.violations) {
          handleRestrictionViolations(result.violations);

          // Set the pending action for override
          setPendingAction(() => async () => {
            await checkInMember(timeBlockId, memberId, !isCheckedIn);
            toast.success(
              `Member ${!isCheckedIn ? "checked in" : "check-in removed"} successfully (override)`,
            );
          });
          return;
        }

        toast.error(result.error || "Failed to update check-in status");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  // Handle checking in a guest
  const handleCheckInGuest = async (
    timeBlockId: number,
    guestId: number,
    isCheckedIn: boolean,
  ) => {
    try {
      const result = (await checkInGuest(
        timeBlockId,
        guestId,
        !isCheckedIn,
      )) as ExtendedActionResult;
      if (result.success) {
        toast.success(
          `Guest ${!isCheckedIn ? "checked in" : "check-in removed"} successfully`,
        );
      } else {
        // Check if there are restriction violations
        if (result.violations) {
          handleRestrictionViolations(result.violations);

          // Set the pending action for override
          setPendingAction(() => async () => {
            await checkInGuest(timeBlockId, guestId, !isCheckedIn);
            toast.success(
              `Guest ${!isCheckedIn ? "checked in" : "check-in removed"} successfully (override)`,
            );
          });
          return;
        }

        toast.error(result.error || "Failed to update check-in status");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  // Handle checking in all participants for a timeblock
  const handleCheckInAll = async (timeBlockId: number) => {
    try {
      const result = (await checkInAllTimeBlockParticipants(
        timeBlockId,
        true,
      )) as ExtendedActionResult;
      if (result.success) {
        toast.success("All participants checked in successfully");
      } else {
        // Check if there are restriction violations
        if (result.violations) {
          handleRestrictionViolations(result.violations);

          // Set the pending action for override
          setPendingAction(() => async () => {
            await checkInAllTimeBlockParticipants(timeBlockId, true);
            toast.success(
              "All participants checked in successfully (override)",
            );
          });
          return;
        }

        toast.error(result.error || "Failed to check in all participants");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  // Handle saving notes for a timeblock
  const handleSaveNotes = async (timeBlockId: number, notes: string) => {
    try {
      const result = await updateTimeBlockNotes(timeBlockId, notes || null);
      if (result.success) {
        toast.success("Notes updated successfully");
        return true;
      } else {
        toast.error(result.error || "Failed to update notes");
        return false;
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
      return false;
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border shadow-sm">
            <Button
              variant={viewMode === "grid" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("grid")}
              className="rounded-r-none border-r"
            >
              <LayoutGrid className="mr-2 h-4 w-4" />
              Grid View
            </Button>
            <Button
              variant={viewMode === "vertical" ? "default" : "ghost"}
              size="sm"
              onClick={() => setViewMode("vertical")}
              className="rounded-l-none"
            >
              <List className="mr-2 h-4 w-4" />
              Traditional View
            </Button>
          </div>
        </div>
      </div>

      {viewMode === "grid" ? (
        <GridTeesheetView
          teesheet={teesheet}
          timeBlocks={sortedTimeBlocks}
          availableConfigs={availableConfigs}
          paceOfPlayMap={paceOfPlayMap}
          isAdmin={isAdmin}
          onRestrictionViolation={handleRestrictionViolations}
          setPendingAction={setPendingAction}
          violations={violations}
          showRestrictionAlert={showRestrictionAlert}
          setShowRestrictionAlert={setShowRestrictionAlert}
          pendingAction={pendingAction}
          onRemoveMember={handleRemoveMember}
          onRemoveGuest={handleRemoveGuest}
          onCheckInMember={handleCheckInMember}
          onCheckInGuest={handleCheckInGuest}
          onCheckInAll={handleCheckInAll}
          onSaveNotes={handleSaveNotes}
        />
      ) : (
        <VerticalTeesheetView
          teesheet={teesheet}
          timeBlocks={sortedTimeBlocks}
          availableConfigs={availableConfigs}
          paceOfPlayData={paceOfPlayData}
          paceOfPlayMap={paceOfPlayMap}
          isAdmin={isAdmin}
          onRestrictionViolation={handleRestrictionViolations}
          setPendingAction={setPendingAction}
          violations={violations}
          showRestrictionAlert={showRestrictionAlert}
          setShowRestrictionAlert={setShowRestrictionAlert}
          pendingAction={pendingAction}
          onRemoveMember={handleRemoveMember}
          onRemoveGuest={handleRemoveGuest}
          onCheckInMember={handleCheckInMember}
          onCheckInGuest={handleCheckInGuest}
          onCheckInAll={handleCheckInAll}
          onSaveNotes={handleSaveNotes}
        />
      )}
    </div>
  );
}
