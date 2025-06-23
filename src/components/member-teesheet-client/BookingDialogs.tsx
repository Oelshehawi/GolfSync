"use client";

import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "~/components/ui/dialog";
import { Loader2 } from "lucide-react";

interface BookingDialogsProps {
  bookingTimeBlockId: number | null;
  cancelTimeBlockId: number | null;
  loading: boolean;
  onBookConfirm: () => void;
  onCancelConfirm: () => void;
  onBookingClose: () => void;
  onCancelClose: () => void;
}

export function BookingDialogs({
  bookingTimeBlockId,
  cancelTimeBlockId,
  loading,
  onBookConfirm,
  onCancelConfirm,
  onBookingClose,
  onCancelClose,
}: BookingDialogsProps) {
  return (
    <>
      {/* Booking Confirmation Dialog */}
      <Dialog
        open={bookingTimeBlockId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) onBookingClose();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Book Tee Time</DialogTitle>
            <DialogDescription>
              Confirm your booking for this tee time?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onBookingClose}
              disabled={loading}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={onBookConfirm}
              disabled={loading}
              className="bg-org-primary hover:bg-org-primary/90 flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Booking...
                </>
              ) : (
                "Confirm"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        open={cancelTimeBlockId !== null}
        onOpenChange={(isOpen) => {
          if (!isOpen) onCancelClose();
        }}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Cancel Booking</DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this tee time?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={onCancelClose}
              disabled={loading}
              className="flex-1"
            >
              Keep Booking
            </Button>
            <Button
              variant="destructive"
              onClick={onCancelConfirm}
              disabled={loading}
              className="flex-1"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cancelling...
                </>
              ) : (
                "Cancel Booking"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
