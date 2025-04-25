"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { RestrictionForm } from "./RestrictionForm";
import { useState } from "react";
import {
  RestrictionFormValues,
  Restriction,
} from "~/app/types/RestrictionTypes";
import {
  createRestriction,
  updateRestriction,
} from "~/server/restrictions/actions";
import toast from "react-hot-toast";

interface RestrictionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  existingRestriction?: Restriction;
  memberClasses?: string[];
  onSuccess?: () => void;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function RestrictionDialog({
  isOpen,
  onClose,
  existingRestriction,
  memberClasses = [],
  onSuccess,
  theme,
}: RestrictionDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (values: RestrictionFormValues) => {
    setIsSubmitting(true);
    try {
      let result;

      if (existingRestriction) {
        // Update existing restriction
        result = await updateRestriction(existingRestriction.id, values);
      } else {
        // Create new restriction
        result = await createRestriction(values);
      }

      if (result.success) {
        toast.success(
          existingRestriction
            ? "Restriction updated successfully"
            : "Restriction created successfully",
        );
        onSuccess?.();
        onClose();
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error submitting restriction:", error);
      toast.error("Failed to save restriction");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[600px]" theme={theme}>
        <DialogHeader>
          <DialogTitle>
            {existingRestriction ? "Edit Restriction" : "Add Restriction"}
          </DialogTitle>
        </DialogHeader>
        <RestrictionForm
          onSubmit={handleSubmit}
          onCancel={onClose}
          initialValues={existingRestriction}
          memberClasses={memberClasses}
          isSubmitting={isSubmitting}
          theme={theme}
        />
      </DialogContent>
    </Dialog>
  );
}
