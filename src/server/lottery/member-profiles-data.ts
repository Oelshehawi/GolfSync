import "server-only";
import { db } from "~/server/db";
import {
  memberSpeedProfiles,
  memberFairnessScores,
  members,
} from "~/server/db/schema";
import { eq, sql, desc, and } from "drizzle-orm";
import type {
  MemberProfileWithFairness,
  MemberSpeedProfileView,
} from "~/app/types/LotteryTypes";

/**
 * Get all member profiles with both speed and fairness data
 */
export async function getMemberProfilesWithFairness(): Promise<{
  success: boolean;
  profiles?: MemberProfileWithFairness[];
  error?: string;
}> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7); // "2024-01"

    const profiles = await db
      .select({
        memberId: members.id,
        memberName: sql<string>`${members.firstName} || ' ' || ${members.lastName}`,
        memberNumber: members.memberNumber,
        memberClass: members.class,
        // Speed profile data
        averageMinutes: memberSpeedProfiles.averageMinutes,
        speedTier: memberSpeedProfiles.speedTier,
        adminPriorityAdjustment: memberSpeedProfiles.adminPriorityAdjustment,
        manualOverride: memberSpeedProfiles.manualOverride,
        lastCalculated: memberSpeedProfiles.lastCalculated,
        notes: memberSpeedProfiles.notes,
        // Fairness score data
        currentMonth: memberFairnessScores.currentMonth,
        totalEntriesMonth: memberFairnessScores.totalEntriesMonth,
        preferencesGrantedMonth: memberFairnessScores.preferencesGrantedMonth,
        preferenceFulfillmentRate:
          memberFairnessScores.preferenceFulfillmentRate,
        daysWithoutGoodTime: memberFairnessScores.daysWithoutGoodTime,
        fairnessScore: memberFairnessScores.fairnessScore,
        fairnessLastUpdated: memberFairnessScores.lastUpdated,
      })
      .from(members)
      .leftJoin(
        memberSpeedProfiles,
        eq(members.id, memberSpeedProfiles.memberId),
      )
      .leftJoin(
        memberFairnessScores,
        and(
          eq(members.id, memberFairnessScores.memberId),
          eq(memberFairnessScores.currentMonth, currentMonth),
        ),
      )
      .orderBy(
        desc(memberSpeedProfiles.adminPriorityAdjustment),
        desc(memberFairnessScores.fairnessScore),
        members.lastName,
      );

    // Transform data to match the type structure
    const transformedProfiles: MemberProfileWithFairness[] = profiles.map(
      (profile) => ({
        id: profile.memberId,
        memberId: profile.memberId,
        memberName: profile.memberName,
        memberNumber: profile.memberNumber,
        memberClass: profile.memberClass,
        // Speed profile data with defaults
        averageMinutes: profile.averageMinutes,
        speedTier:
          (profile.speedTier as "FAST" | "AVERAGE" | "SLOW") || "AVERAGE",
        adminPriorityAdjustment: profile.adminPriorityAdjustment || 0,
        manualOverride: profile.manualOverride || false,
        lastCalculated: profile.lastCalculated,
        notes: profile.notes,
        // Fairness score data - only include if exists
        fairnessScore: profile.currentMonth
          ? {
              currentMonth: profile.currentMonth,
              totalEntriesMonth: profile.totalEntriesMonth || 0,
              preferencesGrantedMonth: profile.preferencesGrantedMonth || 0,
              preferenceFulfillmentRate: profile.preferenceFulfillmentRate || 0,
              daysWithoutGoodTime: profile.daysWithoutGoodTime || 0,
              fairnessScore: profile.fairnessScore || 0,
              lastUpdated: profile.fairnessLastUpdated,
            }
          : null,
      }),
    );

    return {
      success: true,
      profiles: transformedProfiles,
    };
  } catch (error) {
    console.error("Error fetching member profiles with fairness:", error);
    return {
      success: false,
      error: "Failed to fetch member profiles",
    };
  }
}

/**
 * Get combined statistics for member profiles
 */
