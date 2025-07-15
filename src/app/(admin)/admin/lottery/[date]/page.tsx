import { redirect } from "next/navigation";
import { isAfter, isBefore, startOfDay } from "date-fns";
import { PageHeader } from "~/components/ui/page-header";
import { Button } from "~/components/ui/button";
import { ArrowLeft, Timer } from "lucide-react";
import Link from "next/link";
import { formatDate } from "~/lib/dates";
import { LotteryDashboard } from "~/components/lottery/LotteryDashboard";
import { getMembers } from "~/server/members/data";
import { getConfigForDate } from "~/server/settings/data";
import {
  getLotteryStatsForDate,
  getLotteryEntriesForDate,
  getAvailableTimeBlocksForDate,
  getActiveTimeRestrictionsForDate,
} from "~/server/lottery/data";
import { checkAndRunMonthlyMaintenance } from "~/server/lottery/maintenance-actions";
import { getTeesheetDataAction } from "~/server/teesheet/actions";

interface PageProps {
  params: {
    date: string;
  };
}

export default async function LotteryManagementPage({ params }: PageProps) {
  const { date } = await params;

  // Validate date format (should be YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(date)) {
    redirect("/admin");
  }

  const lotteryDate = new Date(date);
  const today = startOfDay(new Date());

  // Check if date is valid
  if (isNaN(lotteryDate.getTime())) {
    redirect("/admin");
  }

  // Check and run monthly maintenance if needed
  await checkAndRunMonthlyMaintenance();

  // Fetch all data at server level
  const [
    members,
    initialStats,
    lotteryEntries,
    timeBlocks,
    config,
    restrictions,
    teesheetData,
  ] = await Promise.all([
    getMembers(),
    getLotteryStatsForDate(date),
    getLotteryEntriesForDate(date),
    getAvailableTimeBlocksForDate(date),
    getConfigForDate(lotteryDate),
    getActiveTimeRestrictionsForDate(date),
    getTeesheetDataAction(date),
  ]);

  // Determine lottery status
  const isPastDate = isBefore(lotteryDate, today);
  const isToday = lotteryDate.getTime() === today.getTime();
  const isFutureDate = isAfter(lotteryDate, today);

  let status: "setup" | "active" | "closed";
  if (isPastDate) {
    status = "closed";
  } else if (isToday) {
    status = "active";
  } else {
    status = "setup";
  }

  return (
    <div className="container mx-auto max-w-7xl p-6">
      {/* Page Header */}
      <div className="mb-6">
        <div className="mb-4 flex items-center justify-between">
          <PageHeader
            title="Lottery Management"
            description={`Managing lottery entries for ${formatDate(date, "EEEE, MMMM do, yyyy")}`}
          />
          <div className="flex items-center gap-2">
            <Link href="/admin/lottery/member-profiles" passHref>
              <Button variant="outline">
                <Timer className="mr-2 h-4 w-4" />
                Member Profiles
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Main Lottery Dashboard */}
      <LotteryDashboard
        date={date}
        status={status}
        members={members}
        initialStats={initialStats}
        initialLotteryEntries={lotteryEntries}
        initialTimeBlocks={timeBlocks}
        config={config}
        restrictions={restrictions}
        teesheetData={teesheetData.success ? teesheetData.data : null}
      />
    </div>
  );
}
