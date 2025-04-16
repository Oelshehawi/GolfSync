import {
  getOrCreateTeesheet,
  getTimeBlocksForTeesheet,
} from "~/app/teesheet/data";
import { TeesheetView } from "~/components/teesheet/TeesheetView";
import { TeesheetHeader } from "~/components/teesheet/TeesheetHeader";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";

export default async function AdminPage() {
  const today = new Date();
  const teesheet = await getOrCreateTeesheet(today);

  if (!teesheet) {
    return <div>Failed to load teesheet</div>;
  }

  const timeBlocks = await getTimeBlocksForTeesheet(teesheet.id);

  return (
    <>
      <TeesheetHeader date={today} />
      <Card>
        <CardHeader>
          <CardTitle>Teesheet for {format(today, "MMMM d, yyyy")}</CardTitle>
        </CardHeader>
        <CardContent>
          <TeesheetView teesheet={teesheet} timeBlocks={timeBlocks} />
        </CardContent>
      </Card>
    </>
  );
}
