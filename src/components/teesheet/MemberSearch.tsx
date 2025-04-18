"use client";

import { useState } from "react";
import { Search, UserPlus } from "lucide-react";
import { Input } from "~/components/ui/input";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { LoadingSpinner } from "~/components/ui/loading-spinner";
import type { Member } from "~/app/types/MemberTypes";

interface MemberSearchProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  searchResults: Member[];
  isLoading: boolean;
  onAddMember: (memberId: number) => void;
  isTimeBlockFull: boolean;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function MemberSearch({
  searchQuery,
  onSearch,
  searchResults,
  isLoading,
  onAddMember,
  isTimeBlockFull,
  theme,
}: MemberSearchProps) {
  const [localQuery, setLocalQuery] = useState(searchQuery);

  return (
    <Card theme={theme}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2" theme={theme}>
          <UserPlus className="h-5 w-5" style={{ color: theme?.primary }} />
          <span>Add Member</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="relative">
            <Search
              className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2"
              style={{ color: theme?.tertiary }}
            />
            <Input
              type="text"
              placeholder="Search members by name or number..."
              className="pl-9"
              value={localQuery}
              onChange={(e) => {
                setLocalQuery(e.target.value);
                onSearch(e.target.value);
              }}
              theme={theme}
            />
          </div>

          {isLoading ? (
            <div className="flex justify-center py-4">
              <LoadingSpinner theme={theme} />
            </div>
          ) : searchResults.length > 0 ? (
            <div className="space-y-3">
              {searchResults.map((member) => (
                <div
                  key={member.id}
                  className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
                >
                  <div className="flex items-center space-x-3">
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
                    size="sm"
                    onClick={() => onAddMember(member.id)}
                    disabled={isTimeBlockFull}
                    theme={theme}
                    style={{
                      backgroundColor: theme?.primary,
                      color: "#ffffff",
                    }}
                  >
                    <UserPlus className="mr-2 h-4 w-4" />
                    Add
                  </Button>
                </div>
              ))}
            </div>
          ) : localQuery ? (
            <div className="rounded-lg border border-dashed p-4 text-center text-gray-500">
              No members found matching your search
            </div>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
