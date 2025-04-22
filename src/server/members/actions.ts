"use server";

import { db } from "~/server/db";
import { members, timeBlockMembers } from "~/server/db/schema";
import { eq, and } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { getOrganizationId } from "~/lib/auth";
import { searchMembers } from "./data";

// Time block related functions
export async function addMemberToTimeBlock(
  timeBlockId: number,
  memberId: number,
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return { success: false, error: "No organization selected" };
    }

    // Check if member is already in the time block
    const existingMember = await db.query.timeBlockMembers.findFirst({
      where: and(
        eq(timeBlockMembers.timeBlockId, timeBlockId),
        eq(timeBlockMembers.memberId, memberId),
      ),
    });

    if (existingMember) {
      return { success: false, error: "Member is already in this time block" };
    }

    // Add member to time block
    await db.insert(timeBlockMembers).values({
      clerkOrgId: orgId,
      timeBlockId,
      memberId,
    });

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    return { success: true };
  } catch (error) {
    console.error("Error adding member to time block:", error);
    return { success: false, error: "Failed to add member to time block" };
  }
}

export async function removeMemberFromTimeBlock(
  timeBlockId: number,
  memberId: number,
) {
  try {
    const orgId = await getOrganizationId();

    if (!orgId) {
      return { success: false, error: "No organization selected" };
    }

    await db
      .delete(timeBlockMembers)
      .where(
        and(
          eq(timeBlockMembers.timeBlockId, timeBlockId),
          eq(timeBlockMembers.memberId, memberId),
          eq(timeBlockMembers.clerkOrgId, orgId),
        ),
      );

    revalidatePath(`/admin/timeblock/${timeBlockId}`);
    return { success: true };
  } catch (error) {
    console.error("Error removing member from time block:", error);
    return { success: false, error: "Failed to remove member from time block" };
  }
}

// Member management functions
export async function createMember(data: {
  memberNumber: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
  class: string;
  gender?: string;
  dateOfBirth?: string;
  handicap?: string;
  bagNumber?: string;
}) {
  const orgId = await getOrganizationId();
  await db.insert(members).values({
    ...data,
    clerkOrgId: orgId,
  });

  revalidatePath("/admin/members");
}

export async function updateMember(
  id: number,
  data: {
    memberNumber: string;
    firstName: string;
    lastName: string;
    username: string;
    email: string;
    class: string;
    gender?: string;
    dateOfBirth?: string;
    handicap?: string;
    bagNumber?: string;
  },
) {
  const orgId = await getOrganizationId();
  await db
    .update(members)
    .set(data)
    .where(and(eq(members.id, id), eq(members.clerkOrgId, orgId)));

  revalidatePath("/admin/members");
}

export async function deleteMember(id: number) {
  const orgId = await getOrganizationId();
  await db
    .delete(members)
    .where(and(eq(members.id, id), eq(members.clerkOrgId, orgId)));

  revalidatePath("/admin/members");
}

export async function searchMembersAction(query: string = "") {
  const { results } = await searchMembers(query, 1, 10);
  return results.map((member) => ({
    ...member,
    dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
    createdAt: new Date(member.createdAt),
    updatedAt: member.updatedAt ? new Date(member.updatedAt) : null,
  }));
}
