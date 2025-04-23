import { db } from "~/server/db";
import {
  teesheets,
  timeBlocks,
  timeBlockMembers,
  members,
} from "~/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";
import type {
  TeeSheet,
  TimeBlock,
  TimeBlockWithMembers,
  TeesheetConfig,
} from "~/app/types/TeeSheetTypes";
import { getConfigForDate } from "~/server/settings/data";
import { generateTimeBlocks } from "~/lib/utils";
import { localToUTCMidnight } from "~/lib/utils";

async function createTimeBlocksForTeesheet(
  teesheetId: number,
  config: TeesheetConfig,
  date: Date,
) {
  const clerkOrgId = await getOrganizationId();

  // Generate time blocks using the utility function
  const timeSlots = generateTimeBlocks(date, config);

  // Create time blocks for each consecutive pair of times
  const blocks = timeSlots.slice(0, -1).map((startTime, index) => {
    const endTime = timeSlots[index + 1];
    if (!endTime) {
      throw new Error("Invalid time block: missing end time");
    }
    return {
      clerkOrgId,
      teesheetId,
      startTime,
      endTime,
    };
  });

  // Insert all blocks in a single query
  await db.insert(timeBlocks).values(blocks);
}

export async function getOrCreateTeesheet(
  date: Date,
): Promise<{ teesheet: TeeSheet; config: TeesheetConfig }> {
  const clerkOrgId = await getOrganizationId();

  // Convert input date to UTC midnight
  const utcDate = localToUTCMidnight(date);

  // Try to find existing teesheet for the same UTC date
  const existingTeesheet = await db.query.teesheets.findFirst({
    where: and(
      eq(teesheets.clerkOrgId, clerkOrgId),
      // Compare the exact timestamp
      eq(teesheets.date, utcDate),
    ),
  });

  // Get config for the date
  const config = await getConfigForDate(date);

  if (existingTeesheet) {
    return { teesheet: existingTeesheet, config };
  }

  // Create new teesheet with UTC date
  const newTeesheet = await db
    .insert(teesheets)
    .values({
      clerkOrgId,
      date: utcDate,
      configId: config.id,
    })
    .returning()
    .then((result) => result[0]);

  if (!newTeesheet) {
    throw new Error("Failed to create teesheet");
  }

  // Create time blocks for the new teesheet
  await createTimeBlocksForTeesheet(newTeesheet.id, config, utcDate);

  return { teesheet: newTeesheet, config };
}

export async function getTimeBlocksForTeesheet(
  teesheetId: number,
): Promise<TimeBlockWithMembers[]> {
  const clerkOrgId = await getOrganizationId();

  const result = await db
    .select({
      id: timeBlocks.id,
      clerkOrgId: timeBlocks.clerkOrgId,
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
    .where(
      and(
        eq(timeBlocks.clerkOrgId, clerkOrgId),
        eq(timeBlocks.teesheetId, teesheetId),
      ),
    );

  if (!result || result.length === 0) {
    return [];
  }

  // Group results by time block
  const timeBlocksMap = new Map<number, TimeBlockWithMembers>();

  result.forEach((row) => {
    if (!timeBlocksMap.has(row.id)) {
      timeBlocksMap.set(row.id, {
        id: row.id,
        clerkOrgId: row.clerkOrgId,
        teesheetId: row.teesheetId,
        startTime: row.startTime,
        endTime: row.endTime,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        members: [],
      });
    }

    if (row.members?.id) {
      const timeBlock = timeBlocksMap.get(row.id)!;
      timeBlock.members.push({
        id: row.members.id,
        firstName: row.members.firstName!,
        lastName: row.members.lastName!,
        memberNumber: row.members.memberNumber!,
      });
    }
  });

  return Array.from(timeBlocksMap.values());
}

export async function getTimeBlockWithMembers(
  timeBlockId: number,
): Promise<TimeBlockWithMembers | null> {
  const clerkOrgId = await getOrganizationId();

  const result = await db
    .select({
      id: timeBlocks.id,
      clerkOrgId: timeBlocks.clerkOrgId,
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
    .where(
      and(
        eq(timeBlocks.id, timeBlockId),
        eq(timeBlocks.clerkOrgId, clerkOrgId),
      ),
    );

  if (!result || result.length === 0) {
    return null;
  }

  // Group members by time block
  const timeBlock = result[0]!;
  const blockMembers = result
    .filter((row) => row.members?.id)
    .map((row) => ({
      id: row.members!.id!,
      firstName: row.members!.firstName!,
      lastName: row.members!.lastName!,
      memberNumber: row.members!.memberNumber!,
    }));

  return {
    id: timeBlock.id,
    clerkOrgId: timeBlock.clerkOrgId,
    teesheetId: timeBlock.teesheetId,
    startTime: timeBlock.startTime,
    endTime: timeBlock.endTime,
    createdAt: timeBlock.createdAt,
    updatedAt: timeBlock.updatedAt,
    members: blockMembers || [], // Ensure members is always an array
  };
}
