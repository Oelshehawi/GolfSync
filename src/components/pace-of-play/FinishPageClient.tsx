"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { RefreshCw, ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { PaceOfPlayCard } from "~/components/pace-of-play/PaceOfPlayCard";
import { PaceOfPlayUpdateModal } from "~/components/pace-of-play/PaceOfPlayUpdateModal";
import { CombinedTurnFinishModal } from "~/components/pace-of-play/CombinedTurnFinishModal";
import { type TimeBlockWithPaceOfPlay } from "~/server/pace-of-play/data";
import { useRouter } from "next/navigation";

interface FinishPageClientProps {
  initialTimeBlocks: {
    regular: TimeBlockWithPaceOfPlay[];
    missedTurns: TimeBlockWithPaceOfPlay[];
  };
}

export function FinishPageClient({ initialTimeBlocks }: FinishPageClientProps) {
  const { user } = useUser();
  const router = useRouter();
  const [timeBlocks, setTimeBlocks] = useState<{
    regular: TimeBlockWithPaceOfPlay[];
    missedTurns: TimeBlockWithPaceOfPlay[];
  }>(initialTimeBlocks);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeBlock, setSelectedTimeBlock] =
    useState<TimeBlockWithPaceOfPlay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCombinedModalOpen, setIsCombinedModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [showMissedTurns, setShowMissedTurns] = useState(false);

  const refreshData = () => {
    setIsLoading(true);
    try {
      router.refresh();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing finish data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setTimeBlocks(initialTimeBlocks);
  }, [initialTimeBlocks]);

  useEffect(() => {
    const intervalId = setInterval(refreshData, 2 * 60 * 1000);
    return () => clearInterval(intervalId);
  }, []);

  const handleUpdateFinish = (timeBlock: TimeBlockWithPaceOfPlay) => {
    setSelectedTimeBlock(timeBlock);
    setIsModalOpen(true);
  };

  const handleCombinedUpdate = (timeBlock: TimeBlockWithPaceOfPlay) => {
    setSelectedTimeBlock(timeBlock);
    setIsCombinedModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCombinedModalOpen(false);
    setSelectedTimeBlock(null);
    refreshData();
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              18th Hole Finish Check-In
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={refreshData}
                disabled={isLoading}
              >
                <RefreshCw
                  className={`mr-2 h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
                />
                {isLoading ? "Refreshing..." : "Refresh"}
              </Button>
            </div>
          </div>
          <p className="text-muted-foreground text-sm">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </CardHeader>
        <CardContent>
          <p>
            Update the pace of play status for groups that have completed their
            round.
          </p>
        </CardContent>
      </Card>

      {/* Regular Finish Groups */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-semibold">Groups Ready for Finish</h2>
        <div className="space-y-4">
          {isLoading ? (
            <p className="py-8 text-center">Loading groups at the finish...</p>
          ) : timeBlocks.regular.length === 0 ? (
            <div className="py-8 text-center">
              <h3 className="mb-2 text-xl font-bold">
                No groups ready for finish
              </h3>
              <p className="text-muted-foreground">
                There are currently no groups that have recorded their turn time
                and need to check in at the finish.
              </p>
            </div>
          ) : (
            timeBlocks.regular.map((timeBlock) => (
              <PaceOfPlayCard
                key={timeBlock.id}
                timeBlock={timeBlock}
                onUpdateFinish={() => handleUpdateFinish(timeBlock)}
                showFinishButton={true}
              />
            ))
          )}
        </div>
      </div>

      {/* Admin Toggle Button */}
      <div className="mb-4">
        <Button
          variant="outline"
          onClick={() => setShowMissedTurns(!showMissedTurns)}
          className="w-full border-dashed"
        >
          <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
          {showMissedTurns ? "Hide" : "Show"} Admin Controls
          {showMissedTurns ? (
            <ChevronUp className="ml-2 h-4 w-4" />
          ) : (
            <ChevronDown className="ml-2 h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Missed Turn Groups - Only shown when toggled */}
      {showMissedTurns && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-amber-800">
              Groups Missing Turn Time
            </h2>
          </div>
          <p className="mb-4 text-sm text-amber-700">
            This section allows administrators to handle exceptional cases where
            groups missed recording their turn time.
          </p>
          <div className="space-y-4">
            {isLoading ? (
              <p className="py-8 text-center">
                Loading groups with missed turns...
              </p>
            ) : timeBlocks.missedTurns.length === 0 ? (
              <div className="py-8 text-center">
                <h3 className="mb-2 text-xl font-bold">
                  No groups with missed turns
                </h3>
                <p className="text-muted-foreground">
                  All active groups have recorded their turn time.
                </p>
              </div>
            ) : (
              timeBlocks.missedTurns.map((timeBlock) => (
                <PaceOfPlayCard
                  key={timeBlock.id}
                  timeBlock={timeBlock}
                  onUpdateFinish={() => handleCombinedUpdate(timeBlock)}
                  showFinishButton={true}
                  isMissedTurn={true}
                />
              ))
            )}
          </div>
        </div>
      )}

      {/* Regular Finish Modal */}
      <PaceOfPlayUpdateModal
        timeBlock={selectedTimeBlock}
        isOpen={isModalOpen}
        onClose={closeModal}
        mode="finish"
        userName={user?.fullName || user?.username || "Admin"}
      />

      {/* Combined Turn & Finish Modal */}
      <CombinedTurnFinishModal
        timeBlock={selectedTimeBlock}
        isOpen={isCombinedModalOpen}
        onClose={closeModal}
        userName={user?.fullName || user?.username || "Admin"}
      />
    </div>
  );
}
