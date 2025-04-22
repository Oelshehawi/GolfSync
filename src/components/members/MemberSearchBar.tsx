"use client";

import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";

interface MemberSearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function MemberSearchBar({
  value,
  onChange,
  placeholder = "Search members by name or number...",
}: MemberSearchBarProps) {
  return (
    <div className="relative">
      <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="pl-9"
      />
    </div>
  );
}
