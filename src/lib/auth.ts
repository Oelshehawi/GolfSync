'use server'
import { auth } from "@clerk/nextjs/server";

export async function getOrganizationId() {
  const session = await auth();
  if (!session.orgId) {
    throw new Error("No organization ID found");
  }
  return session.orgId;
}
