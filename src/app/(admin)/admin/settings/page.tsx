import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getTeesheetConfigs } from "~/server/settings/data";
import { TeesheetSettings } from "~/components/settings/teesheet/TeesheetSettings";

export default async function SettingsPage() {
  const result = await getTeesheetConfigs();
  const configs = "success" in result ? [] : result;

  return (
    <div className="space-y-8">
      {/* Header */}
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle className="text-3xl font-bold tracking-tight">
            Settings
          </CardTitle>
          <CardDescription>
            Manage your teesheet settings and configurations
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Teesheet Settings */}
      <TeesheetSettings initialConfigs={configs} />
    </div>
  );
}
