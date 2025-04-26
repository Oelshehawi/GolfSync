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
import { ThemeConfig } from "~/app/types/UITypes";

interface AddGuestDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: GuestFormValues) => Promise<void>;
  theme?: ThemeConfig;
}

export function AddGuestDialog({
  open,
  onOpenChange,
  onSubmit,
  theme,
}: AddGuestDialogProps) {
  const handleSubmit = async (values: GuestFormValues) => {
    await onSubmit(values);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" theme={theme}>
        <DialogHeader>
          <DialogTitle>Add Guest</DialogTitle>
        </DialogHeader>
        <AddGuestForm
          onSubmit={handleSubmit}
          onCancel={() => onOpenChange(false)}
          theme={theme || {}}
        />
      </DialogContent>
    </Dialog>
  );
}
