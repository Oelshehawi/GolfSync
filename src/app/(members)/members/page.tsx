import { auth } from "@clerk/nextjs/server";
import {
  getMemberData,
  getUpcomingTeeTimes,
} from "~/server/members-teesheet-client/data";
import { getCourseInfo } from "~/server/settings/data";
import {
  getUpcomingEvents,
  getMemberEventRegistrations,
} from "~/server/events/data";
import { CourseInfoDisplay } from "~/components/course-info/CourseInfoDisplay";
import { UpcomingTeeTimes } from "~/components/member-teesheet-client/UpcomingTeeTimes";
import { Member } from "~/app/types/MemberTypes";
import { EventCard } from "~/components/events/EventCard";
import { Event, EventType } from "~/app/types/events";

export default async function MembersHome() {
  const { sessionClaims } = await auth();

  const member = await getMemberData(sessionClaims?.userId as string);

  // Get course info
  const courseInfo = await getCourseInfo();

  // Get upcoming tee times
  const upcomingTeeTimes = await getUpcomingTeeTimes(member as Member);

  const upcomingEvents = await getUpcomingEvents(3);

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
      {/* Course Info */}
      {courseInfo && !("success" in courseInfo) && (
        <CourseInfoDisplay data={courseInfo} />
      )}

      <div className="rounded-lg bg-white p-6 shadow-md sm:p-8">
        <h2 className="mb-4 text-xl font-semibold sm:text-2xl">
          Welcome,{" "}
          <span className="text-[var(--org-primary)]">
            {member?.firstName} {member?.lastName}
          </span>
          !
        </h2>
        <div className="space-y-6">
          <p className="text-gray-700">
            View your upcoming events, tee times, and more.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-3 text-lg font-medium">Upcoming Tee Times</h3>
          <UpcomingTeeTimes teeTimes={upcomingTeeTimes} />
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-4 text-lg font-medium">Upcoming Events</h3>
          {upcomingEvents.length > 0 ? (
            <div className="space-y-4">
              {upcomingEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={{
                    ...event,
                    eventType: event.eventType as EventType,
                    // Convert all nullable fields to undefined for the component
                    startTime: event.startTime ?? undefined,
                    endTime: event.endTime ?? undefined,
                    location: event.location ?? undefined,
                    capacity: event.capacity ?? undefined,
                    registrationDeadline:
                      event.registrationDeadline ?? undefined,
                    updatedAt: event.updatedAt ?? undefined,
                    details: event.details
                      ? {
                          format: event.details.format ?? undefined,
                          rules: event.details.rules ?? undefined,
                          prizes: event.details.prizes ?? undefined,
                          entryFee: event.details.entryFee ?? undefined,
                          additionalInfo:
                            event.details.additionalInfo ?? undefined,
                        }
                      : undefined,
                  }}
                  className="border-0 shadow-none"
                  isMember={true}
                  memberId={member?.id}
                  isRegistered={registrationMap.has(event.id)}
                  registrationStatus={registrationMap.get(event.id)}
                />
              ))}
            </div>
          ) : (
            <p className="text-gray-500">No upcoming events.</p>
          )}
        </div>
      </div>
    </div>
  );
}
