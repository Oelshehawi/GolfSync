"use server";

import { db } from "~/server/db";
import { eq, and, or, isNull } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";
import { timeblockRestrictions, members } from "~/server/db/schema";
import {
  formatCalendarDate,
  formatDateToYYYYMMDD,
  formatDisplayDate,
  formatDisplayTime,
} from "~/lib/utils";
import { format } from "date-fns";

type ResultType<T> = { success: false; error: string } | T;

// Get all timeblock restrictions for the current organization
export async function getTimeblockRestrictions(): Promise<ResultType<any[]>> {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return { success: false, error: "No organization selected" };
    }

    const restrictions = await db.query.timeblockRestrictions.findMany({
      where: eq(timeblockRestrictions.clerkOrgId, orgId),
      orderBy: [
        timeblockRestrictions.restrictionCategory,
        timeblockRestrictions.name,
      ],
    });

    return restrictions;
  } catch (error) {
    console.error("Error getting timeblock restrictions:", error);
    return { success: false, error: "Failed to get restrictions" };
  }
}

/**
 * Get a list of all unique member classes in the organization
 */
export async function getMemberClasses(): Promise<ResultType<string[]>> {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return { success: false, error: "No organization selected" };
    }

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

// Get timeblock restrictions by category
export async function getTimeblockRestrictionsByCategory(
  category: "MEMBER_CLASS" | "GUEST" | "COURSE_AVAILABILITY",
): Promise<ResultType<any[]>> {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return { success: false, error: "No organization selected" };
    }

    const restrictions = await db.query.timeblockRestrictions.findMany({
      where: and(
        eq(timeblockRestrictions.clerkOrgId, orgId),
        eq(timeblockRestrictions.restrictionCategory, category),
      ),
      orderBy: [timeblockRestrictions.name],
    });

    return restrictions;
  } catch (error) {
    console.error("Error getting timeblock restrictions by category:", error);
    return { success: false, error: "Failed to get restrictions" };
  }
}

// Get timeblock restriction by ID
export async function getTimeblockRestrictionById(
  id: number,
): Promise<ResultType<any>> {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return { success: false, error: "No organization selected" };
    }

    const restriction = await db.query.timeblockRestrictions.findFirst({
      where: and(
        eq(timeblockRestrictions.id, id),
        eq(timeblockRestrictions.clerkOrgId, orgId),
      ),
    });

    if (!restriction) {
      return { success: false, error: "Restriction not found" };
    }

    return restriction;
  } catch (error) {
    console.error("Error getting timeblock restriction by ID:", error);
    return { success: false, error: "Failed to get restriction" };
  }
}

/**
 * Check restrictions for multiple timeblocks in a batch to improve performance
 */
export async function checkBatchTimeblockRestrictions(params: {
  timeBlocks: Array<{
    id: number;
    startTime: string; // Updated to only accept string (HH:MM format)
    date: string; // Add date parameter in YYYY-MM-DD format
  }>;
  memberId?: number;
  memberClass?: string;
  guestId?: number;
}): Promise<
  ResultType<
    Array<{
      timeBlockId: number;
      hasViolations: boolean;
      violations: any[];
      preferredReason: string;
    }>
  >
