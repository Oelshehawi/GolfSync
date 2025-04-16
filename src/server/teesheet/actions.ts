"use server";

import { db } from "~/server/db";
import { timeBlocks, timeBlockMembers } from "~/server/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function createTimeBlock(
  teesheetId: number,
  startTime: Date,
  endTime: Date,
  memberIds?: number[],
) {
  const [timeBlock] = await db
    .insert(timeBlocks)
    .values({
      teesheetId,
      startTime,
      endTime,
    })
    .returning();

  if (memberIds && memberIds.length > 0) {
    await db.insert(timeBlockMembers).values(
      memberIds.map((memberId) => ({
        timeBlockId: timeBlock?.id || 0,
        memberId,
      })),
    );
  }

  revalidatePath("/admin");
  return timeBlock;
}

export async function updateTimeBlock(
  timeBlockId: number,
  memberIds: number[],
) {
  // First, delete existing member associations
  await db
    .delete(timeBlockMembers)
    .where(eq(timeBlockMembers.timeBlockId, timeBlockId));

  // Then, add new member associations if any
  if (memberIds.length > 0) {
    await db.insert(timeBlockMembers).values(
      memberIds.map((memberId) => ({
        timeBlockId,
        memberId,
      })),
    );
  }

  const [timeBlock] = await db
    .select()
    .from(timeBlocks)
    .where(eq(timeBlocks.id, timeBlockId));

  if (!timeBlock) {
    throw new Error("Time block not found");
  }

  revalidatePath("/admin");
  return timeBlock;
}

export async function deleteTimeBlock(timeBlockId: number) {
  await db.delete(timeBlocks).where(eq(timeBlocks.id, timeBlockId));
  revalidatePath("/admin");
}
