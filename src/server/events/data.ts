import "server-only";
import { db } from "~/server/db";
import { events, eventRegistrations, eventDetails } from "~/server/db/schema";
import {
  eq,
  sql,
  and,
  desc,
  asc,
  gte,
  inArray,
  or,
  isNull,
  type SQL,
} from "drizzle-orm";

import {
  type Event,
  type EventRegistration,
  type EventType,
  type EventWithRegistrations,
} from "~/app/types/events";
import { getBCToday } from "~/lib/dates";

// Database event type
type DbEvent = {
  id: number;
  name: string;
  description: string;
  eventType: string;
  startDate: string;
  endDate: string;
  startTime?: string | null;
  endTime?: string | null;
  location?: string | null;
  capacity?: number | null;
  requiresApproval: boolean;
  registrationDeadline?: string | null;
  isActive: boolean;
  memberClasses: string[];
  createdAt: Date;
  updatedAt?: Date | null;
  details?: {
    format?: string | null;
    rules?: string | null;
    prizes?: string | null;
    entryFee?: number | null;
    additionalInfo?: string | null;
  } | null;
};

// Get all events
export async function getEvents(options?: {
  includeRegistrations?: boolean;
}): Promise<EventWithRegistrations[]> {
  const rows = (await db.query.events.findMany({
    with: {
      details: true,
    },
    orderBy: [desc(events.startDate)],
  })) as DbEvent[];

  // Get registration counts for each event
  const results = await Promise.all(
    rows.map(async (event) => {
      // Get active registrations count (approved + pending only, not rejected)
      const registrationsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, event.id),
            or(
              eq(eventRegistrations.status, "APPROVED"),
              eq(eventRegistrations.status, "PENDING"),
            ),
          ),
        )
        .then((res) => res[0]?.count || 0);

      // Get pending registrations count
      const pendingRegistrationsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.status, "PENDING"),
          ),
        )
        .then((res) => res[0]?.count || 0);

      // Get registrations if needed for admin
      let eventRegistrationsData: EventRegistration[] = [];
      if (options?.includeRegistrations) {
        eventRegistrationsData = await getEventRegistrations(event.id);
      }

      return {
        ...event,
        eventType: event.eventType as EventType,
        registrationsCount,
        pendingRegistrationsCount,
        registrations: options?.includeRegistrations
          ? eventRegistrationsData
          : undefined,
      } as EventWithRegistrations;
    }),
  );

  return results;
}

// Get upcoming events
export async function getUpcomingEvents(
  limit = 5,
  memberClass?: string,
): Promise<Event[]> {
  const today = getBCToday();

  const memberClassCondition = memberClass
    ? sql`AND (member_classes IS NULL OR ${memberClass} = ANY(member_classes))`
    : sql``;

  const whereClause = sql`start_date >= ${today} ${memberClassCondition}`;

  const rows = (await db.query.events.findMany({
    where: whereClause,
    orderBy: [desc(events.startDate)],
    with: {
      details: true,
    },
    limit,
  })) as DbEvent[];

  // Get registration counts for each event
  const results = await Promise.all(
    rows.map(async (event) => {
      const registrationsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, event.id),
            or(
              eq(eventRegistrations.status, "APPROVED"),
              eq(eventRegistrations.status, "PENDING"),
            ),
          ),
        )
        .then((res) => res[0]?.count || 0);

      return {
        ...event,
        eventType: event.eventType as EventType,
        registrationsCount,
      } as Event;
    }),
  );

  return results;
}

// Get a single event by ID
export async function getEventById(eventId: number): Promise<Event | null> {
  const event = (await db.query.events.findFirst({
    where: eq(events.id, eventId),
    with: {
      details: true,
    },
  })) as DbEvent | null;

  if (!event) return null;

  // Get active registration count (approved + pending only)
  const registrationsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        or(
          eq(eventRegistrations.status, "APPROVED"),
          eq(eventRegistrations.status, "PENDING"),
        ),
      ),
    )
    .then((res) => res[0]?.count || 0);

  return {
    ...event,
    eventType: event.eventType as EventType,
    registrationsCount,
  } as Event;
}

// Get event registrations
export async function getEventRegistrations(
  eventId: number,
): Promise<EventRegistration[]> {
  const registrations = await db.query.eventRegistrations.findMany({
    where: and(eq(eventRegistrations.eventId, eventId)),
    with: {
      member: true,
    },
    orderBy: [desc(eventRegistrations.createdAt)],
  });

  return registrations as EventRegistration[];
}

// Check if a member is registered for an event
export async function isMemberRegistered(
  eventId: number,
  memberId: number,
): Promise<boolean> {
  const registration = await db.query.eventRegistrations.findFirst({
    where: and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.memberId, memberId),
    ),
  });

  return !!registration;
}

// Get a member's event registrations
export async function getMemberEventRegistrations(memberId: number) {
  const registrations = await db.query.eventRegistrations.findMany({
    where: and(eq(eventRegistrations.memberId, memberId)),
    with: {
      event: true,
    },
    orderBy: [desc(eventRegistrations.createdAt)],
  });

  return registrations;
}

export async function getEventsForClass(memberClass: string) {
  const whereClause = sql`(member_classes IS NULL OR ${memberClass} = ANY(member_classes))`;

  const dbEvents = (await db.query.events.findMany({
    where: whereClause,
    orderBy: [desc(events.startDate)],
    with: {
      details: true,
    },
  })) as DbEvent[];

  // Get registration counts for each event
  const results = await Promise.all(
    dbEvents.map(async (event) => {
      const registrationsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, event.id),
            or(
              eq(eventRegistrations.status, "APPROVED"),
              eq(eventRegistrations.status, "PENDING"),
            ),
          ),
        )
        .then((res) => res[0]?.count || 0);

      const pendingRegistrationsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.status, "PENDING"),
          ),
        )
        .then((res) => res[0]?.count || 0);

      return {
        ...event,
        eventType: event.eventType as EventType,
        registrationsCount,
        pendingRegistrationsCount,
      } as Event;
    }),
  );

  return results;
}
