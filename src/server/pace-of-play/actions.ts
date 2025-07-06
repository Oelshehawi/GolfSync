"use server";

import { revalidatePath } from "next/cache";

import {
  getPaceOfPlayByTimeBlockId,
  getPaceOfPlayByDate,
  upsertPaceOfPlay,
  type PaceOfPlayInsert,
  type PaceOfPlayRecord,
  getMemberPaceOfPlayHistory,
} from "./data";
import { type PaceOfPlayStatus } from "~/app/types/PaceOfPlayTypes";
import { db } from "../db";
import { and, eq } from "drizzle-orm";
import { timeBlocks } from "../db/schema";

// Constants for expected pace durations in minutes
const EXPECTED_TURN_DURATION = 120; // 2 hours to reach the turn
const EXPECTED_FINISH_DURATION = 240; // 4 hours to complete the round

// Helper function to calculate expected times
function calculateExpectedTimes(startTime: Date) {
  const expectedTurn9Time = new Date(startTime);
  expectedTurn9Time.setMinutes(
    expectedTurn9Time.getMinutes() + EXPECTED_TURN_DURATION,
  );

  const expectedFinishTime = new Date(startTime);
  expectedFinishTime.setMinutes(
    expectedFinishTime.getMinutes() + EXPECTED_FINISH_DURATION,
  );

  return {
    expectedStartTime: startTime,
    expectedTurn9Time,
    expectedFinishTime,
  };
}

// Helper to determine pace of play status
function determinePaceStatus(
  actualTime: Date | null,
  expectedTime: Date,
  isFinish = false,
): PaceOfPlayStatus {
  if (!actualTime) return "pending";

  const diffMinutes = Math.floor(
    (actualTime.getTime() - expectedTime.getTime()) / (1000 * 60),
  );

  // For finish status, provide more detailed completion status
  if (isFinish) {
    if (Math.abs(diffMinutes) <= 5) return "completed_on_time";
    if (diffMinutes < 0) return "completed_early";
    return "completed_late";
  }

  // On time: within 5 minutes of expected time (either early or late)
  // Ahead: more than 5 minutes early
  // Behind: more than 5 minutes late
  if (Math.abs(diffMinutes) <= 5) return "on_time"; // Within 5 minutes of expected time
  if (diffMinutes < 0) return "ahead"; // More than 5 minutes early
  return "behind"; // More than 5 minutes late
}

// Initialize pace of play when a group starts
export async function initializePaceOfPlay(
  timeBlockId: number,
  startTime: Date,
) {
  // Get the timeblock to get the actual scheduled tee time
  const timeBlockRes = await db
    .select({
      startTime: timeBlocks.startTime,
    })
    .from(timeBlocks)
    .where(eq(timeBlocks.id, timeBlockId));

  // Get scheduled tee time as string (e.g. "11:45")
  const scheduledTeeTimeStr = timeBlockRes[0]?.startTime || "";

  // Create a proper date object from the tee time
  let teeTimeDate = startTime; // Default to check-in time

  if (scheduledTeeTimeStr) {
    try {
      // Extract hours and minutes from the time string (e.g. "11:45")
      const parts = scheduledTeeTimeStr.split(":");
      if (parts.length >= 2 && parts[0] && parts[1]) {
        const hours = parseInt(parts[0], 10);
        const minutes = parseInt(parts[1], 10);

        if (!isNaN(hours) && !isNaN(minutes)) {
          // Create a new date with today's date but with the scheduled hours/minutes
          teeTimeDate = new Date(startTime); // Clone the date
          teeTimeDate.setHours(hours);
          teeTimeDate.setMinutes(minutes);
          teeTimeDate.setSeconds(0);
          teeTimeDate.setMilliseconds(0);
        }
      }
    } catch (error) {
      console.error("Error parsing tee time:", error);
    }
  }

  const { expectedStartTime, expectedTurn9Time, expectedFinishTime } =
    calculateExpectedTimes(teeTimeDate);

  const paceData: Partial<PaceOfPlayInsert> = {
    startTime, // This is the actual check-in time
    expectedStartTime: teeTimeDate, // This is when they were scheduled to tee off
    expectedTurn9Time,
    expectedFinishTime,
    status: "on_time",
    lastUpdatedBy: "system",
  };

  await upsertPaceOfPlay(timeBlockId, paceData);
  revalidatePath("/admin/pace-of-play");
  return { success: true };
}

