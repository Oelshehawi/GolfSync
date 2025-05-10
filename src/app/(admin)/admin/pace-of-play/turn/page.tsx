import { TurnPageClient } from "~/components/pace-of-play/TurnPageClient";
import { getTimeBlocksAtTurn } from "~/server/pace-of-play/data";

export default async function TurnPage() {
  const timeBlocks = await getTimeBlocksAtTurn(new Date());

  return (
    <div className="container mx-auto max-w-4xl py-6">
      <TurnPageClient initialTimeBlocks={timeBlocks} />
    </div>
  );
}
