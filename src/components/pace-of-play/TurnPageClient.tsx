"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { RefreshCw } from "lucide-react";
import { PaceOfPlayCard } from "~/components/pace-of-play/PaceOfPlayCard";
import { PaceOfPlayUpdateModal } from "~/components/pace-of-play/PaceOfPlayUpdateModal";
import { type TimeBlockWithPaceOfPlay } from "~/app/types/PaceOfPlayTypes";
import { useRouter } from "next/navigation";

interface TurnPageClientProps {
  initialTimeBlocks: TimeBlockWithPaceOfPlay[];
}

export function TurnPageClient({ initialTimeBlocks }: TurnPageClientProps) {
  const { user } = useUser();
  const router = useRouter();
  const [timeBlocks, setTimeBlocks] =
    useState<TimeBlockWithPaceOfPlay[]>(initialTimeBlocks);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedTimeBlock, setSelectedTimeBlock] =
    useState<TimeBlockWithPaceOfPlay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  const refreshData = () => {
    setIsLoading(true);
    try {
      // Use Next.js router to refresh the page data
      router.refresh();
      setLastUpdated(new Date());
    } catch (error) {
      console.error("Error refreshing turn data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Keep timeBlocks updated when initialTimeBlocks changes
  useEffect(() => {
    setTimeBlocks(initialTimeBlocks);
  }, [initialTimeBlocks]);

  useEffect(() => {
    // Set up auto-refresh every 2 minutes
    const intervalId = setInterval(
      () => {
        refreshData();
      },
      2 * 60 * 1000,
    );

    return () => clearInterval(intervalId);
  }, []);

  const handleUpdateTurn = (timeBlock: TimeBlockWithPaceOfPlay) => {
    setSelectedTimeBlock(timeBlock);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedTimeBlock(null);
    refreshData();
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <CardTitle className="text-2xl font-bold">
              9th Hole Turn Check-In
            </CardTitle>
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
          <p className="text-muted-foreground text-sm">
            Last updated: {lastUpdated.toLocaleTimeString()}
          </p>
        </CardHeader>
        <CardContent>
          <p>
            Update the pace of play status for groups that have reached the turn
            (9th hole).
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {isLoading ? (
          <p className="py-8 text-center">Loading groups at the turn...</p>
        ) : timeBlocks.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="mb-2 text-xl font-bold">No groups at the turn</h3>
            <p className="text-muted-foreground">
              There are currently no groups that need to check in at the turn.
            </p>
          </div>
        ) : (
          timeBlocks.map((timeBlock) => (
            <PaceOfPlayCard
              key={timeBlock.id}
              timeBlock={timeBlock}
              onUpdateTurn={() => handleUpdateTurn(timeBlock)}
              showTurnButton={true}
            />
          ))
        )}
      </div>

      <PaceOfPlayUpdateModal
        timeBlock={selectedTimeBlock}
        isOpen={isModalOpen}
        onClose={closeModal}
        mode="turn"
        userName={user?.fullName || user?.username || "Admin"}
      />
    </div>
  );
}
