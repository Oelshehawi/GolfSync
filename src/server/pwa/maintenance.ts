"use server";

import { db } from "~/server/db";
import { members } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { cleanupExpiredSubscriptions } from "./actions";
import { getPushNotificationStats } from "./data";

/**
 * Run maintenance tasks for push notifications
 */
export async function runPushNotificationMaintenance() {
  try {
    console.log("Starting push notification maintenance...");

    const cleanupResult = await cleanupExpiredSubscriptions();

    if (!cleanupResult.success) {
      throw new Error(cleanupResult.error || "Cleanup failed");
    }

    const statsResult = {
      totalMembers: 0,
      subscribedMembers: 0,
      validSubscriptions: 0,
      subscriptionRate: 0,
    };

    console.log("Push notification maintenance completed successfully");

    return {
      success: true,
      cleanedUp: cleanupResult.cleanedUp,
      stats: statsResult,
    };
  } catch (error) {
    console.error("Error during push notification maintenance:", error);
    return {
      success: false,
      error: "Failed to run maintenance tasks",
    };
  }
}

/**
 * Disable push notifications for a specific member (admin action)
 */
export async function disableMemberPushNotifications(memberId: number) {
  try {
    await db
      .update(members)
      .set({
        pushNotificationsEnabled: false,
        pushSubscription: null,
      })
      .where(eq(members.id, memberId));

    console.log(`Manually disabled push notifications for member ${memberId}`);

    return { success: true };
  } catch (error) {
    console.error(
      `Error disabling push notifications for member ${memberId}:`,
      error,
    );
    return {
      success: false,
      error: "Failed to disable push notifications",
    };
  }
}
