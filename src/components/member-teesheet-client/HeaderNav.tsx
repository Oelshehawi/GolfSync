import { HeaderNavClient } from "./HeaderNavClient";
import { getMemberData } from "~/server/members-teesheet-client/data";
import { auth } from "@clerk/nextjs/server";

export async function HeaderNav() {
  const { sessionClaims } = await auth();

  const member = await getMemberData(sessionClaims?.userId as string);

  return <HeaderNavClient member={member} isMember={true} />;
}
