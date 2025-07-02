import { redirect } from "next/navigation";
import { isAfter, isBefore, startOfDay } from "date-fns";
import { getAuthenticatedUser } from "~/lib/auth-server";
import { PageHeader } from "~/components/ui/page-header";
import { Button } from "~/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { formatDate } from "~/lib/dates";
import { LotteryDashboard } from "~/components/lottery/LotteryDashboard";
import { getMembers } from "~/server/members/data";
import {
  getLotteryStatsForDate,
  getLotteryEntriesForDate,
  getAvailableTimeBlocksForDate,
} from "~/server/lottery/data";

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

  // Fetch all data at server level
  const [members, initialStats, lotteryEntries, timeBlocks] = await Promise.all(
    [
      getMembers(),
      getLotteryStatsForDate(date),
      getLotteryEntriesForDate(date),
      getAvailableTimeBlocksForDate(date),
    ],
  );

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
        <div className="mb-4 flex items-center gap-4">
          <PageHeader
            title="Lottery Management"
            description={`Managing lottery entries for ${formatDate(date, "EEEE, MMMM do, yyyy")}`}
          />
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
      />
    </div>
  );
}
