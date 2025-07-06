"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Card, CardHeader, CardTitle, CardContent } from "~/components/ui/card";
import { Button } from "~/components/ui/button";

import { PaceOfPlayCard } from "~/components/pace-of-play/PaceOfPlayCard";
import { PaceOfPlayUpdateModal } from "~/components/pace-of-play/PaceOfPlayUpdateModal";
import { AdminPaceOfPlayModal } from "~/components/pace-of-play/AdminPaceOfPlayModal";
import { type TimeBlockWithPaceOfPlay } from "~/app/types/PaceOfPlayTypes";
import { useRouter } from "next/navigation";

interface TurnPageClientProps {
  initialTimeBlocks: TimeBlockWithPaceOfPlay[];
  isAdmin?: boolean;
}

export function TurnPageClient({
  initialTimeBlocks,
  isAdmin = false,
}: TurnPageClientProps) {
  const { user } = useUser();
  const router = useRouter();
  const [timeBlocks, setTimeBlocks] =
    useState<TimeBlockWithPaceOfPlay[]>(initialTimeBlocks);
  const [selectedTimeBlock, setSelectedTimeBlock] =
    useState<TimeBlockWithPaceOfPlay | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  // Keep timeBlocks updated when initialTimeBlocks changes
  useEffect(() => {
    setTimeBlocks(initialTimeBlocks);
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

  const handleUpdateTurn = (timeBlock: TimeBlockWithPaceOfPlay) => {
    setSelectedTimeBlock(timeBlock);
    setIsModalOpen(true);
  };

  const handleAdminUpdateTurn = (timeBlock: TimeBlockWithPaceOfPlay) => {
    setSelectedTimeBlock(timeBlock);
    setIsAdminModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
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
            9th Hole Turn Check-In
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p>
            Update the pace of play status for groups that have reached the turn
            (9th hole).
          </p>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {timeBlocks.length === 0 ? (
          <div className="py-12 text-center">
            <h3 className="mb-2 text-xl font-bold">No groups at the turn</h3>
            <p className="text-muted-foreground">
              There are currently no groups that need to check in at the turn.
            </p>
          </div>
        ) : (
          timeBlocks.map((timeBlock) => (
            <div key={timeBlock.id} className="space-y-2">
              <PaceOfPlayCard
                timeBlock={timeBlock}
                onUpdateTurn={() => handleUpdateTurn(timeBlock)}
                showTurnButton={true}
              />
              {isAdmin && (
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleAdminUpdateTurn(timeBlock)}
                    className="border-amber-300 text-amber-600 hover:bg-amber-50 hover:text-amber-700"
                  >
                    Set Custom Turn Time
                  </Button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      <PaceOfPlayUpdateModal
        timeBlock={selectedTimeBlock}
        isOpen={isModalOpen}
        onClose={closeModal}
        mode="turn"
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
          mode="turn"
          userName={user?.fullName || user?.username || "Admin"}
        />
      )}
    </div>
  );
}
