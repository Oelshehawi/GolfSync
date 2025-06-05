"use server";

import { and, eq, sql } from "drizzle-orm";
import { db } from "../db";
import { getOrganizationId } from "~/lib/auth";
import {
  powerCartCharges,
  generalCharges,
  type PaymentMethod,
} from "../db/schema";
import { type PowerCartAssignmentData } from "~/app/types/ChargeTypes";
import { revalidatePath } from "next/cache";
import { formatCalendarDate } from "~/lib/utils";
import { getFilteredCharges, type ChargeFilters } from "./data";

// Create power cart charge
export async function createPowerCartCharge(data: PowerCartAssignmentData) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const charge = await db
    .insert(powerCartCharges)
    .values({
      ...data,
      date: formatCalendarDate(data.date),
      clerkOrgId: orgId,
    })
    .returning();

  revalidatePath("/admin/charges");
  return charge[0];
}

// Create general charge
export async function createGeneralCharge(data: any) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const charge = await db
    .insert(generalCharges)
    .values({
      ...data,
      date: formatCalendarDate(data.date),
      clerkOrgId: orgId,
    })
    .returning();

  revalidatePath("/admin/charges");
  return charge[0];
}

// Complete power cart charge
export async function completePowerCartCharge({
  id,
  staffInitials,
}: {
  id: number;
  staffInitials: string;
}) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const charge = await db
    .update(powerCartCharges)
    .set({ charged: true, staffInitials })
    .where(
      and(eq(powerCartCharges.id, id), eq(powerCartCharges.clerkOrgId, orgId)),
    )
    .returning();

  revalidatePath("/admin/charges");
  return charge[0];
}

// Complete general charge
export async function completeGeneralCharge({
  id,
  staffInitials,
  paymentMethod,
}: {
  id: number;
  staffInitials: string;
  paymentMethod: (typeof PaymentMethod.enumValues)[number];
}) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const charge = await db
    .update(generalCharges)
    .set({ charged: true, staffInitials, paymentMethod })
    .where(and(eq(generalCharges.id, id), eq(generalCharges.clerkOrgId, orgId)))
    .returning();

  revalidatePath("/admin/charges");
  return charge[0];
}

// Quick cart assignment from teesheet
export async function quickAssignPowerCart(data: PowerCartAssignmentData) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  // If staff initials are empty, use a default value
  const staffInitials = data.staffInitials || "STAFF";

  const charge = await db
    .insert(powerCartCharges)
    .values({
      ...data,
      staffInitials,
      date: formatCalendarDate(data.date),
      clerkOrgId: orgId,
    })
    .returning();

  revalidatePath("/admin/charges");
  revalidatePath("/admin"); // Revalidate teesheet
  return charge[0];
}

// Delete a power cart charge
export async function deletePowerCartCharge(id: number) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  await db
    .delete(powerCartCharges)
    .where(
      and(eq(powerCartCharges.id, id), eq(powerCartCharges.clerkOrgId, orgId)),
    );

  return { success: true };
}

// Delete a general charge
export async function deleteGeneralCharge(id: number) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  await db
    .delete(generalCharges)
    .where(
      and(eq(generalCharges.id, id), eq(generalCharges.clerkOrgId, orgId)),
    );

  return { success: true };
}

export async function fetchFilteredCharges(filters: ChargeFilters) {
  try {
    return await getFilteredCharges(filters);
  } catch (error) {
    console.error("Error fetching filtered charges:", error);
    throw new Error("Failed to fetch charges");
  }
}
