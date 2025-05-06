"use server";

import { db } from "~/server/db";
import {
  guests,
  timeBlockGuests,
  timeBlocks,
  teesheets,
} from "~/server/db/schema";
import { eq, and, like, or } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";
import { revalidatePath } from "next/cache";
import { getGuestBookingHistory } from "./data";
import { formatDateToYYYYMMDD } from "~/lib/utils";

export async function searchGuestsAction(searchTerm: string) {
  const orgId = await getOrganizationId();
  if (!orgId || !searchTerm.trim()) return [];

  const lowerSearchTerm = `%${searchTerm.toLowerCase()}%`;

  return await db.query.guests.findMany({
    where: and(
      eq(guests.clerkOrgId, orgId),
      or(
        like(guests.firstName, lowerSearchTerm),
        like(guests.lastName, lowerSearchTerm),
        like(guests.email, lowerSearchTerm),
      ),
    ),
    orderBy: [guests.lastName, guests.firstName],
  });
}

export async function createGuest(data: {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  handicap?: string;
}) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  try {
    const [newGuest] = await db
      .insert(guests)
      .values({
        clerkOrgId: orgId,
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || null,
        phone: data.phone || null,
        handicap: data.handicap || null,
      })
      .returning();

    revalidatePath("/admin/members");
    return { success: true, data: newGuest };
  } catch (error) {
    console.error("Error creating guest:", error);
    return { success: false, error: "Failed to create guest" };
  }
}

export async function updateGuest(
  id: number,
  data: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    handicap?: string;
  },
) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  try {
    const [updatedGuest] = await db
      .update(guests)
      .set(data)
      .where(and(eq(guests.id, id), eq(guests.clerkOrgId, orgId)))
      .returning();

    revalidatePath("/admin/members");
    return { success: true, data: updatedGuest };
  } catch (error) {
    console.error("Error updating guest:", error);
    return { success: false, error: "Failed to update guest" };
  }
}

export async function deleteGuest(id: number) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  try {
    const [deletedGuest] = await db
      .delete(guests)
      .where(and(eq(guests.id, id), eq(guests.clerkOrgId, orgId)))
      .returning();

    revalidatePath("/admin/members");
    return { success: true, data: deletedGuest };
  } catch (error) {
    console.error("Error deleting guest:", error);
    return { success: false, error: "Failed to delete guest" };
  }
}

export async function addGuestToTimeBlock(
  timeBlockId: number,
  guestId: number,
  invitedByMemberId: number,
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return { success: false, error: "No organization selected" };
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

    // Get the booking date and time
    const bookingDate = formatDateToYYYYMMDD(teesheet.date);
    const bookingTime = timeBlock.startTime;

    // Check if guest is already in the time block
    const existingGuest = await db.query.timeBlockGuests.findFirst({
      where: and(
        eq(timeBlockGuests.timeBlockId, timeBlockId),
        eq(timeBlockGuests.guestId, guestId),
      ),
    });

    if (existingGuest) {
      return { success: false, error: "Guest is already in this time block" };
    }

    // Add guest to time block
    await db.insert(timeBlockGuests).values({
      clerkOrgId: orgId,
      timeBlockId,
      guestId,
      invitedByMemberId,
      bookingDate,
      bookingTime,
    });

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding guest to time block:", error);
    return { success: false, error: "Failed to add guest to time block" };
  }
}

export async function removeGuestFromTimeBlock(
  timeBlockId: number,
  guestId: number,
) {
  const orgId = await getOrganizationId();
  if (!orgId) {
    return { success: false, error: "No organization selected" };
  }

  try {
    const [removedGuest] = await db
      .delete(timeBlockGuests)
      .where(
        and(
          eq(timeBlockGuests.timeBlockId, timeBlockId),
          eq(timeBlockGuests.guestId, guestId),
          eq(timeBlockGuests.clerkOrgId, orgId),
        ),
      )
      .returning();

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    return { success: true, data: removedGuest };
  } catch (error) {
    console.error("Error removing guest from time block:", error);
    return { success: false, error: "Failed to remove guest from time block" };
  }
}

export async function getGuestBookingHistoryAction(guestId: number) {
  const bookings = await getGuestBookingHistory(guestId);
  return bookings;
}
