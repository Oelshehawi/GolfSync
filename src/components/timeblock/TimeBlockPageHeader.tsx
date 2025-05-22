"use client";

import { format } from "date-fns";
import { ChevronLeft, Calendar } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";
import { formatDisplayTime } from "~/lib/utils";

interface TimeBlockPageHeaderProps {
  timeBlock: TimeBlockWithMembers;

}

export function TimeBlockPageHeader({
  timeBlock,
}: TimeBlockPageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center space-x-4 border-b pb-4">
      <div className="flex items-center space-x-2">
        <Calendar className="h-5 w-5 text-gray-500" />
        <h1 className="text-2xl font-bold">
          Manage Time Block - {formatDisplayTime(timeBlock.startTime)}
        </h1>
      </div>
    </div>
  );
}