// Update turn time (9th hole) for a group
export async function updateTurnTime(
  timeBlockId: number,
  turn9Time: Date,
  updatedBy: string,
  notes?: string,
) {
  const currentPace = await getPaceOfPlayByTimeBlockId(timeBlockId);
  if (!currentPace) {
    throw new Error("Pace of play record not found");
  }

  // Get the actual tee time for reference
  const timeBlockRes = await db
    .select({
      startTime: timeBlocks.startTime,
    })
    .from(timeBlocks)
    .where(eq(timeBlocks.id, timeBlockId));


  // Ensure we're using the correct expected time
  const expectedTurn9Time = currentPace.expectedTurn9Time
    ? new Date(currentPace.expectedTurn9Time)
    : new Date(); // fallback shouldn't happen

  const status = determinePaceStatus(turn9Time, expectedTurn9Time);

  const paceData: Partial<PaceOfPlayInsert> = {
    turn9Time,
    status,
    lastUpdatedBy: updatedBy,
    notes: notes || currentPace.notes,
  };

  await upsertPaceOfPlay(timeBlockId, paceData);
  revalidatePath("/admin/pace-of-play");
  revalidatePath("/admin/pace-of-play/turn");
  return { success: true };
}

// Update finish time (18th hole) for a group
export async function updateFinishTime(
  timeBlockId: number,
  finishTime: Date,
  updatedBy: string,
  notes?: string,
) {
  const currentPace = await getPaceOfPlayByTimeBlockId(timeBlockId);
  if (!currentPace) {
    throw new Error("Pace of play record not found");
  }

  const status = determinePaceStatus(
    finishTime,
    new Date(currentPace.expectedFinishTime),
    true,
  );

  // If notes aren't provided, use turn notes if available, or fall back to existing notes
  const updateNotes =
    notes ||
    (currentPace.turn9Time && currentPace.notes ? currentPace.notes : null);

  const paceData: Partial<PaceOfPlayInsert> = {
    finishTime,
    status,
    lastUpdatedBy: updatedBy,
    notes: updateNotes,
  };

  await upsertPaceOfPlay(timeBlockId, paceData);
  revalidatePath("/admin/pace-of-play");
  revalidatePath("/admin/pace-of-play/finish");
  return { success: true };
}

// Update both turn and finish times together (for missed turn scenarios)
export async function updateTurnAndFinishTime(
  timeBlockId: number,
  turnTime: Date,
  finishTime: Date,
  updatedBy: string,
  notes?: string,
): Promise<{ success: boolean; error?: string }> {
  const currentPace = await getPaceOfPlayByTimeBlockId(timeBlockId);
  if (!currentPace) {
    throw new Error("Pace of play record not found");
  }

  // Validate times
  if (turnTime >= finishTime) {
    return {
      success: false,
      error: "Turn time must be before finish time",
    };
  }

  const startTime = new Date(currentPace.startTime!);
  if (startTime >= turnTime) {
    return {
      success: false,
      error: "Turn time must be after start time",
    };
  }

  // Calculate status for both turn and finish
  const turnStatus = determinePaceStatus(
    turnTime,
    new Date(currentPace.expectedTurn9Time),
  );
  const finishStatus = determinePaceStatus(
    finishTime,
    new Date(currentPace.expectedFinishTime),
    true,
  );

  const paceData: Partial<PaceOfPlayInsert> = {
    turn9Time: turnTime,
    finishTime,
    status: finishStatus,
    lastUpdatedBy: updatedBy,
    notes: notes || "Turn and finish times recorded together",
  };

  await upsertPaceOfPlay(timeBlockId, paceData);
  revalidatePath("/admin/pace-of-play");
  revalidatePath("/admin/pace-of-play/finish");
  return { success: true };
}

// Get pace of play data for a specific timeblock
export async function getPaceOfPlayData(
  timeBlockId: number,
): Promise<PaceOfPlayRecord | null> {
  try {
    const result = await getPaceOfPlayByTimeBlockId(timeBlockId);
    return result || null; // Explicitly return null if result is undefined
  } catch (error) {
    console.error("Error fetching pace of play data:", error);
    return null;
  }
}

// Get all pace of play data for a specific date
export async function getAllPaceOfPlayForDate(date: Date) {
  try {
    return await getPaceOfPlayByDate(date);
  } catch (error) {
    console.error("Error fetching pace of play data for date:", error);
    return [];
  }
}

// Get pace of play history for a specific member
export async function getMemberPaceOfPlayHistoryAction(memberId: number) {
  try {
    const history = await getMemberPaceOfPlayHistory(memberId);
    // Transform the data to match PaceOfPlayHistoryItem interface
    const transformedHistory = history.map((item) => ({
      ...item,
      status: item.status as PaceOfPlayStatus,
    }));
    return { success: true, data: transformedHistory };
  } catch (error) {
    console.error("Error fetching member pace of play history:", error);
    return {
      success: false,
      data: [],
      error: "Failed to fetch pace of play history",
    };
  }
}
