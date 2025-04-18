"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { timeBlockMembers } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { searchMembers } from "./data";

export async function addMemberToTimeBlock(
  timeBlockId: number,
  memberId: number,
) {
  try {
    const session = await auth();
    if (!session.orgId) {
      return { success: false, error: "No organization selected" };
    }

    // Check if member is already in the time block
    const existingMember = await db.query.timeBlockMembers.findFirst({
      where: and(
        eq(timeBlockMembers.timeBlockId, timeBlockId),
        eq(timeBlockMembers.memberId, memberId),
      ),
    });

    if (existingMember) {
      return { success: false, error: "Member is already in this time block" };
    }

    // Add member to time block
    await db.insert(timeBlockMembers).values({
      clerkOrgId: session.orgId,
      timeBlockId,
      memberId,
    });

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding member to time block:", error);
    return { success: false, error: "Failed to add member to time block" };
  }
}

export async function removeMemberFromTimeBlock(
  timeBlockId: number,
  memberId: number,
) {
  try {
    const session = await auth();
    if (!session.orgId) {
      return { success: false, error: "No organization selected" };
    }

    await db
      .delete(timeBlockMembers)
      .where(
        and(
          eq(timeBlockMembers.timeBlockId, timeBlockId),
          eq(timeBlockMembers.memberId, memberId),
          eq(timeBlockMembers.clerkOrgId, session.orgId),
        ),
      );

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing member from time block:", error);
    return { success: false, error: "Failed to remove member from time block" };
  }
}

export async function searchMembersAction(query: string = "") {
  // Limit to 10 results for better performance
  const { results } = await searchMembers(query, 1, 10);
  return results;
}
