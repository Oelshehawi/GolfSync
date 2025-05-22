import { notFound } from "next/navigation";
import { getTimeBlockWithMembers } from "~/server/teesheet/data";
import { getTimeBlockGuests } from "~/server/guests/data";
import type { TimeBlockGuest } from "~/app/types/GuestTypes";
import { TimeBlockMemberManager } from "~/components/timeblock/TimeBlockMemberManager";

interface TimeBlockPageProps {
  params: {
    id: string;
  };
}

export default async function TimeBlockPage({ params }: TimeBlockPageProps) {
  const { id } = await params;
  const timeBlockId = parseInt(id);

  if (isNaN(timeBlockId)) {
    notFound();
  }

  const [timeBlock, timeBlockGuestsData] = await Promise.all([
    getTimeBlockWithMembers(timeBlockId),
    getTimeBlockGuests(timeBlockId),
  ]);

  if (!timeBlock) {
    notFound();
  }

  // Transform the timeBlockGuests data to match the expected TimeBlockGuest type
  const timeBlockGuests: TimeBlockGuest[] = timeBlockGuestsData.map((item) => ({
    id: item.guestId,
    firstName: item.guest.firstName,
    lastName: item.guest.lastName,
    email: item.guest.email,
    phone: item.guest.phone,
    handicap: item.guest.handicap,
    checkedIn: item.checkedIn || false,
    checkedInAt: item.checkedInAt,
    invitedByMember: item.invitedByMember
      ? {
          id: item.invitedByMember.id,
          firstName: item.invitedByMember.firstName,
          lastName: item.invitedByMember.lastName,
          memberNumber: item.invitedByMember.memberNumber,
        }
      : undefined,
  }));

  return (
    <div className="container mx-auto p-6">
      <TimeBlockMemberManager
        key={`timeblock-${timeBlockId}`}
        timeBlock={timeBlock}
        timeBlockGuests={timeBlockGuests}
      />
    </div>
  );
}
