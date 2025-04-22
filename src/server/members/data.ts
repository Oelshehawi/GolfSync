import { db } from "~/server/db";
import { members } from "~/server/db/schema";
import { eq, sql, and } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";
import type { Member } from "~/app/types/MemberTypes";

// Helper function to map members to their full names
export function mapMembersToNames(members: Member[]): string[] {
  return members.map((member) => `${member.firstName} ${member.lastName}`);
}

function convertToMember(row: any): Member {
  return {
    ...row,
    dateOfBirth: row.dateOfBirth ? new Date(row.dateOfBirth) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: row.updatedAt ? new Date(row.updatedAt) : null,
  };
}

export async function getMembers(): Promise<Member[]> {
  const orgId = await getOrganizationId();
  const rows = await db
    .select()
    .from(members)
    .where(eq(members.clerkOrgId, orgId))
    .orderBy(members.lastName, members.firstName);

  return rows.map(convertToMember);
}

export async function searchMembersList(query: string): Promise<Member[]> {
  const orgId = await getOrganizationId();
  const rows = await db
    .select()
    .from(members)
    .where(
      and(
        eq(members.clerkOrgId, orgId),
        sql`CONCAT(${members.firstName}, ' ', ${members.lastName}) ILIKE ${`%${query}%`} OR ${members.memberNumber} ILIKE ${`%${query}%`}`,
      ),
    )
    .orderBy(members.lastName, members.firstName);

  return rows.map(convertToMember);
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
