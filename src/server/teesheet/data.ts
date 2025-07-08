import "server-only";
import { db } from "~/server/db";
import {
  teesheets,
  timeBlocks,
  timeBlockMembers,
  members,
  timeBlockGuests,
  guests,
  timeBlockFills,
  templates,
} from "~/server/db/schema";
import { eq, and, inArray } from "drizzle-orm";

import type {
  TeeSheet,
  TimeBlockWithMembers,
  TeesheetConfig,
  FillType,
  TemplateBlock,
  RegularConfig,
} from "~/app/types/TeeSheetTypes";
import { ConfigTypes } from "~/app/types/TeeSheetTypes";
import { getConfigForDate } from "~/server/settings/data";
import { generateTimeBlocks } from "~/lib/utils";
import { getDateForDB } from "~/lib/dates";

export async function createTimeBlocksForTeesheet(
  teesheetId: number,
  config: TeesheetConfig,
  teesheetDate?: string,
) {
  // If no teesheet date provided, fetch it from the database
  let dateStr = teesheetDate;
  if (!dateStr) {
    const teesheet = await db.query.teesheets.findFirst({
      where: eq(teesheets.id, teesheetId),
    });

    if (teesheet) {
      dateStr = teesheet.date;
    } else {
      throw new Error("No teesheet found");
    }
  }

  // Delete existing time blocks for this teesheet
  await db.delete(timeBlocks).where(and(eq(timeBlocks.teesheetId, teesheetId)));

  // For custom configurations, fetch the template and create blocks based on it
  if (config.type === ConfigTypes.CUSTOM) {
    // Fetch the template
    const template = await db.query.templates.findFirst({
      where: eq(templates.id, config.templateId),
    });

    if (!template) {
      throw new Error("Template not found");
    }

    if (!template.blocks) {
      throw new Error("Template has no blocks");
    }

    // Create blocks based on template
    try {
      const templateBlocks = template.blocks as TemplateBlock[];

      // Create blocks based on template
      const blocks = templateBlocks.map((block, index) => ({
        teesheetId,
        startTime: block.startTime,
        endTime: block.startTime, // For template blocks, end time is same as start time
        maxMembers: block.maxPlayers,
        displayName: block.displayName,
        sortOrder: index, // Use the index to maintain order
      }));

      if (blocks.length > 0) {
        await db.insert(timeBlocks).values(blocks);
      }
    } catch (error) {
      throw new Error("Failed to create template blocks");
    }
  } else {
    const regularConfig = config;

    // For regular configurations, generate blocks based on start time, end time, and interval
    const timeBlocksArray = generateTimeBlocks({
      startTime: regularConfig.startTime,
      endTime: regularConfig.endTime,
      interval: regularConfig.interval,
    });

    const blocks = timeBlocksArray.map((time, index) => ({
      teesheetId,
      startTime: time,
      endTime: time, // For regular blocks, end time is same as start time
      maxMembers: regularConfig.maxMembersPerBlock,
      sortOrder: index,
    }));

    if (blocks.length > 0) {
      try {
        await db.insert(timeBlocks).values(blocks);
      } catch (error) {
        throw new Error("Failed to create regular blocks");
      }
    }
  }

  return await getTimeBlocksForTeesheet(teesheetId);
}

export async function getOrCreateTeesheet(
  date: Date,
): Promise<{ teesheet: TeeSheet; config: TeesheetConfig }> {
  // Format date as YYYY-MM-DD string using BC timezone
  const formattedDate = getDateForDB(date);

  // Try to find existing teesheet for the date
  const existingTeesheet = await db.query.teesheets.findFirst({
    where: eq(teesheets.date, formattedDate),
    with: {
      config: {
        with: {
          rules: true,
        },
      },
    },
  });

  let teesheet: TeeSheet;
  let config: TeesheetConfig;

  if (existingTeesheet) {
    // For existing teesheets, use the stored config
    teesheet = existingTeesheet;
    config = existingTeesheet.config as TeesheetConfig;
  } else {
    // For new teesheets, determine the appropriate config using getConfigForDate
    config = await getConfigForDate(date);

    // Create new teesheet with the date and determined config
    const newTeesheet = await db
      .insert(teesheets)
      .values({
        date: formattedDate,
        configId: config.id,
      })
      .returning()
      .then((result) => result[0]);

    if (!newTeesheet) {
      throw new Error("Failed to create teesheet");
    }

    teesheet = newTeesheet;
  }

  // Check if the teesheet has any time blocks
  const existingBlocks = await db.query.timeBlocks.findMany({
    where: eq(timeBlocks.teesheetId, teesheet.id),
    limit: 1,
  });

  // If no blocks exist, create them
  if (existingBlocks.length === 0) {
    try {
      await createTimeBlocksForTeesheet(teesheet.id, config, formattedDate);
    } catch (error) {
      throw error;
    }
  }

  return { teesheet, config };
}

