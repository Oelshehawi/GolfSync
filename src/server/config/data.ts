import { db } from "~/server/db";
import { teesheetConfigs, teesheetConfigRules } from "~/server/db/schema";
import { eq, and, or, desc, isNull, lte, gte, sql } from "drizzle-orm";
import { format } from "date-fns";
import type { TeesheetConfig } from "~/app/types/TeeSheetTypes";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";
import { getOrganizationId } from "~/lib/auth";

// Helper function to convert database types to our interface types
function convertToTeesheetConfig(config: any): TeesheetConfig {
  return {
    ...config,
    updatedAt: config.updatedAt || undefined,
  };
}

export async function initializeDefaultConfigs() {
  try {
    const clerkOrgId = await getOrganizationId();

    // First check if we already have configs
    const existingConfigs = await db.query.teesheetConfigs.findMany({
      where: eq(teesheetConfigs.clerkOrgId, clerkOrgId),
    });

    if (existingConfigs.length > 0) {
      return; // Configs already exist, no need to create defaults
    }

    // Create default weekday config (Mon-Fri)
    const weekdayConfig = await db
      .insert(teesheetConfigs)
      .values({
        clerkOrgId,
        name: "Weekday (Mon-Fri)",
        startTime: "07:00",
        endTime: "19:00",
        interval: 15,
        maxMembersPerBlock: 4,
        isActive: true,
      })
      .returning()
      .then((result) => convertToTeesheetConfig(result[0]));

    if (!weekdayConfig) {
      throw new Error("Failed to create weekday config");
    }

    // Create default weekend config (Sat-Sun)
    const weekendConfig = await db
      .insert(teesheetConfigs)
      .values({
        clerkOrgId,
        name: "Weekend (Sat-Sun)",
        startTime: "07:00",
        endTime: "19:00",
        interval: 20,
        maxMembersPerBlock: 4,
        isActive: true,
      })
      .returning()
      .then((result) => convertToTeesheetConfig(result[0]));

    if (!weekendConfig) {
      throw new Error("Failed to create weekend config");
    }

    // Create rules
    await db.insert(teesheetConfigRules).values([
      {
        clerkOrgId,
        configId: weekdayConfig.id,
        daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
        priority: 1,
        isActive: true,
      },
      {
        clerkOrgId,
        configId: weekendConfig.id,
        daysOfWeek: [0, 6], // Sat-Sun
        priority: 1,
        isActive: true,
      },
    ]);
  } catch (error) {
    console.error("Error initializing default configs:", error);
    // If we get a unique constraint error, it means another process already created the configs
    // We can safely ignore this error
    if (error instanceof Error && error.message.includes("unique constraint")) {
      return;
    }
    throw error;
  }
}

export async function getConfigForDate(date: Date): Promise<TeesheetConfig> {
  const clerkOrgId = await getOrganizationId();

  // First ensure we have default configs
  await initializeDefaultConfigs();

  const dayOfWeek = date.getDay();
  const formattedDate = format(date, "yyyy-MM-dd");

  // First check for specific date rules
  const specificDateRules = await db.query.teesheetConfigRules.findMany({
    where: and(
      eq(teesheetConfigRules.clerkOrgId, clerkOrgId),
      eq(teesheetConfigRules.isActive, true),
      eq(teesheetConfigRules.startDate, formattedDate),
      eq(teesheetConfigRules.endDate, formattedDate),
    ),
    orderBy: desc(teesheetConfigRules.priority),
    limit: 1,
  });

  if (specificDateRules.length > 0 && specificDateRules[0]) {
    const config = await db.query.teesheetConfigs.findFirst({
      where: and(
        eq(teesheetConfigs.clerkOrgId, clerkOrgId),
        eq(teesheetConfigs.id, specificDateRules[0].configId),
      ),
    });

    if (!config) {
      throw new Error("Configuration not found");
    }

    return convertToTeesheetConfig(config);
  }

  // Then check for recurring day rules
  const recurringRules = await db.query.teesheetConfigRules.findMany({
    where: and(
      eq(teesheetConfigRules.clerkOrgId, clerkOrgId),
      eq(teesheetConfigRules.isActive, true),
      sql`${dayOfWeek} = ANY(${teesheetConfigRules.daysOfWeek})`,
      or(
        isNull(teesheetConfigRules.startDate),
        lte(teesheetConfigRules.startDate, formattedDate),
      ),
      or(
        isNull(teesheetConfigRules.endDate),
        gte(teesheetConfigRules.endDate, formattedDate),
      ),
    ),
    orderBy: desc(teesheetConfigRules.priority),
    limit: 1,
  });

  if (recurringRules.length > 0 && recurringRules[0]) {
    const config = await db.query.teesheetConfigs.findFirst({
      where: and(
        eq(teesheetConfigs.clerkOrgId, clerkOrgId),
        eq(teesheetConfigs.id, recurringRules[0].configId),
      ),
    });

    if (!config) {
      throw new Error("Configuration not found");
    }

    return convertToTeesheetConfig(config);
  }

  // If no rules match, get the default config for the day of week
  const defaultConfig = await db.query.teesheetConfigs.findFirst({
    where: and(
      eq(teesheetConfigs.clerkOrgId, clerkOrgId),
      eq(teesheetConfigs.isActive, true),
      sql`${dayOfWeek} = ANY(${teesheetConfigRules.daysOfWeek})`,
    ),
    orderBy: desc(teesheetConfigRules.priority),
  });

  if (!defaultConfig) {
    throw new Error("No matching configuration found");
  }

  return convertToTeesheetConfig(defaultConfig);
}

export async function getOrganizationTheme() {
  const session = await auth();

  const organization = await (
    await clerkClient()
  ).organizations.getOrganization({
    organizationId: session.orgId!,
  });

  const theme = organization.publicMetadata?.theme as
    | {
        primary: string;
        tertiary: string;
        secondary: string;
      }
    | undefined;

  return theme;
}
