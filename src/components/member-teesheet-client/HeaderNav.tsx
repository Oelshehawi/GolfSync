import { HeaderNavClient } from "./HeaderNavClient";
import { getMemberData } from "~/server/members-teesheet-client/data";
import { auth } from "@clerk/nextjs/server";

export async function HeaderNav() {
  const { sessionClaims } = await auth();

  const member = await getMemberData(sessionClaims?.userId as string);

  return (
    <header className="fixed top-2 left-1/2 z-20 w-full max-w-5xl -translate-x-1/2 px-4">
      <nav className="rounded-xl border border-[var(--org-primary)]/20 bg-white shadow-lg backdrop-blur-sm">
        <HeaderNavClient member={member} />
      </nav>
    </header>
  );
}
