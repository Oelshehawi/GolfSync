import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { Badge } from "~/components/ui/badge";
import { Card, CardContent } from "~/components/ui/card";
import { Member } from "~/app/types/MemberTypes";
import { TimeBlockMemberView } from "~/app/types/TeeSheetTypes";
import { TimeBlockGuest } from "~/app/types/GuestTypes";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Trophy,
  CreditCard,
  UserCircle,
  Hash,
  Users,
} from "lucide-react";

type AccountData = Member | TimeBlockMemberView | TimeBlockGuest | null;

interface AccountDialogProps {
  member: AccountData;
  isOpen: boolean;
  onClose: () => void;
}

// Type guard functions
const isMember = (data: AccountData): data is Member => {
  return data !== null && "clerkOrgId" in data;
};

const isTimeBlockMember = (data: AccountData): data is TimeBlockMemberView => {
  return data !== null && "username" in data && !("clerkOrgId" in data);
};

const isGuest = (data: AccountData): data is TimeBlockGuest => {
  return data !== null && "invitedByMember" in data;
};

export function AccountDialog({ member, isOpen, onClose }: AccountDialogProps) {
  if (!member) return null;

  const isGuestAccount = isGuest(member);
  const isMemberAccount = isMember(member) || isTimeBlockMember(member);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader className="space-y-3">
          <DialogTitle className="flex items-center gap-2 text-xl">
            {isGuestAccount ? (
              <Users className="h-5 w-5 text-blue-600" />
            ) : (
              <UserCircle className="h-5 w-5 text-green-600" />
            )}
            {isGuestAccount ? "Guest Information" : "Member Account"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Main Info Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-4">
              <div className="space-y-3">
                {/* Name */}
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-gray-500" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Name</p>
                    <p className="font-semibold">
                      {member.firstName} {member.lastName}
                    </p>
                  </div>
                </div>

                {/* Member-specific fields */}
                {isMemberAccount && !isGuestAccount && (
                  <>
                    {/* Username */}
                    {"username" in member && (
                      <div className="flex items-center gap-3">
                        <Hash className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Username
                          </p>
                          <p className="font-medium">{member.username}</p>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {"email" in member && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Email
                          </p>
                          <p className="font-medium">{member.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Member Number */}
                    {"memberNumber" in member && (
                      <div className="flex items-center gap-3">
                        <CreditCard className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Member #
                          </p>
                          <p className="font-medium">{member.memberNumber}</p>
                        </div>
                      </div>
                    )}

                    {/* Member Class */}
                    {"class" in member && member.class && (
                      <div className="flex items-center gap-3">
                        <Trophy className="h-4 w-4 text-gray-500" />
                        <div className="flex items-center gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-600">
                              Member Class
                            </p>
                            <Badge variant="outline" className="mt-1">
                              {member.class}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    )}
                  </>
                )}

                {/* Guest-specific fields */}
                {isGuestAccount && (
                  <>
                    {/* Email */}
                    {member.email && (
                      <div className="flex items-center gap-3">
                        <Mail className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Email
                          </p>
                          <p className="font-medium">{member.email}</p>
                        </div>
                      </div>
                    )}

                    {/* Phone */}
                    {member.phone && (
                      <div className="flex items-center gap-3">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Phone
                          </p>
                          <p className="font-medium">{member.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Invited By */}
                    {member.invitedByMember && (
                      <div className="flex items-center gap-3">
                        <Users className="h-4 w-4 text-gray-500" />
                        <div>
                          <p className="text-sm font-medium text-gray-600">
                            Invited By
                          </p>
                          <p className="font-medium">
                            {member.invitedByMember.firstName}{" "}
                            {member.invitedByMember.lastName}
                            <span className="ml-1 text-sm text-gray-500">
                              (#{member.invitedByMember.memberNumber})
                            </span>
                          </p>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Additional Info Card - Only for members with extra data */}
          {isMemberAccount && !isGuestAccount && (
            <Card>
              <CardContent className="pt-4">
                <h3 className="mb-3 font-medium text-gray-900">
                  Additional Information
                </h3>
                <div className="space-y-3">
                  {/* Gender */}
                  {"gender" in member && member.gender && (
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Gender
                        </p>
                        <p className="font-medium">{member.gender}</p>
                      </div>
                    </div>
                  )}

                  {/* Date of Birth */}
                  {"dateOfBirth" in member && member.dateOfBirth && (
                    <div className="flex items-center gap-3">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Date of Birth
                        </p>
                        <p className="font-medium">
                          {new Date(member.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Handicap */}
                  {"handicap" in member && member.handicap && (
                    <div className="flex items-center gap-3">
                      <Trophy className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Handicap
                        </p>
                        <Badge variant="secondary" className="mt-1">
                          {member.handicap}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Bag Number */}
                  {"bagNumber" in member && member.bagNumber && (
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-4 w-4 text-gray-500" />
                      <div>
                        <p className="text-sm font-medium text-gray-600">
                          Bag #
                        </p>
                        <p className="font-medium">{member.bagNumber}</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Check-in Status */}
          {"checkedIn" in member && (
            <Card
              className={`border-l-4 ${member.checkedIn ? "border-l-green-500 bg-green-50" : "border-l-gray-300"}`}
            >
              <CardContent className="pt-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`h-3 w-3 rounded-full ${member.checkedIn ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-600">
                      Check-in Status
                    </p>
                    <p
                      className={`font-medium ${member.checkedIn ? "text-green-700" : "text-gray-600"}`}
                    >
                      {member.checkedIn ? "Checked In" : "Not Checked In"}
                    </p>
                    {"checkedInAt" in member &&
                      member.checkedInAt &&
                      member.checkedIn && (
                        <p className="mt-1 text-xs text-gray-500">
                          at {new Date(member.checkedInAt).toLocaleTimeString()}
                        </p>
                      )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={onClose} className="px-6">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
