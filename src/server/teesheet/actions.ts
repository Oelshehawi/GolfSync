"use server";

import { getOrganizationId } from "~/lib/auth";
import { db } from "~/server/db";
import {
  timeBlockMembers,
  timeBlockGuests,
  timeBlocks,
  paceOfPlay,
  members,
  guests,
} from "~/server/db/schema";
import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { initializePaceOfPlay } from "~/server/pace-of-play/actions";

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

    // If checking in, initialize pace of play
    if (isCheckedIn) {
      // Check if this is the first check-in for this time block
      const checkedInCount = await db
        .select({ count: sql`COUNT(*)` })
        .from(timeBlockMembers)
        .where(
          and(
            eq(timeBlockMembers.timeBlockId, timeBlockId),
            eq(timeBlockMembers.clerkOrgId, clerkOrgId),
            eq(timeBlockMembers.checkedIn, true),
          ),
        )
        .then((result) => result[0]?.count || 0);

      // Get the pace of play record for this time block
      const existingPaceOfPlay = await db.query.paceOfPlay.findFirst({
        where: and(
          eq(paceOfPlay.timeBlockId, timeBlockId),
          eq(paceOfPlay.clerkOrgId, clerkOrgId),
        ),
      });

      // Only initialize pace of play if it hasn't been initialized yet
      if (!existingPaceOfPlay?.startTime) {
        const currentTime = new Date();
        await initializePaceOfPlay(timeBlockId, currentTime);
      }
    }

    revalidatePath(`/teesheet`);
    revalidatePath(`/admin/pace-of-play`);
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

    // If checking in, initialize pace of play
    if (isCheckedIn) {
      // Get the pace of play record for this time block
      const existingPaceOfPlay = await db.query.paceOfPlay.findFirst({
        where: and(
          eq(paceOfPlay.timeBlockId, timeBlockId),
          eq(paceOfPlay.clerkOrgId, clerkOrgId),
        ),
      });

      // Only initialize pace of play if it hasn't been initialized yet
      if (!existingPaceOfPlay?.startTime) {
        const currentTime = new Date();
        await initializePaceOfPlay(timeBlockId, currentTime);
      }
    }

    revalidatePath(`/teesheet`);
    revalidatePath(`/admin/pace-of-play`);
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

// DEBUG FUNCTION: Populate timeblocks with random members for testing
export async function populateTimeBlocksWithRandomMembers(
  teesheetId: number,
  date: string,
) {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return { success: false, error: "No organization selected" };
    }

    // Get all members in the organization
    const allMembers = await db.query.members.findMany({
      where: eq(members.clerkOrgId, orgId),
    });

    if (allMembers.length === 0) {
      return { success: false, error: "No members found in organization" };
    }

    // Get all timeblocks for the teesheet
    const teesheetTimeBlocks = await db.query.timeBlocks.findMany({
      where: and(
        eq(timeBlocks.teesheetId, teesheetId),
        eq(timeBlocks.clerkOrgId, orgId),
      ),
    });

    if (teesheetTimeBlocks.length === 0) {
      return { success: false, error: "No timeblocks found for teesheet" };
    }

    // For each timeblock, add 1-4 random members
    const promises = teesheetTimeBlocks.map(
      async (timeBlock: typeof timeBlocks.$inferSelect) => {
        // Clear existing members first
        await db
          .delete(timeBlockMembers)
          .where(
            and(
              eq(timeBlockMembers.timeBlockId, timeBlock.id),
              eq(timeBlockMembers.clerkOrgId, orgId),
            ),
          );

        // Also clear any existing pace of play records
        await db
          .delete(paceOfPlay)
          .where(
            and(
              eq(paceOfPlay.timeBlockId, timeBlock.id),
              eq(paceOfPlay.clerkOrgId, orgId),
            ),
          );

        // Randomly decide how many members to add (1-4)
        const numMembersToAdd = Math.floor(Math.random() * 3) + 1; // 1-3 members

        // Shuffle members array to get random members
        const shuffledMembers = [...allMembers].sort(() => 0.5 - Math.random());

        // Select the first N members
        const selectedMembers = shuffledMembers.slice(0, numMembersToAdd);

        // Flag to track if we should initialize pace of play
        let shouldInitializePaceOfPlay = false;
        const checkInTime = new Date();

        // Add each member to the timeblock
        for (const member of selectedMembers) {
          // As requested, set checkedIn and checkedInAt to null
          // Even though it was previously set to be random
          const isCheckedIn = false;

          await db.insert(timeBlockMembers).values({
            clerkOrgId: orgId,
            timeBlockId: timeBlock.id,
            memberId: member.id,
            bookingDate: date,
            bookingTime: timeBlock.startTime,
            bagNumber: member.bagNumber,
            checkedIn: isCheckedIn,
            checkedInAt: null,
          });
        }

        // No need to initialize pace of play since no one is checked in
        // But keep this for when you want to re-enable it
        if (shouldInitializePaceOfPlay) {
          await initializePaceOfPlay(timeBlock.id, checkInTime);

          // For some (20%) timeblocks, also add turn time
          if (Math.random() < 0.2) {
            // Get the pace record we just created
            const paceRecord = await db.query.paceOfPlay.findFirst({
              where: and(
                eq(paceOfPlay.timeBlockId, timeBlock.id),
                eq(paceOfPlay.clerkOrgId, orgId),
              ),
            });

            if (paceRecord) {
              // Add 2 hours +/- 20 minutes to the start time for turn time
              const turnTime = new Date(checkInTime);
              turnTime.setMinutes(
                turnTime.getMinutes() +
                  120 +
                  Math.floor(Math.random() * 40) -
                  20,
              );

              // Update pace of play with turn time
              await db
                .update(paceOfPlay)
                .set({
                  turn9Time: turnTime,
                  lastUpdatedBy: "Debug Populate",
                })
                .where(
                  and(
                    eq(paceOfPlay.timeBlockId, timeBlock.id),
                    eq(paceOfPlay.clerkOrgId, orgId),
                  ),
                );
            }
          }
        }
      },
    );

    await Promise.all(promises);

    // Revalidate the page to show the new data
    revalidatePath(`/admin`);
    revalidatePath(`/admin/pace-of-play`);
    revalidatePath(`/admin/pace-of-play/turn`);
    revalidatePath(`/admin/pace-of-play/finish`);

    return {
      success: true,
      message: `Successfully populated timeblocks with random members`,
    };
  } catch (error) {
    console.error("Error populating timeblocks with random members:", error);
    return {
      success: false,
      error: `Failed to populate timeblocks: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
