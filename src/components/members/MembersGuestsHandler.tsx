import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { MembersHandler } from "~/components/members/MembersHandler";
import { GuestsHandler } from "~/components/guests/GuestsHandler";
import type { Member } from "~/app/types/MemberTypes";

type Guest = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  handicap: string | null;
};

interface MembersGuestsHandlerProps {
  initialMembers: Member[];
  initialGuests: Guest[];
  theme: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function MembersGuestsHandler({
  initialMembers,
  initialGuests,
  theme,
}: MembersGuestsHandlerProps) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Manage Members & Guests</h1>

      <Tabs defaultValue="members" className="w-full">
        <TabsList className="mb-4" theme={theme}>
          <TabsTrigger value="members" theme={theme}>
            Members
          </TabsTrigger>
          <TabsTrigger value="guests" theme={theme}>
            Guests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" theme={theme}>
          <MembersHandler initialMembers={initialMembers} theme={theme} />
        </TabsContent>

        <TabsContent value="guests" theme={theme}>
          <GuestsHandler initialGuests={initialGuests} theme={theme} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
