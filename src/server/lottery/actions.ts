"use server";

import { db } from "~/server/db";
import { lotteryEntries, lotteryGroups, members } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
// Remove getAuthenticatedUser import - actions will receive userId as parameter
import type {
  LotteryEntryInsert,
  LotteryGroupInsert,
  LotteryEntryFormData,
} from "~/app/types/LotteryTypes";

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: any;
};

/**
 * Submit a lottery entry (individual or group based on memberIds)
 */
export async function submitLotteryEntry(
  userId: string,
  data: LotteryEntryFormData,
): Promise<ActionResult> {
  try {
    // Get member data
    const member = await db.query.members.findFirst({
      where: eq(members.username, userId),
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Check if this is a group entry (has memberIds) or individual
    const isGroupEntry = data.memberIds && data.memberIds.length > 0;

    if (isGroupEntry) {
      // Handle group entry
      const allMemberIds = [member.id, ...(data.memberIds || [])];

      // Check if group entry already exists for this date
      const existingGroup = await db.query.lotteryGroups.findFirst({
        where: and(
          eq(lotteryGroups.leaderId, member.id),
          eq(lotteryGroups.lotteryDate, data.lotteryDate),
        ),
      });

      if (existingGroup) {
        return {
          success: false,
          error: "You already have a group lottery entry for this date",
        };
      }

      // Check if any of the group members already have individual entries
      const existingEntries = await db.query.lotteryEntries.findMany({
        where: and(eq(lotteryEntries.lotteryDate, data.lotteryDate)),
      });

      const conflictingMembers = existingEntries.filter((entry) =>
        allMemberIds.includes(entry.memberId),
      );

      if (conflictingMembers.length > 0) {
        return {
          success: false,
          error:
            "Some group members already have lottery entries for this date",
        };
      }

      // Create group lottery entry
      const groupData: LotteryGroupInsert = {
        leaderId: member.id,
        lotteryDate: data.lotteryDate,
        memberIds: allMemberIds,
        preferredWindow: data.preferredWindow,
        specificTimePreference: data.specificTimePreference || null,
        alternateWindow: data.alternateWindow || null,
        leaderMemberClass: member.class,
        status: "PENDING",
      };

      const [newGroup] = await db
        .insert(lotteryGroups)
        .values(groupData)
        .returning();

      revalidatePath("/members/teesheet");
      return { success: true, data: newGroup };
    } else {
      // Handle individual entry
      // Check if entry already exists for this date
      const existingEntry = await db.query.lotteryEntries.findFirst({
        where: and(
          eq(lotteryEntries.memberId, member.id),
          eq(lotteryEntries.lotteryDate, data.lotteryDate),
        ),
      });

      if (existingEntry) {
        return {
          success: false,
          error: "You already have a lottery entry for this date",
        };
      }

      // Create individual lottery entry
      const entryData: LotteryEntryInsert = {
        memberId: member.id,
        lotteryDate: data.lotteryDate,
        preferredWindow: data.preferredWindow,
        specificTimePreference: data.specificTimePreference || null,
        alternateWindow: data.alternateWindow || null,
        memberClass: member.class,
        status: "PENDING",
      };

      const [newEntry] = await db
        .insert(lotteryEntries)
        .values(entryData)
        .returning();

      revalidatePath("/members/teesheet");
      return { success: true, data: newEntry };
    }
  } catch (error) {
    console.error("Error submitting lottery entry:", error);
    return { success: false, error: "Failed to submit lottery entry" };
  }
}

/**
 * Get lottery entry for a member and date
 */
export async function getLotteryEntry(
  userId: string,
  lotteryDate: string,
): Promise<ActionResult> {
  try {
    // Get member data
    const member = await db.query.members.findFirst({
      where: eq(members.username, userId),
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Check for individual entry
    const individualEntry = await db.query.lotteryEntries.findFirst({
      where: and(
        eq(lotteryEntries.memberId, member.id),
        eq(lotteryEntries.lotteryDate, lotteryDate),
      ),
    });

    if (individualEntry) {
      return {
        success: true,
        data: { type: "individual", entry: individualEntry },
      };
    }

    // Check for group entry where this member is the leader
    const groupEntry = await db.query.lotteryGroups.findFirst({
      where: and(
        eq(lotteryGroups.leaderId, member.id),
        eq(lotteryGroups.lotteryDate, lotteryDate),
      ),
    });

    if (groupEntry) {
      return { success: true, data: { type: "group", entry: groupEntry } };
    }

    // Check if member is part of another group
    const otherGroupEntry = await db.query.lotteryGroups.findFirst({
      where: eq(lotteryGroups.lotteryDate, lotteryDate),
    });

    if (otherGroupEntry && otherGroupEntry.memberIds.includes(member.id)) {
      return {
        success: true,
        data: { type: "group_member", entry: otherGroupEntry },
      };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Error getting lottery entry:", error);
    return { success: false, error: "Failed to get lottery entry" };
  }
}

/**
 * Update a lottery entry
 */
export async function updateLotteryEntry(
  userId: string,
  data: {
    entryId: number;
    preferredWindow: string;
    specificTimePreference?: string;
    alternateWindow?: string;
  },
): Promise<ActionResult> {
  try {
    // Get member data
    const member = await db.query.members.findFirst({
      where: eq(members.username, userId),
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Verify the entry belongs to this member
    const entry = await db.query.lotteryEntries.findFirst({
      where: and(
        eq(lotteryEntries.id, data.entryId),
        eq(lotteryEntries.memberId, member.id),
      ),
    });

    if (!entry) {
      return {
        success: false,
        error: "Lottery entry not found or access denied",
      };
    }

    if (entry.status !== "PENDING") {
      return {
        success: false,
        error: "Cannot modify entry that has been processed",
      };
    }

    // Update the entry
    const [updatedEntry] = await db
      .update(lotteryEntries)
      .set({
        preferredWindow: data.preferredWindow,
        specificTimePreference: data.specificTimePreference || null,
        alternateWindow: data.alternateWindow || null,
        updatedAt: new Date(),
      })
      .where(eq(lotteryEntries.id, data.entryId))
      .returning();

    revalidatePath("/members/teesheet");
    return { success: true, data: updatedEntry };
  } catch (error) {
    console.error("Error updating lottery entry:", error);
    return { success: false, error: "Failed to update lottery entry" };
  }
}

/**
 * Cancel a lottery entry
 */
export async function cancelLotteryEntry(
  userId: string,
  entryId: number,
): Promise<ActionResult> {
  try {
    // Get member data
    const member = await db.query.members.findFirst({
      where: eq(members.username, userId),
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Verify the entry belongs to this member
    const entry = await db.query.lotteryEntries.findFirst({
      where: and(
        eq(lotteryEntries.id, entryId),
        eq(lotteryEntries.memberId, member.id),
      ),
    });

    if (!entry) {
      return {
        success: false,
        error: "Lottery entry not found or access denied",
      };
    }

    if (entry.status !== "PENDING") {
      return {
        success: false,
        error: "Cannot cancel entry that has been processed",
      };
    }

    // Update status to cancelled
    await db
      .update(lotteryEntries)
      .set({
        status: "CANCELLED",
        updatedAt: new Date(),
      })
      .where(eq(lotteryEntries.id, entryId));

    revalidatePath("/members/teesheet");
    return { success: true };
  } catch (error) {
    console.error("Error cancelling lottery entry:", error);
    return { success: false, error: "Failed to cancel lottery entry" };
  }
}
