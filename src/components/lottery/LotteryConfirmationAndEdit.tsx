"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import { ConfirmationDialog } from "~/components/ui/confirmation-dialog";
import {
  Users,
  Clock,
  CheckCircle,
  Calendar,
  User,
  AlertCircle,
  X,
  Save,
  Undo,
} from "lucide-react";

import {
  cancelLotteryEntry,
  finalizeLotteryResults,
  batchUpdateLotteryAssignments,
} from "~/server/lottery/actions";
import { toast } from "react-hot-toast";
import { TIME_WINDOWS } from "~/app/types/LotteryTypes";
import { formatTime12Hour, formatDate } from "~/lib/dates";
import { LotteryAssignmentStats } from "./LotteryAssignmentStats";
import { LotteryAllEntries } from "./LotteryAllEntries";

interface LotteryConfirmationAndEditProps {
  date: string;
  onComplete: () => void;
  members: Array<{
    id: number;
    firstName: string;
    lastName: string;
    class: string;
  }>;
  initialLotteryEntries: any;
  initialTimeBlocks: any;
}

interface LotteryEntryData {
  individual: any[];
  groups: any[];
}

interface ClientSideAssignment {
  id: string;
  name: string;
  entryId: number;
  isGroup: boolean;
  members?: string[];
  memberIds?: number[];
  memberClasses?: { name: string; class: string; id: number }[];
  memberClass?: string;
  preferredWindow?: string;
  size: number;
  // Client-side state
  originalTimeBlockId?: number | null;
  currentTimeBlockId?: number | null;
  hasChanges?: boolean;
}

interface TimeBlockWithAssignments {
  id: number;
  startTime: string;
  endTime: string;
  maxMembers: number;
  assignments: ClientSideAssignment[];
}

interface SelectedItem {
  type: "entry";
  entryId: string;
  sourceTimeBlockId?: number | null;
  isGroup?: boolean;
}

interface PendingChange {
  entryId: number;
  isGroup: boolean;
  assignedTimeBlockId: number | null;
  type: "assignment" | "member_move" | "member_add";
  details?: any;
}

interface ConfirmDialogState {
  open: boolean;
  title: string;
  description: string;
  onConfirm: () => void;
  variant?: "default" | "destructive";
}

// Get shortened member class
const getShortMemberClass = (memberClass: string) => {
  const classMap: { [key: string]: string } = {
    REGULAR: "REG",
    SENIOR: "SR",
    JUNIOR: "JR",
    STUDENT: "STU",
    CORPORATE: "CORP",
    HONORARY: "HON",
    MILITARY: "MIL",
    CLERGY: "CLG",
    INTERMEDIATE: "INT",
    OVERSEAS: "OVS",
  };
  return classMap[memberClass] || memberClass.substring(0, 3).toUpperCase();
};

