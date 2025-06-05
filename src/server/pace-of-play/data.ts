import { and, asc, desc, eq, gte, sql } from "drizzle-orm";
import { db } from "../db";
import { getOrganizationId } from "~/lib/auth";
import {
  members,
  paceOfPlay,
  teesheets,
  timeBlockMembers,
  timeBlocks,
  timeBlockGuests,
  guests,
} from "../db/schema";

import type {
  PaceOfPlayStatus,
  TimeBlockWithPaceOfPlay,
} from "~/app/types/PaceOfPlayTypes";

export type { PaceOfPlayStatus, TimeBlockWithPaceOfPlay };
export type PaceOfPlayRecord = typeof paceOfPlay.$inferSelect;
export type PaceOfPlayInsert = typeof paceOfPlay.$inferInsert;

// Create or update pace of play record
export async function upsertPaceOfPlay(
  timeBlockId: number,
  data: Partial<PaceOfPlayInsert>,
) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  // Check if record exists
  const existingRecord = await db.query.paceOfPlay.findFirst({
    where: and(
      eq(paceOfPlay.clerkOrgId, orgId),
      eq(paceOfPlay.timeBlockId, timeBlockId),
    ),
  });

  if (existingRecord) {
    // Update existing record
    return db
      .update(paceOfPlay)
      .set({
        ...data,
        updatedAt: new Date(),
        clerkOrgId: orgId,
      })
      .where(
        and(
          eq(paceOfPlay.clerkOrgId, orgId),
          eq(paceOfPlay.timeBlockId, timeBlockId),
        ),
      )
      .returning();
  } else {
    // Create new record - ensure required fields are present
    // Explicitly handle values that might be undefined
    const insertData = {
      ...data,
      timeBlockId,
      clerkOrgId: orgId,
      // Ensure required fields have values
      expectedStartTime: data.expectedStartTime || new Date(),
      expectedTurn9Time: data.expectedTurn9Time || new Date(),
      expectedFinishTime: data.expectedFinishTime || new Date(),
    };

    return db.insert(paceOfPlay).values(insertData).returning();
  }
}

// Get pace of play by timeBlockId
export async function getPaceOfPlayByTimeBlockId(timeBlockId: number) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  // First, get the actual timeBlock to see the real tee time
  const timeBlockData = await db.query.timeBlocks.findFirst({
    where: eq(timeBlocks.id, timeBlockId),
  });

  const paceData = await db.query.paceOfPlay.findFirst({
    where: and(
      eq(paceOfPlay.clerkOrgId, orgId),
      eq(paceOfPlay.timeBlockId, timeBlockId),
    ),
  });

  return paceData;
}

// Get all pace of play records for a specific date
export async function getPaceOfPlayByDate(date: Date) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const formattedDate = date.toISOString().split("T")[0];

  const result = await db
    .select({
      timeBlock: timeBlocks,
      paceOfPlay: paceOfPlay,
      numPlayers: sql<number>`COUNT(DISTINCT ${timeBlockMembers.memberId}) + COUNT(DISTINCT ${timeBlockGuests.guestId})`,
      playerNames: sql<string>`string_agg(DISTINCT CONCAT(${members.firstName}, ' ', ${members.lastName}), ', ')`,
    })
    .from(timeBlocks)
    .innerJoin(teesheets, eq(timeBlocks.teesheetId, teesheets.id))
    .leftJoin(paceOfPlay, eq(timeBlocks.id, paceOfPlay.timeBlockId))
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .leftJoin(timeBlockGuests, eq(timeBlocks.id, timeBlockGuests.timeBlockId))
    .leftJoin(guests, eq(timeBlockGuests.guestId, guests.id))
    .where(
      and(
        eq(timeBlocks.clerkOrgId, orgId),
        sql`${teesheets.date} = ${formattedDate}`,
      ),
    )
    .groupBy(timeBlocks.id, paceOfPlay.id)
    .orderBy(asc(timeBlocks.startTime));

  return result.map((row) => ({
    id: row.timeBlock.id,
    startTime: row.timeBlock.startTime,
    teesheetId: row.timeBlock.teesheetId,
    paceOfPlay: row.paceOfPlay,
    playerNames: row.playerNames || "",
    numPlayers: row.numPlayers,
  })) as TimeBlockWithPaceOfPlay[];
}

// Get ongoing pace of play records (for turn and finish pages)
export async function getOngoingPaceOfPlay(date: Date) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const formattedDate = date.toISOString().split("T")[0];

  return db
    .select({
      timeBlock: timeBlocks,
      paceOfPlay: paceOfPlay,
      numPlayers: sql<number>`COUNT(DISTINCT ${timeBlockMembers.memberId}) + COUNT(DISTINCT ${timeBlockGuests.guestId})`,
      playerNames: sql<string>`string_agg(DISTINCT CONCAT(${members.firstName}, ' ', ${members.lastName}), ', ')`,
    })
    .from(timeBlocks)
    .innerJoin(teesheets, eq(timeBlocks.teesheetId, teesheets.id))
    .innerJoin(paceOfPlay, eq(timeBlocks.id, paceOfPlay.timeBlockId))
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .leftJoin(timeBlockGuests, eq(timeBlocks.id, timeBlockGuests.timeBlockId))
    .leftJoin(guests, eq(timeBlockGuests.guestId, guests.id))
    .where(
      and(
        eq(timeBlocks.clerkOrgId, orgId),
        sql`${teesheets.date} = ${formattedDate}`,
        sql`${paceOfPlay.startTime} IS NOT NULL`,
        sql`${paceOfPlay.finishTime} IS NULL`,
      ),
    )
    .groupBy(timeBlocks.id, paceOfPlay.id)
    .orderBy(asc(timeBlocks.startTime));
}

