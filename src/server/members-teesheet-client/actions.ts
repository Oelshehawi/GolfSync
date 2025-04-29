"use server";

import { db } from "~/server/db";
import { timeBlockMembers, timeBlocks } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { checkRestrictions } from "~/server/restrictions/data";
import { getOrganizationId } from "~/lib/auth";
import { getMemberData } from "./data";
import { auth } from "@clerk/nextjs/server";
import { Member } from "~/app/types/MemberTypes";

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

    // Get time block to check the booking time
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

    // Check for existing booking
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

    // Check for restrictions
    const restrictionsCheck = await checkRestrictions({
      memberId: member.id,
      memberClass: member.class,
      bookingTime: timeBlock.startTime,
    });

    if ("error" in restrictionsCheck) {
      return {
        success: false,
        error: restrictionsCheck.error,
      };
    }

    if (restrictionsCheck.hasViolations) {
      return {
        success: false,
        error: "Booking not allowed due to restrictions",
        violations: restrictionsCheck.violations,
      };
    }

    // Book the time slot
    await db.insert(timeBlockMembers).values({
      timeBlockId,
      memberId: member.id,
      clerkOrgId: organizationId,
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
