"use client";

import { useState, useCallback, useEffect, useMemo } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TimeBlockPageHeader } from "./TimeBlockPageHeader";
import { TimeBlockHeader } from "./TimeBlockHeader";
import {
  searchMembersAction,
  addMemberToTimeBlock,
} from "~/server/members/actions";
import {
  searchGuestsAction,
  addGuestToTimeBlock,
  removeGuestFromTimeBlock,
} from "~/server/guests/actions";
import {
  addFillToTimeBlock,
  removeFillFromTimeBlock,
  removeTimeBlockMember,
} from "~/server/teesheet/actions";
import { checkTimeblockRestrictionsAction } from "~/server/timeblock-restrictions/actions";
import type { Member } from "~/app/types/MemberTypes";
import type {
  TimeBlockWithMembers,
  TimeBlockMemberView,
  TimeBlockFill,
  FillType,
} from "~/app/types/TeeSheetTypes";
import {
  TimeBlockMemberSearch,
  TimeBlockGuestSearch,
  TimeBlockPeopleList,
} from "./TimeBlockPeopleList";
import { TimeBlockFillForm } from "./fills/TimeBlockFillForm";
import toast from "react-hot-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "~/components/ui/tabs";
import { type RestrictionViolation } from "~/app/types/RestrictionTypes";
import { RestrictionViolationAlert } from "~/components/settings/timeblock-restrictions/RestrictionViolationAlert";
import { formatDateToYYYYMMDD } from "~/lib/utils";
import { type TimeBlockGuest } from "~/app/types/GuestTypes";
import { AddGuestDialog } from "~/components/guests/AddGuestDialog";
import { createGuest } from "~/server/guests/actions";
import type { GuestFormValues } from "~/app/types/GuestTypes";

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
}