// Get active time blocks at the turn (have started but not recorded turn time)
export async function getTimeBlocksAtTurn(date: Date) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const formattedDate = date.toISOString().split("T")[0];

  const result = await db
    .select({
      timeBlock: timeBlocks,
      paceOfPlay: paceOfPlay,
      numPlayers: sql<number>`COUNT(DISTINCT ${timeBlockMembers.memberId}) + COUNT(DISTINCT ${timeBlockGuests.guestId})`,
      playerNames: sql<string>`string_agg(DISTINCT CONCAT(${members.firstName}, ' ', ${members.lastName}), ', ')`,
    })
    .from(timeBlocks)
    .innerJoin(teesheets, eq(timeBlocks.teesheetId, teesheets.id))
    .innerJoin(paceOfPlay, eq(timeBlocks.id, paceOfPlay.timeBlockId))
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .leftJoin(timeBlockGuests, eq(timeBlocks.id, timeBlockGuests.timeBlockId))
    .leftJoin(guests, eq(timeBlockGuests.guestId, guests.id))
    .where(
      and(
        eq(timeBlocks.clerkOrgId, orgId),
        sql`${teesheets.date} = ${formattedDate}`,
        sql`${paceOfPlay.startTime} IS NOT NULL`,
        sql`${paceOfPlay.turn9Time} IS NULL`,
      ),
    )
    .groupBy(timeBlocks.id, paceOfPlay.id)
    .orderBy(asc(timeBlocks.startTime));

  return result.map((row) => ({
    id: row.timeBlock.id,
    startTime: row.timeBlock.startTime,
    teesheetId: row.timeBlock.teesheetId,
    paceOfPlay: row.paceOfPlay,
    playerNames: row.playerNames || "",
    numPlayers: row.numPlayers,
  })) as TimeBlockWithPaceOfPlay[];
}

// Get active time blocks at the finish (have started, recorded turn time, but not finished)
export async function getTimeBlocksAtFinish(
  date: Date,
  includeMissedTurns = false,
): Promise<{
  regular: TimeBlockWithPaceOfPlay[];
  missedTurns: TimeBlockWithPaceOfPlay[];
}> {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const formattedDate = date.toISOString().split("T")[0];

  // Base query conditions
  const baseConditions = [
    eq(timeBlocks.clerkOrgId, orgId),
    sql`${teesheets.date} = ${formattedDate}`,
    sql`${paceOfPlay.startTime} IS NOT NULL`,
    sql`${paceOfPlay.finishTime} IS NULL`,
  ];

  const result = await db
    .select({
      timeBlock: timeBlocks,
      paceOfPlay: paceOfPlay,
      numPlayers: sql<number>`COUNT(DISTINCT ${timeBlockMembers.memberId}) + COUNT(DISTINCT ${timeBlockGuests.guestId})`,
      playerNames: sql<string>`string_agg(DISTINCT CONCAT(${members.firstName}, ' ', ${members.lastName}), ', ')`,
    })
    .from(timeBlocks)
    .innerJoin(teesheets, eq(timeBlocks.teesheetId, teesheets.id))
    .innerJoin(paceOfPlay, eq(timeBlocks.id, paceOfPlay.timeBlockId))
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .leftJoin(timeBlockGuests, eq(timeBlocks.id, timeBlockGuests.timeBlockId))
    .leftJoin(guests, eq(timeBlockGuests.guestId, guests.id))
    .where(and(...baseConditions))
    .groupBy(timeBlocks.id, paceOfPlay.id)
    .orderBy(asc(timeBlocks.startTime));

  const timeBlocksWithPace = result.map((row) => ({
    id: row.timeBlock.id,
    startTime: row.timeBlock.startTime,
    teesheetId: row.timeBlock.teesheetId,
    paceOfPlay: row.paceOfPlay,
    playerNames: row.playerNames || "",
    numPlayers: row.numPlayers,
    hasMissedTurn: !row.paceOfPlay.turn9Time,
  })) as (TimeBlockWithPaceOfPlay & { hasMissedTurn: boolean })[];

  // If including missed turns, separate them into two groups
  const regular = timeBlocksWithPace.filter((tb) => !tb.hasMissedTurn);
  const missedTurns = timeBlocksWithPace.filter((tb) => tb.hasMissedTurn);

  return {
    regular,
    missedTurns,
  };
}

// Get pace of play history for a specific member
export async function getMemberPaceOfPlayHistory(memberId: number) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const result = await db
    .select({
      id: paceOfPlay.id,
      timeBlockId: timeBlocks.id,
      date: teesheets.date,
      startTime: timeBlocks.startTime,
      actualStartTime: paceOfPlay.startTime,
      turn9Time: paceOfPlay.turn9Time,
      finishTime: paceOfPlay.finishTime,
      expectedStartTime: paceOfPlay.expectedStartTime,
      expectedTurn9Time: paceOfPlay.expectedTurn9Time,
      expectedFinishTime: paceOfPlay.expectedFinishTime,
      status: paceOfPlay.status,
      notes: paceOfPlay.notes,
      createdAt: paceOfPlay.createdAt,
    })
    .from(paceOfPlay)
    .innerJoin(timeBlocks, eq(paceOfPlay.timeBlockId, timeBlocks.id))
    .innerJoin(teesheets, eq(timeBlocks.teesheetId, teesheets.id))
    .innerJoin(
      timeBlockMembers,
      eq(timeBlocks.id, timeBlockMembers.timeBlockId),
    )
    .where(
      and(
        eq(paceOfPlay.clerkOrgId, orgId),
        eq(timeBlockMembers.memberId, memberId),
      ),
    )
    .orderBy(desc(teesheets.date), asc(timeBlocks.startTime));

  return result;
}
