import { db } from "~/server/db";
import { events, eventRegistrations } from "~/server/db/schema";
import { eq, sql, and, desc, asc } from "drizzle-orm";
import { getOrganizationId } from "~/lib/auth";

// Helper type for event results
export type EventWithDetails = {
  id: number;
  name: string;
  description: string;
  eventType: string;
  startDate: Date;
  endDate: Date;
  startTime?: string | null | undefined;
  endTime?: string | null;
  location?: string | null;
  capacity?: number | null;
  requiresApproval: boolean;
  registrationDeadline?: Date | null;
  isActive: boolean;
  createdAt: Date;
  updatedAt?: Date | null;
  details?: {
    format?: string | null;
    rules?: string | null;
    prizes?: string | null;
    entryFee?: number | null;
    additionalInfo?: string | null;
  } | null;
  registrationsCount?: number;
  pendingRegistrationsCount?: number;
  registrations?: any[]; // Registration data for admin use
};

// Type for database event registration
type EventRegistration = {
  id: number;
  eventId: number;
  memberId: number;
  status: string;
  notes?: string;
  createdAt: Date;
  member: {
    id: number;
    firstName: string;
    lastName: string;
    memberNumber: string;
    [key: string]: any;
  };
};

// Get all events
export async function getEvents(options?: {
  includeRegistrations?: boolean;
}): Promise<EventWithDetails[]> {
  const orgId = await getOrganizationId();

  const rows = await db.query.events.findMany({
    where: eq(events.clerkOrgId, orgId),
    with: {
      details: true,
    },
    orderBy: [desc(events.startDate)],
  });

  // Get registration counts for each event
  const results = await Promise.all(
    rows.map(async (event) => {
      // Get total registrations count
      const registrationsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.clerkOrgId, orgId),
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
            eq(eventRegistrations.clerkOrgId, orgId),
            eq(eventRegistrations.status, "PENDING"),
          ),
        )
        .then((res) => res[0]?.count || 0);

      // Get registrations if needed for admin
      let eventRegistrationsData: EventRegistration[] = [];
      if (options?.includeRegistrations) {
        eventRegistrationsData = await getEventRegistrations(event.id);
      }

      // Convert date strings to Date objects
      return {
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        registrationDeadline: event.registrationDeadline
          ? new Date(event.registrationDeadline)
          : event.registrationDeadline,
        registrationsCount,
        pendingRegistrationsCount,
        registrations: options?.includeRegistrations
          ? eventRegistrationsData
          : undefined,
      } as EventWithDetails;
    }),
  );

  return results;
}

// Get upcoming events
export async function getUpcomingEvents(
  limit: number = 5,
): Promise<EventWithDetails[]> {
  const orgId = await getOrganizationId();
  const today = new Date();

  // SQL comparison works with an ISO date string without the time component
  const todayString = today.toISOString().split("T")[0]; // Format as YYYY-MM-DD

  const rows = await db.query.events.findMany({
    where: and(
      eq(events.clerkOrgId, orgId),
      eq(events.isActive, true),
      sql`${events.startDate} >= ${todayString}`, // Using SQL template for date comparison
    ),
    with: {
      details: true,
    },
    orderBy: [asc(events.startDate)],
    limit,
  });

  // Get registration counts for each event
  const results = await Promise.all(
    rows.map(async (event) => {
      const registrationsCount = await db
        .select({ count: sql<number>`count(*)` })
        .from(eventRegistrations)
        .where(
          and(
            eq(eventRegistrations.eventId, event.id),
            eq(eventRegistrations.clerkOrgId, orgId),
          ),
        )
        .then((res) => res[0]?.count || 0);

      // Convert date strings to Date objects
      return {
        ...event,
        startDate: new Date(event.startDate),
        endDate: new Date(event.endDate),
        registrationDeadline: event.registrationDeadline
          ? new Date(event.registrationDeadline)
          : event.registrationDeadline,
        registrationsCount,
      } as EventWithDetails;
    }),
  );

  return results;
}

// Get a single event by ID
export async function getEventById(
  eventId: number,
): Promise<EventWithDetails | null> {
  const orgId = await getOrganizationId();

  const event = await db.query.events.findFirst({
    where: and(eq(events.id, eventId), eq(events.clerkOrgId, orgId)),
    with: {
      details: true,
    },
  });

  if (!event) return null;

  // Get registration count
  const registrationsCount = await db
    .select({ count: sql<number>`count(*)` })
    .from(eventRegistrations)
    .where(
      and(
        eq(eventRegistrations.eventId, eventId),
        eq(eventRegistrations.clerkOrgId, orgId),
      ),
    )
    .then((res) => res[0]?.count || 0);

  // Convert date strings to Date objects
  return {
    ...event,
    startDate: new Date(event.startDate),
    endDate: new Date(event.endDate),
    registrationDeadline: event.registrationDeadline
      ? new Date(event.registrationDeadline)
      : event.registrationDeadline,
    registrationsCount,
  } as EventWithDetails;
}

// Get event registrations
export async function getEventRegistrations(
  eventId: number,
): Promise<EventRegistration[]> {
  const orgId = await getOrganizationId();

  const registrations = await db.query.eventRegistrations.findMany({
    where: and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.clerkOrgId, orgId),
    ),
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
  const orgId = await getOrganizationId();

  const registration = await db.query.eventRegistrations.findFirst({
    where: and(
      eq(eventRegistrations.eventId, eventId),
      eq(eventRegistrations.memberId, memberId),
      eq(eventRegistrations.clerkOrgId, orgId),
    ),
  });

  return !!registration;
}

// Get a member's event registrations
export async function getMemberEventRegistrations(memberId: number) {
  const orgId = await getOrganizationId();

  const registrations = await db.query.eventRegistrations.findMany({
    where: and(
      eq(eventRegistrations.memberId, memberId),
      eq(eventRegistrations.clerkOrgId, orgId),
    ),
    with: {
      event: true,
    },
    orderBy: [desc(eventRegistrations.createdAt)],
  });

  return registrations;
}
