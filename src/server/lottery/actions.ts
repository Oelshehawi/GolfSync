"use server";

import { db } from "~/server/db";
import {
  lotteryEntries,
  lotteryGroups,
  members,
  timeBlockMembers,
  memberFairnessScores,
  timeBlocks,
} from "~/server/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import type {
  LotteryEntryInsert,
  LotteryGroupInsert,
  LotteryEntryFormData,
  TimeWindow,
} from "~/app/types/LotteryTypes";

export type ActionResult = {
  success: boolean;
  error?: string;
  data?: any;
};

/**
 * Submit a lottery entry (individual or group based on memberIds)
 */
export async function submitLotteryEntry(
  userId: string,
  data: LotteryEntryFormData,
): Promise<ActionResult> {
  try {
    // Get member data
    const member = await db.query.members.findFirst({
      where: eq(members.username, userId),
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Check if this is a group entry (has memberIds) or individual
    const isGroupEntry = data.memberIds && data.memberIds.length > 0;

    if (isGroupEntry) {
      // Handle group entry
      const allMemberIds = [member.id, ...(data.memberIds || [])];

      // Check if group entry already exists for this date
      const existingGroup = await db.query.lotteryGroups.findFirst({
        where: and(
          eq(lotteryGroups.leaderId, member.id),
          eq(lotteryGroups.lotteryDate, data.lotteryDate),
        ),
      });

      if (existingGroup) {
        return {
          success: false,
          error: "You already have a group lottery entry for this date",
        };
      }

      // Check if any of the group members already have individual entries
      const existingEntries = await db.query.lotteryEntries.findMany({
        where: and(eq(lotteryEntries.lotteryDate, data.lotteryDate)),
      });

      const conflictingMembers = existingEntries.filter((entry) =>
        allMemberIds.includes(entry.memberId),
      );

      if (conflictingMembers.length > 0) {
        return {
          success: false,
          error:
            "Some group members already have lottery entries for this date",
        };
      }

      // Create group lottery entry
      const groupData: LotteryGroupInsert = {
        leaderId: member.id,
        lotteryDate: data.lotteryDate,
        memberIds: allMemberIds,
        preferredWindow: data.preferredWindow,
        specificTimePreference: data.specificTimePreference || null,
        alternateWindow: data.alternateWindow || null,
        leaderMemberClass: member.class,
        status: "PENDING",
      };

      const [newGroup] = await db
        .insert(lotteryGroups)
        .values(groupData)
        .returning();

      revalidatePath("/members/teesheet");
      return { success: true, data: newGroup };
    } else {
      // Handle individual entry
      // Check if entry already exists for this date
      const existingEntry = await db.query.lotteryEntries.findFirst({
        where: and(
          eq(lotteryEntries.memberId, member.id),
          eq(lotteryEntries.lotteryDate, data.lotteryDate),
        ),
      });

      if (existingEntry) {
        return {
          success: false,
          error: "You already have a lottery entry for this date",
        };
      }

      // Create individual lottery entry
      const entryData: LotteryEntryInsert = {
        memberId: member.id,
        lotteryDate: data.lotteryDate,
        preferredWindow: data.preferredWindow,
        specificTimePreference: data.specificTimePreference || null,
        alternateWindow: data.alternateWindow || null,
        memberClass: member.class,
        status: "PENDING",
      };

      const [newEntry] = await db
        .insert(lotteryEntries)
        .values(entryData)
        .returning();

      revalidatePath("/members/teesheet");
      return { success: true, data: newEntry };
    }
  } catch (error) {
    console.error("Error submitting lottery entry:", error);
    return { success: false, error: "Failed to submit lottery entry" };
  }
}

/**
 * Get lottery entry for a member and date
 */
export async function getLotteryEntry(
  userId: string,
  lotteryDate: string,
): Promise<ActionResult> {
  try {
    // Get member data
    const member = await db.query.members.findFirst({
      where: eq(members.username, userId),
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Check for individual entry
    const individualEntry = await db.query.lotteryEntries.findFirst({
      where: and(
        eq(lotteryEntries.memberId, member.id),
        eq(lotteryEntries.lotteryDate, lotteryDate),
      ),
    });

    if (individualEntry) {
      return {
        success: true,
        data: { type: "individual", entry: individualEntry },
      };
    }

    // Check for group entry where this member is the leader
    const groupEntry = await db.query.lotteryGroups.findFirst({
      where: and(
        eq(lotteryGroups.leaderId, member.id),
        eq(lotteryGroups.lotteryDate, lotteryDate),
      ),
    });

    if (groupEntry) {
      return { success: true, data: { type: "group", entry: groupEntry } };
    }

    // Check if member is part of another group
    const otherGroupEntry = await db.query.lotteryGroups.findFirst({
      where: eq(lotteryGroups.lotteryDate, lotteryDate),
    });

    if (otherGroupEntry && otherGroupEntry.memberIds.includes(member.id)) {
      return {
        success: true,
        data: { type: "group_member", entry: otherGroupEntry },
      };
    }

    return { success: true, data: null };
  } catch (error) {
    console.error("Error getting lottery entry:", error);
    return { success: false, error: "Failed to get lottery entry" };
  }
}

/**
 * Update a lottery entry
 */
export async function updateLotteryEntry(
  userId: string,
  data: {
    entryId: number;
    preferredWindow: string;
    specificTimePreference?: string;
    alternateWindow?: string;
  },
): Promise<ActionResult> {
  try {
    // Get member data
    const member = await db.query.members.findFirst({
      where: eq(members.username, userId),
    });

    if (!member) {
      return { success: false, error: "Member not found" };
    }

    // Verify the entry belongs to this member
    const entry = await db.query.lotteryEntries.findFirst({
      where: and(
        eq(lotteryEntries.id, data.entryId),
        eq(lotteryEntries.memberId, member.id),
      ),
    });

    if (!entry) {
      return {
        success: false,
        error: "Lottery entry not found or access denied",
      };
    }

    if (entry.status !== "PENDING") {
      return {
        success: false,
        error: "Cannot modify entry that has been processed",
      };
    }

    // Update the entry
    const [updatedEntry] = await db
      .update(lotteryEntries)
      .set({
        preferredWindow: data.preferredWindow,
        specificTimePreference: data.specificTimePreference || null,
        alternateWindow: data.alternateWindow || null,
        updatedAt: new Date(),
      })
      .where(eq(lotteryEntries.id, data.entryId))
      .returning();

    revalidatePath("/members/teesheet");
    return { success: true, data: updatedEntry };
  } catch (error) {
    console.error("Error updating lottery entry:", error);
    return { success: false, error: "Failed to update lottery entry" };
  }
}

/**
 * Update a lottery entry (admin action)
 */
export async function updateLotteryEntryAdmin(
  entryId: number,
  data: {
    preferredWindow: string;
    specificTimePreference?: string;
    alternateWindow?: string;
  },
): Promise<ActionResult> {
  try {
    // Verify the entry exists
    const entry = await db.query.lotteryEntries.findFirst({
      where: eq(lotteryEntries.id, entryId),
    });

    if (!entry) {
      return {
        success: false,
        error: "Lottery entry not found",
      };
    }

    // Update the entry
    const [updatedEntry] = await db
      .update(lotteryEntries)
      .set({
        preferredWindow: data.preferredWindow,
        specificTimePreference: data.specificTimePreference || null,
        alternateWindow: data.alternateWindow || null,
        updatedAt: new Date(),
      })
      .where(eq(lotteryEntries.id, entryId))
      .returning();

    revalidatePath("/admin/lottery");
    return { success: true, data: updatedEntry };
  } catch (error) {
    console.error("Error updating lottery entry (admin):", error);
    return { success: false, error: "Failed to update lottery entry" };
  }
}

/**
 * Update a lottery group (admin action)
 */
export async function updateLotteryGroupAdmin(
  groupId: number,
  data: {
    preferredWindow: string;
    specificTimePreference?: string;
    alternateWindow?: string;
    memberIds: number[];
  },
): Promise<ActionResult> {
  try {
    // Verify the group exists
    const group = await db.query.lotteryGroups.findFirst({
      where: eq(lotteryGroups.id, groupId),
    });

    if (!group) {
      return {
        success: false,
        error: "Lottery group not found",
      };
    }

    // Validate that memberIds includes the leader
    if (!data.memberIds.includes(group.leaderId)) {
      return {
        success: false,
        error: "Group leader must be included in member list",
      };
    }

    // Update the group
    const [updatedGroup] = await db
      .update(lotteryGroups)
      .set({
        preferredWindow: data.preferredWindow,
        specificTimePreference: data.specificTimePreference || null,
        alternateWindow: data.alternateWindow || null,
        memberIds: data.memberIds,
        updatedAt: new Date(),
      })
      .where(eq(lotteryGroups.id, groupId))
      .returning();

    revalidatePath("/admin/lottery");
    return { success: true, data: updatedGroup };
  } catch (error) {
    console.error("Error updating lottery group (admin):", error);
    return { success: false, error: "Failed to update lottery group" };
  }
}

// ADMIN FUNCTIONS

/**
 * Cancel a lottery entry (admin action)
 */
export async function cancelLotteryEntry(
  entryId: number,
  isGroup: boolean = false,
): Promise<ActionResult> {
  try {
    if (isGroup) {
      const [updatedGroup] = await db
        .update(lotteryGroups)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(lotteryGroups.id, entryId))
        .returning();

      revalidatePath("/admin/lottery");
      return { success: true, data: updatedGroup };
    } else {
      const [updatedEntry] = await db
        .update(lotteryEntries)
        .set({
          status: "CANCELLED",
          updatedAt: new Date(),
        })
        .where(eq(lotteryEntries.id, entryId))
        .returning();

      revalidatePath("/admin/lottery");
      return { success: true, data: updatedEntry };
    }
  } catch (error) {
    console.error("Error canceling lottery entry:", error);
    return { success: false, error: "Failed to cancel lottery entry" };
  }
}

/**
 * Manually assign a lottery entry to a time block (admin action)
 */
export async function assignLotteryEntry(
  entryId: number,
  timeBlockId: number,
  isGroup: boolean = false,
): Promise<ActionResult> {
  try {
    const now = new Date();

    // Get the time block details to extract the proper time
    const timeBlock = await db.query.timeBlocks.findFirst({
      where: eq(timeBlocks.id, timeBlockId),
    });

    if (!timeBlock) {
      return { success: false, error: "Time block not found" };
    }

    if (isGroup) {
      // Update group status
      const [updatedGroup] = await db
        .update(lotteryGroups)
        .set({
          status: "ASSIGNED",
          assignedTimeBlockId: timeBlockId,
          processedAt: now,
          updatedAt: now,
        })
        .where(eq(lotteryGroups.id, entryId))
        .returning();

      // Add all group members to the time block
      if (updatedGroup) {
        const memberInserts = updatedGroup.memberIds.map((memberId) => ({
          timeBlockId,
          memberId,
          bookingDate: updatedGroup.lotteryDate,
          bookingTime: timeBlock.startTime, // Use actual time from time block
        }));

        await db.insert(timeBlockMembers).values(memberInserts);
      }

      revalidatePath("/admin/lottery");
      return { success: true, data: updatedGroup };
    } else {
      // Update entry status
      const [updatedEntry] = await db
        .update(lotteryEntries)
        .set({
          status: "ASSIGNED",
          assignedTimeBlockId: timeBlockId,
          processedAt: now,
          updatedAt: now,
        })
        .where(eq(lotteryEntries.id, entryId))
        .returning();

      // Add member to the time block
      if (updatedEntry) {
        await db.insert(timeBlockMembers).values({
          timeBlockId,
          memberId: updatedEntry.memberId,
          bookingDate: updatedEntry.lotteryDate,
          bookingTime: timeBlock.startTime, // Use actual time from time block
        });
      }

      revalidatePath("/admin/lottery");
      return { success: true, data: updatedEntry };
    }
  } catch (error) {
    console.error("Error assigning lottery entry:", error);
    return { success: false, error: "Failed to assign lottery entry" };
  }
}

/**
 * Process lottery entries by assigning them to time blocks WITHOUT creating actual bookings
 * This allows for preview and confirmation before finalizing
 */
export async function processLotteryForDate(
  date: string,
): Promise<ActionResult> {
  try {
    // This is a basic implementation - can be enhanced with more sophisticated algorithms
    const { getLotteryEntriesForDate, getAvailableTimeBlocksForDate } =
      await import("~/server/lottery/data");

    const entries = await getLotteryEntriesForDate(date);
    const availableBlocks = await getAvailableTimeBlocksForDate(date);

    const availableBlocksOnly = availableBlocks.filter(
      (block) => block.availableSpots > 0,
    );

    if (availableBlocksOnly.length === 0) {
      return {
        success: false,
        error: "No available time blocks for this date",
      };
    }

    let processedCount = 0;
    const now = new Date();

    // Process individual entries first (by submission time)
    for (const entry of entries.individual) {
      if (entry.status !== "PENDING") continue;

      // Find available block that matches preferences
      const suitableBlock = findSuitableTimeBlock(
        availableBlocksOnly,
        entry.preferredWindow as TimeWindow,
        entry.alternateWindow as TimeWindow | null,
        entry.specificTimePreference,
      );

      if (suitableBlock && suitableBlock.availableSpots > 0) {
        // ONLY assign the entry - DO NOT create timeBlockMembers record yet
        await db
          .update(lotteryEntries)
          .set({
            status: "ASSIGNED",
            assignedTimeBlockId: suitableBlock.id,
            processedAt: now,
            updatedAt: now,
          })
          .where(eq(lotteryEntries.id, entry.id));

        // Update available spots for next assignment calculations
        suitableBlock.availableSpots -= 1;
        processedCount++;
      }
    }

    // Process group entries
    for (const group of entries.groups) {
      if (group.status !== "PENDING") continue;

      const groupSize = group.memberIds.length;

      // Find available block that can accommodate the entire group
      const suitableBlock = availableBlocksOnly.find(
        (block) =>
          block.availableSpots >= groupSize &&
          matchesTimePreference(
            block,
            group.preferredWindow as TimeWindow,
            group.alternateWindow as TimeWindow | null,
            group.specificTimePreference,
          ),
      );

      if (suitableBlock) {
        // ONLY assign the group - DO NOT create timeBlockMembers records yet
        await db
          .update(lotteryGroups)
          .set({
            status: "ASSIGNED",
            assignedTimeBlockId: suitableBlock.id,
            processedAt: now,
            updatedAt: now,
          })
          .where(eq(lotteryGroups.id, group.id));

        // Update available spots for next assignment calculations
        suitableBlock.availableSpots -= groupSize;
        processedCount++;
      }
    }

    revalidatePath("/admin/lottery");
    return {
      success: true,
      data: {
        processedCount,
        totalEntries: entries.individual.length + entries.groups.length,
      },
    };
  } catch (error) {
    console.error("Error processing lottery:", error);
    return { success: false, error: "Failed to process lottery entries" };
  }
}

/**
 * Finalize lottery results by creating actual timeBlockMembers records
 * This should only be called after admin confirms the assignments
 */
export async function finalizeLotteryResults(
  date: string,
): Promise<ActionResult> {
  try {
    const { getLotteryEntriesForDate } = await import("~/server/lottery/data");
    const entries = await getLotteryEntriesForDate(date);

    const memberInserts: any[] = [];

    // Create timeBlockMembers records for assigned individual entries
    for (const entry of entries.individual) {
      if (entry.status === "ASSIGNED" && entry.assignedTimeBlockId) {
        const timeBlock = await db.query.timeBlocks.findFirst({
          where: eq(timeBlocks.id, entry.assignedTimeBlockId),
        });

        if (timeBlock) {
          memberInserts.push({
            timeBlockId: entry.assignedTimeBlockId,
            memberId: entry.memberId,
            bookingDate: date,
            bookingTime: timeBlock.startTime,
          });
        }
      }
    }

    // Create timeBlockMembers records for assigned group entries
    for (const group of entries.groups) {
      if (
        group.status === "ASSIGNED" &&
        group.members &&
        group.members.length > 0
      ) {
        // Find the assigned time block for this group
        const assignedTimeBlock = await db.query.timeBlocks.findFirst({
          where: sql`EXISTS (
            SELECT 1 FROM ${lotteryEntries} 
            WHERE ${lotteryEntries.assignedTimeBlockId} = ${timeBlocks.id}
            AND ${lotteryEntries.memberId} = ANY(${group.memberIds})
            AND ${lotteryEntries.lotteryDate} = ${date}
          )`,
        });

        if (assignedTimeBlock) {
          // Add all group members to the time block
          for (const memberId of group.memberIds) {
            memberInserts.push({
              timeBlockId: assignedTimeBlock.id,
              memberId: memberId,
              bookingDate: date,
              bookingTime: assignedTimeBlock.startTime,
            });
          }
        }
      }
    }

    // Insert all timeBlockMembers records at once
    if (memberInserts.length > 0) {
      await db.insert(timeBlockMembers).values(memberInserts);
    }

    revalidatePath("/admin/lottery");
    revalidatePath("/admin/teesheet");

    return {
      success: true,
      data: {
        finalizedCount: memberInserts.length,
      },
    };
  } catch (error) {
    console.error("Error finalizing lottery results:", error);
    return { success: false, error: "Failed to finalize lottery results" };
  }
}

/**
 * Initialize fairness scores for a member
 */
export async function initializeFairnessScore(
  memberId: number,
): Promise<ActionResult> {
  try {
    const [score] = await db
      .insert(memberFairnessScores)
      .values({
        memberId,
        last6WeeksAverage: 0,
        currentStreak: 0,
        priorityScore: 0,
      })
      .onConflictDoNothing()
      .returning();

    return { success: true, data: score };
  } catch (error) {
    console.error("Error initializing fairness score:", error);
    return { success: false, error: "Failed to initialize fairness score" };
  }
}

/**
 * Helper function to find suitable time block based on preferences
 */
function findSuitableTimeBlock(
  availableBlocks: any[],
  preferredWindow: TimeWindow,
  alternateWindow: TimeWindow | null,
  specificTime: string | null,
) {
  // First try to match specific time preference
  if (specificTime) {
    const specificMatch = availableBlocks.find(
      (block) => block.startTime === specificTime && block.availableSpots > 0,
    );
    if (specificMatch) return specificMatch;
  }

  // Then try preferred window
  const preferredMatch = availableBlocks.find(
    (block) =>
      matchesTimePreference(block, preferredWindow, null, null) &&
      block.availableSpots > 0,
  );
  if (preferredMatch) return preferredMatch;

  // Finally try alternate window
  if (alternateWindow) {
    const alternateMatch = availableBlocks.find(
      (block) =>
        matchesTimePreference(block, alternateWindow, null, null) &&
        block.availableSpots > 0,
    );
    if (alternateMatch) return alternateMatch;
  }

  // Return any available block as last resort
  return availableBlocks.find((block) => block.availableSpots > 0);
}

/**
 * Helper function to check if a time block matches time preferences
 */
function matchesTimePreference(
  block: any,
  timeWindow: TimeWindow,
  alternateWindow: TimeWindow | null,
  specificTime: string | null,
): boolean {
  const blockTime = parseInt(block.startTime.replace(":", ""));

  if (specificTime && block.startTime === specificTime) {
    return true;
  }

  const windowRanges = {
    EARLY_MORNING: { start: 600, end: 800 },
    MORNING: { start: 800, end: 1100 },
    MIDDAY: { start: 1100, end: 1400 },
    AFTERNOON: { start: 1400, end: 1800 },
  };

  const preferredRange = windowRanges[timeWindow];
  if (blockTime >= preferredRange.start && blockTime < preferredRange.end) {
    return true;
  }

  if (alternateWindow) {
    const alternateRange = windowRanges[alternateWindow];
    if (blockTime >= alternateRange.start && blockTime < alternateRange.end) {
      return true;
    }
  }

  return false;
}

/**
 * Create test lottery entries for debugging (admin only)
 */
export async function createTestLotteryEntries(
  date: string,
): Promise<ActionResult> {
  try {
    // Get many members to use for test entries - need enough to fill a full teesheet
    // Exclude RESIGNED, SUSPENDED, and DINING members
    const allMembers = await db.query.members.findMany({
      where: and(
        sql`${members.class} != 'RESIGNED'`,
        sql`${members.class} != 'SUSPENDED'`,
        sql`${members.class} != 'DINING'`,
      ),
      limit: 80, // Increased to support many more entries
    });

    if (allMembers.length < 15) {
      return {
        success: false,
        error: "Need at least 15 members to create comprehensive test entries",
      };
    }

    const testEntries: LotteryEntryInsert[] = [];
    const testGroups: LotteryGroupInsert[] = [];

    // Create individual entries with various preferences
    const timeWindows: TimeWindow[] = [
      "EARLY_MORNING",
      "MORNING",
      "MIDDAY",
      "AFTERNOON",
    ];
    // More specific times to cover 7am-4pm range
    const specificTimes = [
      "07:00",
      "07:15",
      "07:30",
      "07:45",
      "08:00",
      "08:15",
      "08:30",
      "08:45",
      "09:00",
      "09:15",
      "09:30",
      "09:45",
      "10:00",
      "10:15",
      "10:30",
      "10:45",
      "11:00",
      "11:15",
      "11:30",
      "11:45",
      "12:00",
      "12:15",
      "12:30",
      "12:45",
      "13:00",
      "13:15",
      "13:30",
      "13:45",
      "14:00",
      "14:15",
      "14:30",
      "14:45",
      "15:00",
      "15:15",
      "15:30",
      "15:45",
      "16:00",
    ];

    // Calculate 70/30 split: 70% group entries, 30% individual entries
    // Aim for about 20-25 total entries (realistic for a day)
    const targetTotalEntries = Math.min(25, Math.floor(allMembers.length / 3));
    const targetGroupEntries = Math.floor(targetTotalEntries * 0.7); // 70%
    const targetIndividualEntries = targetTotalEntries - targetGroupEntries; // 30%

    let memberIndex = 0;

    // Create group entries first (70% of total entries)
    while (
      testGroups.length < targetGroupEntries &&
      memberIndex < allMembers.length - 1
    ) {
      const groupSize = Math.min(
        2 + Math.floor(Math.random() * 3), // Random size 2-4
        allMembers.length - memberIndex,
      );

      if (groupSize < 2 || memberIndex + groupSize > allMembers.length) break;

      const leader = allMembers[memberIndex];
      if (!leader) break;

      const groupMembers = [leader.id];
      for (let i = 1; i < groupSize; i++) {
        const member = allMembers[memberIndex + i];
        if (member) groupMembers.push(member.id);
      }

      if (groupMembers.length >= 2) {
        const randomWindow =
          timeWindows[Math.floor(Math.random() * timeWindows.length)]!;
        const alternateWindow =
          timeWindows[Math.floor(Math.random() * timeWindows.length)]!;
        const useSpecificTime = Math.random() > 0.6; // 40% chance for groups

        testGroups.push({
          leaderId: leader.id,
          lotteryDate: date,
          memberIds: groupMembers,
          preferredWindow: randomWindow,
          alternateWindow:
            randomWindow !== alternateWindow ? alternateWindow : null,
          specificTimePreference: useSpecificTime
            ? specificTimes[Math.floor(Math.random() * specificTimes.length)]!
            : null,
          leaderMemberClass: leader.class,
          status: "PENDING",
        });
      }

      memberIndex += groupSize;
    }

    // Create individual entries with remaining members (30% of total entries)
    let individualCount = 0;
    while (
      individualCount < targetIndividualEntries &&
      memberIndex < allMembers.length
    ) {
      const member = allMembers[memberIndex];
      if (!member) break;

      const randomWindow =
        timeWindows[Math.floor(Math.random() * timeWindows.length)]!;
      const alternateWindow =
        timeWindows[Math.floor(Math.random() * timeWindows.length)]!;
      const useSpecificTime = Math.random() > 0.5; // 50% chance of specific time

      testEntries.push({
        memberId: member.id,
        lotteryDate: date,
        preferredWindow: randomWindow,
        alternateWindow:
          randomWindow !== alternateWindow ? alternateWindow : null,
        specificTimePreference: useSpecificTime
          ? specificTimes[Math.floor(Math.random() * specificTimes.length)]!
          : null,
        memberClass: member.class,
        status: "PENDING",
      });

      memberIndex++;
      individualCount++;
    }

    // Insert all test entries
    let createdEntries = 0;
    let createdGroups = 0;

    if (testEntries.length > 0) {
      const results = await db
        .insert(lotteryEntries)
        .values(testEntries)
        .returning();
      createdEntries = results.length;
    }

    if (testGroups.length > 0) {
      const results = await db
        .insert(lotteryGroups)
        .values(testGroups)
        .returning();
      createdGroups = results.length;
    }

    revalidatePath("/admin/lottery");
    return {
      success: true,
      data: {
        createdEntries,
        createdGroups,
        totalPlayers:
          createdEntries +
          testGroups.reduce((sum, group) => sum + group.memberIds.length, 0),
      },
    };
  } catch (error) {
    console.error("Error creating test lottery entries:", error);
    return { success: false, error: "Failed to create test lottery entries" };
  }
}

/**
 * Clear all lottery entries for a date (debug function)
 */
export async function clearLotteryEntriesForDate(
  date: string,
): Promise<ActionResult> {
  try {
    // Delete individual entries
    const deletedEntries = await db
      .delete(lotteryEntries)
      .where(eq(lotteryEntries.lotteryDate, date))
      .returning();

    // Delete group entries
    const deletedGroups = await db
      .delete(lotteryGroups)
      .where(eq(lotteryGroups.lotteryDate, date))
      .returning();

    revalidatePath("/admin/lottery");
    return {
      success: true,
      data: {
        deletedEntries: deletedEntries.length,
        deletedGroups: deletedGroups.length,
      },
    };
  } catch (error) {
    console.error("Error clearing lottery entries:", error);
    return { success: false, error: "Failed to clear lottery entries" };
  }
}


/**
 * Update lottery assignment (move entry/group between time blocks or unassign)
 */
export async function updateLotteryAssignment(
  entryId: number,
  isGroup: boolean,
  targetTimeBlockId: number | null,
): Promise<ActionResult> {
  try {
    if (isGroup) {
      await db
        .update(lotteryGroups)
        .set({
          assignedTimeBlockId: targetTimeBlockId,
          status: targetTimeBlockId ? "ASSIGNED" : "PENDING",
          updatedAt: new Date(),
        })
        .where(eq(lotteryGroups.id, entryId));
    } else {
      await db
        .update(lotteryEntries)
        .set({
          assignedTimeBlockId: targetTimeBlockId,
          status: targetTimeBlockId ? "ASSIGNED" : "PENDING",
          updatedAt: new Date(),
        })
        .where(eq(lotteryEntries.id, entryId));
    }

    revalidatePath("/admin/lottery");
    return { success: true };
  } catch (error) {
    console.error("Error updating lottery assignment:", error);
    return { success: false, error: "Failed to update assignment" };
  }
}

/**
 * Batch update lottery assignments (save all client-side changes at once)
 */
export async function batchUpdateLotteryAssignments(
  changes: {
    entryId: number;
    isGroup: boolean;
    assignedTimeBlockId: number | null;
  }[],
): Promise<ActionResult> {
  try {
    // Process all entry assignment changes
    for (const change of changes) {
      if (change.isGroup) {
        await db
          .update(lotteryGroups)
          .set({
            assignedTimeBlockId: change.assignedTimeBlockId,
            status: change.assignedTimeBlockId ? "ASSIGNED" : "PENDING",
            updatedAt: new Date(),
          })
          .where(eq(lotteryGroups.id, change.entryId));
      } else {
        await db
          .update(lotteryEntries)
          .set({
            assignedTimeBlockId: change.assignedTimeBlockId,
            status: change.assignedTimeBlockId ? "ASSIGNED" : "PENDING",
            updatedAt: new Date(),
          })
          .where(eq(lotteryEntries.id, change.entryId));
      }
    }

    revalidatePath("/admin/lottery");
    return { success: true };
  } catch (error) {
    console.error("Error batch updating lottery assignments:", error);
    return { success: false, error: "Failed to save changes" };
  }
}
