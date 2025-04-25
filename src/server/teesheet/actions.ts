"use server";

import { getOrganizationId } from "~/lib/auth";
import { db } from "~/server/db";
import { timeBlockMembers, timeBlockGuests } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";

type ActionResult = {
  success: boolean;
  error?: string;
};

export async function createTimeBlock(
  teesheetId: number,
  startTime: Date,
  endTime: Date,
  memberIds?: number[],
) {
  try {
    return "Time block created successfully";
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

    return "Time block updated successfully";
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

export async function removeTimeBlockMember(
  timeBlockId: number,
  memberId: number,
): Promise<ActionResult> {
  try {
    const clerkOrgId = await getOrganizationId();

    // Delete the time block member
    const result = await db
      .delete(timeBlockMembers)
      .where(
        and(
          eq(timeBlockMembers.timeBlockId, timeBlockId),
          eq(timeBlockMembers.memberId, memberId),
          eq(timeBlockMembers.clerkOrgId, clerkOrgId),
        ),
      )
      .returning();

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Member not found in time block",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing time block member:", error);
    return {
      success: false,
      error: "Failed to remove member from time block",
    };
  }
}

export async function removeTimeBlockGuest(
  timeBlockId: number,
  guestId: number,
): Promise<ActionResult> {
  try {
    const clerkOrgId = await getOrganizationId();

    // Delete the time block guest
    const result = await db
      .delete(timeBlockGuests)
      .where(
        and(
          eq(timeBlockGuests.timeBlockId, timeBlockId),
          eq(timeBlockGuests.guestId, guestId),
          eq(timeBlockGuests.clerkOrgId, clerkOrgId),
        ),
      )
      .returning();

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Guest not found in time block",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error removing time block guest:", error);
    return {
      success: false,
      error: "Failed to remove guest from time block",
    };
  }
}
