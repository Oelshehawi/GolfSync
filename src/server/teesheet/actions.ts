"use server";

import { getOrganizationId } from "~/lib/auth";
import { db } from "~/server/db";
import {
  timeBlockMembers,
  timeBlockGuests,
  timeBlocks,
} from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

type ActionResult = {
  success: boolean;
  error?: string;
};

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

    revalidatePath(`/teesheet`);
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

    revalidatePath(`/teesheet`);
    return { success: true };
  } catch (error) {
    console.error("Error removing time block guest:", error);
    return {
      success: false,
      error: "Failed to remove guest from time block",
    };
  }
}

export async function checkInMember(
  timeBlockId: number,
  memberId: number,
  isCheckedIn: boolean,
): Promise<ActionResult> {
  try {
    const clerkOrgId = await getOrganizationId();

    const result = await db
      .update(timeBlockMembers)
      .set({
        checkedIn: isCheckedIn,
        checkedInAt: isCheckedIn ? new Date() : null,
      })
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

    revalidatePath(`/teesheet`);
    return { success: true };
  } catch (error) {
    console.error("Error checking in member:", error);
    return {
      success: false,
      error: "Failed to check in member",
    };
  }
}

export async function checkInGuest(
  timeBlockId: number,
  guestId: number,
  isCheckedIn: boolean,
): Promise<ActionResult> {
  try {
    const clerkOrgId = await getOrganizationId();

    const result = await db
      .update(timeBlockGuests)
      .set({
        checkedIn: isCheckedIn,
        checkedInAt: isCheckedIn ? new Date() : null,
      })
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

    revalidatePath(`/teesheet`);
    return { success: true };
  } catch (error) {
    console.error("Error checking in guest:", error);
    return {
      success: false,
      error: "Failed to check in guest",
    };
  }
}

export async function checkInAllTimeBlockParticipants(
  timeBlockId: number,
  isCheckedIn: boolean,
): Promise<ActionResult> {
  try {
    const clerkOrgId = await getOrganizationId();

    // Check in all members
    await db
      .update(timeBlockMembers)
      .set({
        checkedIn: isCheckedIn,
        checkedInAt: isCheckedIn ? new Date() : null,
      })
      .where(
        and(
          eq(timeBlockMembers.timeBlockId, timeBlockId),
          eq(timeBlockMembers.clerkOrgId, clerkOrgId),
        ),
      );

    // Check in all guests
    await db
      .update(timeBlockGuests)
      .set({
        checkedIn: isCheckedIn,
        checkedInAt: isCheckedIn ? new Date() : null,
      })
      .where(
        and(
          eq(timeBlockGuests.timeBlockId, timeBlockId),
          eq(timeBlockGuests.clerkOrgId, clerkOrgId),
        ),
      );

    revalidatePath(`/teesheet`);
    return { success: true };
  } catch (error) {
    console.error("Error checking in all participants:", error);
    return {
      success: false,
      error: "Failed to check in all participants",
    };
  }
}

export async function updateTimeBlockNotes(
  timeBlockId: number,
  notes: string | null,
): Promise<ActionResult> {
  try {
    const clerkOrgId = await getOrganizationId();

    const result = await db
      .update(timeBlocks)
      .set({ notes })
      .where(
        and(
          eq(timeBlocks.id, timeBlockId),
          eq(timeBlocks.clerkOrgId, clerkOrgId),
        ),
      )
      .returning();

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Time block not found",
      };
    }

    revalidatePath(`/teesheet`);
    return { success: true };
  } catch (error) {
    console.error("Error updating time block notes:", error);
    return {
      success: false,
      error: "Failed to update time block notes",
    };
  }
}
