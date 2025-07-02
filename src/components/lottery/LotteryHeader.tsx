"use client";

import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { Clock, CheckCircle, Calendar, TrendingUp } from "lucide-react";
import { formatDate } from "~/lib/dates";

type ProcessingStatus = "pending" | "processing" | "completed";

interface ProcessingStatusInfo {
  title: string;
  description: string;
  color: "yellow" | "blue" | "green" | "gray";
  icon: React.ComponentType<any>;
}

interface LotteryHeaderProps {
  date: string;
  processingStatus: ProcessingStatus;
}

export function LotteryHeader({ date, processingStatus }: LotteryHeaderProps) {
  const getProcessingStatusInfo = (): ProcessingStatusInfo => {
    switch (processingStatus) {
      case "pending":
        return {
          title: "Ready to Process",
          description: "Entries are ready for lottery processing",
          color: "yellow",
          icon: Clock,
        };
      case "processing":
        return {
          title: "Processing",
          description: "Lottery algorithm is running",
          color: "blue",
          icon: TrendingUp,
        };
      case "completed":
        return {
          title: "Completed",
          description: "All entries have been processed",
          color: "green",
          icon: CheckCircle,
        };
      default:
        return {
          title: "Unknown",
          description: "Status unknown",
          color: "gray",
          icon: Calendar,
        };
    }
  };

  const statusInfo = getProcessingStatusInfo();
  const StatusIcon = statusInfo.icon;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Lottery Overview for {formatDate(date, "EEEE, MMMM do, yyyy")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <Badge
            variant={
              statusInfo.color === "green"
                ? "default"
                : statusInfo.color === "yellow"
                  ? "secondary"
                  : statusInfo.color === "blue"
                    ? "secondary"
                    : "outline"
            }
            className="text-sm font-medium"
          >
            <StatusIcon className="mr-1 h-3 w-3" />
            {statusInfo.title}
          </Badge>
          <span className="text-sm text-gray-600">
            {statusInfo.description}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}
