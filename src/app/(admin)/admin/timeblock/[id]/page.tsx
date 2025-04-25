import { notFound } from "next/navigation";
import { TimeBlockMemberManager } from "~/components/timeblock/TimeBlockMemberManager";
import { getTimeBlockWithMembers } from "~/server/teesheet/data";
import { getTimeBlockGuests } from "~/server/guests/data";
import { getOrganizationTheme } from "~/server/config/data";

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

  const [timeBlock, timeBlockGuests, theme] = await Promise.all([
    getTimeBlockWithMembers(timeBlockId),
    getTimeBlockGuests(timeBlockId),
    getOrganizationTheme(),
  ]);

  if (!timeBlock) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <TimeBlockMemberManager
        timeBlock={timeBlock}
        timeBlockGuests={timeBlockGuests}
        theme={theme}
      />
    </div>
  );
}
