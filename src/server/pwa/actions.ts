"use server";

import webpush from "web-push";
import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { members } from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { getMemberData } from "~/server/members-teesheet-client/data";

webpush.setVapidDetails(
  "mailto:zacker74@gmail.com",
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!,
);

// Helper function to handle subscription expiration
async function handleExpiredSubscription(memberId: number, error: any) {
  try {
    // Log the expiration
    console.log(`Push subscription expired for member ${memberId}:`, {
      statusCode: error.statusCode,
      endpoint: error.endpoint,
      body: error.body,
    });

    // Disable push notifications for this member
    await db
      .update(members)
      .set({
        pushNotificationsEnabled: false,
        pushSubscription: null,
      })
      .where(eq(members.id, memberId));

    console.log(`Disabled expired push subscription for member ${memberId}`);
  } catch (dbError) {
    console.error(
      `Failed to disable expired subscription for member ${memberId}:`,
      dbError,
    );
  }
}

// Helper function to check if error is a subscription expiration
function isSubscriptionExpired(error: any): boolean {
  return (
    error.statusCode === 410 ||
    (error.statusCode === 400 &&
      error.body?.includes("unsubscribed")) ||
    (error.body?.includes("expired")) ||
    (error.body?.includes("invalid"))
  );
}

export async function subscribeUserToPushNotifications(subscription: any) {
  try {
    const { sessionClaims } = await auth();
    if (!sessionClaims?.userId) {
      return { success: false, error: "Not authenticated" };
    }

    const member = await getMemberData(sessionClaims.userId as string);
    if (!member?.id) {
      return { success: false, error: "Member not found" };
    }

    // Update member's push notification subscription in database
    await db
      .update(members)
      .set({
        pushNotificationsEnabled: true,
        pushSubscription: subscription,
      })
      .where(eq(members.id, member.id));

    return { success: true };
  } catch (error) {
    console.error("Error subscribing user to push notifications:", error);
    return { success: false, error: "Failed to subscribe to notifications" };
  }
}

export async function unsubscribeUserFromPushNotifications() {
  try {
    const { sessionClaims } = await auth();
    if (!sessionClaims?.userId) {
      return { success: false, error: "Not authenticated" };
    }

    const member = await getMemberData(sessionClaims.userId as string);
    if (!member?.id) {
      return { success: false, error: "Member not found" };
    }

    // Update member's push notification subscription in database
    await db
      .update(members)
      .set({
        pushNotificationsEnabled: false,
        pushSubscription: null,
      })
      .where(eq(members.id, member.id));

    return { success: true };
  } catch (error) {
    console.error("Error unsubscribing user from push notifications:", error);
    return {
      success: false,
      error: "Failed to unsubscribe from notifications",
    };
  }
}

export async function sendNotificationToMember(
  memberId: number,
  title: string,
  body: string,
  data?: any,
) {
  try {
    // Get member's push subscription from database
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
      columns: {
        pushNotificationsEnabled: true,
        pushSubscription: true,
      },
    });

    if (!member?.pushNotificationsEnabled || !member.pushSubscription) {
      return {
        success: false,
        error: "Member not subscribed to push notifications",
        shouldRetry: false,
      };
    }

    const payload = JSON.stringify({
      title,
      body,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data,
    });

    await webpush.sendNotification(member.pushSubscription as any, payload);

    return { success: true };
  } catch (error: any) {
    // Handle subscription expiration specifically
    if (isSubscriptionExpired(error)) {
      await handleExpiredSubscription(memberId, error);
      return {
        success: false,
        error: "Push subscription has expired and has been removed",
        expired: true,
        shouldRetry: false,
      };
    }

    // Handle other errors
    console.error("Error sending push notification:", error);
    return {
      success: false,
      error: "Failed to send notification",
      shouldRetry: true,
    };
  }
}

export async function sendNotificationToAllMembers(
  title: string,
  body: string,
  data?: any,
) {
  try {
    // Get all members who have push notifications enabled
    const subscribedMembers = await db.query.members.findMany({
      where: eq(members.pushNotificationsEnabled, true),
      columns: {
        id: true,
        pushSubscription: true,
      },
    });

    const payload = JSON.stringify({
      title,
      body,
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
      data,
    });

    const results = await Promise.allSettled(
      subscribedMembers
        .filter((member) => member.pushSubscription)
        .map(async (member) => {
          try {
            await webpush.sendNotification(
              member.pushSubscription as any,
              payload,
            );
            return { memberId: member.id, success: true };
          } catch (error: any) {
            // Handle expired subscriptions automatically
            if (isSubscriptionExpired(error)) {
              await handleExpiredSubscription(member.id, error);
              return {
                memberId: member.id,
                success: false,
                expired: true,
                error: error.body || "Subscription expired",
              };
            }
            return {
              memberId: member.id,
              success: false,
              error: error.message || "Unknown error",
            };
          }
        }),
    );

    const successful = results.filter(
      (result) => result.status === "fulfilled" && result.value.success,
    ).length;
    const expired = results.filter(
      (result) => result.status === "fulfilled" && result.value.expired,
    ).length;
    const failed = results.filter(
      (result) =>
        result.status === "rejected" ||
        (result.status === "fulfilled" &&
          !result.value.success &&
          !result.value.expired),
    ).length;

    console.log(
      `Push notification batch complete: ${successful} sent, ${expired} expired, ${failed} failed`,
    );

    return {
      success: true,
      sent: successful,
      expired,
      failed,
    };
  } catch (error) {
    console.error("Error sending push notifications to all members:", error);
    return { success: false, error: "Failed to send notifications" };
  }
}

// New utility function to clean up expired subscriptions
export async function cleanupExpiredSubscriptions() {
  try {
    // Get all members with push notifications enabled
    const subscribedMembers = await db.query.members.findMany({
      where: eq(members.pushNotificationsEnabled, true),
      columns: {
        id: true,
        pushSubscription: true,
        firstName: true,
        lastName: true,
      },
    });

    console.log(
      `Checking ${subscribedMembers.length} subscriptions for expiration...`,
    );

    let expiredCount = 0;
    const testPayload = JSON.stringify({
      title: "Test",
      body: "Subscription test",
      icon: "/icon-192x192.png",
      badge: "/icon-192x192.png",
    });

    for (const member of subscribedMembers) {
      if (!member.pushSubscription) continue;

      try {
        // Test the subscription with a dry run
        await webpush.sendNotification(
          member.pushSubscription as any,
          testPayload,
          {
            // Add headers to make this a test/dry run if supported
          },
        );
      } catch (error: any) {
        if (isSubscriptionExpired(error)) {
          await handleExpiredSubscription(member.id, error);
          expiredCount++;
          console.log(
            `Cleaned up expired subscription for ${member.firstName} ${member.lastName} (ID: ${member.id})`,
          );
        }
      }
    }

    console.log(
      `Cleanup complete: removed ${expiredCount} expired subscriptions`,
    );
    return { success: true, cleanedUp: expiredCount };
  } catch (error) {
    console.error("Error during subscription cleanup:", error);
    return { success: false, error: "Failed to cleanup subscriptions" };
  }
}
