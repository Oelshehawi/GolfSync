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

interface ClassCount {
  class: string;
  totalCount: number;
  subscribedCount: number;
}

interface NotificationDashboardProps {
  stats: PushStats | null;
  memberClasses: string[];
  classCounts: ClassCount[];
}

export function NotificationDashboard({
  stats,
  memberClasses,
  classCounts,
}: NotificationDashboardProps) {
  return (
    <div className="space-y-6">
      <StatsCards stats={stats} />
      <NotificationForms
        validSubscriptions={stats?.validSubscriptions ?? 0}
        memberClasses={memberClasses}
        classCounts={classCounts}
      />
      <NotificationInfo />
    </div>
  );
}
