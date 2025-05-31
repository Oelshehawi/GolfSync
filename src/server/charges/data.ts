import { and, desc, eq, gte, lte, sql, or, ilike } from "drizzle-orm";
import { db } from "../db";
import { getOrganizationId } from "~/lib/auth";
import {
  powerCartCharges,
  generalCharges,
  members,
  guests,
} from "../db/schema";
import { formatCalendarDate } from "~/lib/utils";
import { alias } from "drizzle-orm/pg-core";

export interface ChargeFilters {
  startDate?: string;
  endDate?: string;
  search?: string;
  chargeType?: string;
  page?: number;
  pageSize?: number;
  charged?: boolean;
  memberId?: number;
  guestId?: number;
}

// Get pending power cart charges
export async function getPendingPowerCartCharges(date?: Date) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const memberTable = members;
  const splitMemberTable = alias(members, "split_members");

  const query = db
    .select({
      id: powerCartCharges.id,
      date: powerCartCharges.date,
      isMedical: powerCartCharges.isMedical,
      staffInitials: powerCartCharges.staffInitials,
      member: {
        id: memberTable.id,
        firstName: memberTable.firstName,
        lastName: memberTable.lastName,
        memberNumber: memberTable.memberNumber,
      },
      guest: {
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
      },
      splitWithMember: {
        id: sql<number>`split_members.id`,
        firstName: sql<string>`split_members.first_name`,
        lastName: sql<string>`split_members.last_name`,
        memberNumber: sql<string>`split_members.member_number`,
      },
    })
    .from(powerCartCharges)
    .leftJoin(memberTable, eq(powerCartCharges.memberId, memberTable.id))
    .leftJoin(guests, eq(powerCartCharges.guestId, guests.id))
    .leftJoin(
      splitMemberTable,
      eq(powerCartCharges.splitWithMemberId, splitMemberTable.id),
    )
    .where(
      and(
        eq(powerCartCharges.clerkOrgId, orgId),
        eq(powerCartCharges.charged, false),
        date ? eq(powerCartCharges.date, formatCalendarDate(date)) : undefined,
      ),
    )
    .orderBy(desc(powerCartCharges.date));

  return query;
}

// Get pending general charges
export async function getPendingGeneralCharges(date?: Date) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const memberTable = members;
  const sponsorMemberTable = alias(members, "sponsor_members");

  const query = db
    .select({
      id: generalCharges.id,
      date: generalCharges.date,
      chargeType: generalCharges.chargeType,
      paymentMethod: generalCharges.paymentMethod,
      staffInitials: generalCharges.staffInitials,
      member: {
        id: memberTable.id,
        firstName: memberTable.firstName,
        lastName: memberTable.lastName,
        memberNumber: memberTable.memberNumber,
      },
      guest: {
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
      },
      sponsorMember: {
        id: sql<number>`sponsor_members.id`,
        firstName: sql<string>`sponsor_members.first_name`,
        lastName: sql<string>`sponsor_members.last_name`,
        memberNumber: sql<string>`sponsor_members.member_number`,
      },
    })
    .from(generalCharges)
    .leftJoin(memberTable, eq(generalCharges.memberId, memberTable.id))
    .leftJoin(guests, eq(generalCharges.guestId, guests.id))
    .leftJoin(
      sponsorMemberTable,
      eq(generalCharges.sponsorMemberId, sponsorMemberTable.id),
    )
    .where(
      and(
        eq(generalCharges.clerkOrgId, orgId),
        eq(generalCharges.charged, false),
        date ? eq(generalCharges.date, formatCalendarDate(date)) : undefined,
      ),
    )
    .orderBy(desc(generalCharges.date));

  return query;
}

