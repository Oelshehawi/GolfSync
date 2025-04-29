"use server";
import { auth, clerkClient } from "@clerk/nextjs/server";

/**
 * Get a user's public metadata
 * @param userId Optional user ID (defaults to current user)
 * @returns The user's public metadata or undefined
 */
export async function getPublicMetadata(userId?: string) {
  try {
    const session = await auth();
    const client = await clerkClient();

    // Use provided userId or current userId from session
    const targetUserId = userId || session.userId;

    if (!targetUserId) {
      return undefined;
    }

    const user = await client.users.getUser(targetUserId);
    return user.publicMetadata;
  } catch (error) {
    console.error("Error fetching public metadata:", error);
    return undefined;
  }
}

/**
 * Get a user's private metadata
 * @param userId Optional user ID (defaults to current user)
 * @returns The user's private metadata or undefined
 */
export async function getPrivateMetadata(userId?: string) {
  try {
    const session = await auth();
    const client = await clerkClient();

    // Use provided userId or current userId from session
    const targetUserId = userId || session.userId;

    if (!targetUserId) {
      return undefined;
    }

    const user = await client.users.getUser(targetUserId);
    return user.privateMetadata;
  } catch (error) {
    console.error("Error fetching private metadata:", error);
    return undefined;
  }
}

export async function getOrganizationTheme() {
  try {
    // Get current session
    const session = await auth();

    // Try to get org ID from session
    let orgId = session.orgId;

    // If not found in session, try user's private metadata
    if (!orgId && session.userId) {
      const client = await clerkClient();
      const user = await client.users.getUser(session.userId);
      orgId = user.privateMetadata.organizationId as string | undefined;
    }

    if (!orgId) {
      return undefined;
    }

    const client = await clerkClient();
    const organization = await client.organizations.getOrganization({
      organizationId: orgId,
    });

    const theme = organization.publicMetadata?.theme as
      | {
          primary: string;
          tertiary: string;
          secondary: string;
        }
      | undefined;

    return theme;
  } catch (error) {
    console.error("Error fetching organization theme:", error);
    return undefined;
  }
}
