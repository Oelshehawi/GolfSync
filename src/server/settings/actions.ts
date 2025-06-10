"use server";

import { db } from "~/server/db";
import {
  teesheetConfigs,
  teesheetConfigRules,
  teesheets,
  timeBlocks,
  courseInfo,
} from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

import { revalidatePath } from "next/cache";
import { createTimeBlocksForTeesheet } from "~/server/teesheet/data";
import { auth } from "@clerk/nextjs/server";
import type {
  TeesheetConfigInput,
  TeesheetConfig,
} from "~/app/types/TeeSheetTypes";
import { ConfigTypes } from "~/app/types/TeeSheetTypes";

export async function createTeesheetConfig(data: TeesheetConfigInput) {
  try {
    // Create the config
    const [newConfig] = await db
      .insert(teesheetConfigs)
      .values({
        name: data.name,
        type: data.type, // Store as uppercase in DB to match enum
        startTime: data.type === ConfigTypes.REGULAR ? data.startTime : null,
        endTime: data.type === ConfigTypes.REGULAR ? data.endTime : null,
        interval: data.type === ConfigTypes.REGULAR ? data.interval : null,
        maxMembersPerBlock:
          data.type === ConfigTypes.REGULAR ? data.maxMembersPerBlock : null,
        templateId: data.type === ConfigTypes.CUSTOM ? data.templateId : null,
        isActive: data.isActive ?? true,
        isSystemConfig: data.isSystemConfig ?? false,
        disallowMemberBooking: data.disallowMemberBooking ?? false,
      })
      .returning();

    if (!newConfig) {
      throw new Error("Failed to create configuration");
    }

    // Create the rules
    if (data.rules && data.rules.length > 0) {
      const rules = await Promise.all(
        data.rules.map((rule) =>
          db
            .insert(teesheetConfigRules)
            .values({
              configId: newConfig.id,
              daysOfWeek: rule.daysOfWeek,
              startDate: rule.startDate,
              endDate: rule.endDate,
              priority: rule.priority,
              isActive: rule.isActive,
            })
            .returning(),
        ),
      );

      if (!rules.every((r) => r[0])) {
        throw new Error("Failed to create rules");
      }
    }

    revalidatePath("/settings");
    return { success: true, data: newConfig };
  } catch (error) {
    console.error("Error creating teesheet config:", error);
    return { success: false, error: "Failed to create configuration" };
  }
}

export async function updateTeesheetConfig(
  id: number,
  data: TeesheetConfigInput,
) {
  try {
    // Update the config
    const [updatedConfig] = await db
      .update(teesheetConfigs)
      .set({
        name: data.name,
        type: data.type, // Store as uppercase in DB to match enum
        startTime: data.type === ConfigTypes.REGULAR ? data.startTime : null,
        endTime: data.type === ConfigTypes.REGULAR ? data.endTime : null,
        interval: data.type === ConfigTypes.REGULAR ? data.interval : null,
        maxMembersPerBlock:
          data.type === ConfigTypes.REGULAR ? data.maxMembersPerBlock : null,
        templateId: data.type === ConfigTypes.CUSTOM ? data.templateId : null,
        isActive: data.isActive,
        isSystemConfig: data.isSystemConfig,
        disallowMemberBooking: data.disallowMemberBooking ?? false,
      })
      .where(eq(teesheetConfigs.id, id))
      .returning();

    if (!updatedConfig) {
      throw new Error("Failed to update configuration");
    }

    // If isActive status changed, update all associated rules
    if (data.isActive !== undefined) {
      await db
        .update(teesheetConfigRules)
        .set({ isActive: data.isActive })
        .where(eq(teesheetConfigRules.configId, id));
    }

    // Update the rules if provided
    if (data.rules && data.rules.length > 0) {
      // First delete existing rules
      await db
        .delete(teesheetConfigRules)
        .where(eq(teesheetConfigRules.configId, id));

      // Then create new rules
      const rules = await Promise.all(
        data.rules.map((rule) =>
          db
            .insert(teesheetConfigRules)
            .values({
              configId: id,
              daysOfWeek: rule.daysOfWeek,
              startDate: rule.startDate,
              endDate: rule.endDate,
              priority: rule.priority,
              isActive: data.isActive ?? rule.isActive, // Use config's isActive if provided
            })
            .returning(),
        ),
      );

      if (!rules.every((r) => r[0])) {
        throw new Error("Failed to update rules");
      }
    }

    revalidatePath("/settings");
    return { success: true, data: updatedConfig };
  } catch (error) {
    console.error("Error updating teesheet config:", error);
    return { success: false, error: "Failed to update configuration" };
  }
}

export async function deleteTeesheetConfig(
  configId: number,
): Promise<{ success: boolean; error?: string }> {
  try {
    await db
      .delete(teesheetConfigs)
      .where(eq(teesheetConfigs.id, configId));

    revalidatePath("/settings/teesheet");
    revalidatePath("/settings/teesheet/configuration");
    return { success: true };
  } catch (error) {
    console.error("Error deleting teesheet config:", error);
    return { success: false, error: "Failed to delete configuration" };
  }
}