// Get charge history with filters
export async function getChargeHistory(filters: ChargeFilters) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  // Power cart charges
  const powerCartQuery = db
    .select({
      id: powerCartCharges.id,
      date: powerCartCharges.date,
      isMedical: powerCartCharges.isMedical,
      staffInitials: powerCartCharges.staffInitials,
      member: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
      },
      guest: {
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
      },
      splitWithMember: {
        id: sql<number>`split_members.id`,
        firstName: sql<string>`split_members.first_name`,
        lastName: sql<string>`split_members.last_name`,
        memberNumber: sql<string>`split_members.member_number`,
      },
    })
    .from(powerCartCharges)
    .leftJoin(members, eq(powerCartCharges.memberId, members.id))
    .leftJoin(guests, eq(powerCartCharges.guestId, guests.id))
    .leftJoin(
      alias(members, "split_members"),
      eq(powerCartCharges.splitWithMemberId, sql`split_members.id`),
    )
    .where(
      and(
        eq(powerCartCharges.clerkOrgId, orgId),
        filters.charged !== undefined
          ? eq(powerCartCharges.charged, filters.charged)
          : undefined,
        filters.memberId
          ? eq(powerCartCharges.memberId, filters.memberId)
          : undefined,
        filters.guestId
          ? eq(powerCartCharges.guestId, filters.guestId)
          : undefined,
        filters.startDate
          ? gte(powerCartCharges.date, formatCalendarDate(filters.startDate))
          : undefined,
        filters.endDate
          ? lte(powerCartCharges.date, formatCalendarDate(filters.endDate))
          : undefined,
      ),
    )
    .orderBy(desc(powerCartCharges.date));

  // General charges
  const generalQuery = db
    .select({
      id: generalCharges.id,
      date: generalCharges.date,
      chargeType: generalCharges.chargeType,
      paymentMethod: generalCharges.paymentMethod,
      staffInitials: generalCharges.staffInitials,
      member: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
      },
      guest: {
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
      },
      sponsorMember: {
        id: sql<number>`sponsor_members.id`,
        firstName: sql<string>`sponsor_members.first_name`,
        lastName: sql<string>`sponsor_members.last_name`,
        memberNumber: sql<string>`sponsor_members.member_number`,
      },
    })
    .from(generalCharges)
    .leftJoin(members, eq(generalCharges.memberId, members.id))
    .leftJoin(guests, eq(generalCharges.guestId, guests.id))
    .leftJoin(
      alias(members, "sponsor_members"),
      eq(generalCharges.sponsorMemberId, sql`sponsor_members.id`),
    )
    .where(
      and(
        eq(generalCharges.clerkOrgId, orgId),
        filters.charged !== undefined
          ? eq(generalCharges.charged, filters.charged)
          : undefined,
        filters.memberId
          ? eq(generalCharges.memberId, filters.memberId)
          : undefined,
        filters.guestId
          ? eq(generalCharges.guestId, filters.guestId)
          : undefined,
        filters.startDate
          ? gte(generalCharges.date, formatCalendarDate(filters.startDate))
          : undefined,
        filters.endDate
          ? lte(generalCharges.date, formatCalendarDate(filters.endDate))
          : undefined,
        filters.chargeType
          ? eq(generalCharges.chargeType, filters.chargeType)
          : undefined,
      ),
    )
    .orderBy(desc(generalCharges.date));

  const [powerCartResults, generalResults] = await Promise.all([
    powerCartQuery,
    generalQuery,
  ]);

  return {
    powerCartCharges: powerCartResults,
    generalCharges: generalResults,
  };
}

// Get pending charges count for notifications
export async function getPendingChargesCount() {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const [powerCartCount, generalCount] = await Promise.all([
    db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(powerCartCharges)
      .where(
        and(
          eq(powerCartCharges.clerkOrgId, orgId),
          eq(powerCartCharges.charged, false),
        ),
      ),
    db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(generalCharges)
      .where(
        and(
          eq(generalCharges.clerkOrgId, orgId),
          eq(generalCharges.charged, false),
        ),
      ),
  ]);

  const powerCartTotal = Number(powerCartCount[0]?.count) || 0;
  const generalTotal = Number(generalCount[0]?.count) || 0;

  return {
    powerCartCount: powerCartTotal,
    generalCount: generalTotal,
    total: powerCartTotal + generalTotal,
  };
}

