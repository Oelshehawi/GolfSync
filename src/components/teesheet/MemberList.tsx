import { UserMinus, UserPlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "~/components/ui/avatar";
import type { Member } from "~/app/types/TeeSheetTypes";

interface MemberListProps {
  members: Member[];
  onRemoveMember: (memberId: number) => void;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function MemberList({
  members,
  onRemoveMember,
  theme,
}: MemberListProps) {
  return (
    <Card theme={theme}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2" theme={theme}>
          <UserPlus className="h-5 w-5" style={{ color: theme?.primary }} />
          <span>Current Members</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.length > 0 ? (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
              >
                <div className="flex items-center space-x-3">
                  <Avatar>
                    <AvatarImage src={member.avatarUrl} />
                    <AvatarFallback>
                      {member.firstName[0]}
                      {member.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">
                      {member.firstName} {member.lastName}
                    </p>
                    <p className="text-sm text-gray-500">
                      #{member.memberNumber}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveMember(member.id)}
                  theme={theme}
                  style={{
                    color: theme?.primary,
                  }}
                  className="hover:bg-secondary"
                >
                  <UserMinus className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            ))
          ) : (
            <div className="rounded-lg border border-dashed p-4 text-center text-gray-500">
              No members booked for this time block
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
