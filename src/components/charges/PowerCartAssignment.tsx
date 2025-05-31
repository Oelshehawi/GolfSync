"use client";

import { useState } from "react";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { Switch } from "~/components/ui/switch";
import { type PowerCartAssignmentData } from "~/app/types/ChargeTypes";

interface PowerCartAssignmentProps {
  memberId?: number;
  guestId?: number;
  onAssign: (data: PowerCartAssignmentData) => Promise<void>;
}

export function PowerCartAssignment({
  memberId,
  guestId,
  onAssign,
}: PowerCartAssignmentProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSplit, setIsSplit] = useState(false);
  const [isMedical, setIsMedical] = useState(false);
  const [numHoles, setNumHoles] = useState<9 | 18>(18);
  const [staffInitials, setStaffInitials] = useState("");
  const [splitWithMemberId, setSplitWithMemberId] = useState<string>("");

  const handleSubmit = async () => {
    await onAssign({
      memberId,
      guestId,
      numHoles,
      isSplit,
      splitWithMemberId: isSplit ? parseInt(splitWithMemberId) : undefined,
      isMedical,
      staffInitials,
      date: new Date(),
    });
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Assign Cart
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign Power Cart</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Holes</Label>
            <div className="col-span-3 flex gap-4">
              <Button
                variant={numHoles === 9 ? "default" : "outline"}
                onClick={() => setNumHoles(9)}
              >
                9 Holes
              </Button>
              <Button
                variant={numHoles === 18 ? "default" : "outline"}
                onClick={() => setNumHoles(18)}
              >
                18 Holes
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Split Cart</Label>
            <Switch
              checked={isSplit}
              onCheckedChange={setIsSplit}
              className="col-span-3"
            />
          </div>

          {isSplit && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">Split With Member #</Label>
              <Input
                value={splitWithMemberId}
                onChange={(e) => setSplitWithMemberId(e.target.value)}
                className="col-span-3"
              />
            </div>
          )}

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Medical</Label>
            <Switch
              checked={isMedical}
              onCheckedChange={setIsMedical}
              className="col-span-3"
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Staff Initials</Label>
            <Input
              value={staffInitials}
              onChange={(e) => setStaffInitials(e.target.value)}
              className="col-span-3"
              maxLength={10}
            />
          </div>
        </div>
        <div className="flex justify-end gap-4">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit}>Assign Cart</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
