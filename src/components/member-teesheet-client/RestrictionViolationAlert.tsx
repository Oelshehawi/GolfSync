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
import { useState } from "react";
import {
  RestrictionViolation,
  RestrictedEntityType,
} from "~/app/types/RestrictionTypes";

interface RestrictionViolationAlertProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  violations: RestrictionViolation[];
  onCancel: () => void;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
  memberClass?: string;
}

export function RestrictionViolationAlert({
  open,
  onOpenChange,
  violations,
  onCancel,
  theme,
  memberClass = "Member",
}: RestrictionViolationAlertProps) {
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
                been violated for your {memberClass} class:
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

              <div className="mt-4 rounded-md border border-blue-600 bg-blue-100 p-4 dark:border-blue-700 dark:bg-blue-900">
                <p className="text-blue-900 dark:text-blue-100">
                  Please contact the golf shop if you would like to book this
                  tee time despite these restrictions.
                </p>
              </div>
            </div>
          </div>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onCancel}>Close</AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
