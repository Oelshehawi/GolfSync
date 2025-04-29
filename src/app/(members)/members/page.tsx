import Link from "next/link";
import { auth } from "@clerk/nextjs/server";
import { getMemberData } from "~/server/members-teesheet-client/data";
export default async function MembersHome() {
  const { sessionClaims } = await auth();

  const member = await getMemberData(sessionClaims?.userId as string);

  return (
    <div className="flex flex-col gap-6 px-4 py-16 sm:px-12 md:pt-24">
      <div className="rounded-lg bg-white p-6 shadow-md sm:p-8">
        <h2 className="mb-4 text-xl font-semibold sm:text-2xl">
          Welcome,{" "}
          <span className="text-[var(--org-primary)]">
            {member?.firstName} {member?.lastName}
          </span>
          !
        </h2>
        <div className="space-y-6">
          <p className="text-gray-700">
            View your upcoming tee times and club announcements below.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-3 text-lg font-medium">Upcoming Tee Times</h3>
          <p className="text-gray-500">No upcoming tee times found.</p>
          <Link
            href="/members/teesheet"
            className="mt-4 inline-block text-sm text-green-700 hover:underline"
          >
            Book a tee time →
          </Link>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-md">
          <h3 className="mb-3 text-lg font-medium">Club Announcements</h3>
          <p className="text-gray-500">No current announcements.</p>
        </div>
      </div>
    </div>
  );
}
