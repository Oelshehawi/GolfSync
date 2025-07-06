"use client";

import { Ban, Plus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useState, useEffect } from "react";
import { RestrictionCard } from "./RestrictionCard";
import { TimeblockRestrictionDialog } from "./TimeblockRestrictionDialog";
import { type TimeblockRestriction } from "./TimeblockRestrictionsSettings";
import toast from "react-hot-toast";
import { deleteTimeblockRestriction } from "~/server/timeblock-restrictions/actions";
import { DeleteConfirmationDialog } from "~/components/ui/delete-confirmation-dialog";

interface GuestRestrictionsProps {
  restrictions: TimeblockRestriction[];
  onUpdate: (restriction: TimeblockRestriction) => void;
  onAdd: (restriction: TimeblockRestriction) => void;
  onDelete: (restrictionId: number) => void;
  highlightId?: number | null;
  onDialogClose?: () => void;
}

export function GuestRestrictions({
  restrictions,
  onUpdate,
  onAdd,
  onDelete,
  highlightId,
  onDialogClose,
}: GuestRestrictionsProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRestriction, setSelectedRestriction] = useState<
    TimeblockRestriction | undefined
  >();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [restrictionToDelete, setRestrictionToDelete] = useState<
    TimeblockRestriction | undefined
  >();

  useEffect(() => {
    if (highlightId) {
      const restriction = restrictions.find((r) => r.id === highlightId);
      if (restriction) {
        handleOpenDialog(restriction);
      }
    }
  }, [highlightId, restrictions]);

  const handleOpenDialog = (restriction?: TimeblockRestriction) => {
    setSelectedRestriction(restriction);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRestriction(undefined);
    if (onDialogClose) {
      onDialogClose();
    }
  };

  const handleDeleteClick = (restriction: TimeblockRestriction) => {
    setRestrictionToDelete(restriction);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!restrictionToDelete) return;

    try {
      const result = await deleteTimeblockRestriction(restrictionToDelete.id);

      // Check if there was an error in the result
      if (result && "error" in result && result.error) {
        toast.error(result.error || "Failed to delete restriction");
        return;
      }

      // If we get here, the deletion was successful
      toast.success("Guest restriction deleted successfully");
      onDelete(restrictionToDelete.id);
    } catch (error) {
      console.error("Error deleting restriction:", error);
      toast.error("Failed to delete restriction");
    } finally {
      setIsDeleteDialogOpen(false);
      setRestrictionToDelete(undefined);
    }
  };

  const handleSuccess = (restriction: TimeblockRestriction) => {
    if (selectedRestriction) {
      onUpdate(restriction);
    } else {
      onAdd(restriction);
    }
    setIsDialogOpen(false);
    setSelectedRestriction(undefined);
  };

  return (
    <>
      <div className="mb-4 flex flex-row items-center justify-between">
        <h3 className="text-lg font-medium">Guest Restrictions</h3>
        <Button onClick={() => handleOpenDialog()} variant="default">
          <Plus className="mr-2 h-4 w-4" />
          Add Restriction
        </Button>
      </div>

      {restrictions.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <Ban className="mb-2 h-10 w-10" />
          <h3 className="text-lg font-medium">No guest restrictions</h3>
          <p>Add restrictions to limit when guests can book or how often</p>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {restrictions.map((restriction) => (
            <RestrictionCard
              key={restriction.id}
              restriction={restriction}
              onEdit={() => handleOpenDialog(restriction)}
              onDelete={() => handleDeleteClick(restriction)}
              isHighlighted={restriction.id === highlightId}
            />
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <TimeblockRestrictionDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        existingRestriction={selectedRestriction}
        restrictionCategory="GUEST"
        onSuccess={handleSuccess}
      />

      {/* Delete Confirmation */}
      <DeleteConfirmationDialog
        open={isDeleteDialogOpen}
        onOpenChange={setIsDeleteDialogOpen}
        onConfirm={handleDeleteConfirm}
        title="Delete Guest Restriction"
        description="This action cannot be undone and will permanently delete this restriction."
        itemName={restrictionToDelete?.name}
      />
    </>
  );
}
