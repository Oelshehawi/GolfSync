"use client";

import { format } from "date-fns";
import Link from "next/link";
import { useState } from "react";
import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";
import { Button } from "~/components/ui/button";
import { X, UserCheck, UserX, Users, Edit, Check } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  removeTimeBlockMember,
  removeTimeBlockGuest,
  checkInMember,
  checkInGuest,
  checkInAllTimeBlockParticipants,
  updateTimeBlockNotes,
} from "~/server/teesheet/actions";
import { Textarea } from "~/components/ui/textarea";
import { ThemeConfig } from "~/app/types/UITypes";

interface TimeBlockProps {
  timeBlock: TimeBlockWithMembers;
  theme?: ThemeConfig;
}

export function TimeBlock({ timeBlock, theme }: TimeBlockProps) {
  const formattedTime = format(new Date(timeBlock.startTime), "h:mm a");
  const totalPeople = timeBlock.members.length + timeBlock.guests.length;
  const [notes, setNotes] = useState(timeBlock.notes || "");
  const [isEditingNotes, setIsEditingNotes] = useState(false);
  const [isSavingNotes, setIsSavingNotes] = useState(false);

  const handleRemoveMember = async (memberId: number) => {
    try {
      const result = await removeTimeBlockMember(timeBlock.id, memberId);
      if (result.success) {
        toast.success("Member removed successfully");
      } else {
        toast.error(result.error || "Failed to remove member");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleRemoveGuest = async (guestId: number) => {
    try {
      const result = await removeTimeBlockGuest(timeBlock.id, guestId);
      if (result.success) {
        toast.success("Guest removed successfully");
      } else {
        toast.error(result.error || "Failed to remove guest");
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
      const result = await checkInMember(timeBlock.id, memberId, !isCheckedIn);
      if (result.success) {
        toast.success(
          `Member ${!isCheckedIn ? "checked in" : "check-in removed"} successfully`,
        );
      } else {
        toast.error(result.error || "Failed to update check-in status");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleCheckInGuest = async (guestId: number, isCheckedIn: boolean) => {
    try {
      const result = await checkInGuest(timeBlock.id, guestId, !isCheckedIn);
      if (result.success) {
        toast.success(
          `Guest ${!isCheckedIn ? "checked in" : "check-in removed"} successfully`,
        );
      } else {
        toast.error(result.error || "Failed to update check-in status");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleCheckInAll = async () => {
    try {
      const result = await checkInAllTimeBlockParticipants(timeBlock.id, true);
      if (result.success) {
        toast.success("All participants checked in successfully");
      } else {
        toast.error(result.error || "Failed to check in all participants");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    }
  };

  const handleSaveNotes = async () => {
    setIsSavingNotes(true);
    try {
      const result = await updateTimeBlockNotes(timeBlock.id, notes || null);
      if (result.success) {
        toast.success("Notes updated successfully");
        setIsEditingNotes(false);
      } else {
        toast.error(result.error || "Failed to update notes");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsSavingNotes(false);
    }
  };

  return (
    <div className="rounded-lg border p-3 hover:border-blue-500 hover:bg-blue-50 hover:shadow-md">
      <div className="mb-2 flex items-center justify-between">
        <Link
          href={`/admin/timeblock/${timeBlock.id}`}
          className="text-base font-semibold text-gray-800"
        >
          {formattedTime}
        </Link>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{totalPeople}/4 spots</span>
          {totalPeople > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCheckInAll}
              className="h-7 rounded-md bg-green-50 px-2 text-xs text-green-600 hover:bg-green-100 hover:text-green-700"
            >
              <Users className="mr-1 h-3 w-3" />
              Check In All
            </Button>
          )}
        </div>
      </div>

      {/* Notes Section */}
      <div className="mb-2 rounded-md border border-gray-200 bg-gray-50 p-2">
        {isEditingNotes ? (
          <div className="flex flex-col space-y-2">
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Enter notes for this tee time..."
              className="min-h-[60px] text-xs"
              disabled={isSavingNotes}
            />
            <div className="flex justify-end space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setIsEditingNotes(false);
                  setNotes(timeBlock.notes || "");
                }}
                className="h-7 text-xs"
                disabled={isSavingNotes}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveNotes}
                className="h-7 text-xs"
                disabled={isSavingNotes}
              >
                <Check className="mr-1 h-3 w-3" />
                Save
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="flex cursor-pointer items-start justify-between"
            onClick={() => setIsEditingNotes(true)}
          >
            <div className="flex-1 text-xs text-gray-600">
              {timeBlock.notes ? (
                timeBlock.notes
              ) : (
                <span className="text-gray-400 italic">
                  No notes. Click to add...
                </span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setIsEditingNotes(true);
              }}
              className="ml-1 h-5 w-5 p-0 text-gray-500 hover:bg-blue-100 hover:text-blue-600"
            >
              <Edit className="h-3 w-3" />
            </Button>
          </div>
        )}
      </div>

      {totalPeople > 0 ? (
        <div className="space-y-1">
          {timeBlock.members.length > 0 && (
            <div className="grid grid-cols-1 gap-1">
              {timeBlock.members.map((member) => (
                <div
                  key={member.id}
                  className={`flex items-center justify-between rounded px-2 py-1 ${
                    member.checkedIn
                      ? "bg-green-100 text-green-800"
                      : "bg-blue-50"
                  }`}
                >
                  <div className="truncate text-xs text-gray-700">
                    {member.firstName} {member.lastName} ({member.memberNumber})
                    {member.checkedIn && (
                      <span className="ml-1 text-xs text-green-600">✓</span>
                    )}
                  </div>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCheckInMember(member.id, !!member.checkedIn);
                      }}
                      className={`ml-1 h-5 w-5 p-0 ${
                        member.checkedIn
                          ? "text-green-600 hover:bg-red-100 hover:text-red-600"
                          : "text-gray-500 hover:bg-green-100 hover:text-green-600"
                      }`}
                    >
                      {member.checkedIn ? (
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
                        handleRemoveMember(member.id);
                      }}
                      className="ml-1 h-5 w-5 p-0 text-gray-500 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {timeBlock.guests.length > 0 && (
            <div className="grid grid-cols-1 gap-1">
              {timeBlock.guests.map((guest) => (
                <div
                  key={guest.id}
                  className={`flex items-center justify-between rounded px-2 py-1 ${
                    guest.checkedIn
                      ? "bg-green-100 text-green-800"
                      : "bg-green-50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs text-gray-700">
                      {guest.firstName} {guest.lastName}
                      {guest.checkedIn && (
                        <span className="ml-1 text-xs text-green-600">✓</span>
                      )}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      Invited: {guest.invitedByMember?.firstName?.charAt(0)}.{" "}
                      {guest.invitedByMember?.lastName}
                    </div>
                  </div>
                  <div className="flex">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.preventDefault();
                        handleCheckInGuest(guest.id, !!guest.checkedIn);
                      }}
                      className={`ml-1 h-5 w-5 p-0 ${
                        guest.checkedIn
                          ? "text-green-600 hover:bg-red-100 hover:text-red-600"
                          : "text-gray-500 hover:bg-green-100 hover:text-green-600"
                      }`}
                    >
                      {guest.checkedIn ? (
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
                        handleRemoveGuest(guest.id);
                      }}
                      className="ml-1 h-5 w-5 p-0 text-gray-500 hover:bg-red-100 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-400">Available</div>
      )}
    </div>
  );
}
