import { getMemberTeesheetDataWithRestrictions } from "~/server/members-teesheet-client/data";
import TeesheetClient from "../../../../components/member-teesheet-client/TeesheetClient";
import { auth } from "@clerk/nextjs/server";
import type { Member } from "~/app/types/MemberTypes";
import { formatCalendarDate, preserveDate } from "~/lib/utils";

interface PageProps {
  searchParams: Promise<{ date?: string | string[] }>;
}

export default async function MemberTeesheetPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { sessionClaims } = await auth();
  const userId = sessionClaims?.userId;

  // Get today's date in YYYY-MM-DD format
  const today = formatCalendarDate(new Date());

  // Use the date param if valid, otherwise use today
  const dateParam = params?.date;
  const dateString = typeof dateParam === "string" ? dateParam : today;

  // Create a Date object that preserves the intended date
  const date = preserveDate(dateString) || new Date();

  // Fetch teesheet data server-side with pre-checked restrictions
  const {
    teesheet,
    config,
    timeBlocks = [],
    member,
  } = await getMemberTeesheetDataWithRestrictions(date, userId as string);

  return (
    <TeesheetClient
      teesheet={teesheet}
      config={config}
      timeBlocks={timeBlocks}
      member={member as Member}
      selectedDate={dateString}
    />
  );
}
