import { db } from "~/server/db";
import {
  teesheets,
  timeBlocks,
  members,
  timeBlockMembers,
} from "~/server/db/schema";
import { eq } from "drizzle-orm";
import { format } from "date-fns";
import type { TeeSheet, TimeBlock, Member, TeesheetConfig } from "~/app/types/TeeSheetTypes";
import { generateTimeBlocks } from "~/lib/utils";
import { createTimeBlock } from "~/server/teesheet/actions";
import { getDefaultConfigForDate } from "~/server/config/data";

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
