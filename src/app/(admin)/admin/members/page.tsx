import { getMembers } from "~/server/members/data";
import { getGuests } from "~/server/guests/data";
import { MembersGuestsHandler } from "~/components/members/MembersGuestsHandler";

export default async function MembersPage() {
  const [members, guests] = await Promise.all([getMembers(), getGuests()]);

  return (
    <div className="container py-6">
      <MembersGuestsHandler
        initialMembers={members}
        initialGuests={guests}
      />
    </div>
  );
}
