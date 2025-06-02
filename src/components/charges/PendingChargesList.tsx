"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { formatCalendarDate } from "~/lib/utils";
import {
  type PowerCartChargeWithRelations,
  type GeneralChargeWithRelations,
  type ChargeType,
} from "~/app/types/ChargeTypes";
import { MoreHorizontal } from "lucide-react";
import { toast } from "react-hot-toast";
import { DeleteConfirmationDialog } from "~/components/ui/delete-confirmation-dialog";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import {
  completePowerCartCharge,
  completeGeneralCharge,
  deletePowerCartCharge,
  deleteGeneralCharge,
} from "~/server/charges/actions";
import { type PaymentMethod } from "~/server/db/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";

interface PendingChargesListProps {
  powerCartCharges: PowerCartChargeWithRelations[];
  generalCharges: GeneralChargeWithRelations[];
}

export function PendingChargesList({
  powerCartCharges,
  generalCharges,
}: PendingChargesListProps) {
  const [completeChargeDialogOpen, setCompleteChargeDialogOpen] =
    useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCharge, setSelectedCharge] = useState<{
    id: number;
    type: ChargeType;
    name: ReactNode;
  } | null>(null);
  const [paymentMethod, setPaymentMethod] =
    useState<(typeof PaymentMethod.enumValues)[number]>("ACCOUNT");
  const [staffInitials, setStaffInitials] = useState("");

  const renderName = (
    charge: PowerCartChargeWithRelations | GeneralChargeWithRelations,
  ): React.ReactNode => {
    if (charge.member?.firstName && charge.member?.lastName) {
      return (
        <>
          {charge.member.firstName} {charge.member.lastName}
          {charge.member.memberNumber && (
            <>
              {" "}
              (<strong>{charge.member.memberNumber}</strong>)
            </>
          )}
        </>
      );
    }
    if (charge.guest?.firstName && charge.guest?.lastName) {
      return `${charge.guest.firstName} ${charge.guest.lastName} (Guest)`;
    }
    return "-";
  };

  const renderSponsorMember = (
    member: {
      firstName: string | null;
      lastName: string | null;
      memberNumber: string | null;
    } | null,
  ): React.ReactNode => {
    if (member?.firstName && member?.lastName) {
      return (
        <>
          {member.firstName} {member.lastName}
          {member.memberNumber && (
            <>
              {" "}
              (<strong>{member.memberNumber}</strong>)
            </>
          )}
        </>
      );
    }
    return "-";
  };

  const handleCompleteCharge = async () => {
    if (!selectedCharge || !staffInitials.trim()) return;

    try {
      if (selectedCharge.type === "power-cart") {
        await completePowerCartCharge({
          id: selectedCharge.id,
          staffInitials,
        });
      } else {
        if (!paymentMethod) return;
        await completeGeneralCharge({
          id: selectedCharge.id,
          staffInitials,
          paymentMethod,
        });
      }
      toast.success("Charge completed successfully");
      setCompleteChargeDialogOpen(false);
      setStaffInitials("");
      setPaymentMethod("ACCOUNT");
      setSelectedCharge(null);
    } catch (error) {
      console.error("Error completing charge:", error);
      toast.error("Failed to complete charge");
    }
  };

  const handleDeleteCharge = async () => {
    if (!selectedCharge) return;

    try {
      if (selectedCharge.type === "power-cart") {
        await deletePowerCartCharge(selectedCharge.id);
      } else {
        await deleteGeneralCharge(selectedCharge.id);
      }
      toast.success("Charge deleted successfully");
      setDeleteDialogOpen(false);
      setSelectedCharge(null);
    } catch (error) {
      console.error("Error deleting charge:", error);
      toast.error("Failed to delete charge");
    }
  };

  return (
    <div className="space-y-4">
      <Tabs defaultValue="power-cart" className="space-y-4">
        <TabsList>
          <TabsTrigger value="power-cart">Power Cart Charges</TabsTrigger>
          <TabsTrigger value="general">General Charges</TabsTrigger>
        </TabsList>

        <TabsContent value="power-cart">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Split With</TableHead>
                <TableHead>Medical</TableHead>
                <TableHead className="w-[50px]"></TableHead>
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
                      {charge.splitWithMember && (
                        <>
                          {charge.splitWithMember.firstName}{" "}
                          {charge.splitWithMember.lastName}
                          {charge.splitWithMember.memberNumber && (
                            <>
                              {" "}
                              (
                              <strong>
                                {charge.splitWithMember.memberNumber}
                              </strong>
                              )
                            </>
                          )}
                        </>
                      )}
                      {!charge.splitWithMember && "-"}
                    </TableCell>
                    <TableCell>{charge.isMedical ? "Yes" : "No"}</TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCharge({
                                id: charge.id,
                                type: "power-cart",
                                name: renderName(charge),
                              });
                              setCompleteChargeDialogOpen(true);
                            }}
                          >
                            Complete Charge
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedCharge({
                                id: charge.id,
                                type: "power-cart",
                                name: renderName(charge),
                              });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="general">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Sponsor</TableHead>
                <TableHead className="w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {generalCharges.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No pending general charges
                  </TableCell>
                </TableRow>
              ) : (
                generalCharges.map((charge) => (
                  <TableRow key={charge.id}>
                    <TableCell>{formatCalendarDate(charge.date)}</TableCell>
                    <TableCell>{renderName(charge)}</TableCell>
                    <TableCell>{charge.chargeType}</TableCell>
                    <TableCell>
                      {charge.sponsorMember && (
                        <>{renderSponsorMember(charge.sponsorMember)}</>
                      )}
                      {!charge.sponsorMember && "-"}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedCharge({
                                id: charge.id,
                                type: "general",
                                name: renderName(charge),
                              });
                              setCompleteChargeDialogOpen(true);
                            }}
                          >
                            Complete Charge
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => {
                              setSelectedCharge({
                                id: charge.id,
                                type: "general",
                                name: renderName(charge),
                              });
                              setDeleteDialogOpen(true);
                            }}
                          >
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Complete Charge Dialog */}
      <Dialog
        open={completeChargeDialogOpen}
        onOpenChange={setCompleteChargeDialogOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Charge</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="staffInitials">Staff Initials</Label>
              <Input
                id="staffInitials"
                value={staffInitials}
                onChange={(e) => setStaffInitials(e.target.value)}
                placeholder="Enter staff initials"
                maxLength={10}
                className="uppercase"
              />
            </div>
            {selectedCharge?.type === "general" && (
              <div className="grid gap-2">
                <Label>Payment Method</Label>
                <Select
                  value={paymentMethod}
                  onValueChange={(value) =>
                    setPaymentMethod(
                      value as (typeof PaymentMethod.enumValues)[number],
                    )
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select payment method" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ACCOUNT">Account</SelectItem>
                    <SelectItem value="VISA">Visa</SelectItem>
                    <SelectItem value="MASTERCARD">Mastercard</SelectItem>
                    <SelectItem value="DEBIT">Debit</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setCompleteChargeDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCompleteCharge}
              disabled={
                !staffInitials.trim() ||
                (selectedCharge?.type === "general" && !paymentMethod)
              }
            >
              Complete Charge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <DeleteConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={handleDeleteCharge}
        title="Delete Charge"
        description="This action cannot be undone and will permanently delete this charge."
        itemName={selectedCharge?.name}
      />
    </div>
  );
}
