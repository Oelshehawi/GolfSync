"use client";

import { useState, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TimeBlockPageHeader } from "./TimeBlockPageHeader";
import { TimeBlockHeader } from "./TimeBlockHeader";
import {
  searchMembersAction,
  addMemberToTimeBlock,
  removeMemberFromTimeBlock,
} from "~/server/members/actions";
import {
  searchGuestsAction,
  addGuestToTimeBlock,
  removeGuestFromTimeBlock,
} from "~/server/guests/actions";
import type { Member } from "~/app/types/MemberTypes";
import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";
import {
  TimeBlockMemberSearch,
  TimeBlockGuestSearch,
  TimeBlockPeopleList,
} from "./TimeBlockPeopleList";
import toast from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { checkRestrictionsAction } from "~/server/restrictions/actions";
import { RestrictionViolation } from "~/app/types/RestrictionTypes";
import { RestrictionViolationAlert } from "~/components/restrictions/RestrictionViolationAlert";

type TimeBlockGuest = {
  id: number;
  guestId: number;
  timeBlockId: number;
  invitedByMemberId: number;
  guest: {
    id: number;
    firstName: string;
    lastName: string;
    email: string | null;
    phone: string | null;
    handicap: string | null;
  };
  invitedByMember: {
    id: number;
    firstName: string;
    lastName: string;
    memberNumber: string;
  };
};

type Guest = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  handicap: string | null;
};

interface TimeBlockMemberManagerProps {
  timeBlock: TimeBlockWithMembers;
  timeBlockGuests?: TimeBlockGuest[];
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function TimeBlockMemberManager({
  timeBlock,
  timeBlockGuests = [],
  theme,
}: TimeBlockMemberManagerProps) {
  // Member state
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [memberSearchResults, setMemberSearchResults] = useState<Member[]>([]);
  const [isMemberSearching, setIsMemberSearching] = useState(false);

  // Guest state
  const [guestSearchQuery, setGuestSearchQuery] = useState("");
  const [guestSearchResults, setGuestSearchResults] = useState<Guest[]>([]);
  const [isGuestSearching, setIsGuestSearching] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);

  // Restriction violation state
  const [restrictionViolations, setRestrictionViolations] = useState<
    RestrictionViolation[]
  >([]);
  const [showViolationAlert, setShowViolationAlert] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    (() => Promise<void>) | null
  >(null);

  // Constants
  const MAX_PEOPLE = 4;
  const totalPeople = timeBlock.members.length + timeBlockGuests.length;
  const isTimeBlockFull = totalPeople >= MAX_PEOPLE;

