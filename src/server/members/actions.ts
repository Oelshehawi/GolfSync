"use server";

import { db } from "~/server/db";
import { timeBlockMembers } from "~/server/db/schema";
import { revalidatePath } from "next/cache";
import { eq, and } from "drizzle-orm";

export async function addMemberToTimeBlock(
  timeBlockId: number,
  memberId: number,
) {
  try {
    await db.insert(timeBlockMembers).values({
      timeBlockId,
      memberId,
    });

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding member to time block:", error);
    return { success: false, error: "Failed to add member" };
  }
}

export async function removeMemberFromTimeBlock(
  timeBlockId: number,
  memberId: number,
) {
  try {
    await db
      .delete(timeBlockMembers)
      .where(
        and(
          eq(timeBlockMembers.timeBlockId, timeBlockId),
          eq(timeBlockMembers.memberId, memberId),
        ),
      );

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing member from time block:", error);
    return { success: false, error: "Failed to remove member" };
  }
}

export async function updateTimeBlockMembers(
  timeBlockId: number,
  memberIds: number[],
) {
  try {
    // First delete all existing members
    await db
      .delete(timeBlockMembers)
      .where(eq(timeBlockMembers.timeBlockId, timeBlockId));

    // Then add new members if any
    if (memberIds.length > 0) {
      await db.insert(timeBlockMembers).values(
        memberIds.map((memberId) => ({
          timeBlockId,
          memberId,
        })),
      );
    }

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    return { success: true };
  } catch (error) {
    console.error("Error updating time block members:", error);
    return { success: false, error: "Failed to update members" };
  }
}
