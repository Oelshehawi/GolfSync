"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { UserIcon, Users } from "lucide-react";
import { formatDisplayTime } from "~/lib/utils";

type TimeBlock = {
  id: number;
  startTime: string | Date;
  endTime: string | Date;
  members: Array<{
    id: number;
    firstName: string;
    lastName: string;
  }>;
  [key: string]: any;
};

// Format time safely - using a format that's consistent across client/server
export const formatTimeString = (
  timeString: string | Date | undefined | null,
): string => {
  if (!timeString) return "";

  try {
    const date =
      typeof timeString === "string" ? new Date(timeString) : timeString;

    // Return in 24-hour format with leading zeros for hours
    // This ensures consistent formatting between server and client
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  } catch (e) {
    return String(timeString);
  }
};

export interface TimeBlockItemProps {
  timeBlock: {
    id: number;
    startTime: Date;
    endTime: Date;
    members: Array<{
      id: number;
      firstName: string;
      lastName: string;
    }>;
  };
  isBooked: boolean;
  isAvailable: boolean;
  isPast?: boolean;
  onBook: () => void;
  onCancel: () => void;
  disabled?: boolean;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
  id?: string;
}

export function TimeBlockItem({
  timeBlock,
  isBooked,
  isAvailable,
  isPast = false,
  onBook,
  onCancel,
  disabled = false,
  theme,
  id,
}: TimeBlockItemProps) {
  // Format the start time for display using our utility function
  const startTimeDisplay = formatDisplayTime(timeBlock.startTime).toUpperCase();

  // Custom theme styles
  const themeStyles = theme
    ? ({
        "--org-primary": theme.primary || "#10b981",
      } as React.CSSProperties)
    : undefined;

  // Determine if the button should be disabled (either by prop or if in the past)
  const isButtonDisabled = disabled || isPast;

  return (
    <div
      id={id}
      className={`rounded-md border border-gray-200 p-4 shadow-sm hover:bg-gray-50 ${isPast ? "bg-gray-100" : ""}`}
    >
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-col">
          <span className="text-lg font-semibold">{startTimeDisplay}</span>
          <div className="mt-1 flex items-center gap-1">
            <span className="text-sm text-gray-600">
              {timeBlock.members.length} / 4 Players
            </span>
            {isBooked && (
              <Badge className="ml-2 bg-green-500 hover:bg-green-600">
                Booked
              </Badge>
            )}
            {isPast && <Badge className="ml-2 bg-gray-500">Past</Badge>}
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
          ) : isAvailable ? (
            <Button
              variant="default"
              size="sm"
              onClick={onBook}
              style={themeStyles}
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

      {/* Player list - now more prominent */}
      {timeBlock.members.length > 0 && (
        <div className="mt-2 rounded bg-gray-50 p-2">
          <div className="mb-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Players:</span>
          </div>
          <ul className="grid grid-cols-1 gap-x-4 gap-y-1 md:grid-cols-2">
            {timeBlock.members.map((member, idx) => (
              <li key={idx} className="flex items-center text-sm text-gray-700">
                <UserIcon className="mr-1 h-3 w-3 text-gray-400" />
                <span className="font-medium">
                  {member.firstName} {member.lastName}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
