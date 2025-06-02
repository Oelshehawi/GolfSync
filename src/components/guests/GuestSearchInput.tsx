"use client";

import { useState, useEffect } from "react";
import { useDebouncedCallback } from "use-debounce";
import { searchGuestsAction } from "~/server/guests/actions";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import { Loader2, X } from "lucide-react";
import { Button } from "~/components/ui/button";

interface Guest {
  id: number;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
}

interface GuestSearchInputProps {
  onSelect: (guest: Guest | null) => void;
  selectedGuest?: Guest | null;
  placeholder?: string;
  className?: string;
}

export function GuestSearchInput({
  onSelect,
  selectedGuest,
  placeholder = "Search guests...",
  className = "",
}: GuestSearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<Guest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = useDebouncedCallback(async (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setIsLoading(true);
    try {
      const searchResults = await searchGuestsAction(query);
      setResults(searchResults);
    } catch (error) {
      console.error("Error searching guests:", error);
    } finally {
      setIsLoading(false);
    }
  }, 300);

  useEffect(() => {
    handleSearch(searchQuery);
  }, [searchQuery, handleSearch]);

  if (selectedGuest) {
    return (
      <div className="flex items-center gap-2 rounded-lg border p-2">
        <div className="flex-1">
          <div className="font-medium">
            {selectedGuest.firstName} {selectedGuest.lastName}
          </div>
          <div className="text-muted-foreground text-sm">
            {selectedGuest.email ||
              selectedGuest.phone ||
              "No contact information"}
          </div>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onSelect(null)}
          className="h-8 w-8"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <Command
      className={`rounded-lg border shadow-sm ${className}`}
      shouldFilter={false}
    >
      <CommandInput
        placeholder={placeholder}
        value={searchQuery}
        onValueChange={setSearchQuery}
        onFocus={() => setIsOpen(true)}
      />
      {isOpen && (
        <>
          {isLoading ? (
            <div className="p-4 text-center">
              <Loader2 className="text-muted-foreground mx-auto h-4 w-4 animate-spin" />
            </div>
          ) : (
            <>
              <CommandEmpty>No guests found.</CommandEmpty>
              <CommandGroup className="max-h-48 overflow-y-auto">
                {results.map((guest) => (
                  <CommandItem
                    key={guest.id}
                    value={`${guest.firstName} ${guest.lastName}`}
                    onSelect={() => {
                      onSelect(guest);
                      setSearchQuery("");
                      setIsOpen(false);
                    }}
                  >
                    <div>
                      <div className="font-medium">
                        {guest.firstName} {guest.lastName}
                      </div>
                      <div className="text-muted-foreground text-sm">
                        {guest.email || guest.phone || "No contact information"}
                      </div>
                    </div>
                  </CommandItem>
                ))}
              </CommandGroup>
            </>
          )}
        </>
      )}
    </Command>
  );
}
