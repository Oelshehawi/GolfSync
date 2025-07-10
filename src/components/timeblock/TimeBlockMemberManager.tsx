"use client";

import { useState, useCallback, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { TimeBlockPageHeader } from "./TimeBlockPageHeader";
import { TimeBlockHeader } from "./TimeBlockHeader";
import { useMutationContext } from "~/hooks/useMutationContext";
import { useTeesheetData } from "~/hooks/useTeesheetData";
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
import { formatDateToYYYYMMDD, parseDate, getBCToday } from "~/lib/dates";
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
};

interface TimeBlockMemberManagerProps {
  timeBlock: TimeBlockWithMembers;
  timeBlockGuests?: TimeBlockGuest[];
  // Optional mutations - if not provided, will fall back to direct server actions
  mutations?: any;
}

export function TimeBlockMemberManager({
  timeBlock: initialTimeBlock,
  timeBlockGuests: initialTimeBlockGuests = [],
  mutations: providedMutations,
}: TimeBlockMemberManagerProps) {
  // Use provided mutations or get from context as fallback
  const contextMutations = useMutationContext();
  const mutations = providedMutations || contextMutations;

  // Get live SWR data instead of using static props
  // This ensures we see updates immediately when mutations happen
  // Fix: Use proper date functions from dates.ts to handle BC timezone
  const dateForSWR = initialTimeBlock.date
    ? parseDate(initialTimeBlock.date) // Use parseDate from dates.ts for proper BC timezone handling
    : new Date();
  const { data: swrData } = useTeesheetData(dateForSWR);

  // Find the current timeblock in the SWR data
  const timeBlock =
    swrData?.timeBlocks?.find((tb) => tb.id === initialTimeBlock.id) ||
    initialTimeBlock;

  // Use live data from SWR for immediate updates
  const members = timeBlock.members || [];
  const guests = timeBlock.guests || [];
  const fills = timeBlock.fills || [];

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

  // Course Sponsored member - hard coded
  const courseSponsoredMember = {
    id: -1, // Special ID to distinguish from real members
    username: "course_sponsored",
    firstName: "Course",
    lastName: "Sponsored",
    memberNumber: "CS001",
    class: "COURSE_SPONSORED",
    email: "course@golfsync.com",
  };

  // Constants
  const MAX_PEOPLE = 4;

  // Calculate current people count
  const currentPeople = members.length + guests.length + fills.length;
  const isTimeBlockFull = currentPeople >= MAX_PEOPLE;

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
      // Use the timeblock's date with proper BC timezone handling
      const bookingDateString = timeBlock.date || getBCToday();

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
      // Use the timeblock's date with proper BC timezone handling
      const bookingDateString = timeBlock.date || getBCToday();

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
    // Check if timeblock is full
    if (isTimeBlockFull) {
      return;
    }

    try {
      const memberToAdd = memberSearchResults.find((m) => m.id === memberId);
      if (!memberToAdd) {
        return;
      }

      // Check for restrictions first
      const hasViolations = await checkMemberRestrictions(
        memberId,
        memberToAdd.class || "",
      );

      if (hasViolations) {
        // Save the action for later if admin overrides
        setPendingAction(() => {
          return async () => {
            try {
              // Use SWR mutation with optimistic updates enabled for immediate feedback
              const result = mutations.addMember
                ? await mutations.addMember(timeBlock.id, memberId, {
                    optimisticUpdate: true, // Enable optimistic update for faster UI
                    revalidate: true,
                  })
                : await addMemberToTimeBlock(timeBlock.id, memberId);

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
        // Use SWR mutation with optimistic updates for immediate UI feedback
        const result = mutations.addMember
          ? await mutations.addMember(timeBlock.id, memberId, {
              optimisticUpdate: true, // Enable optimistic update for immediate feedback
              revalidate: true,
            })
          : await addMemberToTimeBlock(timeBlock.id, memberId);

        if (result.success) {
          toast.success("Member added successfully");
        } else {
          toast.error(result.error || "Failed to add member");
        }
      } catch (error) {
        console.error("Error adding member:", error);
        toast.error("An error occurred while adding the member");
      }
    } catch (error) {
      console.error("Error adding member:", error);
      toast.error("An error occurred while adding the member");
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    try {
      // Use SWR mutation with optimistic updates for immediate UI feedback
      const result = mutations.removeMember
        ? await mutations.removeMember(timeBlock.id, memberId, {
            optimisticUpdate: true, // Optimistic update for immediate UI feedback
            revalidate: true,
          })
        : await removeTimeBlockMember(timeBlock.id, memberId);

      if (result.success) {
        toast.success("Member removed successfully");
        // SWR mutation handles immediate UI update
      } else {
        toast.error(result.error || "Failed to remove member");
      }
    } catch (error) {
      toast.error("An error occurred while removing the member");
      console.error(error);
    }
  };

  const handleAddGuest = async (guestId: number) => {
    // Check if timeblock is full
    if (isTimeBlockFull) {
      return;
    }

    const guestToAdd = guestSearchResults.find((g) => g.id === guestId);
    if (!guestToAdd) {
      return;
    }

    // Determine the inviting member - use Course Sponsored if selectedMemberId is -1 or null
    let invitingMember;
    let invitingMemberId: number;

    if (!selectedMemberId || selectedMemberId === -1) {
      // Use Course Sponsored member
      if (!courseSponsoredMember) {
        toast.error("Course Sponsored member not available");
        return;
      }
      invitingMember = courseSponsoredMember;
      invitingMemberId = courseSponsoredMember.id;
    } else {
      // Use selected member
      invitingMember = members.find((m: any) => m.id === selectedMemberId);
      if (!invitingMember) {
        toast.error("Selected member not found");
        return;
      }
      invitingMemberId = selectedMemberId;
    }

    try {
      // Check for restrictions
      const hasViolations = await checkGuestRestrictions(guestId);

      if (hasViolations) {
        // Save the action for later if admin overrides
        setPendingAction(() => {
          return async () => {
            try {
              // Use SWR mutation with optimistic updates for immediate feedback
              const result = mutations.addGuest
                ? await mutations.addGuest(
                    timeBlock.id,
                    guestId,
                    invitingMemberId,
                    {
                      optimisticUpdate: true, // Enable optimistic update for faster UI
                      revalidate: true,
                    },
                  )
                : await addGuestToTimeBlock(
                    timeBlock.id,
                    guestId,
                    invitingMemberId,
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
      // Use SWR mutation with optimistic updates for immediate UI feedback
      const result = mutations.addGuest
        ? await mutations.addGuest(timeBlock.id, guestId, invitingMemberId, {
            optimisticUpdate: true, // Enable optimistic update for immediate feedback
            revalidate: true,
          })
        : await addGuestToTimeBlock(timeBlock.id, guestId, invitingMemberId);

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
      // Use SWR mutation with optimistic updates for immediate UI feedback
      const result = mutations.removeGuest
        ? await mutations.removeGuest(timeBlock.id, guestId, {
            optimisticUpdate: true, // Optimistic update for immediate UI feedback
            revalidate: true,
          })
        : await removeGuestFromTimeBlock(timeBlock.id, guestId);

      if (result.success) {
        toast.success("Guest removed successfully");
        // SWR mutation handles immediate UI update
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
    // Check if timeblock is full
    if (isTimeBlockFull) {
      return;
    }

    try {
      // Use SWR mutation with optimistic updates for immediate UI feedback
      const result = mutations.addFill
        ? await mutations.addFill(timeBlock.id, fillType, customName, {
            optimisticUpdate: true, // Optimistic update for immediate UI feedback
            revalidate: true,
          })
        : await addFillToTimeBlock(timeBlock.id, fillType, 1, customName);

      if (result.success) {
        toast.success("Fill added successfully");
        // SWR mutation handles immediate UI update
      } else {
        toast.error(result.error || "Failed to add fill");
      }
    } catch (error) {
      toast.error("An error occurred while adding the fill");
      console.error(error);
    }
  };

  const handleRemoveFill = async (fillId: number) => {
    try {
      // Use SWR mutation with optimistic updates for immediate UI feedback
      const result = mutations.removeFill
        ? await mutations.removeFill(timeBlock.id, fillId, {
            optimisticUpdate: true, // Optimistic update for immediate UI feedback
            revalidate: true,
          })
        : await removeFillFromTimeBlock(timeBlock.id, fillId);

      if (result.success) {
        toast.success("Fill removed successfully");
        // SWR mutation handles immediate UI update
      } else {
        toast.error(result.error || "Failed to remove fill");
      }
    } catch (error) {
      toast.error("An error occurred while removing the fill");
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <TimeBlockPageHeader timeBlock={timeBlock} />
      <TimeBlockHeader
        timeBlock={timeBlock}
        guestsCount={guests.length}
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
          <div className="space-y-4">
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-3">
              <p className="text-sm text-blue-800">
                <strong>Guest Hosting:</strong> Select a member from the time
                block to host a guest, or select Course Sponsored guests
                (reciprocals, gift certificates, etc.).
              </p>
            </div>
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
              members={members}
              onMemberSelect={handleMemberSelect}
              selectedMemberId={selectedMemberId}
              onCreateGuest={handleShowCreateGuestDialog}
            />
          </div>
        </TabsContent>

        <TabsContent value="fills">
          <TimeBlockFillForm
            onAddFill={handleAddFill}
            isTimeBlockFull={isTimeBlockFull}
            maxPeople={MAX_PEOPLE}
            currentPeopleCount={currentPeople}
          />
        </TabsContent>
      </Tabs>

      {/* Combined People List - always visible */}
      <TimeBlockPeopleList
        key={`people-${timeBlock.id}-${members.length}-${guests.length}-${fills.length}`}
        members={members}
        guests={guests}
        fills={fills}
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
