"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  TeeSheet,
  TimeBlockWithMembers,
  TeesheetConfig,
} from "~/app/types/TeeSheetTypes";
import { TimeBlock as TimeBlockComponent } from "../timeblock/TimeBlock";
import { RestrictionViolationAlert } from "~/components/settings/timeblock-restrictions/RestrictionViolationAlert";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";
import type { TimeBlockWithPaceOfPlay } from "~/server/pace-of-play/data";
import { TeesheetControlPanel } from "./TeesheetControlPanel";
import { TeesheetGeneralNotes } from "./TeesheetGeneralNotes";

// Poll interval in milliseconds
const POLL_INTERVAL = 30000;

interface GridTeesheetViewProps {
  teesheet: TeeSheet;
  timeBlocks: TimeBlockWithMembers[];
  availableConfigs: TeesheetConfig[];
  paceOfPlayMap: Map<number, any>;
  isAdmin?: boolean;
  onRestrictionViolation: (violations: RestrictionViolation[]) => void;
  setPendingAction: React.Dispatch<
    React.SetStateAction<(() => Promise<void>) | null>
  >;
  violations: RestrictionViolation[];
  showRestrictionAlert: boolean;
  setShowRestrictionAlert: (show: boolean) => void;
  pendingAction: (() => Promise<void>) | null;
  onRemoveMember: (timeBlockId: number, memberId: number) => Promise<void>;
  onRemoveGuest: (timeBlockId: number, guestId: number) => Promise<void>;
  onCheckInMember: (
    timeBlockId: number,
    memberId: number,
    isCheckedIn: boolean,
  ) => Promise<void>;
  onCheckInGuest: (
    timeBlockId: number,
    guestId: number,
    isCheckedIn: boolean,
  ) => Promise<void>;
  onCheckInAll: (timeBlockId: number) => Promise<void>;
  onSaveNotes: (timeBlockId: number, notes: string) => Promise<boolean>;
}

export function GridTeesheetView({
  teesheet,
  timeBlocks,
  availableConfigs,
  paceOfPlayMap,
  isAdmin = true,
  onRestrictionViolation,
  setPendingAction,
  violations,
  showRestrictionAlert,
  setShowRestrictionAlert,
  pendingAction,
  onRemoveMember,
  onRemoveGuest,
  onCheckInMember,
  onCheckInGuest,
  onCheckInAll,
  onSaveNotes,
}: GridTeesheetViewProps) {
  const router = useRouter();

  // Add polling for admin view only
  useEffect(() => {
    // Only poll if this is the admin view
    if (!isAdmin) return;

    // Set up polling interval
    const interval = setInterval(() => {
      router.refresh();
    }, POLL_INTERVAL);

    // Clean up interval on component unmount
    return () => clearInterval(interval);
  }, [router, isAdmin]);

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
  };

  return (
    <>
      <TeesheetControlPanel
        teesheet={teesheet}
        availableConfigs={availableConfigs}
        isAdmin={isAdmin}
      />

      {/* General Notes Section */}
      <TeesheetGeneralNotes key={`notes-${teesheet.id}`} teesheet={teesheet} />

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-3">
        {timeBlocks.map((block) => (
          <TimeBlockComponent
            key={`timeblock-${block.id}`}
            timeBlock={{
              ...block,
              startTime: block.startTime,
              endTime: block.endTime,
              date: block.date || teesheet.date,
              members: block.members || [],
              guests: block.guests || [],
            }}
            onRestrictionViolation={onRestrictionViolation}
            setPendingAction={setPendingAction}
            paceOfPlay={paceOfPlayMap.get(block.id) || null}
            showMemberClass={true}
            onRemoveMember={(memberId: number) =>
              onRemoveMember(block.id, memberId)
            }
            onRemoveGuest={(guestId: number) =>
              onRemoveGuest(block.id, guestId)
            }
            onCheckInMember={(memberId: number, isCheckedIn: boolean) =>
              onCheckInMember(block.id, memberId, isCheckedIn)
            }
            onCheckInGuest={(guestId: number, isCheckedIn: boolean) =>
              onCheckInGuest(block.id, guestId, isCheckedIn)
            }
            onCheckInAll={() => onCheckInAll(block.id)}
            onSaveNotes={(notes: string) => onSaveNotes(block.id, notes)}
            viewMode="grid"
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
    </>
  );
}
