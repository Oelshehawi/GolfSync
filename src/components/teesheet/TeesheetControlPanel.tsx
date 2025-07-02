import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { Settings, Activity, RotateCw, Bug, Dice1 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { updateTeesheetConfigForDate } from "~/server/settings/actions";
import toast from "react-hot-toast";
import type { TeeSheet, TeesheetConfig } from "~/app/types/TeeSheetTypes";
import { populateTimeBlocksWithRandomMembers } from "~/server/teesheet/actions";

// Check if we're in development mode
const isDev = process.env.NODE_ENV === "development";

interface TeesheetControlPanelProps {
  teesheet: TeeSheet;
  availableConfigs: TeesheetConfig[];
  isAdmin?: boolean;
}

export function TeesheetControlPanel({
  teesheet,
  availableConfigs,
  isAdmin = true,
}: TeesheetControlPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);

  const handleConfigChange = async (configId: number) => {
    if (configId === teesheet.configId) return;

    setIsUpdating(true);
    try {
      const result = await updateTeesheetConfigForDate(teesheet.id, configId);
      if (result.success) {
        toast.success("Teesheet configuration updated successfully");
      } else {
        toast.error(result.error || "Failed to update teesheet configuration");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
    }
  };

  // DEBUG: Populate timeblocks with random members
  const handlePopulateTimeBlocks = async () => {
    if (!teesheet || !teesheet.date) return;

    setIsPopulating(true);
    try {
      const result = await populateTimeBlocksWithRandomMembers(
        teesheet.id,
        teesheet.date,
      );

      if (result.success) {
        toast.success(result.message || "Successfully populated timeblocks");
      } else {
        toast.error(result.error || "Failed to populate timeblocks");
      }
    } catch (error) {
      toast.error("An unexpected error occurred while populating timeblocks");
      console.error(error);
    } finally {
      setIsPopulating(false);
    }
  };

  // Get lottery button text based on date status
  const getLotteryButtonText = () => {
    const today = new Date();
    const teesheetDate = new Date(teesheet.date);

    if (teesheetDate < today) {
      return "View Lottery";
    } else if (teesheetDate.toDateString() === today.toDateString()) {
      return "Manage Lottery";
    } else {
      return "Setup Lottery";
    }
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <Link href={`/admin/pace-of-play/turn`} passHref>
          <Button
            variant="outline"
            size="sm"
            className="shadow-sm hover:text-white"
          >
            <Activity className="mr-2 h-4 w-4" />
            Turn Check-in
          </Button>
        </Link>

        <Link href={`/admin/pace-of-play/finish`} passHref>
          <Button
            variant="outline"
            size="sm"
            className="shadow-sm hover:text-white"
          >
            <RotateCw className="mr-2 h-4 w-4" />
            Finish Check-in
          </Button>
        </Link>

        <Link href={`/admin/lottery/${teesheet.date}`} passHref>
          <Button
            variant="outline"
            size="sm"
            className="shadow-sm hover:text-white"
          >
            <Dice1 className="mr-2 h-4 w-4" />
            {getLotteryButtonText()}
          </Button>
        </Link>

        {/* Debug Button - Only shown in development */}
        {isDev && (
          <Button
            variant="outline"
            size="sm"
            onClick={handlePopulateTimeBlocks}
            disabled={isPopulating}
            className="bg-yellow-50 shadow-sm hover:bg-yellow-100 hover:text-yellow-800"
          >
            <Bug className="mr-2 h-4 w-4" />
            {isPopulating ? "Populating..." : "Auto-Populate (Debug)"}
          </Button>
        )}
      </div>

      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            disabled={isUpdating}
            className="cursor-pointer shadow-sm transition-colors hover:text-white"
          >
            <Settings className="mr-2 h-4 w-4" />
            Change Configuration
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="rounded-md border bg-white shadow-lg">
          {availableConfigs.map((config) => (
            <DropdownMenuItem
              key={config.id}
              onClick={() => handleConfigChange(config.id)}
              disabled={config.id === teesheet.configId || isUpdating}
              className="hover:bg-org-primary cursor-pointer transition-colors hover:text-white"
            >
              {config.name}
              {config.id === teesheet.configId && " (Current)"}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
