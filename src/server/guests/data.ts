import { db } from "~/server/db";
import { guests, timeBlockGuests, members } from "~/server/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";

export async function getGuests() {
  const orgId = await getOrganizationId();
  if (!orgId) return [];

  return db.query.guests.findMany({
    where: eq(guests.clerkOrgId, orgId),
    orderBy: [guests.lastName, guests.firstName],
  });
}

export async function getGuestById(id: number) {
  const orgId = await getOrganizationId();
  if (!orgId) return null;

  return db.query.guests.findFirst({
    where: (guest) => and(eq(guest.id, id), eq(guest.clerkOrgId, orgId)),
  });
}

export async function getTimeBlockGuests(timeBlockId: number) {
  const orgId = await getOrganizationId();
  if (!orgId) return [];

  const result = await db.query.timeBlockGuests.findMany({
    where: (tbg) =>
      and(eq(tbg.timeBlockId, timeBlockId), eq(tbg.clerkOrgId, orgId)),
    with: {
      guest: true,
      invitedByMember: true,
    },
  });

  return result;
}

export async function searchGuests(searchTerm: string) {
  const orgId = await getOrganizationId();
  if (!orgId) return [];

  const lowerSearchTerm = searchTerm.toLowerCase();

  // Get all guests from the organization
  const allGuests = await db.query.guests.findMany({
    where: eq(guests.clerkOrgId, orgId),
  });

  // Filter guests based on the search term
  return allGuests.filter((guest) => {
    const fullName = `${guest.firstName} ${guest.lastName}`.toLowerCase();
    const email = (guest.email || "").toLowerCase();

    return (
      fullName.includes(lowerSearchTerm) ||
      email.includes(lowerSearchTerm) ||
      (guest.phone && guest.phone.includes(searchTerm))
    );
  });
}

export async function getGuestBookingHistory(
  guestId: number,
  limit: number = 20,
): Promise<any[]> {
  try {
    const orgId = await getOrganizationId();

    const bookings = await db.query.timeBlockGuests.findMany({
      where: and(
        eq(timeBlockGuests.guestId, guestId),
        eq(timeBlockGuests.clerkOrgId, orgId),
      ),
      with: {
        timeBlock: true,
        invitedByMember: true,
      },
      orderBy: desc(timeBlockGuests.createdAt),
      limit,
    });

    return bookings.map((booking) => ({
      id: booking.id,
      date: booking.bookingDate,
      time: booking.bookingTime,
      teesheetId: booking.timeBlock.teesheetId,
      timeBlockId: booking.timeBlockId,
      invitedBy: `${booking.invitedByMember.firstName} ${booking.invitedByMember.lastName}`,
      invitedByMemberId: booking.invitedByMemberId,
      createdAt: booking.createdAt,
    }));
  } catch (error) {
    console.error("Error getting guest booking history:", error);
    return [];
  }
}
