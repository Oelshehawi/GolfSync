"use client";

import { Search } from "lucide-react";
import { Input } from "~/components/ui/input";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  theme: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function SearchBar({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
  theme,
}: SearchBarProps) {
  return (
    <div className="relative">
      <Search
        className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[var(--org-tertiary)]"
      />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`pl-9 ${className}`}
        theme={theme}
      />
    </div>
  );
}
