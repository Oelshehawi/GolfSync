"use server";

import { db } from "~/server/db";
import { teesheetConfigs, teesheetConfigRules } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";
import { revalidatePath } from "next/cache";

export async function createTeesheetConfig(data: {
  name: string;
  startTime: string;
  endTime: string;
  interval: number;
  maxMembersPerBlock: number;
}) {
  const orgId = await getOrganizationId();

  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  try {
    const [newConfig] = await db
      .insert(teesheetConfigs)
      .values({
        ...data,
        clerkOrgId: orgId,
      })
      .returning();

    revalidatePath("/settings");
    return { success: true, data: newConfig };
  } catch (error) {
    return { success: false, error: "Failed to create configuration" };
  }
}

export async function updateTeesheetConfig(
  id: number,
  data: {
    name?: string;
    startTime?: string;
    endTime?: string;
    interval?: number;
    maxMembersPerBlock?: number;
  },
) {
  const orgId = await getOrganizationId();

  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  try {
    const [updatedConfig] = await db
      .update(teesheetConfigs)
      .set(data)
      .where(
        and(eq(teesheetConfigs.id, id), eq(teesheetConfigs.clerkOrgId, orgId)),
      )
      .returning();

    revalidatePath("/settings");
    return { success: true, data: updatedConfig };
  } catch (error) {
    return { success: false, error: "Failed to update configuration" };
  }
}

export async function deleteTeesheetConfig(id: number) {
  const orgId = await getOrganizationId();

  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  try {
    const [deletedConfig] = await db
      .delete(teesheetConfigs)
      .where(
        and(eq(teesheetConfigs.id, id), eq(teesheetConfigs.clerkOrgId, orgId)),
      )
      .returning();

    revalidatePath("/settings");
    return { success: true, data: deletedConfig };
  } catch (error) {
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
  const orgId = await getOrganizationId();

  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  const [newRule] = await db
    .insert(teesheetConfigRules)
    .values({
      clerkOrgId: orgId,
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
  const orgId = await getOrganizationId();

  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  const [updatedRule] = await db
    .update(teesheetConfigRules)
    .set(updates)
    .where(
      and(
        eq(teesheetConfigRules.id, ruleId),
        eq(teesheetConfigRules.clerkOrgId, orgId),
      ),
    )
    .returning();

  if (!updatedRule) {
    return { success: false, error: "Failed to update rule" };
  }

  return { success: true, data: updatedRule };
}

export async function deleteTeesheetConfigRule(ruleId: number) {
  const orgId = await getOrganizationId();

  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  const [deletedRule] = await db
    .delete(teesheetConfigRules)
    .where(
      and(
        eq(teesheetConfigRules.id, ruleId),
        eq(teesheetConfigRules.clerkOrgId, orgId),
      ),
    )
    .returning();

  if (!deletedRule) {
    return { success: false, error: "Failed to delete rule" };
  }

  return { success: true, data: deletedRule };
}
