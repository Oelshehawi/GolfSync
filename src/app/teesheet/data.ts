import { db } from "~/server/db";
import {
  teesheets,
  timeBlocks,
  members,
  timeBlockMembers,
  teesheetConfigs,
  teesheetConfigRules,
} from "~/server/db/schema";
import { eq, and, or, desc } from "drizzle-orm";
import { format, isWeekend, parse, addMinutes } from "date-fns";
import type {
  TeeSheet,
  TimeBlock,
  Member,
  TeesheetConfig,
} from "~/app/types/TeeSheetTypes";
import { generateTimeBlocks } from "~/lib/utils";
import { clerkClient } from "@clerk/nextjs/server";
import { auth } from "@clerk/nextjs/server";

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

interface TimeBlockQueryResult {
  id: number;
  teesheetId: number;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date | null;
  member: {
    id: number | null;
    firstName: string | null;
    lastName: string | null;
    memberNumber: string | null;
  } | null;
}

export async function getTimeBlockWithMembers(timeBlockId: number) {
  const result = (await db
    .select({
      id: timeBlocks.id,
      teesheetId: timeBlocks.teesheetId,
      startTime: timeBlocks.startTime,
      endTime: timeBlocks.endTime,
      createdAt: timeBlocks.createdAt,
      updatedAt: timeBlocks.updatedAt,
      member: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
      },
    })
    .from(timeBlocks)
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .where(eq(timeBlocks.id, timeBlockId))) as TimeBlockQueryResult[];

  if (!result || result.length === 0) {
    return null;
  }

  // Group members by time block
  const timeBlock = result[0]!;
  const blockMembers: Member[] = result
    .filter((row: TimeBlockQueryResult) => row.member?.id)
    .map((row: TimeBlockQueryResult) => ({
      id: row.member!.id!,
      firstName: row.member!.firstName!,
      lastName: row.member!.lastName!,
      memberNumber: row.member!.memberNumber!,
    }));

  return {
    id: timeBlock.id,
    teesheetId: timeBlock.teesheetId,
    startTime: timeBlock.startTime,
    endTime: timeBlock.endTime,
    createdAt: timeBlock.createdAt,
    updatedAt: timeBlock.updatedAt,
    members: blockMembers,
  };
}

async function createTimeBlocksForTeesheet(
  teesheetId: number,
  config: TeesheetConfig,
  date: Date,
) {
  const timeBlocks = generateTimeBlocks(date, config);

  // Create time blocks in batch for each consecutive pair of times
  for (let i = 0; i < timeBlocks.length - 1; i++) {
    await createTimeBlock(teesheetId, timeBlocks[i]!, timeBlocks[i + 1]!);
  }
}

export async function getOrCreateTeesheet(date: Date): Promise<TeeSheet> {
  const formattedDate = format(date, "yyyy-MM-dd");

  // Try to find existing teesheet
  let teesheet = await db.query.teesheets.findFirst({
    where: eq(teesheets.date, formattedDate),
  });

  // If no teesheet exists, create one with default config and time blocks
  if (!teesheet) {
    const defaultConfig = await getDefaultConfigForDate(date);
    const [newTeesheet] = await db
      .insert(teesheets)
      .values({
        date: formattedDate,
        configId: defaultConfig.id,
      })
      .returning();

    if (!newTeesheet) {
      throw new Error("Failed to create teesheet");
    }

    // Create time blocks for the new teesheet
    await createTimeBlocksForTeesheet(newTeesheet.id, defaultConfig, date);

    teesheet = newTeesheet;
  }

  return {
    id: teesheet.id,
    date: teesheet.date,
    configId: teesheet.configId,
    createdAt: teesheet.createdAt,
    updatedAt: teesheet.updatedAt,
  };
}

interface BlockQueryResult {
  id: number;
  teesheetId: number;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date | null;
  members: {
    id: number;
    firstName: string;
    lastName: string;
    memberNumber: string;
  } | null;
}

