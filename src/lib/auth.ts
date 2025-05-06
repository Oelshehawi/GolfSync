"use server";
import { auth } from "@clerk/nextjs/server";
import { getPrivateMetadata } from "~/server/config/data";

/**
 * Get the organization ID from the session or user metadata
 */
export async function getOrganizationId() {
  const session = await auth();

  // First try to get organization ID from session
  if (session.orgId) {
    return session.orgId;
  }

  // If not in session, try to get from user's private metadata
  if (session.userId) {
    const metadata = await getPrivateMetadata(session.userId);
    const orgId = metadata?.organizationId as string | undefined;

    if (orgId) {
      return orgId;
    }
  }

  throw new Error("No organization ID found in session or user metadata");
}
