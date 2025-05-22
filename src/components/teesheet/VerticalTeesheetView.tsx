"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import type {
  TeeSheet,
  TimeBlockWithMembers,
  TeesheetConfig,
} from "~/app/types/TeeSheetTypes";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";
import type { TimeBlockWithPaceOfPlay } from "~/server/pace-of-play/data";
import { TimeBlock as TimeBlockComponent } from "../timeblock/TimeBlock";
import { RestrictionViolationAlert } from "~/components/settings/timeblock-restrictions/RestrictionViolationAlert";
import { TeesheetControlPanel } from "./TeesheetControlPanel";
import { TeesheetGeneralNotes } from "./TeesheetGeneralNotes";
import {
  TimeBlockNote,
  TimeBlockNoteEditor,
  TimeBlockNoteAddIndicator,
} from "../timeblock/TimeBlockNotes";
import { AddPlayerModal } from "../timeblock/AddPlayerModal";
import type { TimeBlockGuest } from "~/app/types/GuestTypes";

// Poll interval in milliseconds
const POLL_INTERVAL = 60000;

interface VerticalTeesheetViewProps {
  teesheet: TeeSheet;
  timeBlocks: TimeBlockWithMembers[];
  availableConfigs: TeesheetConfig[];
  paceOfPlayData?: TimeBlockWithPaceOfPlay[];
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

export function VerticalTeesheetView({
  teesheet,
  timeBlocks,
  availableConfigs,
  paceOfPlayData = [],
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
}: VerticalTeesheetViewProps) {
  const router = useRouter();
  const [selectedTimeBlock, setSelectedTimeBlock] =
    useState<TimeBlockWithMembers | null>(null);
  const [addPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
  const [editingTimeBlockNote, setEditingTimeBlockNote] = useState<
    number | null
  >(null);

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

  // Add event listener for opening the add player modal
  useEffect(() => {
    const handleOpenAddPlayerModal = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail?.timeBlockId) {
        const timeBlock = timeBlocks.find(
          (block) => block.id === customEvent.detail.timeBlockId,
        );
        if (timeBlock) {
          setSelectedTimeBlock(timeBlock);
          setAddPlayerModalOpen(true);
        }
      }
    };

    window.addEventListener("open-add-player-modal", handleOpenAddPlayerModal);

    return () => {
      window.removeEventListener(
        "open-add-player-modal",
        handleOpenAddPlayerModal,
      );
    };
  }, [timeBlocks]);

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

  // Toggle timeblock note editing
  const toggleTimeBlockNoteEdit = (timeBlockId: number | null) => {
    setEditingTimeBlockNote(timeBlockId);
  };

  // Handle modal close
  const handleModalOpenChange = (open: boolean) => {
    setAddPlayerModalOpen(open);
    if (!open) {
      setSelectedTimeBlock(null);
    }
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

      {/* Traditional Vertical Teesheet View */}
      <div className="rounded-lg border shadow">
        <table className="w-full table-auto">
          <thead className="bg-gray-100 text-xs font-semibold text-gray-600 uppercase">
            <tr>
              <th className="w-[10%] px-3 py-2 text-left whitespace-nowrap">
                Time
              </th>
              <th className="w-[12%] px-3 py-2 text-left whitespace-nowrap">
                Status
              </th>
              <th className="w-[60%] px-3 py-2 text-left">Players</th>
              <th className="w-[18%] px-3 py-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {timeBlocks.map((block) => (
              <React.Fragment key={`block-${block.id}`}>
                {/* Render the actual timeblock */}
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
                  viewMode="vertical"
                />

                {/* Display existing notes if any */}
                {block.notes && block.notes.trim() !== "" && (
                  <tr>
                    <td
                      colSpan={4}
                      className="border-b border-[var(--org-primary-light)] p-0"
                    >
                      <TimeBlockNote
                        notes={block.notes}
                        onEditClick={() => toggleTimeBlockNoteEdit(block.id)}
                        timeBlockId={block.id}
                        onSaveNotes={onSaveNotes}
                      />
                    </td>
                  </tr>
                )}

                {/* Add note indicator or editor after timeblock */}
                <tr className="hover:bg-gray-50">
                  <td colSpan={4} className="h-2 p-0">
                    {editingTimeBlockNote === block.id ? (
                      <TimeBlockNoteEditor
                        timeBlockId={block.id}
                        initialNote={block.notes || ""}
                        onSaveNotes={(timeBlockId, notes) => {
                          toggleTimeBlockNoteEdit(null);
                          return onSaveNotes(timeBlockId, notes);
                        }}
                        onCancel={() => toggleTimeBlockNoteEdit(null)}
                      />
                    ) : (
                      <TimeBlockNoteAddIndicator
                        onClick={() => toggleTimeBlockNoteEdit(block.id)}
                      />
                    )}
                  </td>
                </tr>
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Restriction Violation Alert (Admin only) */}
      <RestrictionViolationAlert
        open={showRestrictionAlert}
        onOpenChange={setShowRestrictionAlert}
        violations={violations}
        onCancel={handleRestrictionCancel}
        onContinue={handleOverrideContinue}
      />

      {/* Add Player Modal */}
      {selectedTimeBlock && (
        <AddPlayerModal
          open={addPlayerModalOpen}
          onOpenChange={handleModalOpenChange}
          timeBlock={selectedTimeBlock}
          timeBlockGuests={selectedTimeBlock.guests}
        />
      )}
    </>
  );
}
