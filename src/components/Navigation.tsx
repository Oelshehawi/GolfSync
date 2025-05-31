import NavigationClient from "~/components/NavigationClient";
import { getPendingChargesCount } from "~/server/charges/data";

interface NavigationProps {
  logoUrl?: string;
  organizationName: string;
}

export default async function Navigation({
  logoUrl,
  organizationName,
}: NavigationProps) {
  // Fetch pending charges count
  const pendingCounts = await getPendingChargesCount();

  const navItems = [
    { name: "Teesheet", href: "/admin" },
    { name: "Members", href: "/admin/members" },
    { name: "Events", href: "/admin/events" },
    {
      name: "Charges",
      href: "/admin/charges",
      count: pendingCounts.total > 0 ? pendingCounts.total : undefined,
    },
    { name: "Settings", href: "/admin/settings" },
  ];

  return (
    <NavigationClient
      logoUrl={logoUrl}
      organizationName={organizationName}
      navItems={navItems}
    />
  );
}
