import { db } from "~/server/db";
import { members } from "~/server/db/schema";
import { sql } from "drizzle-orm";
import type { Member } from "~/app/types/TeeSheetTypes";

// Helper function to map members to their full names
export function mapMembersToNames(members: Member[]): string[] {
  return members.map((member) => `${member.firstName} ${member.lastName}`);
}

export async function searchMembers(query: string) {
  if (query.length < 2) return [];

  const searchTerm = query.toLowerCase();

  const results = await db.query.members.findMany({
    where: (members, { or, like, sql }) =>
      or(
        sql`LOWER(${members.firstName}) LIKE ${`%${searchTerm}%`}`,
        sql`LOWER(${members.lastName}) LIKE ${`%${searchTerm}%`}`,
        sql`LOWER(${members.memberNumber}) LIKE ${`%${searchTerm}%`}`,
        // Also search for full name concatenation
        sql`LOWER(CONCAT(${members.firstName}, ' ', ${members.lastName})) LIKE ${`%${searchTerm}%`}`,
      ),
    limit: 10,
  });

  return results;
}
