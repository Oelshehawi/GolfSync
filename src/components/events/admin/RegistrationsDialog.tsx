"use client";

import { useState } from "react";
import { Check, Search, X } from "lucide-react";
import { format } from "date-fns";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "~/components/ui/table";
import { Badge } from "~/components/ui/badge";
import { Textarea } from "~/components/ui/textarea";
import { Label } from "~/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { updateRegistrationStatus } from "~/server/events/actions";
import toast from "react-hot-toast";

interface RegistrationDialogProps {
  eventId: number;
  eventName: string;
  registrations: any[];
  requiresApproval: boolean;
  capacity?: number | null;
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
}

export default function RegistrationsDialog({
  eventId,
  eventName,
  registrations,
  requiresApproval,
  capacity,
  isOpen,
  onOpenChange,
}: RegistrationDialogProps) {
  const [registrationsState, setRegistrationsState] = useState(registrations);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isProcessing, setIsProcessing] = useState(false);

  // Dialog state for changing status
  const [isStatusDialogOpen, setIsStatusDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<any>(null);
  const [statusNotes, setStatusNotes] = useState("");
  const [newStatus, setNewStatus] = useState<
    "APPROVED" | "PENDING" | "REJECTED"
  >("APPROVED");

  // Filter registrations based on search term and status filter
  const filteredRegistrations = registrationsState.filter((reg) => {
    const matchesSearch =
      reg.member.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.member.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      reg.member.memberNumber
        ?.toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      (reg.notes && reg.notes.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = filterStatus === "ALL" || reg.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  // Count registrations by status
  const statusCounts = {
    APPROVED: registrationsState.filter((r) => r.status === "APPROVED").length,
    PENDING: registrationsState.filter((r) => r.status === "PENDING").length,
    REJECTED: registrationsState.filter((r) => r.status === "REJECTED").length,
  };

  // Open dialog to change registration status
  const openStatusDialog = (
    registration: any,
    initialStatus: "APPROVED" | "PENDING" | "REJECTED",
  ) => {
    setSelectedRegistration(registration);
    setNewStatus(initialStatus);
    setStatusNotes(registration.notes || "");
    setIsStatusDialogOpen(true);
  };

  // Handle status change
  const handleStatusChange = async () => {
    if (!selectedRegistration) return;

    setIsProcessing(true);
    try {
      const result = await updateRegistrationStatus(
        selectedRegistration.id,
        newStatus,
        statusNotes,
      );

      if (result.success) {
        // Update local state
        setRegistrationsState((prevRegistrations) =>
          prevRegistrations.map((reg) =>
            reg.id === selectedRegistration.id
              ? { ...reg, status: newStatus, notes: statusNotes }
              : reg,
          ),
        );

        toast.success(`Registration ${newStatus.toLowerCase()} successfully`);
        setIsStatusDialogOpen(false);
      } else {
        toast.error(result.error || "Failed to update registration status");
      }
    } catch (error) {
      console.error("Error updating registration status:", error);
      toast.error("An error occurred while updating registration status");
    } finally {
      setIsProcessing(false);
    }
  };

  // Get background color for status badge
  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "success";
      case "PENDING":
        return "warning";
      case "REJECTED":
        return "destructive";
      default:
        return "default";
    }
  };

  // Get button text for dialog based on status
  const getStatusDialogTitle = (status: string) => {
    switch (status) {
      case "APPROVED":
        return "Approve Registration";
      case "PENDING":
        return "Set to Pending";
      case "REJECTED":
        return "Reject Registration";
      default:
        return "Update Registration";
    }
  };

  // Get button text for action based on status
  const getStatusActionText = (status: string, processing: boolean) => {
    if (processing) return "Processing...";

    switch (status) {
      case "APPROVED":
        return "Approve Registration";
      case "PENDING":
        return "Set to Pending";
      case "REJECTED":
        return "Reject Registration";
      default:
        return "Update Status";
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl">Event Registrations</DialogTitle>
          <DialogDescription>
            Manage registrations for {eventName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row">
            <div className="relative w-full sm:w-2/3">
              <Search className="text-muted-foreground absolute top-2.5 left-2 h-4 w-4" />
              <Input
                placeholder="Search by name or member number"
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <div className="w-full sm:w-1/3">
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ALL">
                    All Statuses ({registrationsState.length})
                  </SelectItem>
                  <SelectItem value="PENDING">
                    Pending ({statusCounts.PENDING})
                  </SelectItem>
                  <SelectItem value="APPROVED">
                    Approved ({statusCounts.APPROVED})
                  </SelectItem>
                  <SelectItem value="REJECTED">
                    Rejected ({statusCounts.REJECTED})
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="mb-6 rounded-md border">
            <div className="bg-muted/50 grid grid-cols-4 gap-4 p-4">
              <div>
                <p className="text-sm font-medium">Total Registrations</p>
                <p className="text-2xl font-bold">
                  {registrationsState.length}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium">Approved</p>
                <p className="text-2xl font-bold">{statusCounts.APPROVED}</p>
                {capacity && (
                  <p className="text-muted-foreground text-xs">
                    {statusCounts.APPROVED} of {capacity} spots filled
                  </p>
                )}
              </div>
              <div>
                <p className="text-sm font-medium">Pending</p>
                <p className="text-2xl font-bold">{statusCounts.PENDING}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Rejected</p>
                <p className="text-2xl font-bold">{statusCounts.REJECTED}</p>
              </div>
            </div>
          </div>

          {filteredRegistrations.length === 0 ? (
            <div className="bg-muted/10 rounded-md border p-8 text-center">
              <p className="text-muted-foreground">No registrations found.</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Registration Date</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRegistrations.map((registration) => (
                    <TableRow key={registration.id}>
                      <TableCell>
                        <div className="font-medium">
                          {registration.member.firstName}{" "}
                          {registration.member.lastName}
                        </div>
                        <div className="text-muted-foreground text-sm">
                          #{registration.member.memberNumber}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            getStatusBadgeVariant(registration.status) as any
                          }
                        >
                          {registration.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {format(
                          new Date(registration.createdAt),
                          "MMM d, yyyy",
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="max-w-[200px] truncate">
                          {registration.notes || "—"}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          {registration.status === "PENDING" && (
                            <>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 border-green-500 text-green-500 hover:bg-green-50 hover:text-green-600"
                                onClick={() =>
                                  openStatusDialog(registration, "APPROVED")
                                }
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8 border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                                onClick={() =>
                                  openStatusDialog(registration, "REJECTED")
                                }
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                          {registration.status !== "PENDING" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() =>
                                openStatusDialog(
                                  registration,
                                  registration.status as
                                    | "APPROVED"
                                    | "PENDING"
                                    | "REJECTED",
                                )
                              }
                            >
                              Update
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </DialogContent>

      {/* Status Change Dialog */}
      {selectedRegistration && (
        <Dialog open={isStatusDialogOpen} onOpenChange={setIsStatusDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>{getStatusDialogTitle(newStatus)}</DialogTitle>
              <DialogDescription>
                Update registration status for this event
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              <div>
                <p className="font-semibold">
                  {selectedRegistration.member.firstName}{" "}
                  {selectedRegistration.member.lastName}
                </p>
                <p className="text-muted-foreground text-sm">
                  #{selectedRegistration.member.memberNumber}
                </p>
              </div>

              <div>
                <Label htmlFor="status">Status</Label>
                <Select
                  value={newStatus}
                  onValueChange={(value: "APPROVED" | "PENDING" | "REJECTED") =>
                    setNewStatus(value)
                  }
                >
                  <SelectTrigger id="status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="status-notes">Notes (Optional)</Label>
                <Textarea
                  id="status-notes"
                  placeholder="Add notes about this registration"
                  value={statusNotes}
                  onChange={(e) => setStatusNotes(e.target.value)}
                  className="mt-1"
                />
              </div>
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsStatusDialogOpen(false)}
                disabled={isProcessing}
              >
                Cancel
              </Button>
              <Button
                variant={
                  newStatus === "APPROVED"
                    ? "default"
                    : newStatus === "PENDING"
                      ? "outline"
                      : "destructive"
                }
                onClick={handleStatusChange}
                disabled={isProcessing}
              >
                {getStatusActionText(newStatus, isProcessing)}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </Dialog>
  );
}
