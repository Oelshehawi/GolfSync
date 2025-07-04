"use server";

import { revalidatePath } from "next/cache";
import { db } from "~/server/db";
import { memberSpeedProfiles } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";

/**
 * Update a member's speed profile settings
 */
export async function updateMemberSpeedProfileAction(
  memberId: number,
  updates: {
    speedTier?: "FAST" | "AVERAGE" | "SLOW";
    adminPriorityAdjustment?: number;
    manualOverride?: boolean;
    notes?: string | null;
  },
): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    // Validate admin priority adjustment range
    if (
      updates.adminPriorityAdjustment !== undefined &&
      (updates.adminPriorityAdjustment < -10 ||
        updates.adminPriorityAdjustment > 10)
    ) {
      return {
        success: false,
        error: "Admin priority adjustment must be between -10 and +10",
      };
    }

    await db
      .update(memberSpeedProfiles)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(memberSpeedProfiles.memberId, memberId));

    // Revalidate relevant pages
    revalidatePath("/admin/lottery/member-profiles");
    revalidatePath("/admin/lottery/[date]", "page");

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error in updateMemberSpeedProfileAction:", error);
    return {
      success: false,
      error: "Failed to update member speed profile",
    };
  }
}

/**
 * Reset all admin priority adjustments to 0
 */
export async function resetAllAdminPriorityAdjustmentsAction(): Promise<{
  success: boolean;
  updatedCount?: number;
  error?: string;
}> {
  try {
    const result = await db
      .update(memberSpeedProfiles)
      .set({
        adminPriorityAdjustment: 0,
        notes: null,
        updatedAt: new Date(),
      })
      .where(sql`admin_priority_adjustment != 0`);

    // Revalidate relevant pages
    revalidatePath("/admin/lottery/member-profiles");
    revalidatePath("/admin/lottery/[date]", "page");

    return {
      success: true,
      updatedCount: result.rowCount || 0,
    };
  } catch (error) {
    console.error("Error in resetAllAdminPriorityAdjustmentsAction:", error);
    return {
      success: false,
      error: "Failed to reset admin priority adjustments",
    };
  }
}

/**
 * Bulk update multiple member speed profiles
 */
export async function bulkUpdateSpeedProfilesAction(
  updates: Array<{
    memberId: number;
    speedTier?: "FAST" | "AVERAGE" | "SLOW";
    adminPriorityAdjustment?: number;
    manualOverride?: boolean;
    notes?: string | null;
  }>,
): Promise<{
  success: boolean;
  updatedCount?: number;
  errors?: string[];
}> {
  try {
    const results = await Promise.allSettled(
      updates.map(async (update) => {
        try {
          // Validate admin priority adjustment range
          if (
            update.adminPriorityAdjustment !== undefined &&
            (update.adminPriorityAdjustment < -10 ||
              update.adminPriorityAdjustment > 10)
          ) {
            return {
              success: false,
              error: "Admin priority adjustment must be between -10 and +10",
            };
          }

          await db
            .update(memberSpeedProfiles)
            .set({
              speedTier: update.speedTier,
              adminPriorityAdjustment: update.adminPriorityAdjustment,
              manualOverride: update.manualOverride,
              notes: update.notes,
              updatedAt: new Date(),
            })
            .where(eq(memberSpeedProfiles.memberId, update.memberId));

          return {
            success: true,
          };
        } catch (error) {
          return {
            success: false,
            error: "Failed to update member speed profile",
          };
        }
      }),
    );

    const errors: string[] = [];
    let updatedCount = 0;

    results.forEach((result, index) => {
      if (result.status === "fulfilled" && result.value.success) {
        updatedCount++;
      } else {
        const error =
          result.status === "fulfilled"
            ? result.value.error
            : result.reason?.message || "Unknown error";
        errors.push(`Member ${updates[index]?.memberId}: ${error}`);
      }
    });

    if (updatedCount > 0) {
      // Revalidate relevant pages
      revalidatePath("/admin/lottery/member-profiles");
      revalidatePath("/admin/lottery/[date]", "page");
    }

    return {
      success: errors.length === 0,
      updatedCount,
      errors: errors.length > 0 ? errors : undefined,
    };
  } catch (error) {
    console.error("Error in bulkUpdateSpeedProfilesAction:", error);
    return {
      success: false,
      errors: ["Failed to perform bulk update"],
    };
  }
}
