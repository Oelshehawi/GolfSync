"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { TimeBlockMemberManager } from "./TimeBlockMemberManager";
import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";
import type { TimeBlockGuest } from "~/app/types/GuestTypes";

interface TimeBlockAddPlayerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  timeBlock: TimeBlockWithMembers;
  timeBlockGuests?: TimeBlockGuest[];
}

export function TimeBlockAddPlayerModal({
  open,
  onOpenChange,
  timeBlock,
  timeBlockGuests = [],
}: TimeBlockAddPlayerModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-5xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Player to Tee Time</DialogTitle>
        </DialogHeader>
        <TimeBlockMemberManager
          timeBlock={timeBlock}
          timeBlockGuests={timeBlockGuests}
        />
      </DialogContent>
    </Dialog>
  );
}
