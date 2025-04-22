import "~/styles/globals.css";
import { GeistSans } from "geist/font/sans";
import { type Metadata } from "next";
import { auth, clerkClient } from "@clerk/nextjs/server";
import Navigation from "~/components/Navigation";
import { Toaster } from "react-hot-toast";

export const metadata: Metadata = {
  title: "GolfSync",
  description:
    "Golf club management system for tracking members, scores, and events",
  icons: [{ rel: "icon", url: "/favicon.ico" }],
};

export default async function AdminLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  if (!session.userId || !session.orgId) {
    return <div>Not authenticated or no organization selected</div>;
  }

  const organization = await (
    await clerkClient()
  ).organizations.getOrganization({
    organizationId: session.orgId,
  });

  const theme = organization.publicMetadata?.theme as
    | {
        primary: string;
        tertiary: string;
        secondary: string;
      }
    | undefined;

  if (!theme) {
    return <div>No theme found in organization metadata</div>;
  }

  const themeStyles = {
    ["--org-primary" as string]: theme?.primary,
    ["--org-secondary" as string]: theme?.secondary,
    ["--org-tertiary" as string]: theme?.tertiary,
  } as React.CSSProperties;


  return (
    <div className={GeistSans.variable}>
      <div
        className="min-h-screen bg-[var(--org-secondary)]"
        style={themeStyles}
      >
        <Navigation
          theme={theme}
          logoUrl={organization.imageUrl}
          organizationName={organization.name}
        />
        <main className="container mx-auto px-4 py-8">{children}</main>
        <Toaster position="top-right" />
      </div>
    </div>
  );
}
