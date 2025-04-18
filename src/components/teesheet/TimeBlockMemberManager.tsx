"use client";

import { useState, useCallback } from "react";
import { useDebouncedCallback } from "use-debounce";
import { MemberSearch } from "./MemberSearch";
import { TimeBlockPageHeader } from "./TimeBlockPageHeader";
import { TimeBlockHeader } from "./TimeBlockHeader";
import {
  searchMembersAction,
  addMemberToTimeBlock,
} from "~/server/members/actions";
import type { Member } from "~/app/types/MemberTypes";
import type { TimeBlockWithMembers } from "~/app/types/TeeSheetTypes";
import { removeMemberFromTimeBlock } from "~/server/members/actions";
import { MemberList } from "./MemberList";
import toast from "react-hot-toast";

interface TimeBlockMemberManagerProps {
  timeBlock: TimeBlockWithMembers;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function TimeBlockMemberManager({
  timeBlock,
  theme,
}: TimeBlockMemberManagerProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchMembersAction(query);

      // Transform date strings to Date objects
      const transformedResults = results.map((member) => ({
        ...member,
        dateOfBirth: member.dateOfBirth ? new Date(member.dateOfBirth) : null,
        createdAt: new Date(member.createdAt),
        updatedAt: member.updatedAt ? new Date(member.updatedAt) : null,
      }));

      setSearchResults(transformedResults);
    } finally {
      setIsSearching(false);
    }
  }, []);

  const debouncedSearch = useDebouncedCallback(handleSearch, 300);

  const handleAddMember = async (memberId: number) => {
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

  return (
    <div className="space-y-6">
      <TimeBlockPageHeader timeBlock={timeBlock} theme={theme} />
      <TimeBlockHeader timeBlock={timeBlock} theme={theme} />
      <MemberSearch
        searchQuery={searchQuery}
        onSearch={(query) => {
          setSearchQuery(query);
          debouncedSearch(query);
        }}
        searchResults={searchResults}
        isLoading={isSearching}
        onAddMember={handleAddMember}
        isTimeBlockFull={timeBlock.members.length >= 4}
        theme={theme}
      />
      <MemberList
        members={timeBlock.members}
        onRemoveMember={handleRemoveMember}
        theme={theme}
      />
    </div>
  );
}
