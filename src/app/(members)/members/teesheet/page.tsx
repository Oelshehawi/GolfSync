import { getMemberTeesheetDataWithRestrictions } from "~/server/members-teesheet-client/data";
import TeesheetClient from "../../../../components/member-teesheet-client/TeesheetClient";
import { parse } from "date-fns";
import { auth } from "@clerk/nextjs/server";
import { Member } from "~/app/types/MemberTypes";
import { formatCalendarDate } from "~/lib/utils";

interface PageProps {
  searchParams: Promise<{ date?: string | string[] }>;
}

export default async function MemberTeesheetPage({ searchParams }: PageProps) {
  const params = await searchParams;

  const { sessionClaims } = await auth();

  const userId = sessionClaims?.userId;

  // Get the date parameter, defaulting to today's date in yyyy-MM-dd format
  const todayString = formatCalendarDate(new Date());

  // Safely extract date string
  const dateParam = params?.date;
  const dateString = typeof dateParam === "string" ? dateParam : todayString;

  // Parse date for server data fetching (needed for DB queries)
  const date = parse(dateString as string, "yyyy-MM-dd", new Date());

  // Fetch teesheet data server-side with pre-checked restrictions
  const teesheetData = await getMemberTeesheetDataWithRestrictions(
    date,
    userId as string,
  );

  // Split out the data for more explicit prop passing
  const { teesheet, config, member } = teesheetData;
  const timeBlocks = (teesheetData.timeBlocks || []).sort((a, b) => {
    return (a.sortOrder || 0) - (b.sortOrder || 0);
  });

  return (
    <TeesheetClient
      teesheet={teesheet}
      config={config}
      timeBlocks={timeBlocks}
      member={member as Member}
      selectedDate={dateString as string}
    />
  );
}
