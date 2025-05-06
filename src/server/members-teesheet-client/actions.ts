"use server";

import { db } from "~/server/db";
import { timeBlockMembers, timeBlocks, teesheets } from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getOrganizationId } from "~/lib/auth";
import { auth } from "@clerk/nextjs/server";
import { Member } from "~/app/types/MemberTypes";
import { formatDateToYYYYMMDD } from "~/lib/utils";

type ActionResult = {
  success: boolean;
  error?: string;
  violations?: any[];
};

/**
 * Book a tee time for a member
 */
export async function bookTeeTime(
  timeBlockId: number,
  member: Member,
): Promise<ActionResult> {
  try {
    // Get member data
    const { userId } = await auth();
    const organizationId = await getOrganizationId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Get time block info and its teesheet date
    const timeBlock = await db.query.timeBlocks.findFirst({
      where: and(
        eq(timeBlocks.id, timeBlockId),
        eq(timeBlocks.clerkOrgId, organizationId),
      ),
    });

    if (!timeBlock) {
      return {
        success: false,
        error: "Time block not found",
      };
    }

    // Get teesheet to get the date
    const teesheet = await db.query.teesheets.findFirst({
      where: eq(teesheets.id, timeBlock.teesheetId),
    });

    if (!teesheet) {
      return {
        success: false,
        error: "Teesheet not found",
      };
    }

    // Format the booking date and save the booking time
    const bookingDate = formatDateToYYYYMMDD(teesheet.date);
    const bookingTime = timeBlock.startTime;

    // Check for existing booking on the same time block
    const existingBooking = await db.query.timeBlockMembers.findFirst({
      where: and(
        eq(timeBlockMembers.timeBlockId, timeBlockId),
        eq(timeBlockMembers.memberId, member.id),
        eq(timeBlockMembers.clerkOrgId, organizationId),
      ),
    });

    if (existingBooking) {
      return {
        success: false,
        error: "You have already booked this time slot",
      };
    }

    // Check if member already has a tee time on the same day
    const existingBookingsOnSameDay = await db.query.timeBlockMembers.findFirst(
      {
        where: and(
          eq(timeBlockMembers.memberId, member.id),
          eq(timeBlockMembers.clerkOrgId, organizationId),
          eq(timeBlockMembers.bookingDate, bookingDate),
        ),
      },
    );

    if (existingBookingsOnSameDay) {
      return {
        success: false,
        error: "You already have a tee time booked on this day",
      };
    }

    // Book the time slot
    await db.insert(timeBlockMembers).values({
      timeBlockId,
      memberId: member.id,
      clerkOrgId: organizationId,
      bookingDate,
      bookingTime,
      checkedIn: false,
    });

    revalidatePath("/members/teesheet");
    return { success: true };
  } catch (error) {
    console.error("Error booking tee time:", error);
    return {
      success: false,
      error: "Failed to book tee time",
    };
  }
}

/**
 * Cancel a member's tee time booking
 */
export async function cancelTeeTime(
  timeBlockId: number,
  member: Member,
): Promise<ActionResult> {
  try {
    // Get member data
    const { userId } = await auth();
    const organizationId = await getOrganizationId();

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Delete the time block member
    const result = await db
      .delete(timeBlockMembers)
      .where(
        and(
          eq(timeBlockMembers.timeBlockId, timeBlockId),
          eq(timeBlockMembers.memberId, member.id),
          eq(timeBlockMembers.clerkOrgId, organizationId),
        ),
      )
      .returning();

    if (!result || result.length === 0) {
      return {
        success: false,
        error: "Booking not found",
      };
    }

    revalidatePath("/members/teesheet");
    return { success: true };
  } catch (error) {
    console.error("Error canceling tee time:", error);
    return {
      success: false,
      error: "Failed to cancel tee time",
    };
  }
}
