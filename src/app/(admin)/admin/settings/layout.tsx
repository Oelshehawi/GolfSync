"use client";
import Link from "next/link";
import { Settings, Calendar, Users, Clock, ChevronLeft } from "lucide-react";
import { cn } from "~/lib/utils";
import { usePathname } from "next/navigation";

const sidebarItems = [
  {
    title: "Teesheet",
    href: "/admin/settings/teesheet",
    icon: Calendar,
  },
  {
    title: "Members",
    href: "/admin/settings/members",
    icon: Users,
  },
  {
    title: "Time Blocks",
    href: "/admin/settings/timeblocks",
    icon: Clock,
  },
  {
    title: "General",
    href: "/admin/settings/general",
    icon: Settings,
  },
];

export default function SettingsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-64 border-r bg-white p-6">
        <div className="mb-8">
          <Link
            href="/admin"
            className="mb-4 flex items-center text-sm text-gray-500 hover:text-gray-900"
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Admin
          </Link>
          <h2 className="text-lg font-semibold text-gray-900">Settings</h2>
          <p className="text-sm text-gray-500">Manage your club settings</p>
        </div>

        <nav className="space-y-1">
          {sidebarItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                "hover:bg-gray-100",
                pathname === item.href
                  ? "bg-gray-100 text-gray-900"
                  : "text-gray-700",
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto bg-gray-50 p-8">{children}</main>
    </div>
  );
}