export async function getTimeBlocksForTeesheet(
  teesheetId: number,
): Promise<TimeBlock[]> {
  const blocks = (await db
    .select({
      id: timeBlocks.id,
      teesheetId: timeBlocks.teesheetId,
      startTime: timeBlocks.startTime,
      endTime: timeBlocks.endTime,
      createdAt: timeBlocks.createdAt,
      updatedAt: timeBlocks.updatedAt,
      members: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
      },
    })
    .from(timeBlocks)
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .where(eq(timeBlocks.teesheetId, teesheetId))) as BlockQueryResult[];

  // Group members by time block
  const groupedBlocks = blocks.reduce<TimeBlock[]>((acc, block) => {
    const existingBlock = acc.find((b) => b.id === block.id);
    const member: Member | null = block.members
      ? {
          id: block.members.id,
          firstName: block.members.firstName,
          lastName: block.members.lastName,
          memberNumber: block.members.memberNumber,
        }
      : null;

    if (existingBlock) {
      if (member) {
        existingBlock.members.push(member);
      }
    } else {
      acc.push({
        id: block.id,
        teesheetId: block.teesheetId,
        startTime: block.startTime,
        endTime: block.endTime,
        createdAt: block.createdAt,
        updatedAt: block.updatedAt,
        members: member ? [member] : [],
      });
    }
    return acc;
  }, []);

  return groupedBlocks;
}

export async function createTimeBlock(
  teesheetId: number,
  startTime: Date,
  endTime: Date,
  memberIds?: number[],
): Promise<TimeBlock> {
  const [timeBlock] = await db
    .insert(timeBlocks)
    .values({
      teesheetId,
      startTime,
      endTime,
    })
    .returning();

  if (!timeBlock) {
    throw new Error("Failed to create time block");
  }

  let blockMembers: Member[] = [];
  if (memberIds && memberIds.length > 0) {
    await db.insert(timeBlockMembers).values(
      memberIds.map((memberId) => ({
        timeBlockId: timeBlock.id,
        memberId,
      })),
    );

    // Fetch the member details
    const memberDetails = await db
      .select()
      .from(members)
      .where(eq(members.id, memberIds[0]!));

    blockMembers = memberDetails.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      memberNumber: member.memberNumber,
    }));
  }

  return {
    id: timeBlock.id,
    teesheetId: timeBlock.teesheetId,
    startTime: timeBlock.startTime,
    endTime: timeBlock.endTime,
    createdAt: timeBlock.createdAt,
    updatedAt: timeBlock.updatedAt,
    members: blockMembers,
  };
}

export async function updateTimeBlock(
  timeBlockId: number,
  memberIds: number[],
): Promise<TimeBlock> {
  // First delete all existing member associations
  await db
    .delete(timeBlockMembers)
    .where(eq(timeBlockMembers.timeBlockId, timeBlockId));

  let blockMembers: Member[] = [];
  // Then add the new member associations
  if (memberIds.length > 0) {
    await db.insert(timeBlockMembers).values(
      memberIds.map((memberId) => ({
        timeBlockId,
        memberId,
      })),
    );

    // Fetch the member details
    const memberDetails = await db
      .select()
      .from(members)
      .where(eq(members.id, memberIds[0]!));

    blockMembers = memberDetails.map((member) => ({
      id: member.id,
      firstName: member.firstName,
      lastName: member.lastName,
      memberNumber: member.memberNumber,
    }));
  }

  // Return the updated time block
  const [timeBlock] = await db
    .select()
    .from(timeBlocks)
    .where(eq(timeBlocks.id, timeBlockId));

  if (!timeBlock) {
    throw new Error("Time block not found");
  }

  return {
    id: timeBlock.id,
    teesheetId: timeBlock.teesheetId,
    startTime: timeBlock.startTime,
    endTime: timeBlock.endTime,
    createdAt: timeBlock.createdAt,
    updatedAt: timeBlock.updatedAt,
    members: blockMembers,
  };
}

// Helper function to map members to their full names
export function mapMembersToNames(members: Member[]): string[] {
  return members.map((member) => `${member.firstName} ${member.lastName}`);
}

export async function searchMembers(query: string) {
  if (query.length < 2) return [];

  const searchTerm = query.toLowerCase();

  const results = await db.query.members.findMany({
    where: (members, { or, like, sql }) =>
      or(
        sql`LOWER(${members.firstName}) LIKE ${`%${searchTerm}%`}`,
        sql`LOWER(${members.lastName}) LIKE ${`%${searchTerm}%`}`,
        sql`LOWER(${members.memberNumber}) LIKE ${`%${searchTerm}%`}`,
        // Also search for full name concatenation
        sql`LOWER(CONCAT(${members.firstName}, ' ', ${members.lastName})) LIKE ${`%${searchTerm}%`}`,
      ),
    limit: 10,
  });

  return results;
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