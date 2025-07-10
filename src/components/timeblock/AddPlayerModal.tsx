"use client";

import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";
import { Dialog, DialogContent, DialogTitle } from "~/components/ui/dialog";
import { TimeBlockMemberManager } from "./TimeBlockMemberManager";
import type { TimeBlockGuest } from "~/app/types/GuestTypes";

interface AddPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeBlock: TimeBlockWithMembers;
  timeBlockGuests?: TimeBlockGuest[];
  mutations?: any;
}

export function AddPlayerModal({
  open,
  onOpenChange,
  timeBlock,
  timeBlockGuests = [],
  mutations,
}: AddPlayerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col overflow-hidden">
        <DialogTitle>Add Players to {timeBlock.startTime}</DialogTitle>
        <div className="flex-grow overflow-y-auto pr-1">
          <TimeBlockMemberManager
            timeBlock={timeBlock}
            timeBlockGuests={timeBlockGuests}
            mutations={mutations}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
