"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Move } from "lucide-react";

interface ClientSideAssignment {
  id: string;
  name: string;
  entryId: number;
  isGroup: boolean;
  members?: string[];
  memberClass?: string;
  memberClasses?: { name: string; class: string }[];
  preferredWindow?: string;
  size: number;
}

interface SidebarEntryProps {
  entry: ClientSideAssignment;
  isDragging?: boolean;
  showPreferredTime?: boolean;
}

interface LotteryUnassignedSidebarProps {
  unassignedEntries: ClientSideAssignment[];
  SidebarEntryComponent: React.ComponentType<SidebarEntryProps>;
}

export function LotteryUnassignedSidebar({
  unassignedEntries,
  SidebarEntryComponent,
}: LotteryUnassignedSidebarProps) {
  const totalUnassigned = unassignedEntries.length;

  if (totalUnassigned === 0) {
    return null;
  }

  return (
    <div className="col-span-3">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Move className="h-4 w-4" />
            Unassigned Entries ({totalUnassigned})
          </CardTitle>
        </CardHeader>
        <CardContent className="max-h-96 space-y-3 overflow-y-auto">
          <SortableContext
            items={unassignedEntries.map((e) => e.id)}
            strategy={verticalListSortingStrategy}
          >
            {unassignedEntries.map((entry) => (
              <SidebarEntryComponent
                key={entry.id}
                entry={entry}
                showPreferredTime={true}
              />
            ))}
          </SortableContext>
        </CardContent>
      </Card>
    </div>
  );
}