export async function createTeesheetConfigRule(
  configId: number,
  rule: {
    daysOfWeek?: number[];
    startDate?: string | null;
    endDate?: string | null;
    priority?: number;
    isActive?: boolean;
  },
) {
  const [newRule] = await db
    .insert(teesheetConfigRules)
    .values({
      configId,
      daysOfWeek: rule.daysOfWeek || null,
      startDate: rule.startDate || null,
      endDate: rule.endDate || null,
      priority: rule.priority || 0,
      isActive: rule.isActive ?? true,
    })
    .returning();

  if (!newRule) {
    return { success: false, error: "Failed to create rule" };
  }

  return { success: true, data: newRule };
}

export async function updateTeesheetConfigRule(
  ruleId: number,
  updates: {
    daysOfWeek?: number[];
    startDate?: string | null;
    endDate?: string | null;
    priority?: number;
    isActive?: boolean;
  },
) {
  const [updatedRule] = await db
    .update(teesheetConfigRules)
    .set(updates)
    .where(eq(teesheetConfigRules.id, ruleId))
    .returning();

  if (!updatedRule) {
    return { success: false, error: "Failed to update rule" };
  }

  return { success: true, data: updatedRule };
}

export async function deleteTeesheetConfigRule(ruleId: number) {
  const [deletedRule] = await db
    .delete(teesheetConfigRules)
    .where(eq(teesheetConfigRules.id, ruleId))
    .returning();

  if (!deletedRule) {
    return { success: false, error: "Failed to delete rule" };
  }

  return { success: true, data: deletedRule };
}

export async function updateTeesheetConfigForDate(
  teesheetId: number,
  configId: number,
) {
  try {
    // First get the teesheet
    const [teesheet] = await db
      .select()
      .from(teesheets)
      .where(eq(teesheets.id, teesheetId));

    if (!teesheet) {
      return { success: false, error: "Teesheet not found" };
    }

    // Get the config
    const config = await db.query.teesheetConfigs.findFirst({
      where: eq(teesheetConfigs.id, configId),
      with: {
        rules: true,
      },
    });

    if (!config) {
      return { success: false, error: "Config not found" };
    }

    // Update the teesheet to use the new config
    const [updatedTeesheet] = await db
      .update(teesheets)
      .set({ configId })
      .where(eq(teesheets.id, teesheetId))
      .returning();

    if (!updatedTeesheet) {
      return { success: false, error: "Failed to update teesheet" };
    }

    // Delete existing time blocks
    await db
      .delete(timeBlocks)
      .where(eq(timeBlocks.teesheetId, teesheetId));

    // Create new time blocks with the new config
    const fullConfig = {
      ...config,
      rules: config.rules.map((rule) => ({
        ...rule,
        startDate: rule.startDate ? new Date(rule.startDate) : null,
        endDate: rule.endDate ? new Date(rule.endDate) : null,
      })),
    } as TeesheetConfig;
    await createTimeBlocksForTeesheet(teesheetId, fullConfig, teesheet.date);

    // Revalidate paths
    revalidatePath(`/teesheet`);

    // Use the date as is, since we know it's a string from our schema changes
    const dateParam = teesheet.date || "";
    revalidatePath(`/admin/teesheet/${dateParam}`);

    return { success: true, data: updatedTeesheet };
  } catch (error) {
    console.error("Error updating teesheet config for date:", error);
    return {
      success: false,
      error: "Failed to update teesheet configuration",
    };
  }
}

// Update or create course info
export async function updateCourseInfo(data: {
  weatherStatus?: string;
  forecast?: string;
  rainfall?: string;
  notes?: string;
}) {
  const { userId, orgId } = await auth();

  if (!orgId || !userId) {
    return { success: false, error: "Not authenticated" };
  }

  try {
    // Check if the course info exists
    const existing = await db.query.courseInfo.findFirst({
      where: eq(courseInfo.id, 1),
    });

    if (existing) {
      // Update existing record
      const updated = await db
        .update(courseInfo)
        .set({
          ...data,
          lastUpdatedBy: userId,
          updatedAt: new Date(),
        })
        .where(eq(courseInfo.id, existing.id))
        .returning();

      revalidatePath("/members");
      revalidatePath("/admin/settings");
      return { success: true };
    } else {
      // Create new record
      const created = await db
        .insert(courseInfo)
        .values({
          weatherStatus: data.weatherStatus,
          forecast: data.forecast,
          rainfall: data.rainfall,
          notes: data.notes,
          lastUpdatedBy: userId,
        })
        .returning();

      revalidatePath("/members");
      revalidatePath("/admin/settings");
      return { success: true, data: created[0] };
    }
  } catch (error) {
    console.error("Error updating course info:", error);
    return { success: false, error: "Error updating course info" };
  }
}
