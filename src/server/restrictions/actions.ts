"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "~/server/db";
import { and, eq } from "drizzle-orm";
import {
  restrictions,
  restrictionOverrides,
  guestBookingHistory,
  memberBookingHistory,
} from "~/server/db/schema";
import {
  RestrictionFormValues,
  RestrictionType,
  RestrictedEntityType,
} from "~/app/types/RestrictionTypes";
import { revalidatePath } from "next/cache";
import { getOrganizationId } from "~/lib/auth";
import { checkRestrictions } from "./data";

type ResultType<T = void> =
  | { success: true; data?: T }
  | { success: false; error: string };

// New server action to wrap checkRestrictions for client component usage
export async function checkRestrictionsAction(params: {
  memberId?: number;
  memberClass?: string;
  guestId?: number;
  bookingTime: Date;
}) {
  try {
    const results = await checkRestrictions(params);
    return results;
  } catch (error) {
    console.error("Error in checkRestrictionsAction:", error);
    return { success: false, error: "Failed to check restrictions" };
  }
}

export async function createRestriction(
  values: RestrictionFormValues,
): Promise<ResultType> {
  try {
    const orgId = await getOrganizationId();

    // Validate based on restriction type
    if (values.restrictionType === RestrictionType.TIME) {
      if (!values.startTime || !values.endTime || !values.daysOfWeek?.length) {
        return {
          success: false,
          error:
            "Time restriction requires start time, end time, and days of week",
        };
      }
    } else if (values.restrictionType === RestrictionType.FREQUENCY) {
      if (!values.maxCount || !values.periodDays) {
        return {
          success: false,
          error: "Frequency restriction requires max count and period days",
        };
      }
    }

    await db.insert(restrictions).values({
      clerkOrgId: orgId,
      entityType: values.entityType,
      entityId: values.entityId,
      name: values.name,
      description: values.description,
      restrictionType: values.restrictionType,
      isActive: values.isActive,

      // Time restriction fields
      startTime:
        values.restrictionType === RestrictionType.TIME
          ? values.startTime
          : null,
      endTime:
        values.restrictionType === RestrictionType.TIME ? values.endTime : null,
      daysOfWeek:
        values.restrictionType === RestrictionType.TIME
          ? values.daysOfWeek
          : null,

      // Frequency restriction fields
      maxCount:
        values.restrictionType === RestrictionType.FREQUENCY
          ? values.maxCount
          : null,
      periodDays:
        values.restrictionType === RestrictionType.FREQUENCY
          ? values.periodDays
          : null,
      applyCharge:
        values.restrictionType === RestrictionType.FREQUENCY
          ? values.applyCharge
          : null,
      chargeAmount:
        values.restrictionType === RestrictionType.FREQUENCY &&
        values.applyCharge
          ? values.chargeAmount
          : null,
    });

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error creating restriction:", error);
    return { success: false, error: "Failed to create restriction" };
  }
}

export async function updateRestriction(
  id: number,
  values: RestrictionFormValues,
): Promise<ResultType> {
  try {
    const orgId = await getOrganizationId();

    // Validate based on restriction type
    if (values.restrictionType === RestrictionType.TIME) {
      if (!values.startTime || !values.endTime || !values.daysOfWeek?.length) {
        return {
          success: false,
          error:
            "Time restriction requires start time, end time, and days of week",
        };
      }
    } else if (values.restrictionType === RestrictionType.FREQUENCY) {
      if (!values.maxCount || !values.periodDays) {
        return {
          success: false,
          error: "Frequency restriction requires max count and period days",
        };
      }
    }

    await db
      .update(restrictions)
      .set({
        entityType: values.entityType,
        entityId: values.entityId,
        name: values.name,
        description: values.description,
        restrictionType: values.restrictionType,
        isActive: values.isActive,

        // Time restriction fields
        startTime:
          values.restrictionType === RestrictionType.TIME
            ? values.startTime
            : null,
        endTime:
          values.restrictionType === RestrictionType.TIME
            ? values.endTime
            : null,
        daysOfWeek:
          values.restrictionType === RestrictionType.TIME
            ? values.daysOfWeek
            : null,

        // Frequency restriction fields
        maxCount:
          values.restrictionType === RestrictionType.FREQUENCY
            ? values.maxCount
            : null,
        periodDays:
          values.restrictionType === RestrictionType.FREQUENCY
            ? values.periodDays
            : null,
        applyCharge:
          values.restrictionType === RestrictionType.FREQUENCY
            ? values.applyCharge
            : null,
        chargeAmount:
          values.restrictionType === RestrictionType.FREQUENCY &&
          values.applyCharge
            ? values.chargeAmount
            : null,
      })
      .where(and(eq(restrictions.id, id), eq(restrictions.clerkOrgId, orgId)));

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error updating restriction:", error);
    return { success: false, error: "Failed to update restriction" };
  }
}

export async function deleteRestriction(id: number): Promise<ResultType> {
  try {
    const orgId = await getOrganizationId();

    await db
      .delete(restrictions)
      .where(and(eq(restrictions.id, id), eq(restrictions.clerkOrgId, orgId)));

    revalidatePath("/admin/settings");

    return { success: true };
  } catch (error) {
    console.error("Error deleting restriction:", error);
    return { success: false, error: "Failed to delete restriction" };
  }
}

export async function recordOverride(params: {
  restrictionId: number;
  entityType: RestrictedEntityType;
  entityId?: string | null;
  reason: string;
}): Promise<ResultType> {
  try {
    const orgId = await getOrganizationId();
    const { userId } = await auth();

    if (!userId) {
      return { success: false, error: "Unauthorized" };
    }

    await db.insert(restrictionOverrides).values({
      clerkOrgId: orgId,
      restrictionId: params.restrictionId,
      overriddenBy: userId,
      entityType: params.entityType,
      entityId: params.entityId || null,
      reason: params.reason,
    });

    return { success: true };
  } catch (error) {
    console.error("Error in recordOverride:", error);
    return { success: false, error: "Failed to record override" };
  }
}

export async function recordBooking(params: {
  memberId?: number;
  guestId?: number;
  bookingDate: Date;
  wasCharged?: boolean;
  chargeAmount?: number;
}): Promise<ResultType> {
  try {
    const orgId = await getOrganizationId();

    const {
      memberId,
      guestId,
      bookingDate,
      wasCharged = false,
      chargeAmount = null,
    } = params;

    if (memberId) {
      await db.insert(memberBookingHistory).values({
        clerkOrgId: orgId,
        memberId,
        bookingDate,
        wasCharged,
        chargeAmount,
      });
    } else if (guestId) {
      await db.insert(guestBookingHistory).values({
        clerkOrgId: orgId,
        guestId,
        bookingDate,
        wasCharged,
        chargeAmount,
      });
    } else {
      return {
        success: false,
        error: "Either memberId or guestId must be provided",
      };
    }

    return { success: true };
  } catch (error) {
    console.error("Error recording booking:", error);
    return { success: false, error: "Failed to record booking" };
  }
}
