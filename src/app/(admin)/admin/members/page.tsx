import { getMembers } from "~/server/members/data";
import { getGuests } from "~/server/guests/data";
import { MembersGuestsHandler } from "~/components/members/MembersGuestsHandler";
import { getOrganizationTheme } from "~/server/config/data";

export default async function MembersPage() {
  const [members, guests] = await Promise.all([getMembers(), getGuests()]);

  const theme = await getOrganizationTheme();

  // Map the theme styles to match the expected format
  const themeProps = {
    primary: theme?.primary,
    secondary: theme?.secondary,
    tertiary: theme?.tertiary,
  };

  return (
    <div className="container py-6">
      <MembersGuestsHandler
        initialMembers={members}
        initialGuests={guests}
        theme={themeProps}
      />
    </div>
  );
}
