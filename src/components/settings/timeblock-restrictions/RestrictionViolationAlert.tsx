"use client";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { useState, useEffect } from "react";
import { Textarea } from "~/components/ui/textarea";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";
import { recordTimeblockRestrictionOverride } from "~/server/timeblock-restrictions/actions";
import { useAuth } from "@clerk/nextjs";

interface RestrictionViolationAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  violations: RestrictionViolation[];
  onContinue: () => void;
  onCancel: () => void;

}

export function RestrictionViolationAlert({
  open,
  onOpenChange,
  violations,
  onContinue,
  onCancel,
}: RestrictionViolationAlertProps) {
  const [overrideReason, setOverrideReason] = useState("");
  const { isLoaded, userId, has } = useAuth();

  // Need a proper admin check - this should be replaced with actual admin role check
  // For now, we're assuming anyone authenticated is an admin for demo purposes
  const isAdmin = isLoaded && !!userId && true; // Replace with actual admin check

  // If not admin, cancel and prevent dialog from showing
  useEffect(() => {
    if (open && !isAdmin) {
      onCancel();
    }
  }, [open, isAdmin, onCancel]);

  const handleOverride = async () => {
    if (!isAdmin || !violations.length) return;

    try {
      // Record overrides for each violation
      for (const violation of violations) {
        await recordTimeblockRestrictionOverride({
          restrictionId: violation.restrictionId,
          restrictionCategory: violation.restrictionCategory,
          entityId: violation.entityId,
          reason: overrideReason,
        });
      }

      // Continue with booking
      onContinue();
    } catch (error) {
      console.error("Error recording override:", error);
    }
  };


  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {violations.length > 1
              ? `${violations.length} Booking Restrictions Violated`
              : "Booking Restriction Violated"}
          </AlertDialogTitle>
          <div className="text-muted-foreground text-left text-sm">
            <div className="space-y-4">
              <div>
                The following booking{" "}
                {violations.length > 1
                  ? "restrictions have"
                  : "restriction has"}{" "}
                been violated:
              </div>

              <ul className="ml-6 list-disc space-y-2">
                {violations.map((violation, index) => (
                  <li key={index} className="text-red-600 dark:text-red-400">
                    <span className="font-medium">
                      {violation.restrictionName}
                    </span>
                    : {violation.message}
                  </li>
                ))}
              </ul>

              {isAdmin && (
                <div className="mt-6 space-y-3 rounded-md border border-blue-600 bg-blue-100 p-4 dark:border-blue-700 dark:bg-blue-900">
                  <div className="font-medium text-blue-900 dark:text-blue-100">
                    Admin Override
                  </div>
                  <div className="text-sm text-blue-900 dark:text-blue-100">
                    As an administrator, you can override these restrictions.
                    Please provide a reason for the override:
                  </div>
                  <Textarea
                    value={overrideReason}
                    onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) =>
                      setOverrideReason(e.target.value)
                    }
                    placeholder="Reason for override..."
                    className="mt-2 border-blue-300 bg-white"
                  />
                </div>
              )}
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>
            Cancel Booking
          </AlertDialogCancel>
          {isAdmin && (
            <AlertDialogAction
              onClick={handleOverride}
              disabled={!overrideReason.trim()}
              className="bg-blue-700 text-white hover:bg-blue-800 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              Override & Continue
            </AlertDialogAction>
          )}
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
