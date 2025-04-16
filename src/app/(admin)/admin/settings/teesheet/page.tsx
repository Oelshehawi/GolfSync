import { db } from "~/server/db";
import { ConfigManager } from "~/components/teesheet/ConfigManager";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Calendar, Clock, Users } from "lucide-react";

export default async function TeesheetSettingsPage() {
  const configs = await db.query.teesheetConfigs.findMany({
    with: {
      rules: true,
    },
  });

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Teesheet Settings</h1>
        <p className="mt-2 text-gray-500">
          Configure your teesheet settings, including time blocks, intervals,
          and member limits.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between ">
            <CardTitle className="text-sm font-medium">
              Active Configurations
            </CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{configs.length}</div>
            <p className="text-xs text-gray-500">Total configurations</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between ">
            <CardTitle className="text-sm font-medium">
              Default Interval
            </CardTitle>
            <Clock className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">15 min</div>
            <p className="text-xs text-gray-500">Between time blocks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 ">
            <CardTitle className="text-sm font-medium">Max Members</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4</div>
            <p className="text-xs text-gray-500">Per time block</p>
          </CardContent>
        </Card>
      </div>

      {/* Configurations */}
      <Card>
        <CardHeader>
          <CardTitle>Teesheet Configurations</CardTitle>
          <CardDescription>
            Create and manage different teesheet configurations for weekdays,
            weekends, and special events.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ConfigManager initialConfigs={configs} />
        </CardContent>
      </Card>
    </div>
  );
}
