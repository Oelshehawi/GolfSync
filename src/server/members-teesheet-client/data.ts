import { getOrCreateTeesheet } from "~/server/teesheet/data";
import { getTimeBlocksForTeesheet } from "~/server/teesheet/data";
import { db } from "~/server/db";
import { timeBlockMembers, members } from "~/server/db/schema";
import { and, eq } from "drizzle-orm";
import { auth } from "@clerk/nextjs/server";
import { getOrganizationId } from "~/lib/auth";

/**
 * Get teesheet data for members
 * Should only be called from server components
 */
export async function getMemberTeesheetData(date: Date, id: string) {
  const { userId } = await auth();


  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Get member data
  const member = await getMemberData(id);

  // Get or create teesheet for the date
  const { teesheet, config } = await getOrCreateTeesheet(date);

  // Get time blocks with all members
  const timeBlocks = await getTimeBlocksForTeesheet(teesheet.id);

  return {
    teesheet,
    config,
    timeBlocks,
    member,
  };
}

/**
 * Get teesheet data for members
 */
export async function getMemberTeesheet(date: Date) {
  const { userId } = await auth();
  const organizationId = await getOrganizationId();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Get member data
  const member = await getMemberData();

  // Get or create teesheet for the date
  const { teesheet, config } = await getOrCreateTeesheet(date);

  // Get time blocks with all members
  const timeBlocks = await getTimeBlocksForTeesheet(teesheet.id);

  return {
    teesheet,
    config,
    timeBlocks,
    memberClass: member?.class,
    memberId: member?.id,
  };
}

/**
 * Get bookings for the current member
 */
export async function getMemberBookings() {
  const { userId } = await auth();
  const organizationId = await getOrganizationId();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  // Get member data
  const member = await getMemberData();

  if (!member) {
    throw new Error("Member not found");
  }

  const bookings = await db.query.timeBlockMembers.findMany({
    where: and(
      eq(timeBlockMembers.clerkOrgId, organizationId),
      eq(timeBlockMembers.memberId, member.id),
    ),
    with: {
      timeBlock: true,
    },
    orderBy: (fields, { asc }) => [asc(fields.createdAt)],
  });

  return bookings;
}

/**
 * Get member data by current user
 */
export async function getMemberData(id?: string) {
  const { userId } = await auth();
  const organizationId = await getOrganizationId();


  if (!userId) {
    throw new Error("Not authenticated");
  }
  const user = await db.query.members.findFirst({
    where: and(
      eq(members.id, Number(id)),
      eq(members.clerkOrgId, organizationId),
    ),
  });

  return user;
}
