"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "~/components/ui/dialog";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";

interface StaffInitialsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (initials: string) => void;
}

export function StaffInitialsDialog({
  open,
  onOpenChange,
  onConfirm,
}: StaffInitialsDialogProps) {
  const [initials, setInitials] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (initials.trim()) {
      onConfirm(initials.trim().toUpperCase());
      setInitials("");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Enter Staff Initials</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="initials">Staff Initials</Label>
              <Input
                id="initials"
                value={initials}
                onChange={(e) => setInitials(e.target.value)}
                placeholder="Enter your initials"
                maxLength={10}
                className="uppercase"
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={!initials.trim()}>
              Complete Charge
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
