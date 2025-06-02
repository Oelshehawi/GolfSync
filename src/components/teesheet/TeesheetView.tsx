"use client";

import React, { useState, useEffect, useMemo } from "react";
import type {
  TeeSheet,
  TimeBlockWithMembers,
  TeesheetConfig,
  TemplateBlock,
  CustomConfig,
  Template,
} from "~/app/types/TeeSheetTypes";
import { ConfigTypes } from "~/app/types/TeeSheetTypes";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";
import { TimeBlock as TimeBlockComponent } from "../timeblock/TimeBlock";
import { RestrictionViolationAlert } from "~/components/settings/timeblock-restrictions/RestrictionViolationAlert";
import type { TimeBlockWithPaceOfPlay } from "~/server/pace-of-play/data";
import { TeesheetControlPanel } from "./TeesheetControlPanel";
import { TeesheetGeneralNotes } from "./TeesheetGeneralNotes";
import {
  TimeBlockNote,
  TimeBlockNoteEditor,
  TimeBlockNoteAddIndicator,
} from "../timeblock/TimeBlockNotes";
import { AddPlayerModal } from "../timeblock/AddPlayerModal";
import { useTeesheetPolling } from "~/hooks/useTeesheetPolling";
import { useRestrictionHandling } from "~/hooks/useRestrictionHandling";
import { toast } from "react-hot-toast";
import {
  removeTimeBlockMember,
  removeTimeBlockGuest,
  checkInMember,
  checkInGuest,
  checkInAllTimeBlockParticipants,
  updateTimeBlockNotes,
  removeFillFromTimeBlock,
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
  templates?: Template[];
  isAdmin?: boolean;
}

export function TeesheetView({
  teesheet,
  timeBlocks,
  availableConfigs,
  paceOfPlayData = [],
  templates = [],
  isAdmin = true,
}: TeesheetViewProps) {
  const [selectedTimeBlock, setSelectedTimeBlock] =
    useState<TimeBlockWithMembers | null>(null);
  const [addPlayerModalOpen, setAddPlayerModalOpen] = useState(false);
  const [editingTimeBlockNote, setEditingTimeBlockNote] = useState<
    number | null
  >(null);
  const [violations, setViolations] = useState<RestrictionViolation[]>([]);
  const [showRestrictionAlert, setShowRestrictionAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);

  // Use shared hooks
  useTeesheetPolling(isAdmin);
  const { handleOverrideContinue, handleRestrictionCancel } =
    useRestrictionHandling();

  // Sort time blocks by sortOrder
  const sortedTimeBlocks = useMemo(() => {
    return [...timeBlocks].sort(
      (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
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
      } else if (result.violations) {
        handleRestrictionViolations(result.violations);
        setPendingAction(() => async () => {
          await removeTimeBlockMember(timeBlockId, memberId);
          toast.success("Member removed successfully (override)");
        });
      } else {
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
      } else if (result.violations) {
        handleRestrictionViolations(result.violations);
        setPendingAction(() => async () => {
          await removeTimeBlockGuest(timeBlockId, guestId);
          toast.success("Guest removed successfully (override)");
        });
      } else {
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
      } else if (result.violations) {
        handleRestrictionViolations(result.violations);
        setPendingAction(() => async () => {
          await checkInMember(timeBlockId, memberId, !isCheckedIn);
          toast.success(
            `Member ${!isCheckedIn ? "checked in" : "check-in removed"} successfully (override)`,
          );
        });
      } else {
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
      } else if (result.violations) {
        handleRestrictionViolations(result.violations);
        setPendingAction(() => async () => {
          await checkInGuest(timeBlockId, guestId, !isCheckedIn);
          toast.success(
            `Guest ${!isCheckedIn ? "checked in" : "check-in removed"} successfully (override)`,
          );
        });
      } else {
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
      } else if (result.violations) {
        handleRestrictionViolations(result.violations);
        setPendingAction(() => async () => {
          await checkInAllTimeBlockParticipants(timeBlockId, true);
          toast.success("All participants checked in successfully (override)");
        });
      } else {
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

  // Handle removing a fill from a timeblock
  const handleRemoveFill = async (timeBlockId: number, fillId: number) => {
    try {
      const result = await removeFillFromTimeBlock(timeBlockId, fillId);
      if (result.success) {
        toast.success("Fill removed successfully");
      } else {
        toast.error(result.error || "Failed to remove fill");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  // Toggle timeblock note editing
  const toggleTimeBlockNoteEdit = (timeBlockId: number | null) => {
    setEditingTimeBlockNote(timeBlockId);
  };

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

  // Handle modal close
  const handleModalOpenChange = (open: boolean) => {
    setAddPlayerModalOpen(open);
    if (!open) {
      setSelectedTimeBlock(null);
    }
  };

  return (
    <div className="rounded-lg bg-white p-4 shadow">
      <TeesheetControlPanel
        teesheet={teesheet}
        availableConfigs={availableConfigs}
        isAdmin={isAdmin}
      />

      {/* General Notes Section */}
      <TeesheetGeneralNotes key={`notes-${teesheet.id}`} teesheet={teesheet} />

      {/* Traditional Vertical Teesheet View */}
      <div className="rounded-lg border p-1 shadow">
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
            {sortedTimeBlocks.map((block) => {
              // Get the template block if this is a custom config
              const config = availableConfigs.find(
                (c) => c.id === teesheet.configId,
              );
              let templateBlock: TemplateBlock | null = null;

              if (config?.type === ConfigTypes.CUSTOM) {
                const customConfig = config as CustomConfig;
                const template = templates?.find(
                  (t) => t.id === customConfig.templateId,
                );
                if (template?.blocks) {
                  templateBlock =
                    template.blocks.find(
                      (tb) => block.startTime === tb.startTime,
                    ) || null;
                }
              }

              return (
                <React.Fragment key={`block-${block.id}`}>
                  <TimeBlockComponent
                    key={`timeblock-${block.id}`}
                    timeBlock={{
                      ...block,
                      startTime: block.startTime,
                      endTime: block.endTime,
                      date: block.date || teesheet.date,
                      members: block.members || [],
                      guests: block.guests || [],
                      displayName:
                        block.displayName || templateBlock?.displayName,
                    }}
                    onRestrictionViolation={handleRestrictionViolations}
                    setPendingAction={setPendingAction}
                    paceOfPlay={paceOfPlayMap.get(block.id) || null}
                    showMemberClass={true}
                    onRemoveMember={(memberId: number) =>
                      handleRemoveMember(block.id, memberId)
                    }
                    onRemoveGuest={(guestId: number) =>
                      handleRemoveGuest(block.id, guestId)
                    }
                    onRemoveFill={(fillId: number) =>
                      handleRemoveFill(block.id, fillId)
                    }
                    onCheckInMember={(memberId: number, isCheckedIn: boolean) =>
                      handleCheckInMember(block.id, memberId, isCheckedIn)
                    }
                    onCheckInGuest={(guestId: number, isCheckedIn: boolean) =>
                      handleCheckInGuest(block.id, guestId, isCheckedIn)
                    }
                    onCheckInAll={() => handleCheckInAll(block.id)}
                    onSaveNotes={(notes: string) =>
                      handleSaveNotes(block.id, notes)
                    }
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
                          onSaveNotes={handleSaveNotes}
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
                            return handleSaveNotes(timeBlockId, notes);
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
              );
            })}
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
    </div>
  );
}
