"use server";

import { db } from "~/server/db";
import { timeBlocks, timeBlockMembers } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";

export async function createTimeBlock(
  teesheetId: number,
  startTime: Date,
  endTime: Date,
  memberIds?: number[],
) {
  try {
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

    if (memberIds && memberIds.length > 0) {
      await db.insert(timeBlockMembers).values(
        memberIds.map((memberId) => ({
          timeBlockId: timeBlock.id,
          memberId,
        })),
      );
    }

    return timeBlock;
  } catch (error) {
    console.error("Error creating time block:", error);
    throw error;
  }
}

export async function updateTimeBlock(
  timeBlockId: number,
  memberIds: number[],
) {
  try {
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

    return timeBlock;
  } catch (error) {
    console.error("Error updating time block:", error);
    throw error;
  }
}

export async function deleteTimeBlock(timeBlockId: number) {
  try {
    await db.delete(timeBlocks).where(eq(timeBlocks.id, timeBlockId));
  } catch (error) {
    console.error("Error deleting time block:", error);
    throw error;
  }
}
