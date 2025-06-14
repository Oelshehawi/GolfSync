import {
  getPushNotificationStats,
  getMemberClassesList,
} from "~/server/pwa/data";
import { NotificationDashboardClient } from "~/components/admin/notifications/NotificationDashboardClient";
import { PageHeader } from "~/components/ui/page-header";

export default async function AdminNotificationsPage() {
  // Fetch data on the server
  const [statsResult, classesResult] = await Promise.all([
    getPushNotificationStats(),
    getMemberClassesList(),
  ]);

  const stats = statsResult.success ? statsResult.stats! : null;
  const memberClasses = classesResult.success
    ? classesResult.classes || []
    : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Push Notifications"
        description="Manage push notifications and member communication"
      />

      <NotificationDashboardClient
        initialStats={stats}
        memberClasses={memberClasses}
      />
    </div>
  );
}
