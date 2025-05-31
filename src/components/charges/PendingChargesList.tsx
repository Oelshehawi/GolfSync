"use client";

import { Button } from "~/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { formatCalendarDate } from "~/lib/utils";
import {
  type PowerCartChargeWithRelations,
  type GeneralChargeWithRelations,
} from "~/app/types/ChargeTypes";
import {
  completePowerCartCharge,
  completeGeneralCharge,
  deletePowerCartCharge,
  deleteGeneralCharge,
} from "~/server/charges/actions";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { DeleteConfirmationDialog } from "~/components/ui/delete-confirmation-dialog";
import { StaffInitialsDialog } from "./StaffInitialsDialog";
import toast from "react-hot-toast";

interface PendingChargesListProps {
  powerCartCharges: PowerCartChargeWithRelations[];
  generalCharges: GeneralChargeWithRelations[];
}

export function PendingChargesList({
  powerCartCharges,
  generalCharges,
}: PendingChargesListProps) {
  const router = useRouter();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [staffInitialsDialogOpen, setStaffInitialsDialogOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<{
    id: number;
    type: "power-cart" | "general";
    action: "complete" | "delete";
    name: string;
  } | null>(null);

  const handleComplete = async (initials: string) => {
    if (!selectedCharge) return;

    try {
      if (selectedCharge.type === "power-cart") {
        await completePowerCartCharge(selectedCharge.id);
      } else {
        await completeGeneralCharge(selectedCharge.id);
      }
      router.refresh();
      toast.success("Charge completed successfully");
      setStaffInitialsDialogOpen(false);
      setSelectedCharge(null);
    } catch (error) {
      console.error("Failed to complete charge:", error);
      toast.error("Failed to complete charge");
    }
  };

  const handleDelete = async () => {
    if (!selectedCharge) return;

    try {
      if (selectedCharge.type === "power-cart") {
        await deletePowerCartCharge(selectedCharge.id);
      } else {
        await deleteGeneralCharge(selectedCharge.id);
      }
      router.refresh();
      toast.success("Charge deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedCharge(null);
    } catch (error) {
      console.error("Failed to delete charge:", error);
      toast.error("Failed to delete charge");
    }
  };

  const renderName = (
    charge: PowerCartChargeWithRelations | GeneralChargeWithRelations,
  ) => {
    if (charge.member) {
      return `${charge.member.firstName} ${charge.member.lastName}`;
    }
    if (charge.guest) {
      return `${charge.guest.firstName} ${charge.guest.lastName} (Guest)`;
    }
    return "-";
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="mb-4 text-sm font-medium">Power Cart Charges</h4>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Split With</TableHead>
                <TableHead>Medical</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {powerCartCharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No pending power cart charges
                  </TableCell>
                </TableRow>
              ) : (
                powerCartCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>{formatCalendarDate(charge.date)}</TableCell>
                    <TableCell>{renderName(charge)}</TableCell>
                    <TableCell>
                      {charge.splitWithMember
                        ? `${charge.splitWithMember.firstName} ${charge.splitWithMember.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell>{charge.isMedical ? "Yes" : "No"}</TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCharge({
                            id: charge.id,
                            type: "power-cart",
                            action: "complete",
                            name: renderName(charge),
                          });
                          setStaffInitialsDialogOpen(true);
                        }}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedCharge({
                            id: charge.id,
                            type: "power-cart",
                            action: "delete",
                            name: renderName(charge),
                          });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <div>
        <h4 className="mb-4 text-sm font-medium">General Charges</h4>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Payment Method</TableHead>
                <TableHead>Sponsor</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generalCharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center">
                    No pending general charges
                  </TableCell>
                </TableRow>
              ) : (
                generalCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>{formatCalendarDate(charge.date)}</TableCell>
                    <TableCell>{renderName(charge)}</TableCell>
                    <TableCell>{charge.chargeType}</TableCell>
                    <TableCell>{charge.paymentMethod || "-"}</TableCell>
                    <TableCell>
                      {charge.sponsorMember
                        ? `${charge.sponsorMember.firstName} ${charge.sponsorMember.lastName}`
                        : "-"}
                    </TableCell>
                    <TableCell className="space-x-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          setSelectedCharge({
                            id: charge.id,
                            type: "general",
                            action: "complete",
                            name: renderName(charge),
                          });
                          setStaffInitialsDialogOpen(true);
                        }}
                      >
                        Complete
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          setSelectedCharge({
                            id: charge.id,
                            type: "general",
                            action: "delete",
                            name: renderName(charge),
                          });
                          setDeleteDialogOpen(true);
                        }}
                      >
                        Delete
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDelete}
        title="Delete Charge"
        description="This action cannot be undone and will permanently delete this charge."
        itemName={selectedCharge?.name}
      />

      <StaffInitialsDialog
        open={staffInitialsDialogOpen}
        onOpenChange={setStaffInitialsDialogOpen}
        onConfirm={handleComplete}
      />
    </div>
  );
}
