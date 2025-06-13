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
  LogOut,
} from "lucide-react";
import { useClerk } from "@clerk/nextjs";

type AccountData = Member | TimeBlockMemberView | TimeBlockGuest | null;

interface AccountDialogProps {
  member: AccountData;
  isOpen: boolean;
  onClose: () => void;
  isMember: boolean;
}

// Type guard functions
const isMemberData = (data: AccountData): data is Member => {
  return data !== null;
};

const isTimeBlockMember = (data: AccountData): data is TimeBlockMemberView => {
  return data !== null && "username" in data;
};

const isGuest = (data: AccountData): data is TimeBlockGuest => {
  return data !== null && "invitedByMember" in data;
};

export function AccountDialog({
  member,
  isOpen,
  onClose,
  isMember,
}: AccountDialogProps) {
  const { signOut } = useClerk();

  const handleSignOut = () => {
    signOut(() => {
      window.location.href = "/";
    });
  };

  if (!member) return null;

  const isGuestAccount = isGuest(member);
  const isMemberAccount = isMemberData(member) || isTimeBlockMember(member);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}  >
      <DialogContent className="mx-4 max-w-sm sm:max-w-lg m-0">
        <DialogHeader className="space-y-2 pb-2">
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            {isGuestAccount ? (
              <Users className="h-4 w-4 text-blue-600 sm:h-5 sm:w-5" />
            ) : (
              <UserCircle className="h-4 w-4 text-green-600 sm:h-5 sm:w-5" />
            )}
            {isGuestAccount ? "Guest Information" : "Member Account"}
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-[70vh] space-y-3 overflow-y-auto">
          {/* Main Info Card */}
          <Card className="border-l-4 border-l-blue-500">
            <CardContent className="pt-3 pb-3">
              <div className="space-y-3">
                {/* Name */}
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 flex-shrink-0 text-gray-500" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-600">Name</p>
                    <p className="truncate text-sm font-semibold sm:text-base">
                      {member.firstName} {member.lastName}
                    </p>
                  </div>
                </div>

                {/* Member-specific fields */}
                {isMemberAccount && !isGuestAccount && (
                  <>
                    {/* Username */}
                    {"username" in member && (
                      <div className="flex items-center gap-2">
                        <Hash className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-600">
                            Username
                          </p>
                          <p className="truncate text-sm font-medium">
                            {member.username}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Email */}
                    {"email" in member && (
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-600">
                            Email
                          </p>
                          <p className="truncate text-sm font-medium">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Member Number */}
                    {"memberNumber" in member && (
                      <div className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-600">
                            Member #
                          </p>
                          <p className="text-sm font-medium">
                            {member.memberNumber}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Member Class */}
                    {"class" in member && member.class && (
                      <div className="flex items-center gap-2">
                        <Trophy className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-600">
                            Member Class
                          </p>
                          <Badge variant="outline" className="mt-1 text-xs">
                            {member.class}
                          </Badge>
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
                      <div className="flex items-center gap-2">
                        <Mail className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-600">
                            Email
                          </p>
                          <p className="truncate text-sm font-medium">
                            {member.email}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* Phone */}
                    {member.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-600">
                            Phone
                          </p>
                          <p className="text-sm font-medium">{member.phone}</p>
                        </div>
                      </div>
                    )}

                    {/* Invited By */}
                    {member.invitedByMember && (
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 flex-shrink-0 text-gray-500" />
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium text-gray-600">
                            Invited By
                          </p>
                          <p className="text-sm font-medium">
                            {member.invitedByMember.firstName}{" "}
                            {member.invitedByMember.lastName}
                            <span className="ml-1 text-xs text-gray-500">
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
              <CardContent className="pt-3 pb-3">
                <h3 className="mb-2 text-sm font-medium text-gray-900">
                  Additional Information
                </h3>
                <div className="space-y-3">
                  {/* Gender */}
                  {"gender" in member && member.gender && (
                    <div className="flex items-center gap-2">
                      <User className="h-4 w-4 flex-shrink-0 text-gray-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-600">
                          Gender
                        </p>
                        <p className="text-sm font-medium">{member.gender}</p>
                      </div>
                    </div>
                  )}

                  {/* Date of Birth */}
                  {"dateOfBirth" in member && member.dateOfBirth && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 flex-shrink-0 text-gray-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-600">
                          Date of Birth
                        </p>
                        <p className="text-sm font-medium">
                          {new Date(member.dateOfBirth).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Handicap */}
                  {"handicap" in member && member.handicap && (
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 flex-shrink-0 text-gray-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-600">
                          Handicap
                        </p>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {member.handicap}
                        </Badge>
                      </div>
                    </div>
                  )}

                  {/* Bag Number */}
                  {"bagNumber" in member && member.bagNumber && (
                    <div className="flex items-center gap-2">
                      <CreditCard className="h-4 w-4 flex-shrink-0 text-gray-500" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-gray-600">
                          Bag #
                        </p>
                        <p className="text-sm font-medium">
                          {member.bagNumber}
                        </p>
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
              <CardContent className="pt-3 pb-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`h-3 w-3 flex-shrink-0 rounded-full ${member.checkedIn ? "bg-green-500" : "bg-gray-300"}`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-gray-600">
                      Check-in Status
                    </p>
                    <p
                      className={`text-sm font-medium ${member.checkedIn ? "text-green-700" : "text-gray-600"}`}
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

          {/* Action Buttons */}
          <div className="sticky bottom-0 flex justify-between bg-white pt-2">
            <div className="flex gap-2">
              {/* Sign Out Button - Only for members */}
              {isMember && (
                <Button
                  variant="outline"
                  onClick={handleSignOut}
                  className="flex items-center gap-2 px-4 text-sm text-red-600 hover:bg-red-50 hover:text-red-700"
                >
                  <LogOut className="h-4 w-4" />
                  Sign Out
                </Button>
              )}
            </div>
            <Button variant="ghost" onClick={onClose} className="px-6 text-sm">
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
