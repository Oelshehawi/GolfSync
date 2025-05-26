import { Suspense } from "react";
import EventsList from "../../../../components/events/admin/EventsList";
import { PageHeader } from "~/components/ui/page-header";
import { getEvents } from "~/server/events/data";
import { EventDialog } from "~/components/events/admin/EventDialog";
import { EventType } from "~/app/types/events";

export const dynamic = "force-dynamic";

export default async function EventsPage() {
  const events = await getEvents({ includeRegistrations: true });

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
