"use server";

import { db } from "~/server/db";
import { lotteryEntries, lotteryGroups, members } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { getAuthenticatedUser } from "~/lib/auth-server";
import type { LotteryEntryData } from "~/app/types/LotteryTypes";

/**
 * Get lottery entry for the authenticated member and specified date
 * @param lotteryDate YYYY-MM-DD date string
 * @returns Lottery entry data or null if none found
 */
export async function getLotteryEntryData(
  lotteryDate: string,
): Promise<LotteryEntryData> {
  try {
    const { sessionClaims } = await getAuthenticatedUser();

    // Get member data using the external userId from session claims
    const member = await db.query.members.findFirst({
      where: eq(members.id, Number(sessionClaims?.userId)),
    });

    if (!member) {
      throw new Error("Member not found");
    }

    // Check for individual entry
    const individualEntry = await db.query.lotteryEntries.findFirst({
      where: and(
        eq(lotteryEntries.memberId, member.id),
        eq(lotteryEntries.lotteryDate, lotteryDate),
      ),
    });

    if (individualEntry) {
      return { type: "individual", entry: individualEntry as any };
    }

    // Check for group entry where this member is the leader
    const groupEntry = await db.query.lotteryGroups.findFirst({
      where: and(
        eq(lotteryGroups.leaderId, member.id),
        eq(lotteryGroups.lotteryDate, lotteryDate),
      ),
    });

    if (groupEntry) {
      return { type: "group", entry: groupEntry as any };
    }

    // Check if member is part of another group
    const otherGroupEntry = await db.query.lotteryGroups.findFirst({
      where: eq(lotteryGroups.lotteryDate, lotteryDate),
    });

    if (otherGroupEntry && otherGroupEntry.memberIds.includes(member.id)) {
      return { type: "group_member", entry: otherGroupEntry as any };
    }

    return null;
  } catch (error) {
    console.error("Error getting lottery entry data:", error);
    throw error;
  }
}

/**
 * Get the authenticated member's data
 * @returns Member data
 */
export async function getMemberForLottery() {
  try {
    const { sessionClaims } = await getAuthenticatedUser();

    const member = await db.query.members.findFirst({
      where: eq(members.id, Number(sessionClaims?.userId)),
    });

    if (!member) {
      throw new Error("Member not found");
    }

    return member;
  } catch (error) {
    console.error("Error getting member for lottery:", error);
    throw error;
  }
}
