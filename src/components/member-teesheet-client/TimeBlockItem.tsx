"use client";

import React from "react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  UserIcon,
  Users,
  Ban,
  AlertCircle,
  CheckCircle,
  Info,
  ClockIcon,
} from "lucide-react";
import { formatTime12Hour } from "~/lib/dates";
import { TimeBlockMemberView, TimeBlockFill } from "~/app/types/TeeSheetTypes";
import { Member } from "~/app/types/MemberTypes";

// Define ClientTimeBlock for client-side usage to avoid type conflicts
type ClientTimeBlock = {
  id: number;
  startTime: string;
  endTime: string;
  members: TimeBlockMemberView[];
  fills: TimeBlockFill[];
  maxMembers: number;
  [key: string]: any;
};

export interface TimeBlockItemProps {
  timeBlock: ClientTimeBlock;
  isBooked: boolean;
  isAvailable: boolean;
  isPast?: boolean;
  onBook: () => void;
  onCancel: () => void;
  onShowDetails?: () => void;
  disabled?: boolean;
  member?: Member;
  id?: string;
  isRestricted?: boolean;
}

export function TimeBlockItem({
  timeBlock,
  isBooked,
  isAvailable,
  isPast = false,
  onBook,
  onCancel,
  onShowDetails,
  disabled = false,
  member,
  id,
  isRestricted = false,
}: TimeBlockItemProps) {
  // Format the start time for display using our proper date utility function
  const startTimeDisplay = formatTime12Hour(timeBlock.startTime);

  // Calculate total people including fills
  const totalPeople = timeBlock.members.length + (timeBlock.fills?.length || 0);
  const maxPlayers = timeBlock.maxMembers || 4;

  // Check for different types of restrictions
  const hasAvailabilityViolation = timeBlock.restriction?.violations?.some(
    (v: any) => v.type === "AVAILABILITY",
  );
  const hasTimeViolation = timeBlock.restriction?.violations?.some(
    (v: any) => v.type === "TIME",
  );
  const hasFrequencyViolation = timeBlock.restriction?.violations?.some(
    (v: any) => v.type === "FREQUENCY",
  );

  // AVAILABILITY and TIME restrictions completely block booking, FREQUENCY allows booking with warning
  const isAvailabilityRestricted = hasAvailabilityViolation;
  const isTimeRestricted = hasTimeViolation && !hasAvailabilityViolation;
  const isFrequencyRestricted =
    hasFrequencyViolation && !hasTimeViolation && !hasAvailabilityViolation;

  // Get descriptions for all applicable violations
  const getViolationDescriptions = (types: string[]) => {
    if (!timeBlock.restriction?.violations) return [];

    return timeBlock.restriction.violations
      .filter((v: any) => types.includes(v.type))
      .map((v: any) => v.restrictionDescription || v.message)
      .filter((desc: string) => desc && desc.trim() !== "");
  };

  // Determine if the button should be disabled
  const isButtonDisabled =
    disabled || isPast || isAvailabilityRestricted || isTimeRestricted;

  // Check if current member is checked in
  const isMemberCheckedIn =
    isBooked &&
    member &&
    timeBlock.members.some((m) => m.id === member.id && m.checkedIn);

  // Check if all members are checked in
  const allMembersCheckedIn =
    timeBlock.members.length > 0 && timeBlock.members.every((m) => m.checkedIn);

  // Determine cell status and styling
  const getStatusInfo = () => {
    if (isPast)
      return {
        status: "PAST",
        color: "bg-gray-100 border-gray-300",
        textColor: "text-gray-500",
      };
    if (isAvailabilityRestricted)
      return {
        status: "UNAVAILABLE",
        color: "bg-red-50 border-red-300",
        textColor: "text-red-600",
      };
    if (isTimeRestricted)
      return {
        status: "RESTRICTED",
        color: "bg-red-50 border-red-300",
        textColor: "text-red-600",
      };
    if (allMembersCheckedIn)
      return {
        status: "CHECKED IN",
        color: "bg-emerald-50 border-emerald-400",
        textColor: "text-emerald-700",
      };
    if (isBooked)
      return {
        status: "BOOKED",
        color: "bg-blue-50 border-blue-400",
        textColor: "text-blue-700",
      };
    if (!isAvailable)
      return {
        status: "FULL",
        color: "bg-orange-50 border-orange-300",
        textColor: "text-orange-600",
      };
    if (isFrequencyRestricted)
      return {
        status: "AVAILABLE*",
        color: "bg-yellow-50 border-yellow-300",
        textColor: "text-yellow-700",
      };
    return {
      status: "AVAILABLE",
      color: "bg-green-50 border-green-400",
      textColor: "text-green-700",
    };
  };

  const statusInfo = getStatusInfo();

  // Get first few player names for compact display
  const displayPlayers = timeBlock.members.slice(0, 2);
  const hasMorePlayers = totalPeople > 2;

  // Handle click on the entire card (except action button)
  const handleCardClick = () => {
    if (onShowDetails) {
      onShowDetails();
    }
  };

  return (
    <div
      id={id}
      className={`relative rounded-lg border-2 shadow-sm transition-all duration-200 ${statusInfo.color} flex min-h-[120px] cursor-pointer flex-col justify-between hover:shadow-md active:scale-[0.98]`}
      onClick={handleCardClick}
    >
      {/* Content Container - Clickable */}
      <div className="flex h-full flex-col justify-between p-3">
        {/* Header Row - Time and Status */}
        <div className="mb-2 flex items-start justify-between">
          <div className="flex flex-col">
            <span className="text-xl font-bold text-gray-900">
              {startTimeDisplay}
            </span>
            <span className={`text-sm font-semibold ${statusInfo.textColor}`}>
              {statusInfo.status}
            </span>
          </div>

          {/* Player Count Badge */}
          <div
            className={`flex items-center gap-1 rounded-full px-2 py-1 text-sm font-semibold ${totalPeople === maxPlayers ? "bg-orange-100 text-orange-700" : "bg-gray-100 text-gray-700"} `}
          >
            <Users className="h-4 w-4" />
            <span>
              {totalPeople}/{maxPlayers}
            </span>
          </div>
        </div>

        {/* Players Preview - Compact */}
        <div className="min-h-[40px] flex-1">
          {totalPeople > 0 ? (
            <div className="space-y-1">
              {displayPlayers.map((player, idx) => (
                <div
                  key={idx}
                  className="flex items-center text-sm text-gray-700"
                >
                  {player.checkedIn ? (
                    <CheckCircle className="mr-2 h-4 w-4 text-green-500" />
                  ) : (
                    <UserIcon className="mr-2 h-4 w-4 text-gray-400" />
                  )}
                  <span
                    className={`text-base font-medium ${player.checkedIn ? "text-green-600" : "text-gray-800"}`}
                  >
                    {player.firstName} {player.lastName?.[0]}.
                  </span>
                </div>
              ))}
              {hasMorePlayers && (
                <div className="text-org-primary mt-1 flex items-center text-sm">
                  <Info className="mr-1 h-4 w-4" />
                  <span className="font-medium">
                    +{totalPeople - 2} more players
                  </span>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <span className="text-sm font-medium text-gray-400">
                Tap to see details
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Action Button - Non-clickable area */}
      <div
        className="p-3 pt-0"
        onClick={(e) => e.stopPropagation()} // Prevent card click when clicking button
      >
        {isBooked ? (
          <Button
            variant="destructive"
            size="sm"
            onClick={onCancel}
            disabled={isButtonDisabled}
            className="h-9 w-full text-sm font-semibold"
          >
            Cancel
          </Button>
        ) : isAvailabilityRestricted ? (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-9 w-full border-red-300 bg-red-50 text-sm text-red-500"
            >
              <Ban className="mr-1 h-3 w-3" />
              Unavailable
            </Button>
            {getViolationDescriptions(["AVAILABILITY"]).map(
              (desc: string, idx: number) => (
                <p key={idx} className="text-center text-xs text-red-600">
                  {desc}
                </p>
              ),
            )}
          </div>
        ) : isTimeRestricted ? (
          <div className="space-y-2">
            <Button
              variant="outline"
              size="sm"
              disabled
              className="h-9 w-full border-red-300 bg-red-50 text-sm text-red-500"
            >
              <Ban className="mr-1 h-3 w-3" />
              Restricted
            </Button>
            {getViolationDescriptions(["TIME"]).map(
              (desc: string, idx: number) => (
                <p key={idx} className="text-center text-xs text-red-600">
                  {desc}
                </p>
              ),
            )}
          </div>
        ) : isPast ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-9 w-full border-gray-300 bg-gray-50 text-sm text-gray-500"
          >
            Past
          </Button>
        ) : !isAvailable ? (
          <Button
            variant="outline"
            size="sm"
            disabled
            className="h-9 w-full border-orange-300 bg-orange-50 text-sm text-orange-600"
          >
            Full
          </Button>
        ) : isFrequencyRestricted ? (
          <div className="space-y-2">
            <Button
              variant="default"
              size="sm"
              onClick={onBook}
              className="bg-org-primary hover:bg-org-primary/90 h-9 w-full text-sm font-semibold"
              disabled={isButtonDisabled}
            >
              Book Now*
            </Button>
            {getViolationDescriptions(["FREQUENCY"]).map(
              (desc: string, idx: number) => (
                <p key={idx} className="text-center text-xs text-yellow-700">
                  {desc}
                </p>
              ),
            )}
          </div>
        ) : (
          <Button
            variant="default"
            size="sm"
            onClick={onBook}
            className="bg-org-primary hover:bg-org-primary/90 h-9 w-full text-sm font-semibold"
            disabled={isButtonDisabled}
          >
            Book Now
          </Button>
        )}
      </div>

      {/* Warning Indicators */}
      {isPast && (
        <div className="absolute -top-1 -right-1">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-400 text-white">
            <ClockIcon className="h-3 w-3" />
          </div>
        </div>
      )}

      {isAvailabilityRestricted && (
        <div className="absolute -top-1 -right-1">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-600 text-white">
            <Ban className="h-3 w-3" />
          </div>
        </div>
      )}

      {isTimeRestricted && (
        <div className="absolute -top-1 -right-1">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white">
            <Ban className="h-3 w-3" />
          </div>
        </div>
      )}

      {isFrequencyRestricted && (
        <div className="absolute -top-1 -right-1">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-yellow-400 text-yellow-900">
            <AlertCircle className="h-3 w-3" />
          </div>
        </div>
      )}

      {isMemberCheckedIn && (
        <div className="absolute -top-1 -right-1">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500 text-white">
            <CheckCircle className="h-3 w-3" />
          </div>
        </div>
      )}
    </div>
  );
}
