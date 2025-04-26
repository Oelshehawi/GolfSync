import { db } from "~/server/db";
import { and, eq, isNull, or, gt } from "drizzle-orm";
import {
  restrictions,
  members,
  timeBlockMembers,
  timeBlockGuests,
  timeBlocks,
} from "~/server/db/schema";
import {
  RestrictedEntityType,
  RestrictionType,
  Restriction,
} from "~/app/types/RestrictionTypes";
import { getOrganizationId } from "~/lib/auth";
import { auth } from "@clerk/nextjs/server";

type ResultType<T> = { success: false; error: string } | T;

export async function getRestrictions(): Promise<ResultType<Restriction[]>> {
  try {
    const orgId = await getOrganizationId();

    const restrictionData = await db.query.restrictions.findMany({
      where: eq(restrictions.clerkOrgId, orgId),
      orderBy: [restrictions.entityType, restrictions.name],
    });

    // Convert the database records to our type system
    const typedRestrictions = restrictionData.map((restriction) => {
      if (restriction.restrictionType === "TIME") {
        return {
          ...restriction,
          restrictionType: RestrictionType.TIME,
          entityType: restriction.entityType as RestrictedEntityType,
          startTime: restriction.startTime!,
          endTime: restriction.endTime!,
          daysOfWeek: restriction.daysOfWeek || [],
        } as Restriction;
      } else {
        return {
          ...restriction,
          restrictionType: RestrictionType.FREQUENCY,
          entityType: restriction.entityType as RestrictedEntityType,
          maxCount: restriction.maxCount!,
          periodDays: restriction.periodDays!,
          applyCharge: restriction.applyCharge!,
          chargeAmount: restriction.chargeAmount,
        } as Restriction;
      }
    });

    return typedRestrictions;
  } catch (error) {
    console.error("Error getting restrictions:", error);
    return { success: false, error: "Failed to get restrictions" };
  }
}

export async function getRestrictionById(
  id: number,
): Promise<ResultType<Restriction>> {
  try {
    const orgId = await getOrganizationId();

    const restriction = await db.query.restrictions.findFirst({
      where: and(eq(restrictions.id, id), eq(restrictions.clerkOrgId, orgId)),
    });

    if (!restriction) {
      return { success: false, error: "Restriction not found" };
    }

    // Convert to typed restriction
    if (restriction.restrictionType === "TIME") {
      return {
        ...restriction,
        restrictionType: RestrictionType.TIME,
        entityType: restriction.entityType as RestrictedEntityType,
        startTime: restriction.startTime!,
        endTime: restriction.endTime!,
        daysOfWeek: restriction.daysOfWeek || [],
      } as Restriction;
    } else {
      return {
        ...restriction,
        restrictionType: RestrictionType.FREQUENCY,
        entityType: restriction.entityType as RestrictedEntityType,
        maxCount: restriction.maxCount!,
        periodDays: restriction.periodDays!,
        applyCharge: restriction.applyCharge!,
        chargeAmount: restriction.chargeAmount,
      } as Restriction;
    }
  } catch (error) {
    console.error("Error getting restriction by id:", error);
    return { success: false, error: "Failed to get restriction" };
  }
}

export async function getMemberClasses(): Promise<ResultType<string[]>> {
  try {
    const orgId = await getOrganizationId();

    const result = await db
      .selectDistinct({ class: members.class })
      .from(members)
      .where(eq(members.clerkOrgId, orgId));

    return result.map((row) => row.class);
  } catch (error) {
    console.error("Error getting member classes:", error);
    return { success: false, error: "Failed to get member classes" };
  }
}

