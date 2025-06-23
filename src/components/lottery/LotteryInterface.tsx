"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Dice1, Plus, Calendar } from "lucide-react";
import { formatDate } from "~/lib/dates";
import { LotteryEntryForm } from "./LotteryEntryForm";
import { LotteryEntryView } from "./LotteryEntryView";
import type { LotteryEntryData } from "~/app/types/LotteryTypes";
import type { Member } from "~/app/types/MemberTypes";

interface LotteryInterfaceProps {
  lotteryDate: string;
  lotteryEntry?: LotteryEntryData;
  member: Member;
  error?: string | null;
  onDataChange?: () => void;
}

export function LotteryInterface({
  lotteryDate,
  lotteryEntry = null,
  member,
  error = null,
  onDataChange,
}: LotteryInterfaceProps) {
  const [showForm, setShowForm] = useState(false);

  // Set initial form state based on lotteryEntry in useEffect
  useEffect(() => {
    setShowForm(!lotteryEntry);
  }, [lotteryEntry]);

  const handleFormSuccess = () => {
    setShowForm(false);
    // Trigger data refresh from parent
    onDataChange?.();
  };

  const handleEdit = () => {
    setShowForm(true);
  };

  const handleCancel = () => {
    setShowForm(false);
    // Trigger data refresh from parent
    onDataChange?.();
  };

  const handleBackToView = () => {
    setShowForm(false);
  };

  if (error) {
    return (
      <Card className="mx-auto w-full max-w-2xl">
        <CardContent className="py-12">
          <div className="space-y-4 text-center">
            <div className="text-lg font-medium text-red-600">Error</div>
            <p className="text-gray-600">{error}</p>
            <Button onClick={() => setShowForm(true)} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show form (new entry or editing)
  if (showForm) {
    return (
      <div className="space-y-4">
        {lotteryEntry && (
          <div className="text-center">
            <Button variant="outline" onClick={handleBackToView}>
              ← Back to Entry
            </Button>
          </div>
        )}
        <LotteryEntryForm
          lotteryDate={lotteryDate}
          member={member}
          existingEntry={
            lotteryEntry?.type === "individual" ? lotteryEntry.entry : null
          }
          onSuccess={handleFormSuccess}
        />
      </div>
    );
  }

  // Show existing entry
  if (lotteryEntry) {
    return (
      <LotteryEntryView
        lotteryDate={lotteryDate}
        entry={lotteryEntry.entry}
        entryType={lotteryEntry.type}
        member={member}
        onEdit={lotteryEntry.type !== "group_member" ? handleEdit : undefined}
        onCancel={handleCancel}
      />
    );
  }

  // Show prompt to create entry (fallback)
  return (
    <Card className="mx-auto w-full max-w-2xl">
      <CardHeader className="text-center">
        <div className="bg-org-primary/10 mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full">
          <Dice1 className="text-org-primary h-8 w-8" />
        </div>
        <CardTitle className="text-2xl">Lottery Entry</CardTitle>
        <CardDescription>
          Enter the lottery for{" "}
          <strong>{formatDate(lotteryDate, "EEEE, MMMM do")}</strong>
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-6 text-center">
        <div className="space-y-4">
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
            <div className="mb-2 flex items-center justify-center gap-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              <span className="font-medium">Lottery System Active</span>
            </div>
            <p className="text-sm text-blue-700">
              This date is available through the lottery system. Submit your
              preferences and we'll assign tee times fairly based on
              availability and member history.
            </p>
          </div>

          <div className="space-y-3">
            <h3 className="text-lg font-medium">How it works:</h3>
            <div className="space-y-2 text-left text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  1
                </Badge>
                <span>
                  Choose your preferred time window and specific preferences
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  2
                </Badge>
                <span>
                  We'll process all entries and assign tee times fairly
                </span>
              </div>
              <div className="flex items-start gap-2">
                <Badge variant="outline" className="mt-0.5">
                  3
                </Badge>
                <span>
                  You'll be notified of your assigned tee time via email/SMS
                </span>
              </div>
            </div>
          </div>

          <Button
            onClick={() => setShowForm(true)}
            className="bg-org-primary hover:bg-org-primary/90 w-full"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Submit Lottery Entry
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
