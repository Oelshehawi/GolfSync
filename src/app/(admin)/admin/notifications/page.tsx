import {
  getPushNotificationStats,
  getMemberClassesList,
} from "~/server/pwa/data";
import { NotificationDashboardClient } from "~/components/admin/notifications/NotificationDashboardClient";

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
    <div className="container mx-auto p-6">
      <div className="mb-6">
        <h1 className="text-org-primary text-3xl font-bold">
          Push Notifications
        </h1>
        <p className="mt-2 text-gray-600">
          Manage push notifications and member communication
        </p>
      </div>

      <NotificationDashboardClient
        initialStats={stats}
        memberClasses={memberClasses}
      />
    </div>
  );
}
