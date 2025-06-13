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
        pushSubscription: subscription as any,
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
  } catch (error) {
    console.error("Error sending push notification:", error);
    return { success: false, error: "Failed to send notification" };
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
        .map((member) =>
          webpush.sendNotification(member.pushSubscription as any, payload),
        ),
    );

    const successful = results.filter(
      (result) => result.status === "fulfilled",
    ).length;
    const failed = results.filter(
      (result) => result.status === "rejected",
    ).length;

    return { success: true, sent: successful, failed };
  } catch (error) {
    console.error("Error sending push notifications to all members:", error);
    return { success: false, error: "Failed to send notifications" };
  }
}

export async function getMemberPushNotificationStatus() {
  try {
    const { sessionClaims } = await auth();
    if (!sessionClaims?.userId) {
      return { success: false, error: "Not authenticated" };
    }

    const member = await getMemberData(sessionClaims.userId as string);
    if (!member?.id) {
      return { success: false, error: "Member not found" };
    }

    const memberData = await db.query.members.findFirst({
      where: eq(members.id, member.id),
      columns: {
        pushNotificationsEnabled: true,
      },
    });

    return {
      success: true,
      enabled: memberData?.pushNotificationsEnabled ?? false,
    };
  } catch (error) {
    console.error("Error getting member push notification status:", error);
    return { success: false, error: "Failed to get notification status" };
  }
}
