import { getMembers } from "~/server/members/data";
import { MembersClient } from "~/components/members/MembersClient";

export default async function MembersPage() {
  const members = await getMembers();

  return <MembersClient initialMembers={members} />;
}
