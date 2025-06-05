"use client";

import { Badge } from "~/components/ui/badge";
import { type PaceOfPlayStatus } from "~/app/types/PaceOfPlayTypes";

interface PaceOfPlayStatusProps {
  status: PaceOfPlayStatus;
  className?: string;
}

export function PaceOfPlayStatus({ status, className }: PaceOfPlayStatusProps) {
  // Status badge mapping
  const statusConfig: Record<
    PaceOfPlayStatus,
    {
      variant: "default" | "outline" | "secondary" | "destructive";
      label: string;
    }
  > = {
    pending: { variant: "outline", label: "Pending" },
    on_time: { variant: "secondary", label: "On Time" },
    behind: { variant: "destructive", label: "Behind" },
    ahead: { variant: "default", label: "Ahead" },
    completed: { variant: "default", label: "Done" },
    completed_on_time: { variant: "secondary", label: "Done On Time" },
    completed_early: { variant: "default", label: "Done Early" },
    completed_late: { variant: "destructive", label: "Done Late" },
  };

  const config = statusConfig[status] || statusConfig.pending;

  return (
    <Badge variant={config.variant} className={className}>
      {config.label}
    </Badge>
  );
}

export function getStatusColor(status: PaceOfPlayStatus): string {
  switch (status) {
    case "on_time":
    case "completed_on_time":
      return "text-yellow-600";
    case "behind":
    case "completed_late":
      return "text-red-600";
    case "ahead":
    case "completed_early":
      return "text-green-600";
    case "completed":
      return "text-blue-600";
    default:
      return "text-gray-600";
  }
}
