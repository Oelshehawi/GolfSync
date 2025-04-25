import { db } from "~/server/db";
import {
  teesheets,
  timeBlocks,
  timeBlockMembers,
  members,
  timeBlockGuests,
  guests,
} from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";
import type {
  TeeSheet,
  TimeBlockWithMembers,
  TeesheetConfig,
} from "~/app/types/TeeSheetTypes";
import { getConfigForDate } from "~/server/settings/data";
import { generateTimeBlocks } from "~/lib/utils";
import { localToUTCMidnight } from "~/lib/utils";

export async function createTimeBlocksForTeesheet(
  teesheetId: number,
  config: TeesheetConfig,
  date: Date,
) {
  const clerkOrgId = await getOrganizationId();

  // Generate time blocks using the utility function
  const timeSlots = generateTimeBlocks(date, config);

  // Create time blocks for each consecutive pair of times
  const blocks = timeSlots.slice(0, -1).map((startTime, index) => {
    const endTime = timeSlots[index + 1];
    if (!endTime) {
      throw new Error("Invalid time block: missing end time");
    }
    return {
      clerkOrgId,
      teesheetId,
      startTime,
      endTime,
    };
  });

  // Insert all blocks in a single query
  await db.insert(timeBlocks).values(blocks);
}

export async function getOrCreateTeesheet(
  date: Date,
): Promise<{ teesheet: TeeSheet; config: TeesheetConfig }> {
  const clerkOrgId = await getOrganizationId();

  // Convert input date to UTC midnight
  const utcDate = localToUTCMidnight(date);

  // Try to find existing teesheet for the same UTC date
  const existingTeesheet = await db.query.teesheets.findFirst({
    where: and(
      eq(teesheets.clerkOrgId, clerkOrgId),
      // Compare the exact timestamp
      eq(teesheets.date, utcDate),
    ),
  });

  // Get config for the date
  const config = await getConfigForDate(date);

  if (existingTeesheet) {
    return { teesheet: existingTeesheet, config };
  }

  // Create new teesheet with UTC date
  const newTeesheet = await db
    .insert(teesheets)
    .values({
      clerkOrgId,
      date: utcDate,
      configId: config.id,
    })
    .returning()
    .then((result) => result[0]);

  if (!newTeesheet) {
    throw new Error("Failed to create teesheet");
  }

  // Create time blocks for the new teesheet
  await createTimeBlocksForTeesheet(newTeesheet.id, config, utcDate);

  return { teesheet: newTeesheet, config };
}

export async function getTimeBlocksForTeesheet(
  teesheetId: number,
): Promise<TimeBlockWithMembers[]> {
  const clerkOrgId = await getOrganizationId();

  const result = await db
    .select({
      id: timeBlocks.id,
      clerkOrgId: timeBlocks.clerkOrgId,
      teesheetId: timeBlocks.teesheetId,
      startTime: timeBlocks.startTime,
      endTime: timeBlocks.endTime,
      createdAt: timeBlocks.createdAt,
      updatedAt: timeBlocks.updatedAt,
      members: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
      },
    })
    .from(timeBlocks)
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .where(
      and(
        eq(timeBlocks.clerkOrgId, clerkOrgId),
        eq(timeBlocks.teesheetId, teesheetId),
      ),
    );

  // Fetch guests data separately
  const guestsResult = await db
    .select({
      timeBlockId: timeBlockGuests.timeBlockId,
      guest: {
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
        email: guests.email,
        phone: guests.phone,
        handicap: guests.handicap,
      },
      invitedByMember: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
      },
    })
    .from(timeBlockGuests)
    .innerJoin(guests, eq(timeBlockGuests.guestId, guests.id))
    .innerJoin(members, eq(timeBlockGuests.invitedByMemberId, members.id))
    .where(
      and(
        eq(timeBlockGuests.clerkOrgId, clerkOrgId),
        inArray(
          timeBlockGuests.timeBlockId,
          result.map((r) => r.id),
        ),
      ),
    );

  if (!result || result.length === 0) {
    return [];
  }

  // Group results by time block
  const timeBlocksMap = new Map<number, TimeBlockWithMembers>();

  result.forEach((row) => {
    if (!timeBlocksMap.has(row.id)) {
      timeBlocksMap.set(row.id, {
        id: row.id,
        clerkOrgId: row.clerkOrgId,
        teesheetId: row.teesheetId,
        startTime: row.startTime,
        endTime: row.endTime,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        members: [],
        guests: [],
      });
    }

    if (row.members?.id) {
      const timeBlock = timeBlocksMap.get(row.id)!;
      timeBlock.members.push({
        id: row.members.id,
        firstName: row.members.firstName!,
        lastName: row.members.lastName!,
        memberNumber: row.members.memberNumber!,
      });
    }
  });

  // Add guests to the corresponding time blocks
  guestsResult.forEach((row) => {
    const timeBlock = timeBlocksMap.get(row.timeBlockId);
    if (timeBlock && row.guest?.id) {
      timeBlock.guests.push({
        id: row.guest.id,
        firstName: row.guest.firstName!,
        lastName: row.guest.lastName!,
        email: row.guest.email,
        phone: row.guest.phone,
        handicap: row.guest.handicap,
        invitedByMember: row.invitedByMember
          ? {
              id: row.invitedByMember.id,
              firstName: row.invitedByMember.firstName!,
              lastName: row.invitedByMember.lastName!,
              memberNumber: row.invitedByMember.memberNumber!,
            }
          : undefined,
      });
    }
  });

  return Array.from(timeBlocksMap.values());
}

