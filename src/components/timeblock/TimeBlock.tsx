"use client";

import { useState, useEffect } from "react";
import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";
import { Button } from "~/components/ui/button";
import { X, UserCheck, UserX, UserPlus } from "lucide-react";
import { toast } from "react-hot-toast";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";
import { formatDisplayTime, getMemberClassStyling } from "~/lib/utils";
import { Badge } from "~/components/ui/badge";
import { cn } from "~/lib/utils";
import type { PaceOfPlayRecord } from "~/server/pace-of-play/data";
import type { PaceOfPlayStatus as PaceOfPlayStatusType } from "~/app/types/PaceOfPlayTypes";
import { QuickCartAssignment } from "./QuickCartAssignment";
import { quickAssignPowerCart } from "~/server/charges/actions";
import { type PowerCartAssignmentData } from "~/app/types/ChargeTypes";

interface TimeBlockProps {
  timeBlock: TimeBlockWithMembers;
  onRestrictionViolation?: (violations: RestrictionViolation[]) => void;
  setPendingAction?: (action: (() => Promise<void>) | null) => void;
  paceOfPlay?: PaceOfPlayRecord | null;
  showMemberClass?: boolean;
  onRemoveMember?: (memberId: number) => Promise<void>;
  onRemoveGuest?: (guestId: number) => Promise<void>;
  onRemoveFill?: (fillId: number) => Promise<void>;
  onCheckInMember?: (memberId: number, isCheckedIn: boolean) => Promise<void>;
  onCheckInGuest?: (guestId: number, isCheckedIn: boolean) => Promise<void>;
  onCheckInAll?: () => Promise<void>;
  onSaveNotes?: (notes: string) => Promise<boolean>;
}