// Individual Member Card Component (Horizontal)
function MemberCard({
  member,
  isSelected,
  isHighlighted,
  onClick,
  compact = false,
}: {
  member: { name: string; class: string; id: number };
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded border transition-all ${
        compact ? "px-2 py-1" : "px-2 py-1"
      } ${
        isSelected
          ? "border-blue-500 bg-blue-100 shadow-md"
          : isHighlighted
            ? "border-green-400 bg-green-50"
            : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div
        className={`text-center ${compact ? "text-xs" : "text-xs"} font-medium`}
      >
        {member.name}
      </div>
      <div className={`text-center text-xs text-gray-600`}>
        {getShortMemberClass(member.class)}
      </div>
    </div>
  );
}

// Group Card Component (Horizontal Layout)
function GroupCard({
  entry,
  isSelected,
  isHighlighted,
  onGroupClick,
  compact = false,
}: {
  entry: ClientSideAssignment;
  isSelected: boolean;
  isHighlighted: boolean;
  selectedMemberId?: number;
  onGroupClick: () => void;
  compact?: boolean;
}) {
  return (
    <div
      className={`rounded border transition-all ${
        compact ? "mb-1 p-1" : "mb-1 p-2"
      } ${
        isSelected
          ? "border-blue-500 bg-blue-50"
          : isHighlighted
            ? "border-green-400 bg-green-50"
            : "border-gray-300 bg-white"
      }`}
    >
      <div
        className={`flex cursor-pointer items-center gap-1 ${compact ? "mb-1" : "mb-1"}`}
        onClick={onGroupClick}
      >
        <Users className={`text-blue-600 ${compact ? "h-3 w-3" : "h-3 w-3"}`} />
        <span className={`font-semibold ${compact ? "text-xs" : "text-xs"}`}>
          Group ({entry.size})
        </span>
        {isSelected && (
          <Badge variant="outline" className="text-xs">
            Selected
          </Badge>
        )}
        {entry.hasChanges && (
          <Badge variant="secondary" className="text-xs">
            Modified
          </Badge>
        )}
      </div>

      {/* Horizontal member layout - non-clickable */}
      <div className="flex flex-wrap gap-1">
        {entry.memberClasses?.map((member, idx) => (
          <div
            key={idx}
            className={`cursor-default rounded border border-gray-200 bg-gray-100 px-1 py-0.5 transition-all`}
          >
            <div className={`text-center text-xs font-medium text-gray-600`}>
              {member.name}
            </div>
            <div className={`text-center text-xs text-gray-500`}>
              {getShortMemberClass(member.class)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Individual Entry Card Component (Compact)
function IndividualCard({
  entry,
  isSelected,
  isHighlighted,
  onClick,
  compact = false,
}: {
  entry: ClientSideAssignment;
  isSelected: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  compact?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={`cursor-pointer rounded border transition-all ${
        compact ? "mb-1 p-1" : "mb-1 p-2"
      } ${
        isSelected
          ? "border-blue-500 bg-blue-100 shadow-md"
          : isHighlighted
            ? "border-green-400 bg-green-50"
            : "border-gray-200 bg-white hover:bg-gray-50"
      }`}
    >
      <div className="flex items-center gap-1">
        <User className={`text-green-600 ${compact ? "h-3 w-3" : "h-3 w-3"}`} />
        <div className="flex-1">
          <div className={`font-medium ${compact ? "text-xs" : "text-xs"}`}>
            {entry.name}
          </div>
          <div className={`text-xs text-gray-600`}>
            {getShortMemberClass(entry.memberClass || "")}
          </div>
        </div>
        <div className="flex gap-1">
          {isSelected && (
            <Badge variant="outline" className="text-xs">
              Selected
            </Badge>
          )}
          {entry.hasChanges && (
            <Badge variant="secondary" className="text-xs">
              Modified
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}

// Time Block Component
function TimeBlockCard({
  block,
  isHighlighted,
  canAcceptSelection,
  selectedItem,
  onTimeBlockClick,
  onEntryClick,
}: {
  block: TimeBlockWithAssignments;
  isHighlighted: boolean;
  canAcceptSelection: boolean;
  selectedItem: SelectedItem | null;
  onTimeBlockClick: () => void;
  onEntryClick: (entryId: string) => void;
}) {
  const currentOccupancy = block.assignments.reduce(
    (sum, assignment) => sum + assignment.size,
    0,
  );
  const availableSpots = Math.max(0, block.maxMembers - currentOccupancy);

  return (
    <div
      className={`min-h-[80px] rounded border p-2 transition-all ${
        isHighlighted && canAcceptSelection
          ? "border-green-400 bg-green-50"
          : isHighlighted && !canAcceptSelection
            ? "border-red-400 bg-red-50"
            : "border-gray-200 bg-white"
      }`}
    >
      <div
        className={`mb-2 flex cursor-pointer items-center justify-between rounded p-1 ${
          canAcceptSelection ? "hover:bg-green-100" : ""
        }`}
        onClick={canAcceptSelection ? onTimeBlockClick : undefined}
      >
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="text-sm font-semibold">
            {formatTime12Hour(block.startTime)}
          </span>
          <Badge variant="outline" className="text-xs">
            {currentOccupancy}/{block.maxMembers}
          </Badge>
        </div>
        {availableSpots > 0 && (
          <Badge variant="secondary" className="text-xs">
            {availableSpots} spots
          </Badge>
        )}
      </div>

      {/* Horizontal layout for assignments */}
      <div className="flex flex-wrap gap-1">
        {block.assignments.map((assignment) => (
          <div key={assignment.id} className="flex-shrink-0">
            {assignment.isGroup ? (
              <GroupCard
                entry={assignment}
                isSelected={selectedItem?.entryId === assignment.id}
                isHighlighted={
                  selectedItem?.type === "entry" &&
                  !selectedItem.isGroup &&
                  selectedItem.entryId !== assignment.id
                }
                selectedMemberId={undefined}
                onGroupClick={() => onEntryClick(assignment.id)}
                compact={true}
              />
            ) : (
              <IndividualCard
                entry={assignment}
                isSelected={selectedItem?.entryId === assignment.id}
                isHighlighted={false}
                onClick={() => onEntryClick(assignment.id)}
                compact={true}
              />
            )}
          </div>
        ))}

        {block.assignments.length === 0 && (
          <div className="flex h-8 w-full items-center justify-center rounded border-2 border-dashed border-gray-300 text-xs text-gray-500">
            No assignments yet
          </div>
        )}
      </div>
    </div>
  );
}

export function LotteryConfirmationAndEdit({
  date,
  onComplete,
  members,
  initialLotteryEntries,
  initialTimeBlocks,
}: LotteryConfirmationAndEditProps) {
  const [entries, setEntries] = useState<LotteryEntryData>(
    initialLotteryEntries,
  );
  const [timeBlocks, setTimeBlocks] = useState<TimeBlockWithAssignments[]>([]);
  const [unassignedEntries, setUnassignedEntries] = useState<
    ClientSideAssignment[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isFinalizingResults, setIsFinalizingResults] = useState(false);
  const [isSavingChanges, setIsSavingChanges] = useState(false);
  const [activeTab, setActiveTab] = useState("preview");
  const [selectedItem, setSelectedItem] = useState<SelectedItem | null>(null);
  const [pendingChanges, setPendingChanges] = useState<PendingChange[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
    onConfirm: () => {},
    variant: "default",
  });

  // Transform initial data - no async needed since data comes from props
  const transformInitialData = () => {
    setIsLoading(true);
    try {
      const entriesData = initialLotteryEntries;
      const blocksData = initialTimeBlocks;

      setEntries(entriesData);

      // Create unassigned entries list
      const unassigned: ClientSideAssignment[] = [];

      // Add unassigned individual entries
      entriesData.individual
        .filter((entry: any) => entry.status === "PENDING")
        .forEach((entry: any) => {
          unassigned.push({
            id: `individual-${entry.id}`,
            name: `${entry.member.firstName} ${entry.member.lastName}`,
            entryId: entry.id,
            isGroup: false,
            size: 1,
            memberClass: entry.member.class,
            preferredWindow: entry.preferredWindow,
            originalTimeBlockId: null,
            currentTimeBlockId: null,
            hasChanges: false,
          });
        });

      // Add unassigned group entries
      entriesData.groups
        .filter((group: any) => group.status === "PENDING")
        .forEach((group: any) => {
          const memberNames =
            group.members?.map((m: any) => `${m.firstName} ${m.lastName}`) ||
            [];
          const memberClasses =
            group.members?.map((m: any) => ({
              name: `${m.firstName} ${m.lastName}`,
              class: m.class,
              id: m.id,
            })) || [];
          unassigned.push({
            id: `group-${group.id}`,
            name: `${group.leader.firstName} ${group.leader.lastName} (Group)`,
            entryId: group.id,
            isGroup: true,
            members: memberNames,
            memberIds: group.memberIds,
            memberClasses: memberClasses,
            size: group.memberIds.length,
            memberClass: group.leader.class,
            preferredWindow: group.preferredWindow,
            originalTimeBlockId: null,
            currentTimeBlockId: null,
            hasChanges: false,
          });
        });

      setUnassignedEntries(unassigned);

      // Transform blocks data to include lottery assignments
      const transformedBlocks: TimeBlockWithAssignments[] = blocksData.map(
        (block: any) => {
          const assignments: ClientSideAssignment[] = [];

          // Add assigned individual entries
          const assignedIndividuals = entriesData.individual.filter(
            (entry: any) => entry.assignedTimeBlockId === block.id,
          );
          assignedIndividuals.forEach((entry: any) => {
            assignments.push({
              id: `individual-${entry.id}`,
              name: `${entry.member.firstName} ${entry.member.lastName}`,
              entryId: entry.id,
              isGroup: false,
              memberClass: entry.member.class,
              size: 1,
              originalTimeBlockId: block.id,
              currentTimeBlockId: block.id,
              hasChanges: false,
            });
          });

          // Add assigned group entries
          const assignedGroups = entriesData.groups.filter(
            (group: any) =>
              group.status === "ASSIGNED" &&
              group.assignedTimeBlockId === block.id,
          );

          assignedGroups.forEach((group: any) => {
            const groupMemberNames =
              group.members?.map((m: any) => `${m.firstName} ${m.lastName}`) ||
              [];
            const memberClasses =
              group.members?.map((m: any) => ({
                name: `${m.firstName} ${m.lastName}`,
                class: m.class,
                id: m.id,
              })) || [];

            assignments.push({
              id: `group-${group.id}`,
              name: `${group.leader.firstName} ${group.leader.lastName} (Group)`,
              entryId: group.id,
              isGroup: true,
              members: groupMemberNames,
              memberIds: group.memberIds,
              memberClasses: memberClasses,
              memberClass: group.leader.class,
              size: group.memberIds.length,
              originalTimeBlockId: block.id,
              currentTimeBlockId: block.id,
              hasChanges: false,
            });
          });

          return {
            id: block.id,
            startTime: block.startTime,
            endTime: block.endTime,
            maxMembers: block.maxMembers,
            assignments,
          };
        },
      );

      setTimeBlocks(transformedBlocks);
      setSelectedItem(null);
      setPendingChanges([]);
    } catch (error) {
      console.error("Error loading lottery data:", error);
      toast.error("Failed to load lottery data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    transformInitialData();
  }, [initialLotteryEntries, initialTimeBlocks]);

  const swapEntries = (entryId1: string, entryId2: string) => {
    const entry1 = [
      ...unassignedEntries,
      ...timeBlocks.flatMap((b) => b.assignments),
    ].find((e) => e.id === entryId1);

    const entry2 = [
      ...unassignedEntries,
      ...timeBlocks.flatMap((b) => b.assignments),
    ].find((e) => e.id === entryId2);

    if (!entry1 || !entry2) {
      toast.error("Could not find entries to swap");
      return;
    }

    // Check capacity constraints
    const entry1Location = entry1.currentTimeBlockId;
    const entry2Location = entry2.currentTimeBlockId;

    // If swapping between time blocks, check capacity
    if (entry1Location !== null && entry2Location !== null) {
      const block1 = timeBlocks.find((b) => b.id === entry1Location);
      const block2 = timeBlocks.find((b) => b.id === entry2Location);

      if (block1 && block2) {
        const block1CurrentOccupancy = block1.assignments.reduce(
          (sum, a) => sum + a.size,
          0,
        );
        const block2CurrentOccupancy = block2.assignments.reduce(
          (sum, a) => sum + a.size,
          0,
        );

        // Calculate occupancy after swap
        const block1AfterSwap =
          block1CurrentOccupancy - entry1.size + entry2.size;
        const block2AfterSwap =
          block2CurrentOccupancy - entry2.size + entry1.size;

        if (
          block1AfterSwap > block1.maxMembers ||
          block2AfterSwap > block2.maxMembers
        ) {
          toast.error("Swap would exceed time block capacity");
          return;
        }
      }
    }

    // Perform the swap
    const temp1TimeBlockId = entry1.currentTimeBlockId;
    const temp2TimeBlockId = entry2.currentTimeBlockId;

    // Remove both entries from their current locations
    if (entry1.currentTimeBlockId === null) {
      setUnassignedEntries((prev) => prev.filter((e) => e.id !== entry1.id));
    } else {
      setTimeBlocks((prev) =>
        prev.map((block) =>
          block.id === entry1.currentTimeBlockId
            ? {
                ...block,
                assignments: block.assignments.filter(
                  (a) => a.id !== entry1.id,
                ),
              }
            : block,
        ),
      );
    }

    if (entry2.currentTimeBlockId === null) {
      setUnassignedEntries((prev) => prev.filter((e) => e.id !== entry2.id));
    } else {
      setTimeBlocks((prev) =>
        prev.map((block) =>
          block.id === entry2.currentTimeBlockId
            ? {
                ...block,
                assignments: block.assignments.filter(
                  (a) => a.id !== entry2.id,
                ),
              }
            : block,
        ),
      );
    }

    // Add entries to their new locations with swapped positions
    const updatedEntry1 = {
      ...entry1,
      currentTimeBlockId: temp2TimeBlockId,
      hasChanges: entry1.originalTimeBlockId !== temp2TimeBlockId,
    };

    const updatedEntry2 = {
      ...entry2,
      currentTimeBlockId: temp1TimeBlockId,
      hasChanges: entry2.originalTimeBlockId !== temp1TimeBlockId,
    };

    // Place entry1 in entry2's old location
    if (temp2TimeBlockId === null) {
      setUnassignedEntries((prev) => [...prev, updatedEntry1]);
    } else {
      setTimeBlocks((prev) =>
        prev.map((block) =>
          block.id === temp2TimeBlockId
            ? { ...block, assignments: [...block.assignments, updatedEntry1] }
            : block,
        ),
      );
    }

    // Place entry2 in entry1's old location
    if (temp1TimeBlockId === null) {
      setUnassignedEntries((prev) => [...prev, updatedEntry2]);
    } else {
      setTimeBlocks((prev) =>
        prev.map((block) =>
          block.id === temp1TimeBlockId
            ? { ...block, assignments: [...block.assignments, updatedEntry2] }
            : block,
        ),
      );
    }

    // Track both changes
    setPendingChanges((prev) => {
      const filtered = prev.filter(
        (c) =>
          !(c.entryId === entry1.entryId && c.type === "assignment") &&
          !(c.entryId === entry2.entryId && c.type === "assignment"),
      );

      return [
        ...filtered,
        {
          entryId: entry1.entryId,
          isGroup: entry1.isGroup,
          assignedTimeBlockId: temp2TimeBlockId ?? null,
          type: "assignment" as const,
        },
        {
          entryId: entry2.entryId,
          isGroup: entry2.isGroup,
          assignedTimeBlockId: temp1TimeBlockId ?? null,
          type: "assignment" as const,
        },
      ];
    });

    setSelectedItem(null);
    toast.success(`Swapped ${entry1.name} and ${entry2.name}`);
  };

  const handleEntryClick = (entryId: string) => {
    if (selectedItem?.entryId === entryId) {
      setSelectedItem(null);
      return;
    }

    // Find the entry
    const entry = [
      ...unassignedEntries,
      ...timeBlocks.flatMap((b) => b.assignments),
    ].find((e) => e.id === entryId);

    if (!entry) return;

    // Check if we should swap with currently selected entry
    if (selectedItem?.type === "entry") {
      const currentEntry = [
        ...unassignedEntries,
        ...timeBlocks.flatMap((b) => b.assignments),
      ].find((e) => e.id === selectedItem.entryId);

      if (currentEntry && currentEntry.id !== entry.id) {
        // Perform swap
        swapEntries(selectedItem.entryId, entryId);
        return;
      }
    }

    setSelectedItem({
      type: "entry",
      entryId: entryId,
      isGroup: entry.isGroup,
      sourceTimeBlockId: entry.currentTimeBlockId,
    });
  };

  const handleTimeBlockClick = async (timeBlockId: number) => {
    if (!selectedItem) return;

    const timeBlock = timeBlocks.find((b) => b.id === timeBlockId);
    if (!timeBlock) return;

    const currentOccupancy = timeBlock.assignments.reduce(
      (sum, assignment) => sum + assignment.size,
      0,
    );
    const availableSpots = Math.max(0, timeBlock.maxMembers - currentOccupancy);

    if (selectedItem.type === "entry") {
      const entry = [
        ...unassignedEntries,
        ...timeBlocks.flatMap((b) => b.assignments),
      ].find((e) => e.id === selectedItem.entryId);

      if (entry && availableSpots >= entry.size) {
        // Client-side move
        moveEntryClientSide(selectedItem.entryId, timeBlockId);
        toast.success(
          `Moved ${entry.name} to ${formatTime12Hour(timeBlock.startTime)}`,
        );
      } else {
        toast.error("Not enough space in this time slot");
      }
    }
  };

  const handleGroupClick = async (groupId: string) => {
    if (!selectedItem || selectedItem.type !== "entry" || selectedItem.isGroup)
      return;

    // Individual entry clicking on a group - add to group
    const targetGroup = [
      ...unassignedEntries,
      ...timeBlocks.flatMap((b) => b.assignments),
    ].find((e) => e.id === groupId && e.isGroup);

    const sourceEntry = [
      ...unassignedEntries,
      ...timeBlocks.flatMap((b) => b.assignments),
    ].find((e) => e.id === selectedItem.entryId);

    if (targetGroup && sourceEntry && !sourceEntry.isGroup) {
      // Client-side add to group
      addIndividualToGroupClientSide(selectedItem.entryId, groupId);
      toast.success(`Added ${sourceEntry.name} to group`);
    }
  };

  const moveEntryClientSide = (
    entryId: string,
    targetTimeBlockId: number | null,
  ) => {
    const sourceEntry = [
      ...unassignedEntries,
      ...timeBlocks.flatMap((b) => b.assignments),
    ].find((e) => e.id === entryId);

    if (!sourceEntry) return;

    // Remove from current location
    if (sourceEntry.currentTimeBlockId === null) {
      setUnassignedEntries((prev) => prev.filter((e) => e.id !== entryId));
    } else {
      setTimeBlocks((prev) =>
        prev.map((block) =>
          block.id === sourceEntry.currentTimeBlockId
            ? {
                ...block,
                assignments: block.assignments.filter((a) => a.id !== entryId),
              }
            : block,
        ),
      );
    }

    // Add to new location with changes tracking
    const updatedEntry = {
      ...sourceEntry,
      currentTimeBlockId: targetTimeBlockId,
      hasChanges: sourceEntry.originalTimeBlockId !== targetTimeBlockId,
    };

    if (targetTimeBlockId === null) {
      setUnassignedEntries((prev) => [...prev, updatedEntry]);
    } else {
      setTimeBlocks((prev) =>
        prev.map((block) =>
          block.id === targetTimeBlockId
            ? { ...block, assignments: [...block.assignments, updatedEntry] }
            : block,
        ),
      );
    }

    // Track the change
    setPendingChanges((prev) => {
      const existing = prev.find(
        (c) => c.entryId === sourceEntry.entryId && c.type === "assignment",
      );
      const newChange: PendingChange = {
        entryId: sourceEntry.entryId,
        isGroup: sourceEntry.isGroup,
        assignedTimeBlockId: targetTimeBlockId,
        type: "assignment",
      };

      if (existing) {
        return prev.map((c) =>
          c.entryId === sourceEntry.entryId && c.type === "assignment"
            ? newChange
            : c,
        );
      } else {
        return [...prev, newChange];
      }
    });

    setSelectedItem(null);
  };

  const addIndividualToGroupClientSide = (
    individualId: string,
    groupId: string,
  ) => {
    // This would be more complex - for now, show a message
    toast.success(
      "Individual to group merge will be implemented in the save phase",
    );
    setSelectedItem(null);
  };

  const canTimeBlockAcceptSelection = (
    timeBlock: TimeBlockWithAssignments,
  ): boolean => {
    if (!selectedItem) return false;

    const currentOccupancy = timeBlock.assignments.reduce(
      (sum, assignment) => sum + assignment.size,
      0,
    );
    const availableSpots = Math.max(0, timeBlock.maxMembers - currentOccupancy);

    if (selectedItem.type === "entry") {
      const entry = [
        ...unassignedEntries,
        ...timeBlocks.flatMap((b) => b.assignments),
      ].find((e) => e.id === selectedItem.entryId);
      return entry ? availableSpots >= entry.size : false;
    }

    return availableSpots >= 1; // Members take 1 spot
  };

  const handleSaveChanges = async () => {
    if (pendingChanges.length === 0) {
      toast.success("No changes to save");
      return;
    }

    setIsSavingChanges(true);
    try {
      const result = await batchUpdateLotteryAssignments(
        pendingChanges.filter((c) => c.type === "assignment"),
      );

      if (result.success) {
        toast.success(`Saved ${pendingChanges.length} changes`);
        // Data will refresh via prop changes from server
      } else {
        toast.error(result.error || "Failed to save changes");
      }
    } catch (error) {
      toast.error("An error occurred while saving changes");
    } finally {
      setIsSavingChanges(false);
    }
  };

  const handleResetChanges = () => {
    if (pendingChanges.length === 0) return;

    setConfirmDialog({
      open: true,
      title: "Reset Changes",
      description:
        "Are you sure you want to reset all unsaved changes? This action cannot be undone.",
      variant: "destructive",
      onConfirm: () => {
        transformInitialData(); // Reset to original state
        toast.success("Changes reset");
        setConfirmDialog((prev) => ({ ...prev, open: false }));
      },
    });
  };

  const handleCancelEntry = async (entryId: number, isGroup: boolean) => {
    setConfirmDialog({
      open: true,
      title: "Cancel Entry",
      description: `Are you sure you want to cancel this ${isGroup ? "group" : "individual"} entry? This action cannot be undone.`,
      variant: "destructive",
      onConfirm: async () => {
        setConfirmDialog((prev) => ({ ...prev, open: false }));
        try {
          const result = await cancelLotteryEntry(entryId, isGroup);
          if (result.success) {
            toast.success("Entry cancelled successfully");
            // Data will refresh via prop changes from server
          } else {
            toast.error(result.error || "Failed to cancel entry");
          }
        } catch (error) {
          toast.error("An error occurred while cancelling the entry");
        }
      },
    });
  };

  const handleFinalizeLottery = async () => {
    // Save changes first if there are any
    if (pendingChanges.length > 0) {
      setConfirmDialog({
        open: true,
        title: "Save and Finalize Lottery",
        description: `You have ${pendingChanges.length} unsaved changes. Save and finalize? This will create actual teesheet bookings and cannot be undone.`,
        variant: "destructive",
        onConfirm: async () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          await handleSaveChanges();
          if (pendingChanges.length > 0) {
            toast.error("Please save changes first before finalizing");
            return;
          }
          proceedWithFinalization();
        },
      });
    } else {
      setConfirmDialog({
        open: true,
        title: "Finalize Lottery Results",
        description:
          "Are you sure you want to finalize these lottery results? This will create actual teesheet bookings and cannot be undone.",
        variant: "destructive",
        onConfirm: () => {
          setConfirmDialog((prev) => ({ ...prev, open: false }));
          proceedWithFinalization();
        },
      });
    }
  };

  const proceedWithFinalization = async () => {
    setIsFinalizingResults(true);

    try {
      const result = await finalizeLotteryResults(date);
      if (result.success) {
        toast.success(
          `Lottery results finalized! ${result.data.finalizedCount} bookings created on the teesheet.`,
        );
        onComplete();
      } else {
        toast.error(result.error || "Failed to finalize lottery results");
      }
    } catch (error) {
      toast.error("An error occurred while finalizing the lottery");
    } finally {
      setIsFinalizingResults(false);
    }
  };

  const getTimeWindowLabel = (window: string) => {
    const timeWindow = TIME_WINDOWS.find((tw) => tw.value === window);
    return timeWindow ? timeWindow.label : window;
  };

  const totalUnassigned = unassignedEntries.length;
  const assignedIndividual = entries.individual.filter(
    (e) => e.status === "ASSIGNED",
  );
  const assignedGroups = entries.groups.filter((g) => g.status === "ASSIGNED");
  const totalAssigned = assignedIndividual.length + assignedGroups.length;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium">
            Lottery Results & Teesheet Preview
          </h3>
          <p className="text-sm text-gray-600">
            Click entries to select, then click time slots to move them. Click
            individual entries on groups to join them.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <LotteryAssignmentStats
            totalAssigned={totalAssigned}
            totalUnassigned={totalUnassigned}
          />
          {pendingChanges.length > 0 && (
            <Badge variant="secondary" className="text-sm">
              {pendingChanges.length} unsaved changes
            </Badge>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      {pendingChanges.length > 0 && (
        <div className="flex gap-2">
          <Button
            onClick={handleSaveChanges}
            disabled={isSavingChanges}
            variant="outline"
          >
            {isSavingChanges ? (
              <>
                <LoadingSpinner className="mr-2 h-4 w-4" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Changes ({pendingChanges.length})
              </>
            )}
          </Button>
          <Button onClick={handleResetChanges} variant="ghost">
            <Undo className="mr-2 h-4 w-4" />
            Reset
          </Button>
        </div>
      )}

      <Tabs
        value={activeTab}
        onValueChange={setActiveTab}
        className="space-y-4"
      >
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="preview">
            <Calendar className="mr-2 h-4 w-4" />
            Teesheet Preview & Assignment
          </TabsTrigger>
          <TabsTrigger value="entries">
            <Users className="mr-2 h-4 w-4" />
            All Entries
          </TabsTrigger>
        </TabsList>

        {/* Teesheet Preview & Assignment Tab */}
        <TabsContent value="preview">
          <div className="grid grid-cols-12 gap-6">
            {/* Unassigned Sidebar */}
            <div className="col-span-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-orange-600" />
                    Unassigned ({totalUnassigned})
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  {unassignedEntries.map((entry) => (
                    <div key={entry.id}>
                      {entry.isGroup ? (
                        <GroupCard
                          entry={entry}
                          isSelected={selectedItem?.entryId === entry.id}
                          isHighlighted={
                            selectedItem?.type === "entry" &&
                            !selectedItem.isGroup &&
                            selectedItem.entryId !== entry.id
                          }
                          onGroupClick={() =>
                            selectedItem?.type === "entry" &&
                            !selectedItem.isGroup
                              ? handleGroupClick(entry.id)
                              : handleEntryClick(entry.id)
                          }
                        />
                      ) : (
                        <IndividualCard
                          entry={entry}
                          isSelected={selectedItem?.entryId === entry.id}
                          isHighlighted={false}
                          onClick={() => handleEntryClick(entry.id)}
                        />
                      )}
                    </div>
                  ))}
                  {unassignedEntries.length === 0 && (
                    <div className="py-8 text-center text-sm text-gray-500">
                      All entries have been assigned
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Teesheet Preview */}
            <div className="col-span-9">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5" />
                      Teesheet for {formatDate(date)}
                    </CardTitle>
                    <Button
                      onClick={handleFinalizeLottery}
                      disabled={isFinalizingResults || isSavingChanges}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isFinalizingResults ? (
                        <>
                          <LoadingSpinner className="mr-2 h-4 w-4" />
                          Finalizing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="mr-2 h-4 w-4" />
                          Finalize Lottery Results
                        </>
                      )}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-1">
                    {timeBlocks.map((block) => (
                      <TimeBlockCard
                        key={block.id}
                        block={block}
                        isHighlighted={!!selectedItem}
                        canAcceptSelection={canTimeBlockAcceptSelection(block)}
                        selectedItem={selectedItem}
                        onTimeBlockClick={() => handleTimeBlockClick(block.id)}
                        onEntryClick={handleEntryClick}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        {/* All Entries Tab */}
        <TabsContent value="entries">
          <LotteryAllEntries
            entries={entries}
            onCancelEntry={handleCancelEntry}
            getTimeWindowLabel={getTimeWindowLabel}
            members={members}
          />
        </TabsContent>
      </Tabs>

      <ConfirmationDialog
        open={confirmDialog.open}
        onOpenChange={(open) => setConfirmDialog((prev) => ({ ...prev, open }))}
        onConfirm={confirmDialog.onConfirm}
        title={confirmDialog.title}
        description={confirmDialog.description}
        variant={confirmDialog.variant}
      />
    </div>
  );
}
