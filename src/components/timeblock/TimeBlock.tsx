"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";
import { Button } from "~/components/ui/button";
import { X } from "lucide-react";
import { toast } from "react-hot-toast";
import {
  removeTimeBlockMember,
  removeTimeBlockGuest,
} from "~/server/teesheet/actions";

interface TimeBlockProps {
  timeBlock: TimeBlockWithMembers;
}

export function TimeBlock({ timeBlock }: TimeBlockProps) {
  const formattedTime = format(new Date(timeBlock.startTime), "h:mm a");
  const totalPeople = timeBlock.members.length + timeBlock.guests.length;

  const handleRemoveMember = async (memberId: number) => {
    try {
      const result = await removeTimeBlockMember(timeBlock.id, memberId);
      if (result.success) {
        toast.success("Member removed successfully");
        // Refresh the page
        window.location.reload();
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
        // Refresh the page
        window.location.reload();
      } else {
        toast.error(result.error || "Failed to remove guest");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
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
        <span className="text-xs text-gray-500">{totalPeople}/4 spots</span>
      </div>

      {totalPeople > 0 ? (
        <div className="space-y-1">
          {timeBlock.members.length > 0 && (
            <div className="grid grid-cols-1 gap-1">
              {timeBlock.members.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded bg-blue-50 px-2 py-1"
                >
                  <div className="truncate text-xs text-gray-700">
                    {member.firstName} {member.lastName} ({member.memberNumber})
                  </div>
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
              ))}
            </div>
          )}

          {timeBlock.guests.length > 0 && (
            <div className="grid grid-cols-1 gap-1">
              {timeBlock.guests.map((guest) => (
                <div
                  key={guest.id}
                  className="flex items-center justify-between rounded bg-green-50 px-2 py-1"
                >
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-xs text-gray-700">
                      {guest.firstName} {guest.lastName}
                    </div>
                    <div className="truncate text-xs text-gray-500">
                      Invited: {guest.invitedByMember?.firstName?.charAt(0)}.{" "}
                      {guest.invitedByMember?.lastName}
                    </div>
                  </div>
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
