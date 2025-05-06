"use client";

import { useState, useCallback, useMemo, CSSProperties } from "react";
import { X, Check } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Command, CommandGroup } from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { Button } from "./button";

export type OptionType = {
  value: string | number;
  label: string;
};

interface MultiSelectProps {
  options: OptionType[];
  selected: string[];
  onChange: (selectedValues: string[]) => void;
  placeholder?: string;
  className?: string;
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);

  // Convert string array to set for faster lookups
  const selectedSet = useMemo(() => new Set(selected), [selected]);

  const handleSelect = useCallback(
    (value: string) => {
      const isSelected = selectedSet.has(value);
      if (isSelected) {
        // Remove the item
        const newSelected = selected.filter((item) => item !== value);
        onChange(newSelected);
      } else {
        // Add the item
        onChange([...selected, value]);
      }
    },
    [selected, selectedSet, onChange],
  );

  const handleUnselect = useCallback(
    (item: string) => {
      onChange(selected.filter((i) => i !== item));
    },
    [selected, onChange],
  );

  // Convert selected values to readable labels for display
  const selectedLabels = useMemo(() => {
    return selected.map((value) => {
      const option = options.find((o) => String(o.value) === value);
      return option ? option.label : value;
    });
  }, [selected, options]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className={cn("h-auto min-h-10 w-full justify-between", className)}
        >
          <div className="flex flex-wrap gap-1 px-2 py-1">
            {selected.length === 0 && <span>{placeholder}</span>}
            {selectedLabels.map((label, i) => (
              <Badge
                variant="secondary"
                key={selected[i] || i}
                className="mr-1 mb-1 px-2 py-1"
              >
                {label}
                <div
                  className="ml-1 cursor-pointer rounded-full outline-none focus-visible:ring-2 focus-visible:ring-[var(--org-primary)] focus-visible:ring-offset-2"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (selected[i]) {
                      handleUnselect(selected[i]);
                    }
                  }}
                  role="button"
                  tabIndex={0}
                  aria-label={`Remove ${label}`}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (selected[i]) {
                        handleUnselect(selected[i]);
                      }
                    }
                  }}
                >
                  <X className="h-3 w-3" />
                </div>
              </Badge>
            ))}
          </div>
          <div className="shrink-0 opacity-70">▼</div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        sideOffset={4}
      >
        <Command>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => {
              const value = String(option.value);
              const isSelected = selectedSet.has(value);

              return (
                <div
                  key={value}
                  className={cn(
                    "flex cursor-pointer items-center gap-2 px-2 py-1.5",
                    isSelected &&
                      "bg-[var(--org-secondary)] text-[var(--org-primary)]",
                  )}
                  onClick={() => handleSelect(value)}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border",
                      isSelected
                        ? "border-[var(--org-primary)] bg-[var(--org-primary)]"
                        : "border-opacity-50 border-[var(--org-primary)]",
                    )}
                  >
                    {isSelected && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <span>{option.label}</span>
                </div>
              );
            })}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