// Check for restriction violations for a given member or guest
export async function checkRestrictions(params: {
  memberId?: number;
  memberClass?: string;
  guestId?: number;
  bookingTime: Date;
}): Promise<ResultType<{ hasViolations: boolean; violations: any[] }>> {
  try {
    const orgId = await getOrganizationId();

    const { memberId, memberClass, guestId, bookingTime } = params;
    const violations = [];

    // Determine what we're checking
    const entityType = guestId
      ? RestrictedEntityType.GUEST
      : RestrictedEntityType.CLASS;

    const entityId = guestId ? null : memberClass;

    // Get applicable restrictions
    const applicableRestrictions = await db.query.restrictions.findMany({
      where: and(
        eq(restrictions.clerkOrgId, orgId),
        eq(restrictions.isActive, true),
        eq(restrictions.entityType, entityType),
        or(
          isNull(restrictions.entityId),
          eq(restrictions.entityId, entityId ?? ""),
        ),
      ),
    });

    // Check each restriction
    for (const restriction of applicableRestrictions) {
      if (restriction.restrictionType === "TIME") {
        // Time-based restriction check
        const dayOfWeek = bookingTime.getDay(); // 0-6 for Sunday-Saturday
        const timeString = bookingTime.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
          hour12: false,
        });

        // Check if the current day is restricted
        if (restriction.daysOfWeek?.includes(dayOfWeek)) {
          // Check if the current time is within restricted hours
          if (
            timeString >= restriction.startTime! &&
            timeString <= restriction.endTime!
          ) {
            violations.push({
              restrictionId: restriction.id,
              restrictionName: restriction.name,
              restrictionDescription: restriction.description,
              entityType: restriction.entityType,
              entityId: restriction.entityId,
              violationType: RestrictionType.TIME,
              message: `Booking time (${timeString}) is within restricted hours (${restriction.startTime} - ${restriction.endTime})`,
              canOverride: true,
            });
          }
        }
      } else if (restriction.restrictionType === "FREQUENCY") {
        // Frequency-based restriction check
        const periodStartDate = new Date(bookingTime);
        periodStartDate.setDate(
          periodStartDate.getDate() - restriction.periodDays!,
        );

        let bookingCount = 0;

        if (guestId) {
          // Check guest booking history directly from timeBlockGuests
          const guestBookings = await db.query.timeBlockGuests.findMany({
            where: and(
              eq(timeBlockGuests.clerkOrgId, orgId),
              eq(timeBlockGuests.guestId, guestId),
            ),
            with: {
              timeBlock: true,
            },
          });

          // Filter bookings within the restriction period
          bookingCount = guestBookings.filter(
            (booking) => booking.timeBlock.startTime >= periodStartDate,
          ).length;
        } else if (memberId) {
          // Check member booking history directly from timeBlockMembers
          const memberBookings = await db.query.timeBlockMembers.findMany({
            where: and(
              eq(timeBlockMembers.clerkOrgId, orgId),
              eq(timeBlockMembers.memberId, memberId),
            ),
            with: {
              timeBlock: true,
            },
          });

          // Filter bookings within the restriction period
          bookingCount = memberBookings.filter(
            (booking) => booking.timeBlock.startTime >= periodStartDate,
          ).length;
        }

        if (bookingCount >= restriction.maxCount!) {
          const message = restriction.applyCharge
            ? `Maximum booking limit reached (${restriction.maxCount} per ${restriction.periodDays} days). Additional fee of ${restriction.chargeAmount} will be charged.`
            : `Maximum booking limit reached (${restriction.maxCount} per ${restriction.periodDays} days). Cannot book more within this period.`;

          violations.push({
            restrictionId: restriction.id,
            restrictionName: restriction.name,
            restrictionDescription: restriction.description,
            entityType: restriction.entityType,
            entityId: restriction.entityId,
            violationType: RestrictionType.FREQUENCY,
            message,
            canOverride: true,
            applyCharge: restriction.applyCharge,
            chargeAmount: restriction.chargeAmount,
          });
        }
      }
    }

    return {
      hasViolations: violations.length > 0,
      violations,
    };
  } catch (error) {
    console.error("Error checking restrictions:", error);
    return { success: false, error: "Failed to check restrictions" };
  }
}
