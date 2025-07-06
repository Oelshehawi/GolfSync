import { FooterNavClient } from "./FooterNavClient";
import { getMemberData } from "~/server/members-teesheet-client/data";
import { auth } from "@clerk/nextjs/server";

export async function FooterNav() {
  const { sessionClaims } = await auth();

  const member = await getMemberData(sessionClaims?.userId as string);

  return <FooterNavClient member={member} isMember={true} />;
}