export async function getTimeBlockWithMembers(
  timeBlockId: number,
): Promise<TimeBlockWithMembers | null> {
  const clerkOrgId = await getOrganizationId();

  const result = await db
    .select({
      id: timeBlocks.id,
      clerkOrgId: timeBlocks.clerkOrgId,
      teesheetId: timeBlocks.teesheetId,
      startTime: timeBlocks.startTime,
      endTime: timeBlocks.endTime,
      createdAt: timeBlocks.createdAt,
      updatedAt: timeBlocks.updatedAt,
      members: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
      },
    })
    .from(timeBlocks)
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .where(
      and(
        eq(timeBlocks.id, timeBlockId),
        eq(timeBlocks.clerkOrgId, clerkOrgId),
      ),
    );

  if (!result || result.length === 0) {
    return null;
  }

  // Fetch guests separately
  const guestsResult = await db
    .select({
      guest: {
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
        email: guests.email,
        phone: guests.phone,
        handicap: guests.handicap,
      },
      invitedByMember: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
      },
    })
    .from(timeBlockGuests)
    .innerJoin(guests, eq(timeBlockGuests.guestId, guests.id))
    .innerJoin(members, eq(timeBlockGuests.invitedByMemberId, members.id))
    .where(
      and(
        eq(timeBlockGuests.timeBlockId, timeBlockId),
        eq(timeBlockGuests.clerkOrgId, clerkOrgId),
      ),
    );

  // Group members by time block
  const timeBlock = result[0]!;
  const blockMembers = result
    .filter((row) => row.members?.id)
    .map((row) => ({
      id: row.members!.id!,
      firstName: row.members!.firstName!,
      lastName: row.members!.lastName!,
      memberNumber: row.members!.memberNumber!,
    }));

  // Process guests
  const blockGuests = guestsResult.map((row) => ({
    id: row.guest!.id!,
    firstName: row.guest!.firstName!,
    lastName: row.guest!.lastName!,
    email: row.guest!.email,
    phone: row.guest!.phone,
    handicap: row.guest!.handicap,
    invitedByMember: row.invitedByMember
      ? {
          id: row.invitedByMember.id,
          firstName: row.invitedByMember.firstName!,
          lastName: row.invitedByMember.lastName!,
          memberNumber: row.invitedByMember.memberNumber!,
        }
      : undefined,
  }));

  return {
    id: timeBlock.id,
    clerkOrgId: timeBlock.clerkOrgId,
    teesheetId: timeBlock.teesheetId,
    startTime: timeBlock.startTime,
    endTime: timeBlock.endTime,
    createdAt: timeBlock.createdAt,
    updatedAt: timeBlock.updatedAt,
    members: blockMembers || [], // Ensure members is always an array
    guests: blockGuests || [], // Ensure guests is always an array
  };
}
