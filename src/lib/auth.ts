"use server";
import { auth } from "@clerk/nextjs/server";

/**
 * Get the current user session
 * Single-tenant mode - no organization logic needed
 */
export async function getCurrentUser() {
  const session = await auth();

  if (!session.userId) {
    throw new Error("Not authenticated");
  }

  return session;
}

/**
 * Get current user ID
 */
export async function getCurrentUserId() {
  const session = await getCurrentUser();
  return session.userId;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated() {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}
