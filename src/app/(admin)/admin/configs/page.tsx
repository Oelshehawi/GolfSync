import { db } from "~/server/db";
import { ConfigManager } from "~/components/teesheet/ConfigManager";

export default async function ConfigsPage() {
  const configs = await db.query.teesheetConfigs.findMany({
    with: {
      rules: true,
    },
  });

  return (
    <main className="container mx-auto px-4 py-8">
      <h1 className="mb-8 text-2xl font-bold">Teesheet Configurations</h1>
      <ConfigManager initialConfigs={configs} />
    </main>
  );
}
