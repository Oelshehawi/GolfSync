import "server-only";

import { db } from "~/server/db";
import { members } from "~/server/db/schema";
import { eq, inArray, and, sql } from "drizzle-orm";

export interface PushStats {
  totalMembers: number;
  subscribedMembers: number;
  validSubscriptions: number;
  subscriptionRate: number;
}

export interface ClassCount {
  class: string;
  totalCount: number;
  subscribedCount: number;
}

/**
 * Get push notification statistics for admin dashboard
 */
export async function getPushNotificationStats(): Promise<{
  success: boolean;
  stats?: PushStats;
  error?: string;
}> {
  try {
    const totalMembers = await db.$count(members);

    const subscribedMembers = await db.$count(
      members,
      eq(members.pushNotificationsEnabled, true),
    );

    const membersWithSubscriptions = await db.query.members.findMany({
      where: eq(members.pushNotificationsEnabled, true),
      columns: {
        id: true,
        pushSubscription: true,
      },
    });

    const validSubscriptions = membersWithSubscriptions.filter(
      (member) => member.pushSubscription,
    ).length;

    return {
      success: true,
      stats: {
        totalMembers,
        subscribedMembers,
        validSubscriptions,
        subscriptionRate:
          totalMembers > 0 ? (subscribedMembers / totalMembers) * 100 : 0,
      },
    };
  } catch (error) {
    console.error("Error getting push notification stats:", error);
    return {
      success: false,
      error: "Failed to get push notification statistics",
    };
  }
}

/**
 * Get a list of all unique member classes
 */
export async function getMemberClassesList(): Promise<{
  success: boolean;
  classes?: string[];
  error?: string;
}> {
  try {
    const classes = await db
      .selectDistinct({ class: members.class })
      .from(members)
      .orderBy(members.class);

    return {
      success: true,
      classes: classes.map((row) => row.class),
    };
  } catch (error) {
    console.error("Error getting member classes:", error);
    return { success: false, error: "Failed to get member classes" };
  }
}

/**
 * Get member counts by class for targeted notifications
 */
export async function getMembersCountByClass(
  targetClasses: string[],
): Promise<{ success: boolean; classCounts?: ClassCount[]; error?: string }> {
  try {
    let results;

    if (targetClasses.length > 0) {
      results = await db
        .select({
          class: members.class,
          totalCount: sql<number>`count(*)::int`,
          subscribedCount: sql<number>`count(case when ${members.pushNotificationsEnabled} = true then 1 end)::int`,
        })
        .from(members)
        .where(inArray(members.class, targetClasses))
        .groupBy(members.class);
    } else {
      results = await db
        .select({
          class: members.class,
          totalCount: sql<number>`count(*)::int`,
          subscribedCount: sql<number>`count(case when ${members.pushNotificationsEnabled} = true then 1 end)::int`,
        })
        .from(members)
        .groupBy(members.class);
    }

    return {
      success: true,
      classCounts: results,
    };
  } catch (error) {
    console.error("Error getting member counts by class:", error);
    return { success: false, error: "Failed to get member counts" };
  }
}

/**
 * Get all subscribed members for notifications
 */
export async function getSubscribedMembers() {
  try {
    const subscribedMembers = await db.query.members.findMany({
      where: eq(members.pushNotificationsEnabled, true),
      columns: {
        id: true,
        pushSubscription: true,
        firstName: true,
        lastName: true,
      },
    });

    return {
      success: true,
      members: subscribedMembers,
    };
  } catch (error) {
    console.error("Error getting subscribed members:", error);
    return { success: false, error: "Failed to get subscribed members" };
  }
}

/**
 * Get subscribed members by class for targeted notifications
 */
export async function getSubscribedMembersByClass(targetClasses: string[]) {
  try {
    let subscribedMembers;

    if (targetClasses.length === 0) {
      // Get all subscribed members if no classes specified
      subscribedMembers = await db.query.members.findMany({
        where: eq(members.pushNotificationsEnabled, true),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          class: true,
        },
      });
    } else {
      // Get members of specific classes
      subscribedMembers = await db.query.members.findMany({
        where: and(
          eq(members.pushNotificationsEnabled, true),
          inArray(members.class, targetClasses),
        ),
        columns: {
          id: true,
          firstName: true,
          lastName: true,
          class: true,
        },
      });
    }

    return {
      success: true,
      members: subscribedMembers,
    };
  } catch (error) {
    console.error("Error getting subscribed members by class:", error);
    return { success: false, error: "Failed to get subscribed members" };
  }
}

/**
 * Get member push subscription details
 */
export async function getMemberPushSubscription(memberId: number) {
  try {
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
      columns: {
        pushNotificationsEnabled: true,
        pushSubscription: true,
      },
    });

    return {
      success: true,
      member,
    };
  } catch (error) {
    console.error("Error getting member push subscription:", error);
    return { success: false, error: "Failed to get member subscription" };
  }
}
