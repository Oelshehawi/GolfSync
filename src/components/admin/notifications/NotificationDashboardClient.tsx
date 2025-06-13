"use client";

import { useState } from "react";
import { NotificationDashboard } from "./NotificationDashboard";
import { getPushNotificationStats } from "~/server/pwa/data";
import toast from "react-hot-toast";

interface PushStats {
  totalMembers: number;
  subscribedMembers: number;
  validSubscriptions: number;
  subscriptionRate: number;
}

interface NotificationDashboardClientProps {
  initialStats: PushStats | null;
  memberClasses: string[];
}

export function NotificationDashboardClient({
  initialStats,
  memberClasses,
}: NotificationDashboardClientProps) {
  const [stats, setStats] = useState<PushStats | null>(initialStats);
  const [isLoading, setIsLoading] = useState(false);

  const refreshStats = async () => {
    try {
      setIsLoading(true);
      const result = await getPushNotificationStats();
      if (result.success && result.stats) {
        setStats(result.stats);
      } else {
        toast.error("Failed to refresh notification statistics");
      }
    } catch (error) {
      toast.error("Error refreshing statistics");
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && !stats) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-center">
          <div className="border-org-primary mx-auto mb-2 h-8 w-8 animate-spin rounded-full border-b-2"></div>
          <p className="text-sm text-gray-600">
            Loading notification dashboard...
          </p>
        </div>
      </div>
    );
  }

  return (
    <NotificationDashboard
      stats={stats}
      memberClasses={memberClasses}
      onStatsUpdate={refreshStats}
    />
  );
}