export async function getTimeBlocksForTeesheet(
  teesheetId: number,
): Promise<TimeBlockWithMembers[]> {
  // First get the teesheet to get its date
  const teesheet = await db.query.teesheets.findFirst({
    where: eq(teesheets.id, teesheetId),
  });

  if (!teesheet) {
    throw new Error("Teesheet not found");
  }

  const result = await db
    .select({
      id: timeBlocks.id,
      teesheetId: timeBlocks.teesheetId,
      startTime: timeBlocks.startTime,
      endTime: timeBlocks.endTime,
      notes: timeBlocks.notes,
      displayName: timeBlocks.displayName,
      maxMembers: timeBlocks.maxMembers,
      sortOrder: timeBlocks.sortOrder,
      createdAt: timeBlocks.createdAt,
      updatedAt: timeBlocks.updatedAt,
      members: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
        class: members.class,
        bagNumber: members.bagNumber,
        username: members.username,
        email: members.email,
        gender: members.gender,
        dateOfBirth: members.dateOfBirth,
        handicap: members.handicap,
        checkedIn: timeBlockMembers.checkedIn,
        checkedInAt: timeBlockMembers.checkedInAt,
      },
    })
    .from(timeBlocks)
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .where(and(eq(timeBlocks.teesheetId, teesheetId)))
    .orderBy(timeBlocks.sortOrder, timeBlocks.startTime);

  if (!result || result.length === 0) {
    return [];
  }

  // Group results by time block
  const timeBlocksMap = new Map<number, TimeBlockWithMembers>();

  result.forEach((row) => {
    if (!timeBlocksMap.has(row.id)) {
      timeBlocksMap.set(row.id, {
        id: row.id,
        teesheetId: row.teesheetId,
        date: teesheet.date,
        startTime: row.startTime,
        endTime: row.endTime,
        notes: row.notes,
        displayName: row.displayName || undefined,
        createdAt: row.createdAt,
        updatedAt: row.updatedAt,
        members: [],
        guests: [],
        fills: [],
        maxMembers: row.maxMembers || 4, // Use the value from database or default to 4
        sortOrder: row.sortOrder || 0, // Use the value from database or default to 0
        type: ConfigTypes.REGULAR, // Default type
      });
    }

    if (row.members?.id) {
      const timeBlock = timeBlocksMap.get(row.id)!;
      timeBlock.members.push({
        id: row.members.id,
        firstName: row.members.firstName!,
        lastName: row.members.lastName!,
        memberNumber: row.members.memberNumber!,
        class: row.members.class!,
        bagNumber: row.members.bagNumber,
        username: row.members.username!,
        email: row.members.email!,
        gender: row.members.gender,
        dateOfBirth: row.members.dateOfBirth,
        handicap: row.members.handicap,
        checkedIn: row.members.checkedIn || false,
        checkedInAt: row.members.checkedInAt,
      });
    }
  });

  // Fetch guests in a separate query including timeBlockId
  const guestsResult = await db
    .select({
      timeBlockId: timeBlockGuests.timeBlockId,
      guest: {
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
        email: guests.email,
        phone: guests.phone,
      },
      checkedIn: timeBlockGuests.checkedIn,
      checkedInAt: timeBlockGuests.checkedInAt,
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
      inArray(timeBlockGuests.timeBlockId, Array.from(timeBlocksMap.keys())),
    );

  // Add guests to the corresponding time blocks
  guestsResult.forEach((row) => {
    const timeBlock = timeBlocksMap.get(row.timeBlockId);
    if (timeBlock && row.guest?.id) {
      timeBlock.guests.push({
        id: row.guest.id,
        firstName: row.guest.firstName,
        lastName: row.guest.lastName,
        email: row.guest.email,
        phone: row.guest.phone,
        checkedIn: row.checkedIn || false,
        checkedInAt: row.checkedInAt,
        invitedByMember: row.invitedByMember
          ? {
              id: row.invitedByMember.id,
              firstName: row.invitedByMember.firstName,
              lastName: row.invitedByMember.lastName,
              memberNumber: row.invitedByMember.memberNumber,
            }
          : undefined,
      });
    }
  });

  // Fetch fills in a separate query
  const fillsResult = await db
    .select()
    .from(timeBlockFills)
    .where(
      inArray(timeBlockFills.timeBlockId, Array.from(timeBlocksMap.keys())),
    );

  // Add fills to the corresponding time blocks
  fillsResult.forEach((fill) => {
    const timeBlock = timeBlocksMap.get(fill.timeBlockId);
    if (timeBlock) {
      if (!timeBlock.fills) {
        timeBlock.fills = [];
      }
      timeBlock.fills.push({
        id: fill.id,
        timeBlockId: fill.timeBlockId,
        fillType: fill.fillType as FillType,
        customName: fill.customName,
        createdAt: fill.createdAt || new Date(),
      });
    }
  });

  return Array.from(timeBlocksMap.values());
}

