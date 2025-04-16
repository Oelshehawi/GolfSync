import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { Settings, Calendar, Users, Clock, ChevronRight } from "lucide-react";
import Link from "next/link";
import { Button } from "~/components/ui/button";

export default function SettingsPage() {
  const settings = [
    {
      title: "Teesheet Settings",
      description: "Configure time blocks, intervals, and member limits",
      icon: Calendar,
      href: "/admin/settings/teesheet",
      color: "bg-blue-50 text-blue-600",
    },
    {
      title: "Member Settings",
      description: "Manage member categories and permissions",
      icon: Users,
      href: "/admin/settings/members",
      color: "bg-green-50 text-green-600",
    },
    {
      title: "Time Block Settings",
      description: "Configure time block types and restrictions",
      icon: Clock,
      href: "/admin/settings/timeblocks",
      color: "bg-purple-50 text-purple-600",
    },
    {
      title: "General Settings",
      description: "Manage general application settings",
      icon: Settings,
      href: "/admin/settings/general",
      color: "bg-gray-50 text-gray-600",
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="mt-2 text-gray-500">
            Manage your application settings and configurations
          </p>
        </div>
        <Button variant="outline" size="sm">
          <Settings className="mr-2 h-4 w-4" />
          Quick Settings
        </Button>
      </div>

      {/* Settings Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        {settings.map((setting) => (
          <Link key={setting.href} href={setting.href}>
            <Card className="group relative overflow-hidden transition-all hover:shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`rounded-lg p-2 ${setting.color}`}>
                    <setting.icon className="h-6 w-6" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{setting.title}</CardTitle>
                    <CardDescription>{setting.description}</CardDescription>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-gray-400 transition-transform group-hover:translate-x-1" />
              </CardHeader>
              <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-transparent via-current to-transparent opacity-0 transition-opacity group-hover:opacity-20" />
            </Card>
          </Link>
        ))}
      </div>

      {/* Recent Activity */}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold">Recent Activity</h2>
        <Card>
          <CardContent className="p-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-blue-100 p-2">
                    <Calendar className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium">
                      Teesheet Configuration Updated
                    </p>
                    <p className="text-sm text-gray-500">2 hours ago</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Changes
                </Button>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="rounded-full bg-green-100 p-2">
                    <Users className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium">New Member Category Added</p>
                    <p className="text-sm text-gray-500">Yesterday</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm">
                  View Details
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
