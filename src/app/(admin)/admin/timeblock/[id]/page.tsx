import { notFound } from "next/navigation";
import { TimeBlockMemberManager } from "~/components/teesheet/TimeBlockMemberManager";
import { getTimeBlockWithMembers } from "~/app/teesheet/data";
import { searchMembers } from "~/app/teesheet/data";
import Link from "next/link";
import { Button } from "~/components/ui/button";
import { ChevronLeft, Calendar } from "lucide-react";
import { format } from "date-fns";

interface TimeBlockPageProps {
  params: {
    id: string;
  };
  searchParams?: {
    query?: string;
  };
}

export default async function TimeBlockPage({
  params,
  searchParams,
}: TimeBlockPageProps) {
  const { id } = await params;
  const query = (await searchParams)?.query || "";

  const timeBlockId = parseInt(id);
  if (isNaN(timeBlockId)) {
    notFound();
  }

  const timeBlock = await getTimeBlockWithMembers(timeBlockId);
  const searchResults = query ? await searchMembers(query) : [];

  if (!timeBlock) {
    notFound();
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4 border-b pb-4">
          <Link href="/admin">
            <Button variant="outline" size="sm">
              <ChevronLeft className="mr-2 h-4 w-4" />
              Back to Teesheet
            </Button>
          </Link>
          <div className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-gray-500" />
            <h1 className="text-2xl font-bold">
              Manage Time Block -{" "}
              {format(new Date(timeBlock.startTime), "h:mm a")}
            </h1>
          </div>
        </div>

        {/* Content */}
        <div className="rounded-xl bg-white shadow-sm">
          <TimeBlockMemberManager
            timeBlock={timeBlock}
            searchResults={searchResults}
          />
        </div>
      </div>
    </div>
  );
}