export async function getFilteredCharges(filters: ChargeFilters) {
  const orgId = await getOrganizationId();
  if (!orgId) throw new Error("Organization not found");

  const pageSize = filters.pageSize || 10;
  const offset = ((filters.page || 1) - 1) * pageSize;

  // Base power cart query
  const powerCartQuery = db
    .select({
      id: powerCartCharges.id,
      date: powerCartCharges.date,
      isMedical: powerCartCharges.isMedical,
      staffInitials: powerCartCharges.staffInitials,
      member: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
      },
      guest: {
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
      },
      splitWithMember: {
        id: sql<number>`split_members.id`,
        firstName: sql<string>`split_members.first_name`,
        lastName: sql<string>`split_members.last_name`,
        memberNumber: sql<string>`split_members.member_number`,
      },
    })
    .from(powerCartCharges)
    .leftJoin(members, eq(powerCartCharges.memberId, members.id))
    .leftJoin(guests, eq(powerCartCharges.guestId, guests.id))
    .leftJoin(
      alias(members, "split_members"),
      eq(powerCartCharges.splitWithMemberId, sql`split_members.id`),
    )
    .where(
      and(
        eq(powerCartCharges.clerkOrgId, orgId),
        eq(powerCartCharges.charged, true),
        filters.startDate
          ? gte(powerCartCharges.date, formatCalendarDate(filters.startDate))
          : undefined,
        filters.endDate
          ? lte(powerCartCharges.date, formatCalendarDate(filters.endDate))
          : undefined,
        filters.search
          ? or(
              // Member name search
              ilike(members.firstName, `%${filters.search}%`),
              ilike(members.lastName, `%${filters.search}%`),
              // Guest name search
              ilike(guests.firstName, `%${filters.search}%`),
              ilike(guests.lastName, `%${filters.search}%`),
              // Split member name search
              sql<boolean>`split_members.first_name ILIKE ${`%${filters.search}%`}`,
              sql<boolean>`split_members.last_name ILIKE ${`%${filters.search}%`}`,
              // Staff initials search
              ilike(powerCartCharges.staffInitials, `%${filters.search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(powerCartCharges.date))
    .limit(pageSize)
    .offset(offset);

  // Base general charges query
  const generalQuery = db
    .select({
      id: generalCharges.id,
      date: generalCharges.date,
      chargeType: generalCharges.chargeType,
      paymentMethod: generalCharges.paymentMethod,
      staffInitials: generalCharges.staffInitials,
      member: {
        id: members.id,
        firstName: members.firstName,
        lastName: members.lastName,
        memberNumber: members.memberNumber,
      },
      guest: {
        id: guests.id,
        firstName: guests.firstName,
        lastName: guests.lastName,
      },
      sponsorMember: {
        id: sql<number>`sponsor_members.id`,
        firstName: sql<string>`sponsor_members.first_name`,
        lastName: sql<string>`sponsor_members.last_name`,
        memberNumber: sql<string>`sponsor_members.member_number`,
      },
    })
    .from(generalCharges)
    .leftJoin(members, eq(generalCharges.memberId, members.id))
    .leftJoin(guests, eq(generalCharges.guestId, guests.id))
    .leftJoin(
      alias(members, "sponsor_members"),
      eq(generalCharges.sponsorMemberId, sql`sponsor_members.id`),
    )
    .where(
      and(
        eq(generalCharges.clerkOrgId, orgId),
        eq(generalCharges.charged, true),
        filters.startDate
          ? gte(generalCharges.date, formatCalendarDate(filters.startDate))
          : undefined,
        filters.endDate
          ? lte(generalCharges.date, formatCalendarDate(filters.endDate))
          : undefined,
        filters.search
          ? or(
              // Member name search
              ilike(members.firstName, `%${filters.search}%`),
              ilike(members.lastName, `%${filters.search}%`),
              // Guest name search
              ilike(guests.firstName, `%${filters.search}%`),
              ilike(guests.lastName, `%${filters.search}%`),
              // Sponsor member name search
              sql<boolean>`sponsor_members.first_name ILIKE ${`%${filters.search}%`}`,
              sql<boolean>`sponsor_members.last_name ILIKE ${`%${filters.search}%`}`,
              // Staff initials and charge type search
              ilike(generalCharges.staffInitials, `%${filters.search}%`),
              ilike(generalCharges.chargeType, `%${filters.search}%`),
            )
          : undefined,
      ),
    )
    .orderBy(desc(generalCharges.date))
    .limit(pageSize)
    .offset(offset);

  // Get total counts for pagination
  const [powerCartTotal, generalTotal] = await Promise.all([
    db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(powerCartCharges)
      .where(
        and(
          eq(powerCartCharges.clerkOrgId, orgId),
          eq(powerCartCharges.charged, true),
        ),
      ),
    db
      .select({ count: sql<number>`cast(count(*) as integer)` })
      .from(generalCharges)
      .where(
        and(
          eq(generalCharges.clerkOrgId, orgId),
          eq(generalCharges.charged, true),
        ),
      ),
  ]);

  const [powerCartResults, generalResults] = await Promise.all([
    filters.chargeType === "general" ? [] : powerCartQuery,
    filters.chargeType === "power-cart" ? [] : generalQuery,
  ]);

  return {
    powerCartCharges: powerCartResults,
    generalCharges: generalResults,
    pagination: {
      total:
        Number(powerCartTotal[0]?.count || 0) +
        Number(generalTotal[0]?.count || 0),
      pageSize,
      currentPage: filters.page || 1,
    },
  };
}