export function TimeBlockMemberManager({
  timeBlock,
  timeBlockGuests = [],
}: TimeBlockMemberManagerProps) {
  // Track members, guests, and fills in local state
  const [localMembers, setLocalMembers] = useState<TimeBlockMemberView[]>(
    timeBlock.members,
  );
  const [localGuests, setLocalGuests] =
    useState<TimeBlockGuest[]>(timeBlockGuests);
  const [localFills, setLocalFills] = useState<TimeBlockFill[]>(
    timeBlock.fills || [],
  );

  // Update local state when props change
  useEffect(() => {
    setLocalMembers(timeBlock.members);
    setLocalGuests(timeBlockGuests);
    setLocalFills(timeBlock.fills || []);
  }, [timeBlock.members, timeBlockGuests, timeBlock.fills]);

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

  // Guest creation state
  const [showAddGuestDialog, setShowAddGuestDialog] = useState(false);

  // Constants
  const MAX_PEOPLE = 4;
  const totalPeople =
    localMembers.length + localGuests.length + localFills.length;
  const isTimeBlockFull = totalPeople >= MAX_PEOPLE;

  // Create a key that changes when members, guests, or fills change (memoized for performance)
  const peopleListKey = useMemo(
    () =>
      `people-list-${localMembers.map((m) => m.id).join("-")}-${localGuests.map((g) => g.id).join("-")}-${localFills.map((f) => f.id).join("-")}`,
    [localMembers, localGuests, localFills],
  );

  // Member search handler with better error handling
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

      setMemberSearchResults(transformedResults as Member[]);
    } catch (error) {
      console.error("Error searching members:", error);
      toast.error("Failed to search members");
      setMemberSearchResults([]);
    } finally {
      setIsMemberSearching(false);
    }
  }, []);

  // Guest search handler with better error handling
  const handleGuestSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setGuestSearchResults([]);
      return;
    }

    setIsGuestSearching(true);
    try {
      const results = await searchGuestsAction(query);
      // Map results to match the Guest type with all required properties
      const mappedResults = results.map((result: any) => ({
        id: result.id,
        firstName: result.firstName,
        lastName: result.lastName,
        email: result.email,
        phone: result.phone,
        handicap: result.handicap || null, // Ensure handicap is included
      }));
      setGuestSearchResults(mappedResults);
    } catch (error) {
      console.error("Error searching guests:", error);
      toast.error("Failed to search guests");
      setGuestSearchResults([]);
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
      // Use the timeblock's date rather than today's date
      const bookingDateString =
        timeBlock.date || formatDateToYYYYMMDD(new Date());

      // Check for restrictions first
      const checkResult = await checkTimeblockRestrictionsAction({
        memberId,
        memberClass,
        bookingDateString,
        bookingTime: timeBlock.startTime,
      });

      if ("success" in checkResult && !checkResult.success) {
        toast.error(checkResult.error || "Failed to check restrictions");
        return false;
      }

      if ("hasViolations" in checkResult && checkResult.hasViolations) {
        setRestrictionViolations(checkResult.violations);
        setShowViolationAlert(true);
        return true;
      }

      return false;
    } catch (error) {
      console.error("Error checking restrictions:", error);
      toast.error("Error checking restrictions");
      return false;
    }
  };

  // Check for restrictions before adding a guest
  const checkGuestRestrictions = async (guestId: number) => {
    try {
      // Use the timeblock's date rather than today's date
      const bookingDateString =
        timeBlock.date || formatDateToYYYYMMDD(new Date());

      // Check for restrictions
      const checkResult = await checkTimeblockRestrictionsAction({
        guestId,
        bookingDateString,
        bookingTime: timeBlock.startTime,
      });

      if ("success" in checkResult && !checkResult.success) {
        toast.error(checkResult.error || "Failed to check restrictions");
        return false;
      }

      if ("hasViolations" in checkResult && checkResult.hasViolations) {
        setRestrictionViolations(checkResult.violations);
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
    try {
      const memberToAdd = memberSearchResults.find((m) => m.id === memberId);
      if (!memberToAdd) {
        return;
      }

      // Check for restrictions
      const hasViolations = await checkMemberRestrictions(
        memberId,
        memberToAdd.class,
      );

      if (hasViolations) {
        // Save the action for later if admin overrides
        setPendingAction(() => {
          return async () => {
            try {
              const result = await addMemberToTimeBlock(timeBlock.id, memberId);
              if (result.success) {
                toast.success("Member added successfully");

                // Add member to local state for immediate UI update
                const newMember: TimeBlockMemberView = {
                  id: memberToAdd.id,
                  username: memberToAdd.username,
                  email: memberToAdd.email,
                  firstName: memberToAdd.firstName,
                  lastName: memberToAdd.lastName,
                  memberNumber: memberToAdd.memberNumber,
                  class: memberToAdd.class,
                  bagNumber: memberToAdd.bagNumber,
                  checkedIn: false,
                  checkedInAt: null,
                };
                setLocalMembers((prev) => [...prev, newMember]);
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

          // Add member to local state for immediate UI update
          const newMember: TimeBlockMemberView = {
            id: memberToAdd.id,
            username: memberToAdd.username,
            email: memberToAdd.email,
            firstName: memberToAdd.firstName,
            lastName: memberToAdd.lastName,
            memberNumber: memberToAdd.memberNumber,
            class: memberToAdd.class,
            bagNumber: memberToAdd.bagNumber,
            checkedIn: false,
            checkedInAt: null,
          };
          setLocalMembers((prev) => [...prev, newMember]);
        } else {
          toast.error(result.error || "Failed to add member");
        }
      } catch (error) {
        toast.error("An error occurred while adding the member");
        console.error(error);
      }
    } catch (error) {
      console.error("Error handling member addition:", error);
      toast.error("An error occurred while adding the member");
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      const result = await removeTimeBlockMember(timeBlock.id, memberId);
      if (result.success) {
        toast.success("Member removed successfully");

        // Remove member from local state for immediate UI update
        setLocalMembers((prev) =>
          prev.filter((member) => member.id !== memberId),
        );
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

    const guestToAdd = guestSearchResults.find((g) => g.id === guestId);
    if (!guestToAdd) {
      return;
    }

    const invitingMember = localMembers.find((m) => m.id === selectedMemberId);
    if (!invitingMember) {
      toast.error("Selected member not found");
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

              // Add guest to local state for immediate UI update
              const newGuest: TimeBlockGuest = {
                id: guestToAdd.id,
                firstName: guestToAdd.firstName,
                lastName: guestToAdd.lastName,
                email: guestToAdd.email,
                phone: guestToAdd.phone,
                checkedIn: false,
                checkedInAt: null,
                invitedByMember: {
                  id: invitingMember.id,
                  firstName: invitingMember.firstName,
                  lastName: invitingMember.lastName,
                  memberNumber: invitingMember.memberNumber,
                },
              };
              setLocalGuests((prev) => [...prev, newGuest]);

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

        // Add guest to local state for immediate UI update
        const newGuest: TimeBlockGuest = {
          id: guestToAdd.id,
          firstName: guestToAdd.firstName,
          lastName: guestToAdd.lastName,
          email: guestToAdd.email,
          phone: guestToAdd.phone,
          checkedIn: false,
          checkedInAt: null,
          invitedByMember: {
            id: invitingMember.id,
            firstName: invitingMember.firstName,
            lastName: invitingMember.lastName,
            memberNumber: invitingMember.memberNumber,
          },
        };
        setLocalGuests((prev) => [...prev, newGuest]);

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

        // Remove guest from local state for immediate UI update
        setLocalGuests((prev) => prev.filter((guest) => guest.id !== guestId));
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

  const handleCreateGuest = async (values: GuestFormValues) => {
    try {
      // Check for duplicates first
      const isDuplicate = guestSearchResults.some(
        (guest) =>
          guest.firstName.toLowerCase() === values.firstName.toLowerCase() &&
          guest.lastName.toLowerCase() === values.lastName.toLowerCase(),
      );

      if (isDuplicate) {
        toast.error("A guest with this name already exists");
        return;
      }

      const result = await createGuest(values);
      if (result.success && result.data) {
        toast.success("Guest created successfully");

        // Close the dialog first
        setShowAddGuestDialog(false);

        // Add the new guest to the timeblock if a member is selected
        if (selectedMemberId) {
          await handleAddGuest(result.data.id);
        }

        // Always refresh the guest search results to show the new guest
        await handleGuestSearch(
          guestSearchQuery || `${values.firstName} ${values.lastName}`,
        );

        // If no search query was active, set it to the new guest's name to show it in results
        if (!guestSearchQuery) {
          setGuestSearchQuery(`${values.firstName} ${values.lastName}`);
        }
      } else {
        toast.error(result.error || "Failed to create guest");
      }
    } catch (error) {
      toast.error("An error occurred while creating the guest");
      console.error(error);
    }
  };

  const handleShowCreateGuestDialog = () => {
    setShowAddGuestDialog(true);
  };

  const handleAddFill = async (fillType: FillType, customName?: string) => {
    try {
      const result = await addFillToTimeBlock(
        timeBlock.id,
        fillType,
        1, // Always add one fill at a time
        customName,
      );

      if (result.success) {
        toast.success("Fill added successfully");
        // Add fill to local state
        const newFill = {
          id: result.fill?.id ?? 0,
          timeBlockId: timeBlock.id,
          fillType,
          customName: customName || null,
        } as TimeBlockFill; // Schema will add createdAt with defaultNow()
        setLocalFills((prev) => [...prev, newFill]);
      } else {
        toast.error(result.error || "Failed to add fill");
      }
    } catch (error) {
      console.error("Error adding fill:", error);
      toast.error("An error occurred while adding the fill");
    }
  };

  const handleRemoveFill = async (fillId: number) => {
    try {
      const result = await removeFillFromTimeBlock(timeBlock.id, fillId);
      if (result.success) {
        toast.success("Fill removed successfully");
        setLocalFills((prev) => prev.filter((fill) => fill.id !== fillId));
      } else {
        toast.error(result.error || "Failed to remove fill");
      }
    } catch (error) {
      console.error("Error removing fill:", error);
      toast.error("An error occurred while removing the fill");
    }
  };

  return (
    <div className="space-y-6">
      <TimeBlockPageHeader timeBlock={timeBlock} />
      <TimeBlockHeader
        timeBlock={timeBlock}
        guestsCount={localGuests.length}
        maxPeople={MAX_PEOPLE}
      />

      <Tabs defaultValue="members" className="mt-8 w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="members">Add Members</TabsTrigger>
          <TabsTrigger value="guests">Add Guests</TabsTrigger>
          <TabsTrigger value="fills">Add Fills</TabsTrigger>
        </TabsList>

        <TabsContent value="members" className="space-y-6">
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
          />
        </TabsContent>

        <TabsContent value="guests">
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
            members={localMembers}
            onMemberSelect={handleMemberSelect}
            selectedMemberId={selectedMemberId}
            onCreateGuest={handleShowCreateGuestDialog}
          />
        </TabsContent>

        <TabsContent value="fills">
          <TimeBlockFillForm
            onAddFill={handleAddFill}
            isTimeBlockFull={isTimeBlockFull}
            maxPeople={MAX_PEOPLE}
            currentPeopleCount={totalPeople}
          />
        </TabsContent>
      </Tabs>

      {/* Combined People List - always visible */}
      <TimeBlockPeopleList
        key={peopleListKey}
        members={localMembers}
        guests={localGuests}
        fills={localFills}
        onRemoveMember={handleRemoveMember}
        onRemoveGuest={handleRemoveGuest}
        onRemoveFill={handleRemoveFill}
        maxPeople={MAX_PEOPLE}
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
      />

      {/* Add Guest Dialog */}
      <AddGuestDialog
        open={showAddGuestDialog}
        onOpenChange={setShowAddGuestDialog}
        onSubmit={handleCreateGuest}
      />
    </div>
  );
}
