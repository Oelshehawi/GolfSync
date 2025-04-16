"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";
import {
  addMemberToTimeBlock,
  removeMemberFromTimeBlock,
} from "~/app/teesheet/actions";
import type { TimeBlock, Member } from "~/app/types/TeeSheetTypes";
import { TimeBlockHeader } from "./TimeBlockHeader";
import { MemberList } from "./MemberList";
import { MemberSearch } from "./MemberSearch";
import { useState } from "react";

interface TimeBlockMemberManagerProps {
  timeBlock: TimeBlock;
  searchResults: Member[];
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function TimeBlockMemberManager({
  timeBlock,
  searchResults,
  theme,
}: TimeBlockMemberManagerProps) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [localSearchQuery, setLocalSearchQuery] = useState(
    searchParams.get("query")?.toString() ?? "",
  );

  const handleSearch = useDebouncedCallback((term: string) => {
    const params = new URLSearchParams(searchParams);
    if (term) {
      params.set("query", term);
    } else {
      params.delete("query");
    }
    router.push(`${pathname}?${params.toString()}`);
  }, 300);

  const handleSearchChange = (term: string) => {
    setLocalSearchQuery(term);
    handleSearch(term);
  };

  const handleAddMember = async (memberId: number) => {
    const result = await addMemberToTimeBlock(timeBlock.id, memberId);
    if (result.success) {
      router.refresh();
    } else {
      console.error(result.error);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    const result = await removeMemberFromTimeBlock(timeBlock.id, memberId);
    if (result.success) {
      router.refresh();
    } else {
      console.error(result.error);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <TimeBlockHeader timeBlock={timeBlock} theme={theme} />

      <MemberSearch
        searchQuery={localSearchQuery}
        onSearch={handleSearchChange}
        searchResults={searchResults}
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
