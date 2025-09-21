import { queryOptions } from "@tanstack/react-query";
import { queryKeys } from "./query-keys";
import type { QueryOptions } from "./types";
import { searchMembersAction } from "~/server/members/actions";
import type { Member } from "~/app/types/MemberTypes";

// Query Options
export const memberQueryOptions = {
  // Search members
  search: (query: string) =>
    queryOptions({
      queryKey: queryKeys.members.search(query),
      queryFn: async (): Promise<Member[]> => {
        if (!query.trim()) {
          return [];
        }

        const results = await searchMembersAction(query);

        // Transform date strings to Date objects
        return results.map((member) => ({
          ...member,
          dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
          createdAt: new Date(member.createdAt),
          updatedAt: member.updatedAt ? new Date(member.updatedAt) : null,
        })) as Member[];
      },
      enabled: !!query.trim(), // Only run query if there's a search term
      staleTime: 5 * 60 * 1000, // 5 minutes - member data doesn't change often
      gcTime: 10 * 60 * 1000, // 10 minutes
    }),
};