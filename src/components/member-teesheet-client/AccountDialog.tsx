import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Member } from "~/app/types/MemberTypes";

interface AccountDialogProps {
  member: Member | null;
  isOpen: boolean;
  onClose: () => void;
}

export function AccountDialog({ member, isOpen, onClose }: AccountDialogProps) {
  if (!member) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>My Account</DialogTitle>
        </DialogHeader>

        <div className="mt-4 space-y-4">
          <div>
            <h3 className="text-lg font-medium">Member Information</h3>
            <div className="mt-2 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-500">Name</div>
                <div className="text-sm">
                  {member.firstName} {member.lastName}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-500">
                  Username
                </div>
                <div className="text-sm">{member.username}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-500">Email</div>
                <div className="text-sm">{member.email}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-500">
                  Member #
                </div>
                <div className="text-sm">{member.memberNumber}</div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-sm font-medium text-gray-500">
                  Member Class
                </div>
                <div className="text-sm">{member.class}</div>
              </div>
              {member.gender && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">
                    Gender
                  </div>
                  <div className="text-sm">{member.gender}</div>
                </div>
              )}
              {member.dateOfBirth && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">
                    Date of Birth
                  </div>
                  <div className="text-sm">
                    {new Date(member.dateOfBirth).toLocaleDateString()}
                  </div>
                </div>
              )}
              {member.handicap && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">
                    Handicap
                  </div>
                  <div className="text-sm">{member.handicap}</div>
                </div>
              )}
              {member.bagNumber && (
                <div className="grid grid-cols-2 gap-2">
                  <div className="text-sm font-medium text-gray-500">Bag #</div>
                  <div className="text-sm">{member.bagNumber}</div>
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
