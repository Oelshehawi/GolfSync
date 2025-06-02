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
  teesheetConfigs,
  teesheetConfigRules,
} from "~/server/db/schema";
import { eq, and, inArray, sql, isNull, or, lte, gte, desc } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";
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
import { generateTimeBlocks, formatDateToYYYYMMDD } from "~/lib/utils";
import { format } from "date-fns";

export async function createTimeBlocksForTeesheet(
  teesheetId: number,
  config: TeesheetConfig,
  teesheetDate?: string,
) {
  const clerkOrgId = await getOrganizationId();

  // If no teesheet date provided, fetch it from the database
  let dateStr = teesheetDate;
  if (!dateStr) {
    const teesheet = await db.query.teesheets.findFirst({
      where: and(
        eq(teesheets.id, teesheetId),
        eq(teesheets.clerkOrgId, clerkOrgId),
      ),
    });

    if (teesheet) {
      dateStr = teesheet.date;
    } else {
      throw new Error("No teesheet found");
    }
  }

  // Delete existing time blocks for this teesheet
  await db
    .delete(timeBlocks)
    .where(
      and(
        eq(timeBlocks.teesheetId, teesheetId),
        eq(timeBlocks.clerkOrgId, clerkOrgId),
      ),
    );

  // For custom configurations, fetch the template and create blocks based on it
  if (config.type === ConfigTypes.CUSTOM) {
    // Fetch the template
    const template = await db.query.templates.findFirst({
      where: and(
        eq(templates.id, config.templateId),
        eq(templates.clerkOrgId, clerkOrgId),
      ),
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
        clerkOrgId,
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
    const regularConfig = config as RegularConfig;

    // For regular configurations, generate blocks based on start time, end time, and interval
    const timeBlocksArray = generateTimeBlocks({
      startTime: regularConfig.startTime,
      endTime: regularConfig.endTime,
      interval: regularConfig.interval,
    });

    const blocks = timeBlocksArray.map((time, index) => ({
      clerkOrgId,
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
  const clerkOrgId = await getOrganizationId();

  // Format date as YYYY-MM-DD string in local time to ensure consistency
  const formattedDate = formatDateToYYYYMMDD(date);

  // Try to find existing teesheet for the date
  const existingTeesheet = await db.query.teesheets.findFirst({
    where: and(
      eq(teesheets.clerkOrgId, clerkOrgId),
      eq(teesheets.date, formattedDate),
    ),
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
        clerkOrgId,
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
    where: and(
      eq(timeBlocks.teesheetId, teesheet.id),
      eq(timeBlocks.clerkOrgId, clerkOrgId),
    ),
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
  const clerkOrgId = await getOrganizationId();

  // First get the teesheet to get its date
  const teesheet = await db.query.teesheets.findFirst({
    where: and(
      eq(teesheets.id, teesheetId),
      eq(teesheets.clerkOrgId, clerkOrgId),
    ),
  });

  if (!teesheet) {
    throw new Error("Teesheet not found");
  }

  const result = await db
    .select({
      id: timeBlocks.id,
      clerkOrgId: timeBlocks.clerkOrgId,
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
        checkedIn: timeBlockMembers.checkedIn,
        checkedInAt: timeBlockMembers.checkedInAt,
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
    )
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
        clerkOrgId: row.clerkOrgId,
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
      and(
        eq(timeBlockGuests.clerkOrgId, clerkOrgId),
        inArray(timeBlockGuests.timeBlockId, Array.from(timeBlocksMap.keys())),
      ),
    );

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
        checkedIn: row.checkedIn || false,
        checkedInAt: row.checkedInAt,
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

  // Fetch fills in a separate query
  const fillsResult = await db
    .select()
    .from(timeBlockFills)
    .where(
      and(
        eq(timeBlockFills.clerkOrgId, clerkOrgId),
        inArray(timeBlockFills.timeBlockId, Array.from(timeBlocksMap.keys())),
      ),
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
        clerkOrgId: fill.clerkOrgId,
        createdAt: fill.createdAt || new Date(),
      });
    }
  });

  return Array.from(timeBlocksMap.values());
}

export async function getTimeBlockWithMembers(
  timeBlockId: number,
): Promise<TimeBlockWithMembers | null> {
  const clerkOrgId = await getOrganizationId();

  // First get the teesheet ID to fetch its date
  const timeBlockInfo = await db.query.timeBlocks.findFirst({
    where: and(
      eq(timeBlocks.id, timeBlockId),
      eq(timeBlocks.clerkOrgId, clerkOrgId),
    ),
  });

  if (!timeBlockInfo) {
    return null;
  }

  // Get the teesheet to get the date
  const teesheet = await db.query.teesheets.findFirst({
    where: and(
      eq(teesheets.id, timeBlockInfo.teesheetId),
      eq(teesheets.clerkOrgId, clerkOrgId),
    ),
  });

  const result = await db
    .select({
      id: timeBlocks.id,
      clerkOrgId: timeBlocks.clerkOrgId,
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
        checkedIn: timeBlockMembers.checkedIn,
        checkedInAt: timeBlockMembers.checkedInAt,
      },
    })
    .from(timeBlocks)
    .leftJoin(timeBlockMembers, eq(timeBlocks.id, timeBlockMembers.timeBlockId))
    .leftJoin(members, eq(timeBlockMembers.memberId, members.id))
    .where(
      and(
        eq(timeBlocks.clerkOrgId, clerkOrgId),
        eq(timeBlocks.id, timeBlockId),
      ),
    );

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
    clerkOrgId: firstRow.clerkOrgId,
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
    .where(
      and(
        eq(timeBlockGuests.clerkOrgId, clerkOrgId),
        eq(timeBlockGuests.timeBlockId, timeBlockId),
      ),
    );

  // Process members
  const blockMembers = result
    .filter((row) => row.members?.id)
    .map((row) => ({
      id: row.members!.id!,
      firstName: row.members!.firstName!,
      lastName: row.members!.lastName!,
      memberNumber: row.members!.memberNumber!,
      class: row.members!.class!,
      bagNumber: row.members!.bagNumber,
      checkedIn: row.members!.checkedIn || false,
      checkedInAt: row.members!.checkedInAt,
    }));

  // Process guests
  const blockGuests = guestsResult.map((row) => ({
    id: row.guest!.id!,
    firstName: row.guest!.firstName!,
    lastName: row.guest!.lastName!,
    email: row.guest!.email,
    phone: row.guest!.phone,
    checkedIn: row.checkedIn || false,
    checkedInAt: row.checkedInAt,
    invitedByMember: row.invitedByMember
      ? {
          id: row.invitedByMember.id,
          firstName: row.invitedByMember.firstName!,
          lastName: row.invitedByMember.lastName!,
          memberNumber: row.invitedByMember.memberNumber!,
        }
      : undefined,
  }));

  // Fetch fills data separately
  const fillsResult = await db
    .select()
    .from(timeBlockFills)
    .where(
      and(
        eq(timeBlockFills.clerkOrgId, clerkOrgId),
        eq(timeBlockFills.timeBlockId, timeBlockId),
      ),
    );

  return {
    id: timeBlock.id,
    clerkOrgId: timeBlock.clerkOrgId,
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
      clerkOrgId: fill.clerkOrgId,
      createdAt: fill.createdAt || new Date(),
    })),
    maxMembers: timeBlock.maxMembers || 4, // Use value from database or default
    sortOrder: timeBlock.sortOrder || 0, // Use value from database or default
    type: ConfigTypes.REGULAR, // Default type
  };
}
