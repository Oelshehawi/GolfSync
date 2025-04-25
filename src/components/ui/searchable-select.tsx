"use client";

import * as React from "react";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "~/lib/utils";
import { getOrganizationColors } from "~/lib/utils";
import { Button } from "~/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { useEffect, useState, useRef, useMemo } from "react";

export type OptionType = {
  value: string;
  label: string;
};

interface SearchableSelectProps {
  options: OptionType[];
  value?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  className?: string;
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder = "Select an option",
  emptyMessage = "No options found.",
  disabled = false,
  className,
  theme,
}: SearchableSelectProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedValue, setSelectedValue] = useState<string | undefined>(value);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const colors = getOrganizationColors(theme);

  // Update internal state when value prop changes
  useEffect(() => {
    setSelectedValue(value);
  }, [value]);

  const selectedOption = useMemo(
    () => options.find((option) => option.value === selectedValue),
    [options, selectedValue],
  );

  // Filter options based on search query
  const filteredOptions = useMemo(() => {
    if (!searchQuery) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchQuery.toLowerCase()),
    );
  }, [options, searchQuery]);

  // Focus input when popover opens
  useEffect(() => {
    if (open && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 0);
    }
  }, [open]);

  // Handle selection
  const handleSelect = (selectedValue: string) => {
    setSelectedValue(selectedValue);
    if (onValueChange) {
      onValueChange(selectedValue);
    }
    setSearchQuery("");
    setOpen(false);
  };
  console.log(colors);

  console.log(theme);
  return (
    <div
      style={
        {
          "--org-primary": colors.primary,
          "--org-secondary": colors.secondary,
          "--org-tertiary": colors.tertiary,
        } as React.CSSProperties
      }
    >
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className={cn("w-full justify-between", className)}
            disabled={disabled}
            theme={theme}
            ref={triggerRef}
          >
            <span className="truncate">
              {selectedOption ? selectedOption.label : placeholder}
            </span>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent
          className="p-0"
          theme={theme}
          style={{
            width: triggerRef.current?.offsetWidth
              ? `${triggerRef.current.offsetWidth}px`
              : "auto",
          }}
          align="start"
        >
          <Command theme={theme}>
            <CommandInput
              placeholder="Search..."
              value={searchQuery}
              onValueChange={setSearchQuery}
              ref={inputRef}
              className="h-9"
            />
            {filteredOptions.length === 0 && (
              <CommandEmpty>{emptyMessage}</CommandEmpty>
            )}
            <CommandGroup className="max-h-[200px] overflow-y-auto">
              {filteredOptions.map((option) => (
                <div
                  key={option.value}
                  className="w-full"
                  onClick={() => handleSelect(option.value)}
                >
                  <CommandItem
                    value={option.value}
                    className={cn(
                      "flex w-full cursor-pointer items-center",
                      option.value === selectedValue &&
                        "bg-[var(--org-primary)] text-white",
                    )}
                    theme={theme}
                    onClick={() => handleSelect(option.value)}
                  >
                    <Check
                      className={cn(
                        "mr-2 h-4 w-4",
                        option.value === selectedValue
                          ? "opacity-100"
                          : "opacity-0",
                      )}
                    />
                    {option.label}
                  </CommandItem>
                </div>
              ))}
            </CommandGroup>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  );
}
