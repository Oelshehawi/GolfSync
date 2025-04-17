"use server";

import { db } from "~/server/db";
import { timeBlocks } from "~/server/db/schema";
import { eq } from "drizzle-orm";

export async function createTimeBlock(
  teesheetId: number,
  startTime: Date,
  endTime: Date,
  memberIds?: number[],
) {
  try {
    

    return 'Time block created successfully';
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
   


    return 'Time block updated successfully';
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
