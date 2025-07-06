import { auth } from "@clerk/nextjs/server";
import { getMemberData } from "~/server/members-teesheet-client/data";
import {
  getEventsForClass,
  getMemberEventRegistrations,
} from "~/server/events/data";
import { EventCard } from "~/components/events/EventCard";
import { type EventType } from "~/app/types/events";
import { Member } from "~/app/types/MemberTypes";

export default async function EventsPage() {
  const { sessionClaims } = await auth();
  const member = await getMemberData(sessionClaims?.userId as string);

  // Get all events for the member's class
  const events = await getEventsForClass(member?.class!);

  // Get member registrations for these events
  const memberRegistrations = member?.id
    ? await getMemberEventRegistrations(member.id)
    : [];

  // Create a map of eventIds to registration status
  const registrationMap = new Map();
  memberRegistrations.forEach((reg: { eventId: number; status: string }) => {
    registrationMap.set(reg.eventId, reg.status);
  });

  return (
    <div className="flex flex-col gap-6 px-4 py-16 sm:px-12 md:pt-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Events</h1>
      </div>

      <div className="grid gap-6">
        {events.length > 0 ? (
          events.map((event) => (
            <EventCard
              key={event.id}
              event={{
                ...event,
                eventType: event.eventType,
                startTime: event.startTime ?? undefined,
                endTime: event.endTime ?? undefined,
                location: event.location ?? undefined,
                capacity: event.capacity ?? undefined,
                registrationDeadline: event.registrationDeadline ?? undefined,
                updatedAt: event.updatedAt ?? undefined,
                details: event.details
                  ? {
                      format: event.details.format ?? undefined,
                      rules: event.details.rules ?? undefined,
                      prizes: event.details.prizes ?? undefined,
                      entryFee: event.details.entryFee ?? undefined,
                      additionalInfo: event.details.additionalInfo ?? undefined,
                    }
                  : undefined,
                registrationsCount: event.registrationsCount,
                pendingRegistrationsCount: event.pendingRegistrationsCount,
              }}
              isMember={true}
              memberId={member?.id}
              isRegistered={registrationMap.has(event.id)}
              registrationStatus={registrationMap.get(event.id)}
              className="bg-white shadow-md"
              variant="compact"
            />
          ))
        ) : (
          <p className="text-gray-500">No events available.</p>
        )}
      </div>
    </div>
  );
}
