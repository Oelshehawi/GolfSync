"use client";

import { UserMinus, UserPlus } from "lucide-react";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { EntitySearchCard } from "~/components/ui/entity-search-card";
import type { TimeBlockMemberView } from "~/app/types/TeeSheetTypes";
import { Badge } from "~/components/ui/badge";

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

type PersonType = "member" | "guest";

interface TimeBlockPersonItemProps {
  type: PersonType;
  person: TimeBlockMemberView | TimeBlockGuest;
  onRemove: (id: number, type: PersonType) => Promise<void>;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export const TimeBlockPersonItem = ({
  type,
  person,
  onRemove,
  theme,
}: TimeBlockPersonItemProps) => {
  const handleRemove = () => {
    if (type === "member") {
      onRemove((person as TimeBlockMemberView).id, "member");
    } else {
      onRemove((person as TimeBlockGuest).guest.id, "guest");
    }
  };

  let firstName = "";
  let lastName = "";
  let subtitle = "";
  let memberInfo = null;

  if (type === "member") {
    const member = person as TimeBlockMemberView;
    firstName = member.firstName;
    lastName = member.lastName;
    subtitle = `#${member.memberNumber}`;
  } else {
    const guest = person as TimeBlockGuest;
    firstName = guest.guest.firstName;
    lastName = guest.guest.lastName;
    subtitle = guest.guest.email || guest.guest.phone || "No contact";
    memberInfo = (
      <div>
        <p className="font-medium">Invited by</p>
        <p className="text-sm text-gray-500">
          {guest.invitedByMember.firstName} {guest.invitedByMember.lastName} (
          {guest.invitedByMember.memberNumber})
        </p>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50">
      <div className="grid flex-1 grid-cols-2 gap-x-6 gap-y-1">
        <div>
          <div className="flex items-center space-x-2">
            <p className="font-medium">
              {firstName} {lastName}
            </p>
            <Badge variant="outline" className="text-xs">
              {type === "member" ? "Member" : "Guest"}
            </Badge>
          </div>
          <p className="text-sm text-gray-500">{subtitle}</p>
        </div>
        {memberInfo}
      </div>
      <Button
        variant="destructive"
        size="sm"
        onClick={handleRemove}
        theme={theme}
      >
        <UserMinus className="mr-2 h-4 w-4" />
        Remove
      </Button>
    </div>
  );
};

// Unified people list component
interface TimeBlockPeopleListProps {
  members: TimeBlockMemberView[];
  guests: TimeBlockGuest[];
  onRemoveMember: (memberId: number) => Promise<void>;
  onRemoveGuest: (guestId: number) => Promise<void>;
  title?: string;
  maxPeople?: number;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function TimeBlockPeopleList({
  members,
  guests,
  onRemoveMember,
  onRemoveGuest,
  title = "People",
  maxPeople = 4,
  theme,
}: TimeBlockPeopleListProps) {
  const totalPeople = members.length + guests.length;

  const handleRemove = async (id: number, type: PersonType) => {
    if (type === "member") {
      await onRemoveMember(id);
    } else {
      await onRemoveGuest(id);
    }
  };

  if (totalPeople === 0) {
    return (
      <Card theme={theme} className="mt-6">
        <CardHeader>
          <CardTitle theme={theme}>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="rounded-lg border border-dashed p-4 text-center text-gray-500">
            No people added to this time block
          </div>
        </CardContent>
      </Card>
    );
  }

  // Create combined and sorted array of members and guests
  const allPeople = [
    ...members.map((member) => ({
      type: "member" as PersonType,
      data: member,
    })),
    ...guests.map((guest) => ({ type: "guest" as PersonType, data: guest })),
  ];

  return (
    <Card theme={theme} className="mt-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle theme={theme}>
          {title} ({totalPeople}/{maxPeople})
        </CardTitle>
        <Badge
          variant={totalPeople >= maxPeople ? "destructive" : "default"}
          theme={theme}
        >
          {totalPeople >= maxPeople ? "Full" : "Available"}
        </Badge>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {allPeople.map((person) => (
            <TimeBlockPersonItem
              key={`${person.type}-${
                person.type === "member"
                  ? (person.data as TimeBlockMemberView).id
                  : (person.data as TimeBlockGuest).id
              }`}
              type={person.type}
              person={person.data}
              onRemove={handleRemove}
              theme={theme}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// Search component for adding members to a time block
interface TimeBlockMemberSearchProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  searchResults: Array<{
    id: number;
    firstName: string;
    lastName: string;
    memberNumber: string;
  }>;
  isLoading: boolean;
  onAddMember: (memberId: number) => Promise<void>;
  isTimeBlockFull: boolean;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function TimeBlockMemberSearch({
  searchQuery,
  onSearch,
  searchResults,
  isLoading,
  onAddMember,
  isTimeBlockFull,
  theme,
}: TimeBlockMemberSearchProps) {
  return (
    <EntitySearchCard
      title="Add Member"
      searchQuery={searchQuery}
      onSearch={onSearch}
      searchResults={searchResults}
      isLoading={isLoading}
      onAddEntity={onAddMember}
      isEntityLimitReached={isTimeBlockFull}
      searchPlaceholder="Search members by name or number..."
      limitReachedMessage="This time block is full. Remove a member or guest before adding more."
      noResultsMessage="No members found matching your search"
      theme={theme || {}}
      renderEntityCard={(member) => (
        <div
          key={member.id}
          className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <div>
              <p className="font-medium">
                {member.firstName} {member.lastName}
              </p>
              <p className="text-sm text-gray-500">#{member.memberNumber}</p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onAddMember(member.id)}
            disabled={isTimeBlockFull}
            theme={theme}
            style={{
              backgroundColor: theme?.primary,
              color: "#ffffff",
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      )}
    />
  );
}

// Search component for adding guests to a time block
type Guest = {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  handicap: string | null;
};

type Member = {
  id: number;
  firstName: string;
  lastName: string;
  memberNumber: string;
};

interface TimeBlockGuestSearchProps {
  searchQuery: string;
  onSearch: (query: string) => void;
  searchResults: Guest[];
  isLoading: boolean;
  onAddGuest: (guestId: number) => Promise<void>;
  isTimeBlockFull: boolean;
  members: Member[];
  onMemberSelect: (memberId: number) => void;
  selectedMemberId: number | null;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function TimeBlockGuestSearch({
  searchQuery,
  onSearch,
  searchResults,
  isLoading,
  onAddGuest,
  isTimeBlockFull,
  members,
  onMemberSelect,
  selectedMemberId,
  theme,
}: TimeBlockGuestSearchProps) {
  // Convert members to select options format
  const memberOptions = members.map((member) => ({
    id: member.id,
    label: `${member.firstName} ${member.lastName} (${member.memberNumber})`,
    value: member.id.toString(),
  }));

  return (
    <EntitySearchCard
      title="Add Guest"
      searchQuery={searchQuery}
      onSearch={onSearch}
      searchResults={searchResults}
      isLoading={isLoading}
      onAddEntity={onAddGuest}
      isEntityLimitReached={isTimeBlockFull}
      showSelectFilter={true}
      selectOptions={memberOptions}
      selectedFilterId={selectedMemberId}
      onFilterSelect={onMemberSelect}
      searchPlaceholder="Search guests by name or email..."
      limitReachedMessage="This time block is full. Remove a member or guest before adding more."
      noResultsMessage="No guests found matching your search"
      theme={theme || {}}
      renderEntityCard={(guest) => (
        <div
          key={guest.id}
          className="flex items-center justify-between rounded-lg border p-3 transition-colors hover:bg-gray-50"
        >
          <div className="flex items-center space-x-3">
            <div>
              <p className="font-medium">
                {guest.firstName} {guest.lastName}
              </p>
              <p className="text-sm text-gray-500">
                {guest.email || guest.phone || "No contact information"}
              </p>
            </div>
          </div>
          <Button
            size="sm"
            onClick={() => onAddGuest(guest.id)}
            disabled={isTimeBlockFull || !selectedMemberId}
            theme={theme}
            style={{
              backgroundColor: theme?.primary,
              color: "#ffffff",
            }}
          >
            <UserPlus className="mr-2 h-4 w-4" />
            Add
          </Button>
        </div>
      )}
    />
  );
}
