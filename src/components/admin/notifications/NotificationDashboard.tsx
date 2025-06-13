"use client";

import { StatsCards } from "./StatsCards";
import { NotificationForms } from "./NotificationForms";
import { NotificationInfo } from "./NotificationInfo";

interface PushStats {
  totalMembers: number;
  subscribedMembers: number;
  validSubscriptions: number;
  subscriptionRate: number;
}

interface NotificationDashboardProps {
  stats: PushStats | null;
  memberClasses: string[];
  onStatsUpdate: () => void;
}

export function NotificationDashboard({
  stats,
  memberClasses,
  onStatsUpdate,
}: NotificationDashboardProps) {
  return (
    <div className="space-y-6">
      <StatsCards stats={stats} onStatsUpdate={onStatsUpdate} />
      <NotificationForms
        validSubscriptions={stats?.validSubscriptions ?? 0}
        memberClasses={memberClasses}
        onNotificationSent={onStatsUpdate}
      />
      <NotificationInfo />
    </div>
  );
}