export async function getTimeBlockWithMembers(
  timeBlockId: number,
): Promise<TimeBlockWithMembers | null> {
  // First get the teesheet ID to fetch its date
  const timeBlockInfo = await db.query.timeBlocks.findFirst({
    where: eq(timeBlocks.id, timeBlockId),
  });

  if (!timeBlockInfo) {
    return null;
  }

  // Get the teesheet to get the date
  const teesheet = await db.query.teesheets.findFirst({
    where: eq(teesheets.id, timeBlockInfo.teesheetId),
  });

  const result = await db
    .select({
      id: timeBlocks.id,
      teesheetId: timeBlocks.teesheetId,
      startTime: timeBlocks.startTime,
      endTime: timeBlocks.endTime,
      notes: timeBlocks.notes,
      displayName: timeBlocks.displayName,
      maxMembers: timeBlocks.maxMembers,
      sortOrder: timeBlocks.sortOrder,
      createdAt: timeBlocks.createdAt,
      updatedAt: timeBlocks.updatedAt,
      members: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
        class: members.class,
        bagNumber: members.bagNumber,
        username: members.username,
        email: members.email,
        gender: members.gender,
        dateOfBirth: members.dateOfBirth,
        handicap: members.handicap,
        checkedIn: timeBlockMembers.checkedIn,
        checkedInAt: timeBlockMembers.checkedInAt,
      },
    })
    .from(timeBlocks)
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .where(eq(timeBlocks.id, timeBlockId));

  if (!result || result.length === 0) {
    return null;
  }

  // Get the basic time block info from the first row
  const firstRow = result[0];
  if (!firstRow) {
    return null;
  }

  const timeBlock = {
    id: firstRow.id,
    teesheetId: firstRow.teesheetId,
    startTime: firstRow.startTime,
    endTime: firstRow.endTime,
    notes: firstRow.notes,
    displayName: firstRow.displayName || undefined,
    maxMembers: firstRow.maxMembers || 4,
    sortOrder: firstRow.sortOrder || 0,
    createdAt: firstRow.createdAt,
    updatedAt: firstRow.updatedAt,
  };

  // Fetch guests data separately
  const guestsResult = await db
    .select({
      guest: {
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
        email: guests.email,
        phone: guests.phone,
      },
      checkedIn: timeBlockGuests.checkedIn,
      checkedInAt: timeBlockGuests.checkedInAt,
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
    .where(eq(timeBlockGuests.timeBlockId, timeBlockId));

  // Process members
  const blockMembers = result
    .filter((row) => row.members?.id)
    .map((row) => ({
      id: row.members.id!,
      firstName: row.members.firstName!,
      lastName: row.members.lastName!,
      memberNumber: row.members.memberNumber!,
      class: row.members.class!,
      bagNumber: row.members.bagNumber,
      username: row.members.username!,
      email: row.members.email!,
      gender: row.members.gender,
      dateOfBirth: row.members.dateOfBirth,
      handicap: row.members.handicap,
      checkedIn: row.members.checkedIn || false,
      checkedInAt: row.members.checkedInAt,
    }));

  // Process guests
  const blockGuests = guestsResult.map((row) => ({
    id: row.guest.id,
    firstName: row.guest.firstName,
    lastName: row.guest.lastName,
    email: row.guest.email,
    phone: row.guest.phone,
    checkedIn: row.checkedIn || false,
    checkedInAt: row.checkedInAt,
    invitedByMember: row.invitedByMember
      ? {
          id: row.invitedByMember.id,
          firstName: row.invitedByMember.firstName,
          lastName: row.invitedByMember.lastName,
          memberNumber: row.invitedByMember.memberNumber,
        }
      : undefined,
  }));

  // Fetch fills data separately
  const fillsResult = await db
    .select()
    .from(timeBlockFills)
    .where(eq(timeBlockFills.timeBlockId, timeBlockId));

  return {
    id: timeBlock.id,
    teesheetId: timeBlock.teesheetId,
    startTime: timeBlock.startTime,
    endTime: timeBlock.endTime,
    notes: timeBlock.notes,
    displayName: timeBlock.displayName || undefined,
    createdAt: timeBlock.createdAt,
    updatedAt: timeBlock.updatedAt,
    date: teesheet?.date,
    members: blockMembers || [],
    guests: blockGuests || [],
    fills: fillsResult.map((fill) => ({
      id: fill.id,
      timeBlockId: fill.timeBlockId,
      fillType: fill.fillType as FillType,
      customName: fill.customName,
      createdAt: fill.createdAt || new Date(),
    })),
    maxMembers: timeBlock.maxMembers || 4, // Use value from database or default
    sortOrder: timeBlock.sortOrder || 0, // Use value from database or default
    type: ConfigTypes.REGULAR, // Default type
  };
}
