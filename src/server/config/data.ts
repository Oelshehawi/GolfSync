import { db } from "~/server/db";
import { teesheetConfigs, teesheetConfigRules } from "~/server/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { isWeekend } from "date-fns";
import type { TeesheetConfig } from "~/app/types/TeeSheetTypes";
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";

export async function initializeDefaultConfigs() {
  // Check if configs exist
  const existingConfigs = await db.query.teesheetConfigs.findMany();

  if (existingConfigs.length === 0) {
    // Create default configurations
    const [weekdayConfig] = await db
      .insert(teesheetConfigs)
      .values({
        name: "Weekday",
        startTime: "07:00",
        endTime: "19:00",
        interval: 15,
        maxMembersPerBlock: 4,
        isActive: true,
      })
      .returning();

    if (!weekdayConfig) {
      throw new Error("Failed to create weekday config");
    }

    const [weekendConfig] = await db
      .insert(teesheetConfigs)
      .values({
        name: "Weekend",
        startTime: "07:00",
        endTime: "19:00",
        interval: 20,
        maxMembersPerBlock: 4,
        isActive: true,
      })
      .returning();

    if (!weekendConfig) {
      throw new Error("Failed to create weekend config");
    }

    // Create default rules
    await db.insert(teesheetConfigRules).values([
      {
        configId: weekdayConfig.id,
        isWeekend: false,
        priority: 1,
        isActive: true,
      },
      {
        configId: weekendConfig.id,
        isWeekend: true,
        priority: 1,
        isActive: true,
      },
    ]);
  }
}

export async function getDefaultConfigForDate(
  date: Date,
): Promise<TeesheetConfig> {
  // First ensure default configs exist
  await initializeDefaultConfigs();

  const isWeekendDay = isWeekend(date);
  const dayOfWeek = date.getDay();

  // Find the highest priority matching rule
  const rules = await db.query.teesheetConfigRules.findMany({
    where: and(
      eq(teesheetConfigRules.isActive, true),
      or(
        eq(teesheetConfigRules.isWeekend, isWeekendDay),
        eq(teesheetConfigRules.dayOfWeek, dayOfWeek),
      ),
    ),
    orderBy: desc(teesheetConfigRules.priority),
    limit: 1,
  });

  if (rules.length === 0) {
    throw new Error("No matching configuration rule found");
  }

  const rule = rules[0];
  if (!rule) {
    throw new Error("Configuration rule not found");
  }

  const config = await db.query.teesheetConfigs.findFirst({
    where: eq(teesheetConfigs.id, rule.configId),
  });

  if (!config) {
    throw new Error("Configuration not found");
  }

  return config;
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