"use client";

import { useState } from "react";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardContent,
} from "~/components/ui/card";
import { Ban, Plus, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import {
  Restriction,
  RestrictedEntityType,
  RestrictionType,
} from "~/app/types/RestrictionTypes";
import { RestrictionDialog } from "./RestrictionDialog";
import { deleteRestriction } from "~/server/restrictions/actions";
import toast from "react-hot-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "~/components/ui/alert-dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { useRouter } from "next/navigation";

interface RestrictionSettingsProps {
  initialRestrictions: Restriction[];
  memberClasses: string[];
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function RestrictionSettings({
  initialRestrictions,
  memberClasses,
  theme,
}: RestrictionSettingsProps) {
  const [restrictions, setRestrictions] =
    useState<Restriction[]>(initialRestrictions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedRestriction, setSelectedRestriction] = useState<
    Restriction | undefined
  >();
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [restrictionToDelete, setRestrictionToDelete] = useState<
    Restriction | undefined
  >();
  const router = useRouter();

  const handleOpenDialog = (restriction?: Restriction) => {
    setSelectedRestriction(restriction);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setSelectedRestriction(undefined);
  };

  const handleDeleteClick = (restriction: Restriction) => {
    setRestrictionToDelete(restriction);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!restrictionToDelete) return;

    try {
      const result = await deleteRestriction(restrictionToDelete.id);

      if (result.success) {
        toast.success("Restriction deleted successfully");
        setRestrictions((prev) =>
          prev.filter((r) => r.id !== restrictionToDelete.id),
        );
      } else {
        toast.error(result.error);
      }
    } catch (error) {
      console.error("Error deleting restriction:", error);
      toast.error("Failed to delete restriction");
    } finally {
      setDeleteConfirmOpen(false);
      setRestrictionToDelete(undefined);
    }
  };

  const handleSuccess = () => {
    // NextJS will handle revalidation, no need to refresh
  };

  // Filter restrictions by type for tabbed interface
  const classRestrictions = restrictions.filter(
    (r) => r.entityType === RestrictedEntityType.CLASS,
  );

  const guestRestrictions = restrictions.filter(
    (r) => r.entityType === RestrictedEntityType.GUEST,
  );

  return (
    <>
      <Card className="rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-2xl font-bold">
              Booking Restrictions
            </CardTitle>
            <CardDescription>
              Manage time and frequency restrictions for member classes and
              guests
            </CardDescription>
          </div>
          <Button
            onClick={() => handleOpenDialog()}
            theme={theme}
            variant="default"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Restriction
          </Button>
        </CardHeader>

        <CardContent className="pb-6">
          <Tabs defaultValue="class" className="w-full">
            <TabsList className="mx-auto mb-4 w-full max-w-[400px]">
              <TabsTrigger value="class" className="flex-1">
                Member Classes
              </TabsTrigger>
              <TabsTrigger value="guest" className="flex-1">
                Guests
              </TabsTrigger>
            </TabsList>

            <TabsContent value="class">
              {classRestrictions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Ban
                    className="mb-2 h-10 w-10"
                    style={{
                      color: theme?.primary || "var(--color-neutral-dark)",
                      opacity: 0.4,
                    }}
                  />
                  <h3 className="text-lg font-medium">No class restrictions</h3>
                  <p
                    style={{
                      color: theme?.primary || "var(--color-neutral-dark)",
                      opacity: 0.7,
                    }}
                  >
                    Add restrictions to limit when certain member classes can
                    book
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {classRestrictions.map((restriction) => (
                    <RestrictionCard
                      key={restriction.id}
                      restriction={restriction}
                      onEdit={() => handleOpenDialog(restriction)}
                      onDelete={() => handleDeleteClick(restriction)}
                      theme={theme}
                    />
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="guest">
              {guestRestrictions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Ban
                    className="mb-2 h-10 w-10"
                    style={{
                      color: theme?.primary || "var(--color-neutral-dark)",
                      opacity: 0.4,
                    }}
                  />
                  <h3 className="text-lg font-medium">No guest restrictions</h3>
                  <p
                    style={{
                      color: theme?.primary || "var(--color-neutral-dark)",
                      opacity: 0.7,
                    }}
                  >
                    Add restrictions to limit when guests can book or how often
                  </p>
                </div>
              ) : (
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {guestRestrictions.map((restriction) => (
                    <RestrictionCard
                      key={restriction.id}
                      restriction={restriction}
                      onEdit={() => handleOpenDialog(restriction)}
                      onDelete={() => handleDeleteClick(restriction)}
                      theme={theme}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <RestrictionDialog
        isOpen={isDialogOpen}
        onClose={handleCloseDialog}
        existingRestriction={selectedRestriction}
        memberClasses={memberClasses}
        onSuccess={handleSuccess}
        theme={theme}
      />

      {/* Delete Confirmation */}
      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Restriction</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{restrictionToDelete?.name}"?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteConfirm} theme={theme}>
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

// Subcomponent for displaying a restriction card
function RestrictionCard({
  restriction,
  onEdit,
  onDelete,
  theme,
}: {
  restriction: Restriction;
  onEdit: () => void;
  onDelete: () => void;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}) {
  const getRestrictionDetails = () => {
    if (restriction.restrictionType === RestrictionType.TIME) {
      const timeRestriction = restriction as any;
      const daysString = timeRestriction.daysOfWeek
        .map(
          (day: number) =>
            ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][day],
        )
        .join(", ");

      return (
        <>
          <p className="mb-1">
            <span className="font-medium">Time:</span>{" "}
            {timeRestriction.startTime} - {timeRestriction.endTime}
          </p>
          <p>
            <span className="font-medium">Days:</span> {daysString}
          </p>
        </>
      );
    } else {
      const freqRestriction = restriction as any;
      return (
        <>
          <p className="mb-1">
            <span className="font-medium">Limit:</span>{" "}
            {freqRestriction.maxCount}{" "}
            {freqRestriction.maxCount === 1 ? "booking" : "bookings"} per{" "}
            {freqRestriction.periodDays} days
          </p>
          {freqRestriction.applyCharge && (
            <p>
              <span className="font-medium">Fee:</span> $
              {freqRestriction.chargeAmount?.toFixed(2)} for exceeding limit
            </p>
          )}
        </>
      );
    }
  };

  const getBadgeColor = () => {
    if (!restriction.isActive) {
      return {
        bg: "var(--color-neutral)",
        text: "var(--color-neutral-dark)",
      };
    }

    if (restriction.restrictionType === RestrictionType.TIME) {
      return {
        bg: theme?.secondary || "var(--color-sand)",
        text: theme?.primary || "var(--color-primary)",
      };
    } else {
      return {
        bg: theme?.tertiary || "var(--color-accent)",
        text: "white",
      };
    }
  };

  const badgeColors = getBadgeColor();

  return (
    <div
      className="rounded-lg border p-4 shadow-sm"
      style={{
        borderColor: theme?.secondary || "var(--color-sand-dark)",
        borderWidth: "1px",
      }}
    >
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-semibold">{restriction.name}</h3>
        <Badge
          variant="outline"
          className="ml-2"
          style={{
            backgroundColor: badgeColors.bg,
            color: badgeColors.text,
            borderColor: "transparent",
          }}
        >
          {!restriction.isActive
            ? "Inactive"
            : restriction.restrictionType === RestrictionType.TIME
              ? "Time"
              : "Frequency"}
        </Badge>
      </div>

      <div
        className="mb-3 text-sm"
        style={{ color: "var(--color-neutral-dark)", opacity: 0.8 }}
      >
        {restriction.description}
      </div>

      <div className="mb-3 text-sm">
        <p className="mb-1">
          <span className="font-medium">Applies to:</span>{" "}
          {restriction.entityType === RestrictedEntityType.CLASS
            ? restriction.entityId || "All Classes"
            : "Guests"}
        </p>
        {getRestrictionDetails()}
      </div>

      <div className="mt-3 flex justify-end space-x-2">
        <Button size="sm" variant="outline" onClick={onEdit} theme={theme}>
          Edit
        </Button>
        <Button size="sm" variant="destructive" onClick={onDelete}>
          Delete
        </Button>
      </div>
    </div>
  );
}
