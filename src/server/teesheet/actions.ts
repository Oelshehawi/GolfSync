"use server";

import { db } from "~/server/db";
import {
  timeBlockMembers,
  timeBlockGuests,
  timeBlocks,
  paceOfPlay,
  members,
  guests,
  teesheets,
  timeBlockFills,
  generalCharges,
  timeblockRestrictions,
} from "~/server/db/schema";
import { and, eq, sql, gte, lte } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { initializePaceOfPlay } from "~/server/pace-of-play/actions";
import type { FillType } from "~/app/types/TeeSheetTypes";
import { formatDateToYYYYMMDD } from "~/lib/utils";
import { format } from "date-fns";

type ActionResult = {
  success: boolean;
  error?: string;
};

type FillActionResult = ActionResult & {
  fill?: typeof timeBlockFills.$inferSelect;
};

export async function removeTimeBlockMember(
  timeBlockId: number,
  memberId: number,
): Promise<ActionResult> {
  try {
    // Delete the time block member
    const result = await db
      .delete(timeBlockMembers)
      .where(
        and(
          eq(timeBlockMembers.timeBlockId, timeBlockId),
          eq(timeBlockMembers.memberId, memberId),
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
    // Delete the time block guest
    const result = await db
      .delete(timeBlockGuests)
      .where(
        and(
          eq(timeBlockGuests.timeBlockId, timeBlockId),
          eq(timeBlockGuests.guestId, guestId),
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
        ),
      )
      .returning();

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Member not found in time block",
      };
    }

    // If checking in, handle frequency restrictions and initialize pace of play
    if (isCheckedIn) {
      // Get member details and timeblock info for frequency restriction checking
      const memberBooking = await db.query.timeBlockMembers.findFirst({
        where: and(
          eq(timeBlockMembers.timeBlockId, timeBlockId),
          eq(timeBlockMembers.memberId, memberId),
        ),
        with: {
          member: true,
          timeBlock: {
            with: {
              teesheet: true,
            },
          },
        },
      });

      // Check for frequency violations if member and timeblock exist
      if (memberBooking?.member && memberBooking?.timeBlock?.teesheet) {
        const memberClass = memberBooking.member.class;
        const bookingDate = memberBooking.timeBlock.teesheet.date;

        // Check for active frequency restrictions for this member class
        const frequencyRestrictions =
          await db.query.timeblockRestrictions.findMany({
            where: and(
              eq(timeblockRestrictions.restrictionCategory, "MEMBER_CLASS"),
              eq(timeblockRestrictions.restrictionType, "FREQUENCY"),
              eq(timeblockRestrictions.isActive, true),
              eq(timeblockRestrictions.applyCharge, true),
            ),
          });

        for (const restriction of frequencyRestrictions) {
          // Check if this restriction applies to the member class
          const memberClassesApplies =
            !restriction.memberClasses?.length ||
            restriction.memberClasses?.includes(memberClass);

          if (
            memberClassesApplies &&
            restriction.maxCount &&
            restriction.periodDays
          ) {
            // Calculate the current calendar month range
            const currentDate = new Date(bookingDate);
            const monthStart = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth(),
              1,
            );
            const monthEnd = new Date(
              currentDate.getFullYear(),
              currentDate.getMonth() + 1,
              0,
            );

            const monthStartStr = formatDateToYYYYMMDD(monthStart);
            const monthEndStr = formatDateToYYYYMMDD(monthEnd);

            // Count existing bookings for this member in the current month
            const existingBookings = await db
              .select({ count: sql<number>`cast(count(*) as integer)` })
              .from(timeBlockMembers)
              .where(
                and(
                  eq(timeBlockMembers.memberId, memberId),
                  gte(timeBlockMembers.bookingDate, monthStartStr),
                  lte(timeBlockMembers.bookingDate, monthEndStr),
                ),
              );

            const currentBookingCount = Number(existingBookings[0]?.count || 0);

            // If this check-in exceeds the limit, create a charge
            if (currentBookingCount > restriction.maxCount) {
              await db.insert(generalCharges).values({
                memberId: memberId,
                date: bookingDate,
                chargeType: "FREQUENCY_FEE",
                charged: false,
                staffInitials: "AUTO", // Auto-generated charge from frequency restriction
              });
            }
          }
        }
      }

      // Get the pace of play record for this time block
      const existingPaceOfPlay = await db.query.paceOfPlay.findFirst({
        where: eq(paceOfPlay.timeBlockId, timeBlockId),
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
    // Get guest and time block details
    const guestDetails = await db.query.timeBlockGuests.findFirst({
      where: and(
        eq(timeBlockGuests.timeBlockId, timeBlockId),
        eq(timeBlockGuests.guestId, guestId),
      ),
      with: {
        guest: true,
        timeBlock: {
          with: {
            teesheet: true,
          },
        },
        invitedByMember: true,
      },
    });

    if (!guestDetails) {
      return {
        success: false,
        error: "Guest not found in time block",
      };
    }

    // Update check-in status
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
        ),
      )
      .returning();

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Failed to update guest check-in status",
      };
    }

    // If checking in (not out), create a general charge
    if (isCheckedIn && guestDetails.guest && guestDetails.timeBlock?.teesheet) {
      await db.insert(generalCharges).values({
        guestId: guestId,
        sponsorMemberId: guestDetails.invitedByMember?.id,
        date: guestDetails.timeBlock.teesheet.date,
        chargeType: "GUEST_FEE",
        charged: false,
        staffInitials: "AUTO", // Auto-generated charge
      });
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
    // Check in all members
    await db
      .update(timeBlockMembers)
      .set({
        checkedIn: isCheckedIn,
        checkedInAt: isCheckedIn ? new Date() : null,
      })
      .where(eq(timeBlockMembers.timeBlockId, timeBlockId));

    // Check in all guests
    await db
      .update(timeBlockGuests)
      .set({
        checkedIn: isCheckedIn,
        checkedInAt: isCheckedIn ? new Date() : null,
      })
      .where(eq(timeBlockGuests.timeBlockId, timeBlockId));

    // If checking in, initialize pace of play
    if (isCheckedIn) {
      // Get the pace of play record for this time block
      const existingPaceOfPlay = await db.query.paceOfPlay.findFirst({
        where: eq(paceOfPlay.timeBlockId, timeBlockId),
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
    const result = await db
      .update(timeBlocks)
      .set({ notes })
      .where(eq(timeBlocks.id, timeBlockId))
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
    // Get all members in the organization (exclude RESIGNED, SUSPENDED, DINING)
    const allMembers = await db.query.members.findMany({
      where: and(
        sql`${members.class} != 'RESIGNED'`,
        sql`${members.class} != 'SUSPENDED'`,
        sql`${members.class} != 'DINING'`,
        sql`${members.class} != 'STAFF PLAY'`,
        sql`${members.class} != 'MANAGEMENT'`,
        sql`${members.class} != 'MGMT / PRO'`,
        sql`${members.class} != 'HONORARY MALE'`,
        sql`${members.class} != 'HONORARY FEMALE'`,
        sql`${members.class} != 'PRIVILEGED MALE'`,
        sql`${members.class} != 'PRIVILEGED FEMALE'`,
        sql`${members.class} != 'SENIOR RETIRED MALE'`,
        sql`${members.class} != 'SENIOR RETIRED FEMALE'`,
        sql`${members.class} != 'LEAVE OF ABSENCE'`,
      ),
    });

    if (allMembers.length === 0) {
      return { success: false, error: "No members found in organization" };
    }

    // Get all timeblocks for the teesheet
    const teesheetTimeBlocks = await db.query.timeBlocks.findMany({
      where: eq(timeBlocks.teesheetId, teesheetId),
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
          .where(eq(timeBlockMembers.timeBlockId, timeBlock.id));

        // Also clear any existing pace of play records
        await db
          .delete(paceOfPlay)
          .where(eq(paceOfPlay.timeBlockId, timeBlock.id));

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
              where: eq(paceOfPlay.timeBlockId, timeBlock.id),
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
                .where(eq(paceOfPlay.timeBlockId, timeBlock.id));
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

/**
 * Updates the general notes for a teesheet
 */
export async function updateTeesheetGeneralNotes(
  teesheetId: number,
  generalNotes: string | null,
): Promise<ActionResult> {
  try {
    const result = await db
      .update(teesheets)
      .set({ generalNotes })
      .where(eq(teesheets.id, teesheetId))
      .returning();

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Teesheet not found",
      };
    }

    revalidatePath(`/teesheet`);
    revalidatePath(`/admin`);
    return { success: true };
  } catch (error) {
    console.error("Error updating teesheet general notes:", error);
    return {
      success: false,
      error: "Failed to update teesheet general notes",
    };
  }
}

export async function addFillToTimeBlock(
  timeBlockId: number,
  fillType: FillType,
  count: number,
  customName?: string,
): Promise<FillActionResult> {
  try {
    // Create individual fill records instead of using count
    const fillPromises = Array.from({ length: count }, () =>
      db
        .insert(timeBlockFills)
        .values({
          timeBlockId,
          fillType,
          customName: customName || null,
        })
        .returning(),
    );

    const results = await Promise.all(fillPromises);

    if (
      !results ||
      results.length === 0 ||
      !results[0] ||
      results[0].length === 0
    ) {
      return {
        success: false,
        error: "Failed to add fills to time block",
      };
    }

    revalidatePath(`/teesheet`);
    return { success: true, fill: results[0][0] };
  } catch (error) {
    console.error("Error adding fills to time block:", error);
    return {
      success: false,
      error: "Failed to add fills to time block",
    };
  }
}

export async function removeFillFromTimeBlock(
  timeBlockId: number,
  fillId: number,
): Promise<ActionResult> {
  try {
    // Delete the fill directly, similar to member removal
    const result = await db
      .delete(timeBlockFills)
      .where(
        and(
          eq(timeBlockFills.timeBlockId, timeBlockId),
          eq(timeBlockFills.id, fillId),
        ),
      )
      .returning();

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Fill not found in time block",
      };
    }

    revalidatePath(`/teesheet`);
    return { success: true };
  } catch (error) {
    console.error("Error removing fill from time block:", error);
    return {
      success: false,
      error: "Failed to remove fill from time block",
    };
  }
}
