"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Play, CheckCircle, AlertCircle, Users } from "lucide-react";
import { processLotteryForDate } from "~/server/lottery/actions";
import { toast } from "react-hot-toast";
import { ConfirmationDialog } from "~/components/ui/confirmation-dialog";
import type { TeesheetConfig } from "~/app/types/TeeSheetTypes";

interface LotteryStats {
  totalEntries: number;
  individualEntries: number;
  groupEntries: number;
  totalPlayers: number;
  availableSlots: number;
  processingStatus: "pending" | "processing" | "completed";
}

interface LotteryProcessorProps {
  date: string;
  stats: LotteryStats;
  onProcessComplete: () => void;
  config: TeesheetConfig;
}

export function LotteryProcessor({
  date,
  stats,
  onProcessComplete,
  config,
}: LotteryProcessorProps) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleProcessLottery = async () => {
    setIsProcessing(true);
    try {
      const result = await processLotteryForDate(date, config);
      if (result.success) {
        toast.success(
          `Lottery processed successfully! ${result.data.processedCount} out of ${result.data.totalEntries} entries processed and ${result.data.bookingsCreated} bookings created.`,
        );
        onProcessComplete();
      } else {
        toast.error(result.error || "Failed to process lottery");
      }
    } catch (error) {
      toast.error("An error occurred while processing the lottery");
    } finally {
      setIsProcessing(false);
    }
  };

  const canProcess =
    stats.processingStatus === "pending" && stats.totalEntries > 0;
  const hasProcessed = stats.processingStatus === "completed";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Play className="h-5 w-5" />
            Lottery Processing Algorithm
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Current Status */}
          <div className="rounded-lg border bg-gray-50 p-4">
            <h3 className="mb-3 font-medium">Current Status</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center justify-between">
                <span>Total Entries:</span>
                <Badge variant="outline">{stats.totalEntries}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Available Slots:</span>
                <Badge variant="outline">{stats.availableSlots}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Individual Entries:</span>
                <Badge variant="secondary">{stats.individualEntries}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Group Entries:</span>
                <Badge variant="secondary">{stats.groupEntries}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Total Players:</span>
                <Badge variant="default">{stats.totalPlayers}</Badge>
              </div>
              <div className="flex items-center justify-between">
                <span>Processing Status:</span>
                <Badge
                  variant={
                    stats.processingStatus === "pending"
                      ? "secondary"
                      : stats.processingStatus === "completed"
                        ? "default"
                        : "destructive"
                  }
                >
                  {stats.processingStatus}
                </Badge>
              </div>
            </div>
          </div>

          {/* Algorithm Information */}
          <div className="rounded-lg border p-4">
            <h3 className="mb-3 font-medium">
              How the Enhanced Algorithm Works
            </h3>
            <div className="space-y-2 text-sm text-gray-600">
              <div className="flex items-start gap-2">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                <span>
                  Calculates fairness scores based on fairness, member profiles,
                  and admin adjustments
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                <span>
                  Gives speed bonuses: FAST players get +5 for morning, +2 for
                  midday slots
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                <span>
                  Tracks monthly fairness scores (members who haven't gotten
                  preferences get higher priority)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                <span>
                  Uses dynamic time windows calculated from teesheet
                  configuration
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                <span>
                  Processes entries in priority order (highest priority first)
                </span>
              </div>
              <div className="flex items-start gap-2">
                <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500"></div>
                <span>
                  Updates fairness scores after processing for future lottery
                  fairness
                </span>
              </div>
            </div>
          </div>

          {/* Processing Action */}
          <div className="space-y-4 text-center">
            {!hasProcessed && !canProcess && stats.totalEntries === 0 && (
              <div className="py-8 text-gray-500">
                <Users className="mx-auto mb-4 h-12 w-12 opacity-50" />
                <p>No lottery entries to process</p>
                <p className="text-sm">
                  Create some test entries using the debug controls to test the
                  algorithm
                </p>
              </div>
            )}

            {canProcess && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-green-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Ready to process lottery</span>
                </div>
                <Button
                  onClick={() => setShowConfirmDialog(true)}
                  disabled={isProcessing}
                  size="lg"
                  className="w-full"
                >
                  {isProcessing ? (
                    <>
                      <div className="mr-2 h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                      Processing Lottery...
                    </>
                  ) : (
                    <>
                      <Play className="mr-2 h-4 w-4" />
                      Process Lottery Algorithm
                    </>
                  )}
                </Button>
                <p className="text-sm text-gray-600">
                  This will create actual teesheet bookings for all pending
                  entries based on preferences and fairness scores
                </p>
              </div>
            )}

            {hasProcessed && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-blue-700">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Lottery has been processed
                  </span>
                </div>
              </div>
            )}

            {!canProcess && stats.totalEntries > 0 && !hasProcessed && (
              <div className="space-y-4">
                <div className="flex items-center justify-center gap-2 text-yellow-700">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">
                    Cannot process at this time
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  There may be no available time blocks or entries are already
                  being processed
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={showConfirmDialog}
        onOpenChange={setShowConfirmDialog}
        onConfirm={() => {
          setShowConfirmDialog(false);
          handleProcessLottery();
        }}
        title="Process Lottery Algorithm?"
        description="Are you sure you want to process the lottery? This will create actual teesheet bookings for all pending entries based on their preferences."
        confirmText="Process Lottery"
        cancelText="Cancel"
      />
    </div>
  );
}
