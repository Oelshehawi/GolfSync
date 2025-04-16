"use client";

import { format } from "date-fns";
import Link from "next/link";
import type { TimeBlock as TimeBlockType } from "~/app/types/TeeSheetTypes";

interface TimeBlockProps {
  timeBlock: TimeBlockType;
}

export function TimeBlock({ timeBlock }: TimeBlockProps) {
  const formattedTime = format(new Date(timeBlock.startTime), "h:mm a");

  return (
    <Link
      href={`/admin/timeblock/${timeBlock.id}`}
      className="block rounded-lg border p-4 transition-all hover:border-blue-500 hover:bg-blue-50 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold text-gray-800">
          {formattedTime}
        </span>
        <span className="text-sm text-gray-500">
          {timeBlock.members.length}/4 spots
        </span>
      </div>

      {timeBlock.members.length > 0 ? (
        <div className="mt-2 space-y-1">
          {timeBlock.members.map((member) => (
            <div
              key={member.id}
              className="text-sm text-gray-600 transition-colors group-hover:text-gray-800"
            >
              {member.firstName} {member.lastName} ({member.memberNumber})
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-sm text-gray-400">Available</div>
      )}
    </Link>
  );
}
