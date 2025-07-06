"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Separator } from "~/components/ui/separator";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import {
  Clock,
  Edit3,
  Trash2,
  CheckCircle,
  AlertCircle,
  Users,
} from "lucide-react";
import { formatDate, formatTime12Hour } from "~/lib/dates";
import { cancelLotteryEntry } from "~/server/lottery/actions";
import { type LotteryEntry, type LotteryGroup } from "~/app/types/LotteryTypes";
import type { Member } from "~/app/types/MemberTypes";

interface LotteryEntryViewProps {
  lotteryDate: string;
  entry: LotteryEntry | LotteryGroup;
  entryType: "individual" | "group" | "group_member";
  member: Member;
  onEdit?: () => void;
  onCancel?: () => void;
}

const TIME_WINDOW_LABELS = {
  EARLY_MORNING: "Early Morning (7:00 AM - 9:00 AM)",
  MORNING: "Morning (9:00 AM - 12:00 PM)",
  MIDDAY: "Midday (12:00 PM - 3:00 PM)",
  AFTERNOON: "Afternoon (3:00 PM - 6:00 PM)",
};

// Helper functions to handle both LotteryEntry and LotteryGroup field differences
function getPreferredWindow(entry: LotteryEntry | LotteryGroup): string {
  if ("primaryTimeWindow" in entry) {
    return entry.primaryTimeWindow;
  }
  return entry.preferredWindow;
}

function getAlternateWindow(
  entry: LotteryEntry | LotteryGroup,
): string | undefined {
  if ("backupTimeWindow" in entry) {
    return entry.backupTimeWindow || undefined;
  }
  if ("alternateWindow" in entry) {
    return entry.alternateWindow || undefined;
  }
  return undefined;
}

function getSubmissionTimestamp(entry: LotteryEntry | LotteryGroup): Date {
  if ("submittedAt" in entry) {
    return entry.submittedAt;
  }
  return entry.submissionTimestamp;
}

function getCreatedAt(entry: LotteryEntry | LotteryGroup): Date {
  if ("submittedAt" in entry) {
    return entry.submittedAt; // LotteryEntry doesn't have createdAt, use submittedAt
  }
  return entry.createdAt;
}

const STATUS_CONFIG = {
  PENDING: {
    label: "Pending",
    color: "bg-yellow-100 text-yellow-800",
    icon: AlertCircle,
    description: "Waiting for lottery processing",
  },
  PROCESSING: {
    label: "Processing",
    color: "bg-blue-100 text-blue-800",
    icon: Clock,
    description: "Lottery is being processed",
  },
  ASSIGNED: {
    label: "Assigned",
    color: "bg-green-100 text-green-800",
    icon: CheckCircle,
    description: "Tee time assigned",
  },
  CANCELLED: {
    label: "Cancelled",
    color: "bg-gray-100 text-gray-800",
    icon: Trash2,
    description: "Entry cancelled",
  },
};

export function MemberLotteryEntryView({
  lotteryDate,
  entry,
  entryType,
  member,
  onEdit,
  onCancel,
}: LotteryEntryViewProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const statusConfig =
    STATUS_CONFIG[entry.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = statusConfig.icon;

  const handleCancel = async () => {
    if (entryType === "individual") {
      setIsCancelling(true);
      try {
        const result = await cancelLotteryEntry(Number(entry.id));
        if (result.success) {
          toast.success("Lottery entry cancelled successfully");
          if (onCancel) onCancel();
        } else {
          toast.error(result.error || "Failed to cancel entry");
        }
      } catch (error) {
        toast.error("An unexpected error occurred");
      } finally {
        setIsCancelling(false);
        setShowCancelDialog(false);
      }
    }
  };

  const canEdit = entry.status === "PENDING" && entryType !== "group_member";
  const canCancel = entry.status === "PENDING" && entryType !== "group_member";

  return (
    <>
      <Card className="mx-auto w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                {entryType === "group" || entryType === "group_member" ? (
                  <Users className="h-5 w-5" />
                ) : (
                  <Clock className="h-5 w-5" />
                )}
                {entryType === "group"
                  ? "Group Lottery Entry"
                  : entryType === "group_member"
                    ? "Group Member Entry"
                    : "Individual Lottery Entry"}
              </CardTitle>
              <CardDescription>
                For {formatDate(lotteryDate, "EEEE, MMMM do")}
              </CardDescription>
            </div>
            <Badge className={statusConfig.color}>
              <StatusIcon className="mr-1 h-3 w-3" />
              {statusConfig.label}
            </Badge>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Status Information */}
          <div className="rounded-lg bg-gray-50 p-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <StatusIcon className="h-4 w-4" />
              {statusConfig.description}
            </div>
          </div>

          {/* Time Preferences */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Time Preferences</h3>

            <div className="grid gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  Preferred Window
                </label>
                <div className="bg-org-primary/5 border-org-primary/20 mt-1 rounded-lg border p-3">
                  <span className="font-medium">
                    {
                      TIME_WINDOW_LABELS[
                        getPreferredWindow(
                          entry,
                        ) as keyof typeof TIME_WINDOW_LABELS
                      ]
                    }
                  </span>
                </div>
              </div>

              {getAlternateWindow(entry) && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    Backup Window
                  </label>
                  <div className="mt-1 rounded-lg border border-gray-200 bg-gray-50 p-3">
                    <span className="font-medium">
                      {
                        TIME_WINDOW_LABELS[
                          getAlternateWindow(
                            entry,
                          ) as keyof typeof TIME_WINDOW_LABELS
                        ]
                      }
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Group Information */}
          {(entryType === "group" || entryType === "group_member") &&
            "memberIds" in entry && (
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Group Information</h3>
                <div className="grid gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      Group Size
                    </label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {entry.memberIds.length} member
                        {entry.memberIds.length !== 1 ? "s" : ""}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            )}

          {/* Submission Info */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Submission Details</h3>
            <div className="space-y-1 text-sm text-gray-600">
              <p>
                Submitted:{" "}
                {formatDate(
                  getSubmissionTimestamp(entry),
                  "MMM d, yyyy 'at' h:mm a",
                )}
              </p>
              {entry.updatedAt && entry.updatedAt > getCreatedAt(entry) && (
                <p>
                  Last updated:{" "}
                  {formatDate(entry.updatedAt, "MMM d, yyyy 'at' h:mm a")}
                </p>
              )}
            </div>
          </div>

          <Separator />

          {/* Action Buttons */}
          <div className="flex flex-col gap-3 sm:flex-row">
            {canEdit && onEdit && (
              <Button variant="outline" onClick={onEdit} className="flex-1">
                <Edit3 className="mr-2 h-4 w-4" />
                Edit Entry
              </Button>
            )}

            {canCancel && (
              <Button
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
                className="flex-1"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Cancel Entry
              </Button>
            )}

            {!canEdit && !canCancel && (
              <div className="py-2 text-center text-sm text-gray-500">
                {entryType === "group_member"
                  ? "Contact the group leader to make changes"
                  : "Entry cannot be modified at this time"}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel Lottery Entry</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel your lottery entry for{" "}
              {formatDate(lotteryDate, "EEEE, MMMM do")}? This action cannot be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isCancelling}>
              Keep Entry
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancel}
              disabled={isCancelling}
              className="bg-red-600 hover:bg-red-700"
            >
              {isCancelling ? (
                <>
                  <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Cancelling...
                </>
              ) : (
                "Cancel Entry"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
