"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Search } from "lucide-react";
import { LotteryIndividualEntriesList } from "./LotteryIndividualEntriesList";
import { LotteryGroupEntriesList } from "./LotteryGroupEntriesList";
import { LotteryEditDialog } from "./LotteryEditDialog";

interface LotteryEntryData {
  individual: any[];
  groups: any[];
}

interface LotteryAllEntriesProps {
  entries: LotteryEntryData;
  onCancelEntry: (entryId: number, isGroup: boolean) => void;
  getTimeWindowLabel: (window: string) => string;
  members: Array<{
    id: number;
    firstName: string;
    lastName: string;
    class: string;
  }>;
}

export function LotteryAllEntries({
  entries,
  onCancelEntry,
  getTimeWindowLabel,
  members,
}: LotteryAllEntriesProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [editDialog, setEditDialog] = useState<{
    open: boolean;
    entry: any | null;
    isGroup: boolean;
  }>({
    open: false,
    entry: null,
    isGroup: false,
  });

  // Filter and sort entries based on search term
  const filteredAndSortedEntries = useMemo(() => {
    // Filter and sort individual entries
    const filteredIndividual = entries.individual
      .filter((entry) => {
        if (!searchTerm) return true;
        const fullName =
          `${entry.member.firstName} ${entry.member.lastName}`.toLowerCase();
        return fullName.includes(searchTerm.toLowerCase());
      })
      .sort((a, b) => {
        const nameA =
          `${a.member.firstName} ${a.member.lastName}`.toLowerCase();
        const nameB =
          `${b.member.firstName} ${b.member.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

    // Filter and sort group entries
    const filteredGroups = entries.groups
      .filter((entry) => {
        if (!searchTerm) return true;
        const searchLower = searchTerm.toLowerCase();

        // Search in leader name
        const leaderName =
          `${entry.leader.firstName} ${entry.leader.lastName}`.toLowerCase();
        if (leaderName.includes(searchLower)) return true;

        // Search in group members if they exist
        if (entry.members && entry.members.length > 0) {
          return entry.members.some((member: any) => {
            const memberName =
              `${member.firstName} ${member.lastName}`.toLowerCase();
            return memberName.includes(searchLower);
          });
        }

        return false;
      })
      .sort((a, b) => {
        const nameA =
          `${a.leader.firstName} ${a.leader.lastName}`.toLowerCase();
        const nameB =
          `${b.leader.firstName} ${b.leader.lastName}`.toLowerCase();
        return nameA.localeCompare(nameB);
      });

    return {
      individual: filteredIndividual,
      groups: filteredGroups,
    };
  }, [entries, searchTerm]);

  const handleEditEntry = (entry: any, isGroup: boolean) => {
    setEditDialog({
      open: true,
      entry,
      isGroup,
    });
  };

  const handleCloseEdit = () => {
    setEditDialog({
      open: false,
      entry: null,
      isGroup: false,
    });
  };

  const totalEntries =
    filteredAndSortedEntries.individual.length +
    filteredAndSortedEntries.groups.length;

  return (
    <>
      <Card className="flex h-[800px] flex-col">
        <CardHeader className="flex-shrink-0">
          <CardTitle>All Lottery Entries</CardTitle>
          <div className="flex items-center gap-4">
            <div className="relative max-w-sm flex-1">
              <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                placeholder="Search players..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="text-sm text-gray-600">
              {totalEntries} {totalEntries === 1 ? "entry" : "entries"}
              {searchTerm &&
                ` (filtered from ${entries.individual.length + entries.groups.length})`}
            </div>
          </div>
        </CardHeader>
        <CardContent className="flex-1 overflow-hidden">
          <div className="h-full overflow-y-auto">
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Individual Entries Column */}
              <div>
                <LotteryIndividualEntriesList
                  entries={filteredAndSortedEntries.individual}
                  onCancelEntry={onCancelEntry}
                  onEditEntry={(entry) => handleEditEntry(entry, false)}
                  getTimeWindowLabel={getTimeWindowLabel}
                />
              </div>

              {/* Group Entries Column */}
              <div>
                <LotteryGroupEntriesList
                  entries={filteredAndSortedEntries.groups}
                  onCancelEntry={onCancelEntry}
                  onEditEntry={(entry) => handleEditEntry(entry, true)}
                  getTimeWindowLabel={getTimeWindowLabel}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <LotteryEditDialog
        open={editDialog.open}
        onClose={handleCloseEdit}
        entry={editDialog.entry}
        isGroup={editDialog.isGroup}
        members={members}
      />
    </>
  );
}
