import { FinishPageClient } from "~/components/pace-of-play/FinishPageClient";
import { getTimeBlocksAtFinish } from "~/server/pace-of-play/data";

export default async function FinishPage() {
  const timeBlocksData = await getTimeBlocksAtFinish(new Date(), true);

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <FinishPageClient initialTimeBlocks={timeBlocksData} />
    </div>
  );
}
