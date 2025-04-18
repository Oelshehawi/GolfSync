import { UserMinus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import type { TimeBlockMemberView } from "~/app/types/TeeSheetTypes";

interface MemberListProps {
  members: TimeBlockMemberView[];
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
  if (members.length === 0) {
    return (
      <Card theme={theme}>
        <CardHeader>
          <CardTitle theme={theme}>No Members</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-500">
            No members have been added to this time block yet.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card theme={theme}>
      <CardHeader>
        <CardTitle theme={theme}>Members ({members.length}/4)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {members.map((member) => (
            <div
              key={member.id}
              className="flex items-center justify-between rounded-lg border p-3"
            >
              <div>
                <p className="font-medium">
                  {member.firstName} {member.lastName}
                </p>
                <p className="text-sm text-gray-500">#{member.memberNumber}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => onRemoveMember(member.id)}
                theme={theme}
              >
                <UserMinus className="mr-2 h-4 w-4" />
                Remove
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
