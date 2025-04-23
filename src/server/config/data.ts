
import { auth } from "@clerk/nextjs/server";
import { clerkClient } from "@clerk/nextjs/server";



export async function getOrganizationTheme() {
  const session = await auth();

  const organization = await (
    await clerkClient()
  ).organizations.getOrganization({
    organizationId: session.orgId!,
  });

  const theme = organization.publicMetadata?.theme as
    | {
        primary: string;
        tertiary: string;
        secondary: string;
      }
    | undefined;

  return theme;
}
