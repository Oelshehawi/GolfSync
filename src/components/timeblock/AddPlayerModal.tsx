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
}

export function AddPlayerModal({
  open,
  onOpenChange,
  timeBlock,
  timeBlockGuests = [],
}: AddPlayerModalProps) {
  // Create a key that changes when members, guests, or fills are added/removed
  const membersKey = timeBlock.members.map((m) => m.id).join("-");
  const guestsKey = timeBlockGuests.map((g) => g.id).join("-");
  const fillsKey =
    timeBlock.fills?.map((f) => `${f.id}`).join("-") || "";
  const componentKey = `modal-timeblock-${timeBlock.id}-members-${membersKey}-guests-${guestsKey}-fills-${fillsKey}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[85vh] max-w-4xl flex-col overflow-hidden">
        <DialogTitle>Add Players to {timeBlock.startTime}</DialogTitle>
        <div className="flex-grow overflow-y-auto pr-1">
          <TimeBlockMemberManager
            key={componentKey}
            timeBlock={timeBlock}
            timeBlockGuests={timeBlockGuests}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