> {
  try {
    const orgId = await getOrganizationId();
    if (!orgId) {
      return { success: false, error: "No organization selected" };
    }

    const { timeBlocks, memberId, memberClass, guestId } = params;
    const results: Array<{
      timeBlockId: number;
      hasViolations: boolean;
      violations: any[];
      preferredReason: string;
    }> = [];

    // Fetch all restrictions upfront to minimize database queries
    const courseRestrictionsResult = await getTimeblockRestrictionsByCategory(
      "COURSE_AVAILABILITY",
    );
    if ("error" in courseRestrictionsResult) {
      return { success: false, error: courseRestrictionsResult.error };
    }
    const courseRestrictions = courseRestrictionsResult.filter(
      (r) => r.isActive,
    );

    // Get member class restrictions if needed
    let memberRestrictions: any[] = [];
    if (memberId && memberClass) {
      const memberRestrictionsResult =
        await getTimeblockRestrictionsByCategory("MEMBER_CLASS");
      if ("error" in memberRestrictionsResult) {
        return { success: false, error: memberRestrictionsResult.error };
      }
      memberRestrictions = memberRestrictionsResult.filter(
        (r) => r.isActive && (!r.memberClass || r.memberClass === memberClass),
      );
    }

    // Get guest restrictions if needed
    let guestRestrictions: any[] = [];
    if (guestId) {
      const guestRestrictionsResult =
        await getTimeblockRestrictionsByCategory("GUEST");
      if ("error" in guestRestrictionsResult) {
        return { success: false, error: guestRestrictionsResult.error };
      }
      guestRestrictions = guestRestrictionsResult.filter((r) => r.isActive);
    }

    // Process each timeblock against the pre-fetched restrictions
    for (const timeBlock of timeBlocks) {
      const violations: any[] = [];
      const bookingTime = timeBlock.startTime; // HH:MM format
      const bookingDateStr = timeBlock.date; // Use the provided date string

      // Parse date to get day of week - ensure correct UTC handling
      // Use the same date parsing approach as in getConfigForDate
      if (!bookingDateStr) {
        console.error("Missing booking date string");
        continue; // Skip this timeblock
      }

      const dateParts = bookingDateStr.split("-");
      if (dateParts.length !== 3) {
        console.error("Invalid date format:", bookingDateStr);
        continue; // Skip this timeblock
      }

      const year = parseInt(dateParts[0] || "0", 10);
      const month = parseInt(dateParts[1] || "0", 10) - 1; // JS months are 0-indexed
      const day = parseInt(dateParts[2] || "0", 10);

      // Create date with explicit year/month/day to avoid timezone issues
      const bookingDate = new Date(year, month, day);
      const dayOfWeek = bookingDate.getDay(); // 0=Sunday, 1=Monday, etc.

      // Check course availability restrictions
      for (const restriction of courseRestrictions) {
        if (restriction.startDate && restriction.endDate) {
          // Convert restriction dates to YYYY-MM-DD format
          const startDateStr = formatDateToYYYYMMDD(restriction.startDate);
          const endDateStr = formatDateToYYYYMMDD(restriction.endDate);

          // Check if the BOOKING date falls within the restriction period
          if (bookingDateStr >= startDateStr && bookingDateStr <= endDateStr) {
            // Format dates directly from the strings to avoid timezone issues
            const startYear = parseInt(startDateStr.substring(0, 4));
            const startMonth = parseInt(startDateStr.substring(5, 7)) - 1; // 0-indexed
            const startDay = parseInt(startDateStr.substring(8, 10));

            const endYear = parseInt(endDateStr.substring(0, 4));
            const endMonth = parseInt(endDateStr.substring(5, 7)) - 1; // 0-indexed
            const endDay = parseInt(endDateStr.substring(8, 10));

            const displayStartDate = new Date(startYear, startMonth, startDay);
            const displayEndDate = new Date(endYear, endMonth, endDay);

            const startDateFormatted = format(
              displayStartDate,
              "MMMM do, yyyy",
            );
            const endDateFormatted = format(displayEndDate, "MMMM do, yyyy");

            violations.push({
              restrictionId: restriction.id,
              restrictionName: restriction.name,
              restrictionDescription: restriction.description,
              restrictionCategory: "COURSE_AVAILABILITY",
              type: "AVAILABILITY",
              message: `Course is restricted (${restriction.name}) from ${startDateFormatted} to ${endDateFormatted}`,
              canOverride: restriction.canOverride,
            });
          }
        }
      }

      // Check member class restrictions
      if (memberId && memberClass) {
        for (const restriction of memberRestrictions) {
          if (restriction.restrictionType === "TIME") {
            // Check day of week
            if (restriction.daysOfWeek?.includes(dayOfWeek)) {
              // Check time range
              if (
                bookingTime >= (restriction.startTime || "00:00") &&
                bookingTime <= (restriction.endTime || "23:59")
              ) {
                // Check date range if applicable
                let dateRangeApplies = true;
                if (restriction.startDate && restriction.endDate) {
                  const startDateStr = formatDateToYYYYMMDD(
                    restriction.startDate,
                  );
                  const endDateStr = formatDateToYYYYMMDD(restriction.endDate);
                  dateRangeApplies =
                    bookingDateStr >= startDateStr &&
                    bookingDateStr <= endDateStr;
                }

                if (dateRangeApplies) {
                  violations.push({
                    restrictionId: restriction.id,
                    restrictionName: restriction.name,
                    restrictionDescription: restriction.description,
                    restrictionCategory: "MEMBER_CLASS",
                    memberClass,
                    type: "TIME",
                    message: `Booking time (${formatDisplayTime(bookingTime)}) is within restricted hours (${restriction.startTime ? formatDisplayTime(restriction.startTime) : "00:00"} - ${restriction.endTime ? formatDisplayTime(restriction.endTime) : "23:59"})`,
                    canOverride: restriction.canOverride,
                  });
                }
              }
            }
          }
        }
      }

      // Check guest restrictions
      if (guestId) {
        for (const restriction of guestRestrictions) {
          if (restriction.restrictionType === "TIME") {
            if (restriction.daysOfWeek?.includes(dayOfWeek)) {
              if (
                bookingTime >= (restriction.startTime || "00:00") &&
                bookingTime <= (restriction.endTime || "23:59")
              ) {
                let dateRangeApplies = true;
                if (restriction.startDate && restriction.endDate) {
                  const startDateStr = formatDateToYYYYMMDD(
                    restriction.startDate,
                  );
                  const endDateStr = formatDateToYYYYMMDD(restriction.endDate);
                  dateRangeApplies =
                    bookingDateStr >= startDateStr &&
                    bookingDateStr <= endDateStr;
                }

                if (dateRangeApplies) {
                  violations.push({
                    restrictionId: restriction.id,
                    restrictionName: restriction.name,
                    restrictionDescription: restriction.description,
                    restrictionCategory: "GUEST",
                    type: "TIME",
                    message: `Guest booking time (${formatDisplayTime(bookingTime)}) is within restricted hours (${restriction.startTime ? formatDisplayTime(restriction.startTime) : "00:00"} - ${restriction.endTime ? formatDisplayTime(restriction.endTime) : "23:59"})`,
                    canOverride: restriction.canOverride,
                  });
                }
              }
            }
          }
        }
      }

      // Add the prepared results for this timeblock
      const timeBlockViolations = violations.length > 0;
      const preferredReason = timeBlockViolations
        ? violations[0].description && violations[0].description.trim() !== ""
          ? violations[0].description
          : violations[0].message
        : "";

      results.push({
        timeBlockId: timeBlock.id,
        hasViolations: timeBlockViolations,
        violations,
        preferredReason,
      });
    }

    return results;
  } catch (error) {
    console.error("Error checking batch timeblock restrictions:", error);
    return { success: false, error: "Failed to check restrictions" };
  }
}
