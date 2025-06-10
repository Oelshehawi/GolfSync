import { HeaderNavClient } from "./HeaderNavClient";
import { getMemberData } from "~/server/members-teesheet-client/data";
import { auth } from "@clerk/nextjs/server";

export async function HeaderNav() {
  const { sessionClaims } = await auth();

  const member = await getMemberData(sessionClaims?.userId as string);

  return (
    <header className="w-full px-4 py-2">
      <nav className="mx-auto max-w-5xl rounded-xl border border-[var(--org-primary)]/20 bg-white shadow-lg backdrop-blur-sm">
        <HeaderNavClient member={member} />
      </nav>
    </header>
  );
}
