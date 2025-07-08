import {
  getPushNotificationStats,
  getMemberClassesList,
  getMembersCountByClass,
} from "~/server/pwa/data";
import { NotificationDashboard } from "~/components/admin/notifications/NotificationDashboard";
import { PageHeader } from "~/components/ui/page-header";

export default async function AdminNotificationsPage() {
  // Fetch data on the server
  const [statsResult, classesResult, classCountsResult] = await Promise.all([
    getPushNotificationStats(),
    getMemberClassesList(),
    getMembersCountByClass([]), // Fetch counts for all classes
  ]);

  const stats = statsResult.success ? statsResult.stats! : null;
  const memberClasses = classesResult.success
    ? classesResult.classes || []
    : [];
  const classCounts = classCountsResult.success
    ? classCountsResult.classCounts || []
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Push Notifications"
        description="Manage push notifications and member communication"
      />

      <NotificationDashboard
        stats={stats}
        memberClasses={memberClasses}
        classCounts={classCounts}
      />
    </div>
  );
}
