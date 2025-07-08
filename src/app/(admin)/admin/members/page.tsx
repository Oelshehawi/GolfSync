import { getMembers } from "~/server/members/data";
import { getGuests } from "~/server/guests/data";
import { getMemberClasses } from "~/server/member-classes/data";
import { MembersGuestsHandler } from "~/components/members/MembersGuestsHandler";
import { PageHeader } from "~/components/ui/page-header";

export default async function MembersPage() {
  const [members, guests, memberClasses] = await Promise.all([
    getMembers(),
    getGuests(),
    getMemberClasses(),
  ]);

  return (
    <div className="container space-y-6 py-6">
      <PageHeader
        title="Members & Guests"
        description="Manage club members and registered guests"
      />

      <MembersGuestsHandler
        initialMembers={members}
        initialGuests={guests}
        memberClasses={memberClasses}
      />
    </div>
  );
}
