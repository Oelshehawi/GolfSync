import { db } from "~/server/db";
import { and, eq, or, desc, isNull, lte, gte, sql } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";
import { teesheetConfigs, teesheetConfigRules } from "~/server/db/schema";
import type {
  TeesheetConfig,
  TeesheetConfigRule,
} from "~/app/types/TeeSheetTypes";
import { format } from "date-fns";

function convertToTeesheetConfig(dbConfig: any): TeesheetConfig {
  return {
    ...dbConfig,
    rules:
      dbConfig.rules?.map((rule: any) => ({
        ...rule,
        startDate: rule.startDate ? new Date(rule.startDate) : null,
        endDate: rule.endDate ? new Date(rule.endDate) : null,
      })) || [],
  };
}

export { convertToTeesheetConfig };

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
        isSystemConfig: true,
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
        isSystemConfig: true,
      })
      .returning()
      .then((result) => convertToTeesheetConfig(result[0]));

    if (!weekendConfig) {
      throw new Error("Failed to create weekend config");
    }

    // Create rules with lowest priority (0)
    await db.insert(teesheetConfigRules).values([
      {
        clerkOrgId,
        configId: weekdayConfig.id,
        daysOfWeek: [1, 2, 3, 4, 5], // Mon-Fri
        priority: 0,
        isActive: true,
      },
      {
        clerkOrgId,
        configId: weekendConfig.id,
        daysOfWeek: [0, 6], // Sat-Sun
        priority: 0,
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

  // Use UTC date for consistent day of week calculation
  const utcDate = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const dayOfWeek = utcDate.getUTCDay();
  const formattedDate = format(utcDate, "yyyy-MM-dd");

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
        eq(teesheetConfigs.isActive, true),
      ),
      with: {
        rules: true,
      },
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
        eq(teesheetConfigs.isActive, true),
      ),
      with: {
        rules: true,
      },
    });

    if (!config) {
      throw new Error("Configuration not found");
    }

    return convertToTeesheetConfig(config);
  }

  // If no specific or recurring rules found, fall back to system configs
  const systemConfigs = await db.query.teesheetConfigs.findMany({
    where: and(
      eq(teesheetConfigs.clerkOrgId, clerkOrgId),
      eq(teesheetConfigs.isSystemConfig, true),
      eq(teesheetConfigs.isActive, true),
    ),
    with: {
      rules: true,
    },
  });

  if (systemConfigs.length === 0) {
    throw new Error("No system configurations found");
  }

  // Find the appropriate system config based on day of week
  const weekdayConfig = systemConfigs.find((config) =>
    config.rules?.some((rule) => rule.daysOfWeek?.includes(dayOfWeek)),
  );

  if (!weekdayConfig) {
    throw new Error("No matching system configuration found");
  }

  return convertToTeesheetConfig(weekdayConfig);
}

export async function getTeesheetConfigs() {
  const orgId = await getOrganizationId();

  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  const configs = await db.query.teesheetConfigs.findMany({
    where: eq(teesheetConfigs.clerkOrgId, orgId),
    with: {
      rules: {
        where: eq(teesheetConfigRules.clerkOrgId, orgId),
      },
    },
  });

  return configs.map(convertToTeesheetConfig);
}

export async function getTeesheetConfig(id: number) {
  const orgId = await getOrganizationId();

  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  const config = await db.query.teesheetConfigs.findFirst({
    where: and(
      eq(teesheetConfigs.id, id),
      eq(teesheetConfigs.clerkOrgId, orgId),
    ),
    with: {
      rules: {
        where: eq(teesheetConfigRules.clerkOrgId, orgId),
      },
    },
  });

  if (!config) {
    return { success: false, error: "Config not found" };
  }

  return { success: true, data: convertToTeesheetConfig(config) };
}
