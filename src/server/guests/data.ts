import { db } from "~/server/db";
import { guests, timeBlockGuests, members } from "~/server/db/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";
import { formatDateToYYYYMMDD } from "~/lib/utils";

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
  options: {
    limit?: number;
    year?: number;
    month?: number; // 0-based month (0 = January, 11 = December)
  } = {},
): Promise<any[]> {
  try {
    const orgId = await getOrganizationId();
    const { limit = 50, year, month } = options;

    let whereConditions = and(
      eq(timeBlockGuests.guestId, guestId),
      eq(timeBlockGuests.clerkOrgId, orgId),
    );

    // Add month filtering if specified
    if (year !== undefined && month !== undefined) {
      const monthStart = new Date(year, month, 1);
      const monthEnd = new Date(year, month + 1, 0);

      const monthStartStr = formatDateToYYYYMMDD(monthStart);
      const monthEndStr = formatDateToYYYYMMDD(monthEnd);

      whereConditions = and(
        whereConditions,
        gte(timeBlockGuests.bookingDate, monthStartStr),
        lte(timeBlockGuests.bookingDate, monthEndStr),
      );
    }

    const bookings = await db.query.timeBlockGuests.findMany({
      where: whereConditions,
      with: {
        timeBlock: true,
        invitedByMember: true,
      },
      orderBy: [
        desc(timeBlockGuests.bookingDate),
        desc(timeBlockGuests.bookingTime),
      ],
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
