import { useState } from "react";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import {
  Settings,
  Activity,
  RotateCw,
  Bug,
  Dice1,
  UserPlus,
  CalendarDays,
  Calendar,
  Home,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { ConfirmationDialog } from "~/components/ui/confirmation-dialog";
import { updateTeesheetConfigForDate } from "~/server/settings/actions";
import toast from "react-hot-toast";
import type { TeeSheet, TeesheetConfig } from "~/app/types/TeeSheetTypes";
import { populateTimeBlocksWithRandomMembers } from "~/server/teesheet/actions";
import { AdminLotteryEntryForm } from "~/components/lottery/AdminLotteryEntryForm";
import { TeesheetSettingsModal } from "./TeesheetSettingsModal";
import { getBCToday, formatDate, parseDate } from "~/lib/dates";

// Check if we're in development mode
const isDev =
  process.env.NODE_ENV === "development" ||
  process.env.NODE_ENV === "production";

interface TeesheetControlPanelProps {
  teesheet: TeeSheet;
  availableConfigs: TeesheetConfig[];
  lotterySettings?: any;
  isAdmin?: boolean;
  isTwoDayView?: boolean;
  onToggleTwoDayView?: (enabled: boolean) => void;
  currentDate?: Date;
  onDateChange?: (date: Date) => void;
  mutations?: {
    revalidate?: () => Promise<void>;
  };
}

export function TeesheetControlPanel({
  teesheet,
  availableConfigs,
  lotterySettings,
  isAdmin = true,
  isTwoDayView = false,
  onToggleTwoDayView,
  currentDate,
  onDateChange,
  mutations,
}: TeesheetControlPanelProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPopulating, setIsPopulating] = useState(false);
  const [showAdminEntryDialog, setShowAdminEntryDialog] = useState(false);
  const [showConfigConfirmation, setShowConfigConfirmation] = useState(false);
  const [pendingConfigId, setPendingConfigId] = useState<number | null>(null);
  const [showSettingsModal, setShowSettingsModal] = useState(false);


  const handleConfirmConfigChange = async () => {
    if (!pendingConfigId) return;

    setIsUpdating(true);
    try {
      const result = await updateTeesheetConfigForDate(
        teesheet.id,
        pendingConfigId,
      );
      if (result.success) {
        toast.success("Teesheet configuration updated successfully");
        // Trigger SWR revalidation to update the local data
        await mutations?.revalidate?.();
      } else {
        toast.error(result.error || "Failed to update teesheet configuration");
      }
    } catch (error) {
      toast.error("An unexpected error occurred");
    } finally {
      setIsUpdating(false);
      setShowConfigConfirmation(false);
      setPendingConfigId(null);
    }
  };

  // DEBUG: Populate timeblocks with random members
  const handlePopulateTimeBlocks = async () => {
    if (!teesheet?.date) return;

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

  // Get lottery button text - simplified to only Setup and View
  const getLotteryButtonText = () => {
    const today = getBCToday();
    const teesheetDateString = formatDate(teesheet.date, "yyyy-MM-dd");

    if (teesheetDateString <= today) {
      return "View Lottery";
    } else {
      return "Setup Lottery";
    }
  };

  // Handle return to today
  const handleReturnToToday = () => {
    if (!onDateChange) return;

    const todayString = getBCToday();
    const todayDate = parseDate(todayString);
    onDateChange(todayDate);
  };

  // Check if already on today
  const isOnToday = () => {
    if (!currentDate) return false;
    const today = getBCToday();
    const currentDateString = formatDate(currentDate, "yyyy-MM-dd");
    return currentDateString === today;
  };

  return (
    <div className="mb-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        {/* Return to Today Button */}
        <Button
          variant="outline"
          size="sm"
          onClick={handleReturnToToday}
          disabled={isOnToday() || !onDateChange}
          className="shadow-sm transition-all"
        >
          <Home className="mr-2 h-4 w-4" />
          Return to Today
        </Button>

        {/* Two-Day View Toggle - Only show on desktop */}
        <div className="hidden lg:block">
          <Button
            variant={isTwoDayView ? "default" : "outline"}
            size="sm"
            onClick={() => onToggleTwoDayView?.(!isTwoDayView)}
            className="shadow-sm transition-all"
          >
            {isTwoDayView ? (
              <Calendar className="mr-2 h-4 w-4" />
            ) : (
              <CalendarDays className="mr-2 h-4 w-4" />
            )}
            {isTwoDayView ? "Single Day" : "Two Days"}
          </Button>
        </div>

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

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAdminEntryDialog(true)}
          className="shadow-sm hover:text-white"
        >
          <UserPlus className="mr-2 h-4 w-4" />
          Create Entry
        </Button>

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

      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowSettingsModal(true)}
        disabled={isUpdating}
        className="cursor-pointer shadow-sm transition-colors hover:text-white"
      >
        <Settings className="mr-2 h-4 w-4" />
        Teesheet Settings
      </Button>

      {/* Admin Lottery Entry Dialog */}
      <Dialog
        open={showAdminEntryDialog}
        onOpenChange={setShowAdminEntryDialog}
      >
        <DialogContent className="max-h-[90vh] max-w-2xl overflow-y-auto">
          <DialogHeader className="sr-only">
            <DialogTitle>Create Lottery Entry</DialogTitle>
            <DialogDescription>
              Create a lottery entry for any member
            </DialogDescription>
          </DialogHeader>
          {(() => {
            const currentConfig = availableConfigs.find(
              (c) => c.id === teesheet.configId,
            );
            if (!currentConfig) return null;

            return (
              <AdminLotteryEntryForm
                lotteryDate={teesheet.date}
                config={currentConfig}
                onSuccess={() => setShowAdminEntryDialog(false)}
                onCancel={() => setShowAdminEntryDialog(false)}
              />
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* Configuration Change Confirmation Dialog */}
      <ConfirmationDialog
        open={showConfigConfirmation}
        onOpenChange={setShowConfigConfirmation}
        onConfirm={handleConfirmConfigChange}
        title="Change Teesheet Configuration"
        description="Changing the configuration will remove all members from this teesheet. Are you sure you want to continue?"
        confirmText="Change Configuration"
        cancelText="Cancel"
        variant="destructive"
        loading={isUpdating}
      />

      {/* Teesheet Settings Modal */}
      <TeesheetSettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        teesheet={teesheet}
        availableConfigs={availableConfigs}
        lotterySettings={lotterySettings || null}
        onSuccess={() => {
          setShowSettingsModal(false);
          mutations?.revalidate?.();
        }}
      />
    </div>
  );
}
