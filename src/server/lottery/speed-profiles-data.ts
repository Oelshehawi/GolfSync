import "server-only";
import { db } from "~/server/db";
import { memberSpeedProfiles, members } from "~/server/db/schema";
import { eq, sql, desc } from "drizzle-orm";
import type { MemberSpeedProfileView } from "~/app/types/LotteryTypes";

/**
 * Get all member speed profiles with member details
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
 * Get speed profile for a specific member
 */
export async function getMemberSpeedProfile(memberId: number): Promise<{
  success: boolean;
  profile?: MemberSpeedProfileView;
  error?: string;
}> {
  try {
    const profile = await db
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
      .where(eq(memberSpeedProfiles.memberId, memberId))
      .limit(1);

    if (profile.length === 0) {
      return {
        success: false,
        error: "Speed profile not found",
      };
    }

    return {
      success: true,
      profile: profile[0] as MemberSpeedProfileView,
    };
  } catch (error) {
    console.error("Error fetching member speed profile:", error);
    return {
      success: false,
      error: "Failed to fetch member speed profile",
    };
  }
}

/**
 * Get speed tier statistics
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
