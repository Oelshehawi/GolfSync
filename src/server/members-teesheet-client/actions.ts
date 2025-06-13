"use server";

import { db } from "~/server/db";
import { timeBlockMembers, timeBlocks, teesheets } from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { auth } from "@clerk/nextjs/server";
import { Member } from "~/app/types/MemberTypes";
import { formatDateToYYYYMMDD } from "~/lib/utils";
import { formatTime, formatDate } from "~/lib/dates";
import { sendNotificationToMember } from "~/server/pwa/actions";

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

    if (!userId) {
      return {
        success: false,
        error: "Not authenticated",
      };
    }

    // Get time block info and its teesheet date
    const timeBlock = await db.query.timeBlocks.findFirst({
      where: eq(timeBlocks.id, timeBlockId),
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
      bookingDate,
      bookingTime,
      checkedIn: false,
    });

    // Send push notification to the member
    try {
      if (member.id && bookingTime) {
        // Use the new date utility functions for proper BC timezone handling
        const formattedTime = formatTime(bookingTime);
        const formattedDate = formatDate(bookingDate, "EEEE, MMMM do");

        await sendNotificationToMember(
          member.id,
          "Tee Time Confirmed! ⛳",
          `Your tee time is booked for ${formattedDate} at ${formattedTime}. See you on the course!`,
        );
      }
    } catch (notificationError) {
      // Don't fail the booking if notification fails - just log it
      console.error("Failed to send booking notification:", notificationError);
    }

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
