"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { UserIcon, Users, Ban, AlertCircle, CheckCircle } from "lucide-react";
import { formatDisplayTime } from "~/lib/utils";
import { TimeBlockMemberView } from "~/app/types/TeeSheetTypes";
import { Member } from "~/app/types/MemberTypes";

// Define ClientTimeBlock for client-side usage to avoid type conflicts
type ClientTimeBlock = {
  id: number;
  startTime: string;
  endTime: string;
  members: TimeBlockMemberView[];
  [key: string]: any;
};

export interface TimeBlockItemProps {
  timeBlock: ClientTimeBlock;
  isBooked: boolean;
  isAvailable: boolean;
  isPast?: boolean;
  onBook: () => void;
  onCancel: () => void;
  disabled?: boolean;
  member?: Member;
  id?: string;
  isRestricted?: boolean;
  restrictionReason?: string;
}

export function TimeBlockItem({
  timeBlock,
  isBooked,
  isAvailable,
  isPast = false,
  onBook,
  onCancel,
  disabled = false,
  member,
  id,
  isRestricted = false,
  restrictionReason = "",
}: TimeBlockItemProps) {
  // Format the start time for display using our proper date utility function
  const startTimeDisplay = formatDisplayTime(timeBlock.startTime).toUpperCase();

  // Determine if the button should be disabled (either by prop, past, or restricted)
  const isButtonDisabled = disabled || isPast || isRestricted;

  // Check if current member is checked in
  const isMemberCheckedIn =
    isBooked &&
    member &&
    timeBlock.members.some((m) => m.id === member.id && m.checkedIn);

  // Check if all members are checked in
  const allMembersCheckedIn =
    timeBlock.members.length > 0 && timeBlock.members.every((m) => m.checkedIn);

  // Get the appropriate CSS class for the timeblock container
  let timeBlockClass = isRestricted
    ? "rounded-md border border-red-300 bg-red-50 p-4 shadow-sm"
    : `rounded-md border p-4 shadow-sm hover:bg-gray-50 ${isPast ? "bg-gray-100 border-gray-200" : "border-gray-200"}`;

  // Add a green border if all members are checked in
  if (allMembersCheckedIn) {
    timeBlockClass = `rounded-md border border-green-400 p-4 shadow-sm hover:bg-green-50 bg-green-50`;
  }

  return (
    <div id={id} className={timeBlockClass}>
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">{startTimeDisplay}</span>
          <div className="mt-1 flex flex-wrap items-center gap-1">
            <span className="text-sm text-gray-600">
              {timeBlock.members.length} / 4 Players
            </span>
            {isBooked && (
              <Badge className="ml-2 bg-green-500 hover:bg-green-600">
                Booked
              </Badge>
            )}
            {isMemberCheckedIn && (
              <Badge className="ml-2 bg-emerald-500 hover:bg-emerald-600">
                <CheckCircle className="mr-1 h-3 w-3" /> Checked In
              </Badge>
            )}
            {isPast && <Badge className="ml-2 bg-gray-500">Past</Badge>}
            {isRestricted && (
              <Badge className="ml-2 bg-red-500 hover:bg-red-600">
                Restricted
              </Badge>
            )}
            {allMembersCheckedIn && (
              <Badge className="ml-2 bg-emerald-500 hover:bg-emerald-600">
                All Checked In
              </Badge>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div>
          {isBooked ? (
            <Button
              variant="destructive"
              size="sm"
              onClick={onCancel}
              disabled={isButtonDisabled}
            >
              Cancel
            </Button>
          ) : isRestricted ? (
            <Button
              variant="outline"
              size="sm"
              disabled
              className="border-red-300 bg-red-50 text-red-500"
            >
              <Ban className="mr-1 h-4 w-4" />
              Unavailable
            </Button>
          ) : isAvailable ? (
            <Button
              variant="default"
              size="sm"
              onClick={onBook}
              className="bg-[var(--org-primary)]"
              disabled={isButtonDisabled}
            >
              {isPast ? "Past" : "Book"}
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Full
            </Button>
          )}
        </div>
      </div>

      {/* Restriction reason */}
      {isRestricted && restrictionReason && (
        <div className="mb-2 flex items-center rounded-md bg-red-100 p-2 text-sm text-red-700">
          <AlertCircle className="mr-2 h-4 w-4" />
          {restrictionReason}
        </div>
      )}

      {/* Player list - now more prominent */}
      {timeBlock.members.length > 0 && (
        <div
          className={`mt-2 rounded p-2 ${allMembersCheckedIn ? "bg-green-50" : "bg-gray-50"}`}
        >
          <div className="mb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Players:</span>
          </div>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
            {timeBlock.members.map((member, idx) => (
              <li
                key={idx}
                className={`flex items-center text-sm ${
                  member.checkedIn ? "text-green-600" : "text-gray-700"
                }`}
              >
                {member.checkedIn ? (
                  <CheckCircle className="mr-1 h-3 w-3 text-green-600" />
                ) : (
                  <UserIcon className="mr-1 h-3 w-3 text-gray-400" />
                )}
                <span
                  className={`font-medium ${member.checkedIn ? "text-green-600" : ""}`}
                >
                  {member.firstName} {member.lastName}
                  {member.checkedIn && <span className="ml-1 text-xs">✓</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
