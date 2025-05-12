import { Suspense } from "react";
import EventsList from "../../../../components/events/admin/EventsList";
import { PageHeader } from "~/components/ui/page-header";
import { getEvents } from "~/server/events/data";
import { EventDialog } from "~/components/events/admin/EventDialog";
import { EventType, EventWithRegistrations } from "~/app/types/events";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const eventsFromServer = await getEvents({ includeRegistrations: true });

  // Transform server events to match the expected EventWithRegistrations type
  const events: EventWithRegistrations[] = eventsFromServer.map((event) => ({
    ...event,
    eventType: event.eventType as EventType,
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
  }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Events"
        description="Manage tournaments, dinners, social events and more"
      />

      <div className="flex justify-end">
        <EventDialog />
      </div>

      <Suspense fallback={<div>Loading events...</div>}>
        <EventsList initialEvents={events} />
      </Suspense>
    </div>
  );
}
