import { auth } from "@clerk/nextjs/server";

/**
 * Get authenticated user session - reusable across server components and data functions
 * @returns {Promise<{userId: string, sessionClaims: any}>}
 * @throws {Error} If user is not authenticated
 */
export async function getAuthenticatedUser() {
  const { userId, sessionClaims } = await auth();

  if (!userId) {
    throw new Error("Not authenticated");
  }

  return { userId, sessionClaims };
}

/**
 * Check if user is authenticated (non-throwing version)
 * @returns {Promise<boolean>}
 */
export async function isUserAuthenticated(): Promise<boolean> {
  try {
    await getAuthenticatedUser();
    return true;
  } catch {
    return false;
  }
}