export async function getMemberProfileStats(): Promise<{
  success: boolean;
  stats?: {
    totalMembers: number;
    speedTiers: {
      fast: number;
      average: number;
      slow: number;
    };
    fairnessScores: {
      highPriority: number; // fairness score > 20
      mediumPriority: number; // fairness score 10-20
      lowPriority: number; // fairness score < 10
      averageFulfillmentRate: number;
    };
    adminAdjustments: {
      positive: number;
      negative: number;
      neutral: number;
    };
  };
  error?: string;
}> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);

    // Get speed tier counts
    const speedStats = await db
      .select({
        speedTier: memberSpeedProfiles.speedTier,
        count: sql<number>`count(*)::int`,
      })
      .from(memberSpeedProfiles)
      .groupBy(memberSpeedProfiles.speedTier);

    // Get fairness score stats
    const fairnessStats = await db
      .select({
        highPriority: sql<number>`count(case when fairness_score > 20 then 1 end)::int`,
        mediumPriority: sql<number>`count(case when fairness_score between 10 and 20 then 1 end)::int`,
        lowPriority: sql<number>`count(case when fairness_score < 10 then 1 end)::int`,
        avgFulfillment: sql<number>`avg(preference_fulfillment_rate)`,
      })
      .from(memberFairnessScores)
      .where(eq(memberFairnessScores.currentMonth, currentMonth));

    // Get admin adjustment stats
    const adminStats = await db
      .select({
        positive: sql<number>`count(case when admin_priority_adjustment > 0 then 1 end)::int`,
        negative: sql<number>`count(case when admin_priority_adjustment < 0 then 1 end)::int`,
        neutral: sql<number>`count(case when admin_priority_adjustment = 0 then 1 end)::int`,
      })
      .from(memberSpeedProfiles);

    // Get total member count
    const totalMembers = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(members);

    const speedTierCounts = {
      fast: 0,
      average: 0,
      slow: 0,
    };

    speedStats.forEach((stat) => {
      switch (stat.speedTier) {
        case "FAST":
          speedTierCounts.fast = stat.count;
          break;
        case "AVERAGE":
          speedTierCounts.average = stat.count;
          break;
        case "SLOW":
          speedTierCounts.slow = stat.count;
          break;
      }
    });

    const fairnessData = fairnessStats[0];
    const adminData = adminStats[0];

    return {
      success: true,
      stats: {
        totalMembers: totalMembers[0]?.count || 0,
        speedTiers: speedTierCounts,
        fairnessScores: {
          highPriority: fairnessData?.highPriority || 0,
          mediumPriority: fairnessData?.mediumPriority || 0,
          lowPriority: fairnessData?.lowPriority || 0,
          averageFulfillmentRate: fairnessData?.avgFulfillment || 0,
        },
        adminAdjustments: {
          positive: adminData?.positive || 0,
          negative: adminData?.negative || 0,
          neutral: adminData?.neutral || 0,
        },
      },
    };
  } catch (error) {
    console.error("Error fetching member profile stats:", error);
    return {
      success: false,
      error: "Failed to fetch member profile statistics",
    };
  }
}

/**
 * Get all member speed profiles with member details (for backwards compatibility)
 */
export async function getAllMemberSpeedProfiles(): Promise<{
  success: boolean;
  profiles?: MemberSpeedProfileView[];
  error?: string;
}> {
  try {
    const profiles = await db
      .select({
        id: memberSpeedProfiles.memberId,
        memberId: memberSpeedProfiles.memberId,
        memberName: sql<string>`${members.firstName} || ' ' || ${members.lastName}`,
        memberNumber: members.memberNumber,
        averageMinutes: memberSpeedProfiles.averageMinutes,
        speedTier: memberSpeedProfiles.speedTier,
        adminPriorityAdjustment: memberSpeedProfiles.adminPriorityAdjustment,
        manualOverride: memberSpeedProfiles.manualOverride,
        lastCalculated: memberSpeedProfiles.lastCalculated,
        notes: memberSpeedProfiles.notes,
      })
      .from(memberSpeedProfiles)
      .leftJoin(members, eq(memberSpeedProfiles.memberId, members.id))
      .orderBy(
        desc(memberSpeedProfiles.adminPriorityAdjustment),
        members.lastName,
      );

    return {
      success: true,
      profiles: profiles as MemberSpeedProfileView[],
    };
  } catch (error) {
    console.error("Error fetching member speed profiles:", error);
    return {
      success: false,
      error: "Failed to fetch member speed profiles",
    };
  }
}

/**
 * Get speed tier statistics (for backwards compatibility)
 */
export async function getSpeedTierStats(): Promise<{
  success: boolean;
  stats?: {
    fast: number;
    average: number;
    slow: number;
    total: number;
    withAdminAdjustments: number;
  };
  error?: string;
}> {
  try {
    const stats = await db
      .select({
        speedTier: memberSpeedProfiles.speedTier,
        count: sql<number>`count(*)::int`,
        withAdjustments: sql<number>`count(case when admin_priority_adjustment != 0 then 1 end)::int`,
      })
      .from(memberSpeedProfiles)
      .groupBy(memberSpeedProfiles.speedTier);

    const result = {
      fast: 0,
      average: 0,
      slow: 0,
      total: 0,
      withAdminAdjustments: 0,
    };

    stats.forEach((stat) => {
      result.total += stat.count;
      result.withAdminAdjustments += stat.withAdjustments;

      switch (stat.speedTier) {
        case "FAST":
          result.fast = stat.count;
          break;
        case "AVERAGE":
          result.average = stat.count;
          break;
        case "SLOW":
          result.slow = stat.count;
          break;
      }
    });

    return {
      success: true,
      stats: result,
    };
  } catch (error) {
    console.error("Error fetching speed tier statistics:", error);
    return {
      success: false,
      error: "Failed to fetch speed tier statistics",
    };
  }
}
