"use server";

import { db } from "~/server/db";
import {
  members,
  timeBlockMembers,
  timeBlocks,
  teesheets,
} from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getOrganizationId } from "~/lib/auth";
import { searchMembers, getMemberBookingHistory } from "./data";
import { formatDateToYYYYMMDD } from "~/lib/utils";

// Time block related functions
export async function addMemberToTimeBlock(
  timeBlockId: number,
  memberId: number,
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
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

    // Get the time block to get its teesheet
    const timeBlock = await db.query.timeBlocks.findFirst({
      where: eq(timeBlocks.id, timeBlockId),
    });

    if (!timeBlock) {
      return { success: false, error: "Time block not found" };
    }

    // Get the teesheet to get its date
    const teesheet = await db.query.teesheets.findFirst({
      where: eq(teesheets.id, timeBlock.teesheetId),
    });

    if (!teesheet) {
      return { success: false, error: "Teesheet not found" };
    }

    // Get the member to get their bag number
    const member = await db.query.members.findFirst({
      where: eq(members.id, memberId),
      columns: {
        bagNumber: true,
      },
    });

    // Get the booking date and time
    const bookingDate = formatDateToYYYYMMDD(teesheet.date);
    const bookingTime = timeBlock.startTime;

    // Check if the member already has a booking on this date
    const existingBooking = await db.query.timeBlockMembers.findFirst({
      where: and(
        eq(timeBlockMembers.memberId, memberId),
        eq(timeBlockMembers.bookingDate, bookingDate),
        eq(timeBlockMembers.clerkOrgId, orgId),
      ),
    });

    if (existingBooking) {
      return {
        success: false,
        error: "This member already has a tee time booked on this day",
      };
    }

    // Add member to time block
    await db.insert(timeBlockMembers).values({
      clerkOrgId: orgId,
      timeBlockId,
      memberId,
      bookingDate,
      bookingTime,
      bagNumber: member?.bagNumber,
    });

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    revalidatePath("/members/teesheet");
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
    const orgId = await getOrganizationId();

    if (!orgId) {
      return { success: false, error: "No organization selected" };
    }

    await db
      .delete(timeBlockMembers)
      .where(
        and(
          eq(timeBlockMembers.timeBlockId, timeBlockId),
          eq(timeBlockMembers.memberId, memberId),
          eq(timeBlockMembers.clerkOrgId, orgId),
        ),
      );

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing member from time block:", error);
    return { success: false, error: "Failed to remove member from time block" };
  }
}

// Member management functions
export async function createMember(data: {
  memberNumber: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  class: string;
  gender?: string;
  dateOfBirth?: string;
  handicap?: string;
  bagNumber?: string;
}) {
  const orgId = await getOrganizationId();
  await db.insert(members).values({
    ...data,
    clerkOrgId: orgId,
  });

  revalidatePath("/admin/members");
}

export async function updateMember(
  id: number,
  data: {
    memberNumber: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    class: string;
    gender?: string;
    dateOfBirth?: string;
    handicap?: string;
    bagNumber?: string;
  },
) {
  const orgId = await getOrganizationId();
  await db
    .update(members)
    .set(data)
    .where(and(eq(members.id, id), eq(members.clerkOrgId, orgId)));

  revalidatePath("/admin/members");
}

export async function deleteMember(id: number) {
  const orgId = await getOrganizationId();
  await db
    .delete(members)
    .where(and(eq(members.id, id), eq(members.clerkOrgId, orgId)));

  revalidatePath("/admin/members");
}

export async function searchMembersAction(query: string = "") {
  const { results } = await searchMembers(query, 1, 10);
  return results.map((member) => ({
    ...member,
    dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
    createdAt: new Date(member.createdAt),
    updatedAt: member.updatedAt ? new Date(member.updatedAt) : null,
  }));
}

export async function getMemberBookingHistoryAction(memberId: number) {
  const bookings = await getMemberBookingHistory(memberId);
  return bookings;
}