  // Member search handler
  const handleMemberSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setMemberSearchResults([]);
      return;
    }

    setIsMemberSearching(true);
    try {
      const results = await searchMembersAction(query);

      // Transform date strings to Date objects
      const transformedResults = results.map((member) => ({
        ...member,
        dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
        createdAt: new Date(member.createdAt),
        updatedAt: member.updatedAt ? new Date(member.updatedAt) : null,
      }));

      setMemberSearchResults(transformedResults);
    } finally {
      setIsMemberSearching(false);
    }
  }, []);

  // Guest search handler
  const handleGuestSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGuestSearchResults([]);
      return;
    }

    setIsGuestSearching(true);
    try {
      const results = await searchGuestsAction(query);
      setGuestSearchResults(results);
    } finally {
      setIsGuestSearching(false);
    }
  }, []);

  const debouncedMemberSearch = useDebouncedCallback(handleMemberSearch, 300);
  const debouncedGuestSearch = useDebouncedCallback(handleGuestSearch, 300);

  // Check for restrictions before adding a member
  const checkMemberRestrictions = async (
    memberId: number,
    memberClass: string,
  ) => {
    try {
      const result = await checkRestrictionsAction({
        memberId,
        memberClass,
        bookingTime: timeBlock.startTime,
      });

      if ("success" in result && !result.success) {
        toast.error(result.error || "Failed to check restrictions");
        return false;
      }

      if ("hasViolations" in result && result.hasViolations) {
        setRestrictionViolations(result.violations);
        setShowViolationAlert(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking restrictions:", error);
      toast.error("Failed to check restrictions");
      return false;
    }
  };

  // Check for restrictions before adding a guest
  const checkGuestRestrictions = async (guestId: number) => {
    try {
      const result = await checkRestrictionsAction({
        guestId,
        bookingTime: timeBlock.startTime,
      });

      if ("success" in result && !result.success) {
        toast.error(result.error || "Failed to check restrictions");
        return false;
      }

      if ("hasViolations" in result && result.hasViolations) {
        setRestrictionViolations(result.violations);
        setShowViolationAlert(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking restrictions:", error);
      toast.error("Failed to check restrictions");
      return false;
    }
  };

  const handleAddMember = async (memberId: number) => {
    // Find the member to get their class
    const member = memberSearchResults.find((m) => m.id === memberId);
    if (!member) {
      toast.error("Member not found");
      return;
    }

    // Check for restrictions
    const hasViolations = await checkMemberRestrictions(memberId, member.class);

    if (hasViolations) {
      // Save the action for later if admin overrides
      setPendingAction(() => {
        return async () => {
          try {
            const result = await addMemberToTimeBlock(timeBlock.id, memberId);
            if (result.success) {
              toast.success("Member added successfully");
            } else {
              toast.error(result.error || "Failed to add member");
            }
          } catch (error) {
            toast.error("An error occurred while adding the member");
            console.error(error);
          }
        };
      });
      return;
    }

    // No violations, proceed as normal
    try {
      const result = await addMemberToTimeBlock(timeBlock.id, memberId);
      if (result.success) {
        toast.success("Member added successfully");
      } else {
        toast.error(result.error || "Failed to add member");
      }
    } catch (error) {
      toast.error("An error occurred while adding the member");
      console.error(error);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      const result = await removeMemberFromTimeBlock(timeBlock.id, memberId);
      if (result.success) {
        toast.success("Member removed successfully");
      } else {
        toast.error(result.error || "Failed to remove member");
      }
    } catch (error) {
      toast.error("An error occurred while removing the member");
      console.error(error);
    }
  };

  const handleAddGuest = async (guestId: number) => {
    if (!selectedMemberId) {
      toast.error("Please select a member who is inviting this guest");
      return;
    }

    // Check for restrictions
    const hasViolations = await checkGuestRestrictions(guestId);

    if (hasViolations) {
      // Save the action for later if admin overrides
      setPendingAction(() => {
        return async () => {
          try {
            const result = await addGuestToTimeBlock(
              timeBlock.id,
              guestId,
              selectedMemberId,
            );
            if (result.success) {
              toast.success("Guest added successfully");
              setSelectedMemberId(null);
            } else {
              toast.error(result.error || "Failed to add guest");
            }
          } catch (error) {
            toast.error("An error occurred while adding the guest");
            console.error(error);
          }
        };
      });
      return;
    }

    // No violations, proceed as normal
    try {
      const result = await addGuestToTimeBlock(
        timeBlock.id,
        guestId,
        selectedMemberId,
      );
      if (result.success) {
        toast.success("Guest added successfully");
        setSelectedMemberId(null);
      } else {
        toast.error(result.error || "Failed to add guest");
      }
    } catch (error) {
      toast.error("An error occurred while adding the guest");
      console.error(error);
    }
  };

  const handleRemoveGuest = async (guestId: number) => {
    try {
      const result = await removeGuestFromTimeBlock(timeBlock.id, guestId);
      if (result.success) {
        toast.success("Guest removed successfully");
      } else {
        toast.error(result.error || "Failed to remove guest");
      }
    } catch (error) {
      toast.error("An error occurred while removing the guest");
      console.error(error);
    }
  };

  const handleMemberSelect = (memberId: number) => {
    setSelectedMemberId(memberId);
  };

  const handleOverrideAndContinue = async () => {
    if (pendingAction) {
      await pendingAction();
      setPendingAction(null);
    }
    setShowViolationAlert(false);
  };

  return (
    <div className="space-y-6">
      <TimeBlockPageHeader timeBlock={timeBlock} theme={theme} />
      <TimeBlockHeader
        timeBlock={timeBlock}
        guestsCount={timeBlockGuests.length}
        maxPeople={MAX_PEOPLE}
        theme={theme}
      />

      <Tabs defaultValue="members" className="mt-8 w-full">
        <TabsList className="mb-4" theme={theme}>
          <TabsTrigger value="members" theme={theme}>
            Add Members
          </TabsTrigger>
          <TabsTrigger value="guests" theme={theme}>
            Add Guests
          </TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6" theme={theme}>
          <TimeBlockMemberSearch
            searchQuery={memberSearchQuery}
            onSearch={(query: string) => {
              setMemberSearchQuery(query);
              debouncedMemberSearch(query);
            }}
            searchResults={memberSearchResults}
            isLoading={isMemberSearching}
            onAddMember={handleAddMember}
            isTimeBlockFull={isTimeBlockFull}
            theme={theme}
          />
        </TabsContent>

        <TabsContent value="guests" theme={theme}>
          <TimeBlockGuestSearch
            searchQuery={guestSearchQuery}
            onSearch={(query: string) => {
              setGuestSearchQuery(query);
              debouncedGuestSearch(query);
            }}
            searchResults={guestSearchResults}
            isLoading={isGuestSearching}
            onAddGuest={handleAddGuest}
            isTimeBlockFull={isTimeBlockFull}
            members={timeBlock.members}
            onMemberSelect={handleMemberSelect}
            selectedMemberId={selectedMemberId}
            theme={theme}
          />
        </TabsContent>
      </Tabs>

      {/* Combined People List - always visible */}
      <TimeBlockPeopleList
        members={timeBlock.members}
        guests={timeBlockGuests}
        onRemoveMember={handleRemoveMember}
        onRemoveGuest={handleRemoveGuest}
        maxPeople={MAX_PEOPLE}
        theme={theme}
      />

      {/* Restriction Violation Alert */}
      <RestrictionViolationAlert
        open={showViolationAlert}
        onOpenChange={setShowViolationAlert}
        violations={restrictionViolations}
        onContinue={handleOverrideAndContinue}
        onCancel={() => {
          setShowViolationAlert(false);
          setPendingAction(null);
        }}
        theme={theme}
      />
    </div>
  );
}
