"use server";

import { sendNotificationToMember } from "./actions";
import { getSubscribedMembersByClass } from "./data";

export async function sendTargetedNotification(
  title: string,
  body: string,
  targetClasses: string[],
  data?: any,
) {
  try {
    const result = await getSubscribedMembersByClass(targetClasses);

    if (!result.success || !result.members) {
      return {
        success: false,
        error: result.error || "Failed to get members",
      };
    }

    const subscribedMembers = result.members;

    if (subscribedMembers.length === 0) {
      return {
        success: false,
        error: "No subscribed members found in the selected classes",
      };
    }

    // Send notifications in parallel
    const results = await Promise.allSettled(
      subscribedMembers.map(async (member: any) => {
        const notificationResult = await sendNotificationToMember(
          member.id,
          title,
          body,
          data,
        );
        return {
          memberId: member.id,
          memberName: `${member.firstName} ${member.lastName}`,
          memberClass: member.class,
          success: notificationResult.success,
          expired: notificationResult.expired,
          error: notificationResult.error,
        };
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
      `Targeted notification complete: ${successful} sent, ${expired} expired, ${failed} failed to classes: ${targetClasses.join(", ")}`,
    );

    return {
      success: true,
      sent: successful,
      expired,
      failed,
      totalTargeted: subscribedMembers.length,
      targetClasses,
    };
  } catch (error) {
    console.error("Error sending targeted notification:", error);
    return { success: false, error: "Failed to send targeted notification" };
  }
}

// Future enhancement: Scheduled notifications table and logic
export interface ScheduledNotification {
  id: number;
  title: string;
  body: string;
  targetClasses: string[];
  scheduledFor: Date;
  status: "pending" | "sent" | "failed" | "cancelled";
  createdAt: Date;
}

// Note: For now, we'll implement basic scheduling logic
// In the future, this would use a job queue system like Redis/Bull
export async function scheduleNotification(
  title: string,
  body: string,
  targetClasses: string[],
  scheduledFor: Date,
  data?: any,
) {
  try {
    const now = new Date();
    const scheduledTime = new Date(scheduledFor);

    if (scheduledTime <= now) {
      return {
        success: false,
        error: "Scheduled time must be in the future",
      };
    }

    // For immediate implementation, we'll use setTimeout
    // In production, this should use a proper job queue
    const delay = scheduledTime.getTime() - now.getTime();

    if (delay > 2147483647) {
      // setTimeout max delay is ~24.8 days
      return {
        success: false,
        error: "Cannot schedule notifications more than 24 days in advance",
      };
    }

    setTimeout(async () => {
      console.log(
        `Executing scheduled notification: ${title} for classes: ${targetClasses.join(", ")}`,
      );
      const result = await sendTargetedNotification(
        title,
        body,
        targetClasses,
        data,
      );
      console.log("Scheduled notification result:", result);
    }, delay);

    console.log(
      `Scheduled notification "${title}" for ${scheduledTime.toISOString()} to classes: ${targetClasses.join(", ")}`,
    );

    return {
      success: true,
      scheduledFor: scheduledTime,
      targetClasses,
      delay: Math.round(delay / 1000 / 60), // minutes
    };
  } catch (error) {
    console.error("Error scheduling notification:", error);
    return { success: false, error: "Failed to schedule notification" };
  }
}
