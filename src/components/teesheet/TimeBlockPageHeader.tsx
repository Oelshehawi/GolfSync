"use client";

import { format } from "date-fns";
import { ChevronLeft, Calendar } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useRouter } from "next/navigation";
import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";

interface TimeBlockPageHeaderProps {
  timeBlock: TimeBlockWithMembers;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function TimeBlockPageHeader({
  timeBlock,
  theme,
}: TimeBlockPageHeaderProps) {
  const router = useRouter();

  return (
    <div className="flex items-center space-x-4 border-b pb-4">
      <Button
        variant="outline"
        size="sm"
        theme={theme}
        onClick={() => router.back()}
      >
        <ChevronLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div className="flex items-center space-x-2">
        <Calendar className="h-5 w-5 text-gray-500" />
        <h1 className="text-2xl font-bold">
          Manage Time Block - {format(new Date(timeBlock.startTime), "h:mm a")}
        </h1>
      </div>
    </div>
  );
}
