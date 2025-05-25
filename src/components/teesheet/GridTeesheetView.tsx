"use client";

import type {
  TeeSheet,
  TimeBlockWithMembers,
  TeesheetConfig,
} from "~/app/types/TeeSheetTypes";
import { TimeBlock as TimeBlockComponent } from "../timeblock/TimeBlock";
import { RestrictionViolationAlert } from "~/components/settings/timeblock-restrictions/RestrictionViolationAlert";
import { TeesheetControlPanel } from "./TeesheetControlPanel";
import { TeesheetGeneralNotes } from "./TeesheetGeneralNotes";
import { useTeesheetPolling } from "~/hooks/useTeesheetPolling";
import { useRestrictionHandling } from "~/hooks/useRestrictionHandling";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";

interface ViewProps {
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
  onRemoveFill: (timeBlockId: number, fillId: number) => Promise<void>;
}

export function GridTeesheetView(props: ViewProps) {
  const {
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
    onRemoveFill,
  } = props;

  // Use shared hooks
  useTeesheetPolling(isAdmin);
  const { handleOverrideContinue, handleRestrictionCancel } =
    useRestrictionHandling();

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
            onRemoveFill={(fillId: number) => onRemoveFill(block.id, fillId)}
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
