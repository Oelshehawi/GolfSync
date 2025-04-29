import { Inter } from "next/font/google";
import "~/styles/globals.css";
import { getOrganizationTheme } from "~/server/config/data";
import { HeaderNav } from "../../components/member-teesheet-client/HeaderNav";
import { Footer } from "~/components/member-teesheet-client/Footer";
import { auth } from "@clerk/nextjs/server";
import { ClerkProvider } from "@clerk/nextjs";
import { getOrganizationColors } from "~/lib/utils";
import { getMemberData } from "~/server/members-teesheet-client/data";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "GolfSync - Member Portal",
  description: "Book tee times and manage your golf membership",
};

export default async function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const orgTheme = await getOrganizationTheme();
  // Get organization colors using the utility function
  const theme = getOrganizationColors(orgTheme);

  const { sessionClaims } = await auth();

  const member = await getMemberData(sessionClaims?.userId as string);

  const themeStyles = {
    ["--org-primary" as string]: theme.primary,
    ["--org-secondary" as string]: theme.secondary,
    ["--org-tertiary" as string]: theme.tertiary,
  } as React.CSSProperties;

  return (
    <ClerkProvider>
      <div className={`flex min-h-screen flex-col ${inter.className}`}>
        <HeaderNav theme={theme} member={member} />
        <main style={themeStyles} className="container mx-auto flex-1 p-4">
          {children}
        </main>
        <Footer theme={theme} />
      </div>
    </ClerkProvider>
  );
}
