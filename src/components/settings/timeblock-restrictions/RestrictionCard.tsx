"use client";

import { Card, CardContent, CardFooter } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import {
  Clock,
  Ban,
  User,
  UserPlus,
  Calendar,
  AlertCircle,
} from "lucide-react";
import { type TimeblockRestriction } from "./TimeblockRestrictionsSettings";
import { Button } from "~/components/ui/button";
import { formatCalendarDate, formatDaysOfWeek } from "~/lib/utils";

interface RestrictionCardProps {
  restriction: TimeblockRestriction;
  onEdit: () => void;
  onDelete: () => void;
  isHighlighted?: boolean;
}

export function RestrictionCard({
  restriction,
  onEdit,
  onDelete,
  isHighlighted = false,
}: RestrictionCardProps) {
  const getEntityIcon = () => {
    switch (restriction.restrictionCategory) {
      case "MEMBER_CLASS":
        return <User className="h-5 w-5" />;
      case "GUEST":
        return <UserPlus className="h-5 w-5" />;
      case "COURSE_AVAILABILITY":
        return <AlertCircle className="h-5 w-5" />;
      default:
        return <Ban className="h-5 w-5" />;
    }
  };

  const getRestrictionTypeIcon = () => {
    switch (restriction.restrictionType) {
      case "TIME":
        return <Clock className="h-5 w-5" />;
      case "FREQUENCY":
        return <Calendar className="h-5 w-5" />;
      case "AVAILABILITY":
        return <Ban className="h-5 w-5" />;
      default:
        return <Ban className="h-5 w-5" />;
    }
  };

  const getRestrictionDetails = () => {
    switch (restriction.restrictionType) {
      case "TIME":
        return (
          <>
            <p className="text-sm">
              <strong>Time:</strong> {restriction.startTime} -{" "}
              {restriction.endTime}
            </p>
            <p className="text-sm">
              <strong>Days:</strong>{" "}
              {formatDaysOfWeek(restriction.daysOfWeek || [])}
            </p>
            {restriction.startDate && restriction.endDate && (
              <p className="text-sm">
                <strong>Date Range:</strong>{" "}
                {formatCalendarDate(
                  restriction.startDate,
                  "EEEE, MMMM d, yyyy",
                )}{" "}
                -{" "}
                {formatCalendarDate(restriction.endDate, "EEEE, MMMM d, yyyy")}
              </p>
            )}
          </>
        );

      case "FREQUENCY":
        return (
          <>
            <p className="text-sm">
              <strong>Max Bookings:</strong> {restriction.maxCount} per{" "}
              {restriction.periodDays} days
            </p>
            {restriction.applyCharge && restriction.chargeAmount && (
              <p className="text-sm">
                <strong>Charge:</strong> {restriction.chargeAmount} after limit
              </p>
            )}
          </>
        );

      case "AVAILABILITY":
        return (
          <>
            {restriction.weatherStatus && (
              <p className="text-sm">
                <strong>Weather:</strong> {restriction.weatherStatus}
              </p>
            )}
            {restriction.rainfall && (
              <p className="text-sm">
                <strong>Rainfall:</strong> {restriction.rainfall}
              </p>
            )}
            {restriction.startDate && restriction.endDate && (
              <p className="text-sm">
                <strong>Date Range:</strong>{" "}
                {formatCalendarDate(
                  restriction.startDate,
                  "EEEE, MMMM d, yyyy",
                )}{" "}
                -{" "}
                {formatCalendarDate(restriction.endDate, "EEEE, MMMM d, yyyy")}
              </p>
            )}
          </>
        );

      default:
        return <p className="text-sm">No details available</p>;
    }
  };

  const getBadgeColor = () => {
    if (!restriction.isActive) {
      return "bg-gray-200 text-gray-700";
    }

    switch (restriction.restrictionCategory) {
      case "MEMBER_CLASS":
        return "bg-org-primary/20 text-org-primary";
      case "GUEST":
        return "bg-org-secondary/20 text-org-secondary";
      case "COURSE_AVAILABILITY":
        return "bg-org-tertiary/20 text-org-tertiary";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const badgeClass = getBadgeColor();

  return (
    <Card
      className={`overflow-hidden transition-all duration-200 ${isHighlighted ? "ring-primary ring-2" : ""}`}
    >
      <div
        className="h-2"
        style={{
          backgroundColor: "var(--org-primary)",
          opacity: restriction.isActive ? 1 : 0.3,
        }}
      />
      <CardContent className="p-4">
        <div className="mb-4 flex items-start justify-between">
          <h3 className="font-semibold">{restriction.name}</h3>
          <Badge className={badgeClass}>
            <div className="flex items-center gap-1">
              {getEntityIcon()}
              <span>
                {restriction.restrictionCategory === "MEMBER_CLASS"
                  ? "Members"
                  : restriction.restrictionCategory === "GUEST"
                    ? "Guest"
                    : "Course"}
              </span>
            </div>
          </Badge>
        </div>

        <div className="mb-2 flex items-center gap-1">
          {getRestrictionTypeIcon()}
          <span className="text-sm font-medium">
            {restriction.restrictionType}
          </span>
        </div>

        <p className="mb-2 text-sm text-gray-600">
          {restriction.description || "No description provided"}
        </p>

        {/* Display member classes if applicable */}
        {restriction.restrictionCategory === "MEMBER_CLASS" &&
          restriction.memberClasses &&
          restriction.memberClasses.length > 0 && (
            <div className="mb-3">
              <p className="mb-1 text-sm font-medium">Applies to:</p>
              <div className="flex flex-wrap gap-1">
                {restriction.memberClasses.map((className) => (
                  <Badge
                    key={className}
                    variant="secondary"
                    className="text-xs"
                  >
                    {className}
                  </Badge>
                ))}
              </div>
            </div>
          )}

        <div className="mt-3 space-y-1 text-gray-700">
          {getRestrictionDetails()}
        </div>

        {!restriction.isActive && (
          <div className="mt-2">
            <Badge variant="outline" className="bg-gray-100">
              Inactive
            </Badge>
          </div>
        )}
      </CardContent>

      <CardFooter className="border-t border-gray-100 bg-gray-50 p-3">
        <div className="flex w-full justify-end gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="h-8 px-3 text-xs"
          >
            Edit
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onDelete}
            className="h-8 px-3 text-xs"
          >
            Delete
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}
