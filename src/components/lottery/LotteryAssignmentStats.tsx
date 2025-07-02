"use client";

import { Badge } from "~/components/ui/badge";

interface LotteryAssignmentStatsProps {
  totalAssigned: number;
  totalUnassigned: number;
}

export function LotteryAssignmentStats({
  totalAssigned,
  totalUnassigned,
}: LotteryAssignmentStatsProps) {
  return (
    <div className="flex gap-2">
      <Badge variant="default" className="bg-green-100 text-green-800">
        {totalAssigned} Assigned
      </Badge>
      {totalUnassigned > 0 && (
        <Badge variant="secondary" className="bg-yellow-100 text-yellow-800">
          {totalUnassigned} Unassigned
        </Badge>
      )}
    </div>
  );
}