export function TimeBlock({
  timeBlock,
  paceOfPlay = null,
  showMemberClass = false,
  onRemoveMember,
  onRemoveGuest,
  onRemoveFill,
  onCheckInMember,
  onCheckInGuest,
  onCheckInAll,
  onSaveNotes,
}: TimeBlockProps) {
  const formattedTime = formatDisplayTime(timeBlock.startTime);
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [editedNotes, setEditedNotes] = useState(timeBlock.notes || "");

  // Calculate members, guests, and fills
  const members = timeBlock.members || [];
  const guests = timeBlock.guests || [];
  const fills = timeBlock.fills || [];
  const totalPeople = members.length + guests.length + fills.length;

  // Check if any members or guests are present
  const hasParticipants = members.length > 0 || guests.length > 0;

  // Check if all participants are checked in
  const allCheckedIn =
    hasParticipants &&
    members.every((m) => m.checkedIn) &&
    guests.every((g) => g.checkedIn);

  // Disable check-in buttons if no participants
  const checkInDisabled = !hasParticipants || allCheckedIn;

  // Reset notes if they change externally while not editing
  useEffect(() => {
    if (!isEditingNotes && timeBlock.notes !== editedNotes) {
      setEditedNotes(timeBlock.notes || "");
    }
  }, [timeBlock.notes, editedNotes, isEditingNotes]);

  // Map members, guests, and fills with their index as key for stable ordering
  const membersSorted = members
    .sort((a, b) => a.id - b.id)
    .map((member) => ({
      ...member,
      key: `member-${member.id}`,
    }));

  const guestsSorted = guests
    .sort((a, b) => a.id - b.id)
    .map((guest) => ({
      ...guest,
      key: `guest-${guest.id}`,
    }));

  const fillsSorted = fills
    .sort((a, b) => a.id - b.id)
    .map((fill) => ({
      ...fill,
      key: `fill-${fill.id}`,
    }));

  const handleRemoveMember = async (memberId: number) => {
    try {
      if (onRemoveMember) {
        await onRemoveMember(memberId);
      } else {
        toast.error("Remove member function not provided");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleRemoveGuest = async (guestId: number) => {
    try {
      if (onRemoveGuest) {
        await onRemoveGuest(guestId);
      } else {
        toast.error("Remove guest function not provided");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleCheckInMember = async (
    memberId: number,
    isCheckedIn: boolean,
  ) => {
    try {
      if (onCheckInMember) {
        await onCheckInMember(memberId, isCheckedIn);
      } else {
        toast.error("Check-in member function not provided");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleCheckInGuest = async (guestId: number, isCheckedIn: boolean) => {
    try {
      if (onCheckInGuest) {
        await onCheckInGuest(guestId, isCheckedIn);
      } else {
        toast.error("Check-in guest function not provided");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  // Get pace of play status class
  const getPaceOfPlayStatusClass = (status: string | null) => {
    if (!status) return "";

    switch (status.toLowerCase()) {
      case "on time":
        return "bg-green-100 text-green-800 border-green-300";
      case "behind":
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
      case "late":
        return "bg-red-100 text-red-800 border-red-300";
      case "completed_late":
      case "completed late":
        return "bg-red-100 text-red-800 border-red-300";
      case "completed_on_time":
      case "completed on time":
        return "bg-green-100 text-green-800 border-green-300";
      case "ahead":
        return "bg-blue-100 text-blue-800 border-blue-300";
      default:
        return "";
    }
  };

  // Format status for display
  const formatStatusForDisplay = (status: string | null): string => {
    if (!status) return "Not Started";

    // Convert snake_case to Title Case
    return status
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  const handleRemoveFill = async (fillId: number) => {
    try {
      if (onRemoveFill) {
        await onRemoveFill(fillId);
      } else {
        toast.error("Remove fill function not provided");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleCartAssign = async (data: PowerCartAssignmentData) => {
    try {
      await quickAssignPowerCart(data);
    } catch (error) {
      console.error("Failed to assign cart:", error);
    }
  };

  // Get all members except the one being assigned a cart
  const getOtherMembers = (currentMemberId: number) => {
    return timeBlock.members
      .filter((m) => m.id !== currentMemberId)
      .map((m) => ({
        id: m.id,
        firstName: m.firstName,
        lastName: m.lastName,
      }));
  };

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-3 py-3">
        <div className="flex flex-col">
          {timeBlock.displayName && (
            <span className="text-sm font-medium text-gray-600">
              {timeBlock.displayName}
            </span>
          )}
          <span className="font-semibold">{formattedTime}</span>
        </div>
      </td>

      {/* Status Column */}
      <td className="px-3 py-3">
        {paceOfPlay ? (
          <Badge
            variant="outline"
            className={cn(
              "px-2 py-1 text-xs font-medium",
              getPaceOfPlayStatusClass(paceOfPlay.status),
            )}
          >
            {formatStatusForDisplay(paceOfPlay.status) || "N/A"}
          </Badge>
        ) : (
          <Badge
            variant="outline"
            className="bg-gray-100 px-2 py-1 text-xs font-medium text-gray-800"
          >
            Not Started
          </Badge>
        )}
      </td>

      {/* Players Column */}
      <td className="px-3 py-3">
        {totalPeople > 0 ? (
          <div className="grid grid-cols-2 gap-2">
            {membersSorted.map((member) => {
              const memberStyle = getMemberClassStyling(member.class);
              const { key, ...memberData } = member;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2 rounded-md p-1",
                    memberData.checkedIn ? "bg-green-200" : memberStyle.bg,
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "truncate text-sm font-medium",
                        memberData.checkedIn
                          ? "text-green-800"
                          : memberStyle.text,
                      )}
                    >
                      {memberData.firstName} {memberData.lastName} (
                      {memberData.memberNumber})
                      {memberData.checkedIn && (
                        <span className="ml-1 text-xs text-green-700">✓</span>
                      )}
                      {showMemberClass && memberData.class && (
                        <Badge
                          variant={memberStyle.badgeVariant as any}
                          className="ml-1 text-xs"
                        >
                          {memberData.class}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center space-x-1">
                    <QuickCartAssignment
                      memberId={memberData.id}
                      onAssign={handleCartAssign}
                      otherMembers={getOtherMembers(memberData.id)}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCheckInMember(
                          memberData.id,
                          !!memberData.checkedIn,
                        );
                      }}
                      className={`ml-1 h-5 w-5 p-0 ${
                        memberData.checkedIn
                          ? "text-green-700 hover:bg-red-100 hover:text-red-600"
                          : "text-gray-500 hover:bg-green-100 hover:text-green-600"
                      }`}
                    >
                      {memberData.checkedIn ? (
                        <UserX className="h-3 w-3" />
                      ) : (
                        <UserCheck className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveMember(memberData.id);
                      }}
                      className="ml-1 h-5 w-5 p-0 text-gray-500 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {guestsSorted.map((guest) => {
              const guestStyle = getMemberClassStyling("GUEST");
              const { key, ...guestData } = guest;

              return (
                <div
                  key={key}
                  className={cn(
                    "flex items-center gap-2 rounded-md p-1",
                    guestData.checkedIn ? "bg-green-200" : guestStyle.bg,
                    guestStyle.border,
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className={cn(
                        "truncate text-sm font-medium",
                        guestData.checkedIn
                          ? "text-green-800"
                          : guestStyle.text,
                      )}
                    >
                      {guestData.firstName} {guestData.lastName}
                      <Badge variant="outline" className="ml-1 text-xs">
                        Guest
                      </Badge>
                      {guestData.checkedIn && (
                        <span className="ml-1 text-xs text-green-700">✓</span>
                      )}
                    </div>
                    <p className="truncate text-xs text-gray-500">
                      Invited: {guestData.invitedByMember?.firstName?.charAt(0)}
                      . {guestData.invitedByMember?.lastName}
                    </p>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCheckInGuest(guestData.id, !!guestData.checkedIn);
                      }}
                      className={`ml-1 h-5 w-5 p-0 ${
                        guestData.checkedIn
                          ? "text-green-700 hover:bg-red-100 hover:text-red-600"
                          : "text-gray-500 hover:bg-green-100 hover:text-green-600"
                      }`}
                    >
                      {guestData.checkedIn ? (
                        <UserX className="h-3 w-3" />
                      ) : (
                        <UserCheck className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleRemoveGuest(guestData.id);
                      }}
                      className="ml-1 h-5 w-5 p-0 text-gray-500 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              );
            })}

            {fillsSorted.map((fill) => {
              const fillStyle = {
                bg: "bg-gray-50",
                border: "border-gray-200",
                text: "text-gray-700",
              };
              return (
                <div
                  key={fill.key}
                  className={`flex items-center justify-between rounded px-2 py-1 ${fillStyle.bg} ${fillStyle.border}`}
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-xs ${fillStyle.text}`}>
                      {fill.fillType === "custom_fill"
                        ? fill.customName || "Custom"
                        : fill.fillType === "guest_fill"
                          ? "Guest"
                          : "Reciprocal"}
                      <Badge variant="secondary" className="ml-1 text-xs">
                        Fill
                      </Badge>
                    </div>
                  </div>
                  {onRemoveFill && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleRemoveFill(fill.id);
                      }}
                      className="ml-1 h-5 w-5 p-0 text-gray-500 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              );
            })}

            {/* Add Player button when slots are available */}
            {totalPeople < 4 && (
              <div
                className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-blue-300 p-1 hover:bg-blue-50"
                onClick={(e) => {
                  e.stopPropagation();
                  window.dispatchEvent(
                    new CustomEvent("open-add-player-modal", {
                      detail: { timeBlockId: timeBlock.id },
                    }),
                  );
                }}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-blue-600">
                    <UserPlus className="mr-1 inline-block h-3 w-3" />
                    Add Player
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div
            className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-blue-300 p-2 hover:bg-blue-50"
            onClick={(e) => {
              e.stopPropagation();
              window.dispatchEvent(
                new CustomEvent("open-add-player-modal", {
                  detail: { timeBlockId: timeBlock.id },
                }),
              );
            }}
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-blue-600">
                <UserPlus className="mr-1 inline-block h-3 w-3" />
                Add Player
              </p>
            </div>
          </div>
        )}
      </td>

      {/* Actions Column */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onCheckInAll && onCheckInAll()}
            disabled={checkInDisabled}
            title={
              !hasParticipants
                ? "No participants to check in"
                : allCheckedIn
                  ? "All participants already checked in"
                  : ""
            }
            className="h-8 px-2 py-1"
          >
            <UserCheck className="mr-1 h-4 w-4" />
            Check In All
          </Button>
        </div>
      </td>
    </tr>
  );
}
