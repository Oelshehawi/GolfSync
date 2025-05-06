"use client";
import { guestFormSchema } from "./guestFormSchema";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { AddGuestForm } from "./AddGuestForm";
import { GuestFormValues } from "~/app/types/GuestTypes";

interface AddGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GuestFormValues) => Promise<void>;
}

export function AddGuestDialog({
  open,
  onOpenChange,
  onSubmit,
}: AddGuestDialogProps) {
  const handleSubmit = async (values: GuestFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" >
        <DialogHeader>
          <DialogTitle>Add Guest</DialogTitle>
        </DialogHeader>
        <AddGuestForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
