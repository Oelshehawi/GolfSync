import { db } from "~/server/db";
import type { Member } from "~/app/types/MemberTypes";

// Helper function to map members to their full names
export function mapMembersToNames(members: Member[]): string[] {
  return members.map((member) => `${member.firstName} ${member.lastName}`);
}

export async function searchMembers(
  query: string = "",
  page: number = 1,
  pageSize: number = 20,
) {
  const offset = (page - 1) * pageSize;

  const results = await db.query.members.findMany({
    where: (members, { or, sql }) =>
      or(
        sql`LOWER(${members.firstName}) LIKE ${`%${query.toLowerCase()}%`}`,
        sql`LOWER(${members.lastName}) LIKE ${`%${query.toLowerCase()}%`}`,
        sql`LOWER(${members.memberNumber}) LIKE ${`%${query.toLowerCase()}%`}`,
        sql`LOWER(CONCAT(${members.firstName}, ' ', ${members.lastName})) LIKE ${`%${query.toLowerCase()}%`}`,
      ),
    limit: pageSize + 1,
    offset: offset,
    orderBy: (members, { asc }) => [asc(members.lastName)],
  });

  const hasMore = results.length > pageSize;
  const items = results.slice(0, pageSize);

  return { results: items, hasMore };
}
