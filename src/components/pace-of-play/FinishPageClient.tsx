"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";
import { ChevronDown, ChevronUp, ShieldAlert } from "lucide-react";
import { PaceOfPlayCard } from "~/components/pace-of-play/PaceOfPlayCard";
import { PaceOfPlayUpdateModal } from "~/components/pace-of-play/PaceOfPlayUpdateModal";
import { CombinedTurnFinishModal } from "~/components/pace-of-play/CombinedTurnFinishModal";
import { AdminPaceOfPlayModal } from "~/components/pace-of-play/AdminPaceOfPlayModal";
import { type TimeBlockWithPaceOfPlay } from "~/app/types/PaceOfPlayTypes";
import { useRouter } from "next/navigation";

interface FinishPageClientProps {
  initialTimeBlocks:
    | TimeBlockWithPaceOfPlay[]
    | {
        regular: TimeBlockWithPaceOfPlay[];
        missedTurns: TimeBlockWithPaceOfPlay[];
      };
  isAdmin?: boolean;
}

export function FinishPageClient({
  initialTimeBlocks,
  isAdmin = false,
}: FinishPageClientProps) {
  const { user } = useUser();
  const router = useRouter();

  // Handle both data structures - simple array for members, object for admins
  const [timeBlocks, setTimeBlocks] = useState<{
    regular: TimeBlockWithPaceOfPlay[];
    missedTurns: TimeBlockWithPaceOfPlay[];
  }>(() => {
    if (Array.isArray(initialTimeBlocks)) {
      return { regular: initialTimeBlocks, missedTurns: [] };
    }
    return initialTimeBlocks;
  });

  const [selectedTimeBlock, setSelectedTimeBlock] =
    useState<TimeBlockWithPaceOfPlay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCombinedModalOpen, setIsCombinedModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminModalMode, setAdminModalMode] = useState<
    "turn" | "finish" | "both"
  >("finish");
  const [showMissedTurns, setShowMissedTurns] = useState(isAdmin); // Auto-show for admins

  useEffect(() => {
    if (Array.isArray(initialTimeBlocks)) {
      setTimeBlocks({ regular: initialTimeBlocks, missedTurns: [] });
    } else {
      setTimeBlocks(initialTimeBlocks);
    }
  }, [initialTimeBlocks]);

  // Auto-refresh for admin only
  useEffect(() => {
    if (!isAdmin) return;

    const intervalId = setInterval(
      () => {
        router.refresh();
      },
      2 * 60 * 1000,
    );

    return () => clearInterval(intervalId);
  }, [isAdmin, router]);

  const handleUpdateFinish = (timeBlock: TimeBlockWithPaceOfPlay) => {
    setSelectedTimeBlock(timeBlock);
    setIsModalOpen(true);
  };

  const handleCombinedUpdate = (timeBlock: TimeBlockWithPaceOfPlay) => {
    setSelectedTimeBlock(timeBlock);
    setIsCombinedModalOpen(true);
  };

  const handleAdminUpdate = (
    timeBlock: TimeBlockWithPaceOfPlay,
    mode: "turn" | "finish" | "both",
  ) => {
    setSelectedTimeBlock(timeBlock);
    setAdminModalMode(mode);
    setIsAdminModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setIsCombinedModalOpen(false);
    setIsAdminModalOpen(false);
    setSelectedTimeBlock(null);
    if (isAdmin) {
      router.refresh();
    }
  };

  return (
    <div>
      <Card className="mb-6">
        <CardHeader className="pb-2">
          <CardTitle className="text-2xl font-bold">
            18th Hole Finish Check-In
          </CardTitle>
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
          {timeBlocks.regular.length === 0 ? (
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

      {/* Admin Toggle Button - Only show if admin or there are missed turns */}
      {(isAdmin || timeBlocks.missedTurns.length > 0) && (
        <div className="mb-4">
          <Button
            variant="outline"
            onClick={() => setShowMissedTurns(!showMissedTurns)}
            className="w-full border-dashed"
          >
            <ShieldAlert className="mr-2 h-4 w-4 text-amber-500" />
            {showMissedTurns ? "Hide" : "Show"}{" "}
            {isAdmin ? "Advanced Controls" : "Admin Controls"}
            {showMissedTurns ? (
              <ChevronUp className="ml-2 h-4 w-4" />
            ) : (
              <ChevronDown className="ml-2 h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      {/* Missed Turn Groups - Only shown when toggled */}
      {showMissedTurns && (
        <div className="mt-8 rounded-lg border border-amber-200 bg-amber-50 p-4">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-amber-500" />
            <h2 className="text-lg font-semibold text-amber-800">
              {isAdmin
                ? "Advanced Controls & Groups Missing Turn Time"
                : "Groups Missing Turn Time"}
            </h2>
          </div>
          <p className="mb-4 text-sm text-amber-700">
            {isAdmin
              ? "As an administrator, you can manually set times, handle missed turns, and override pace of play records."
              : "This section allows administrators to handle exceptional cases where groups missed recording their turn time."}
          </p>
          <div className="space-y-4">
            {timeBlocks.missedTurns.length === 0 ? (
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
                <div key={timeBlock.id} className="space-y-2">
                  <PaceOfPlayCard
                    timeBlock={timeBlock}
                    onUpdateFinish={() => handleCombinedUpdate(timeBlock)}
                    showFinishButton={true}
                    isMissedTurn={true}
                  />
                  {isAdmin && (
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdminUpdate(timeBlock, "turn")}
                        className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                      >
                        Set Turn Time
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdminUpdate(timeBlock, "finish")}
                        className="border-green-300 text-green-600 hover:bg-green-50 hover:text-green-700"
                      >
                        Set Finish Time
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleAdminUpdate(timeBlock, "both")}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                      >
                        Set Both Times
                      </Button>
                    </div>
                  )}
                </div>
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
        userName={
          user?.fullName || user?.username || (isAdmin ? "Admin" : "Member")
        }
      />

      {/* Combined Turn & Finish Modal */}
      <CombinedTurnFinishModal
        timeBlock={selectedTimeBlock}
        isOpen={isCombinedModalOpen}
        onClose={closeModal}
        userName={
          user?.fullName || user?.username || (isAdmin ? "Admin" : "Member")
        }
      />

      {/* Admin Enhanced Modal */}
      {isAdmin && (
        <AdminPaceOfPlayModal
          timeBlock={selectedTimeBlock}
          isOpen={isAdminModalOpen}
          onClose={closeModal}
          mode={adminModalMode}
          userName={user?.fullName || user?.username || "Admin"}
        />
      )}
    </div>
  );
}
