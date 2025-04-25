"use client";

import {
  useState,
  useCallback,
  useMemo,
  CSSProperties,
  useEffect,
} from "react";
import { X, Check } from "lucide-react";
import { Badge } from "~/components/ui/badge";
import { Command, CommandGroup, CommandItem } from "~/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "~/components/ui/popover";
import { cn } from "~/lib/utils";
import { Button } from "./button";
import { getOrganizationColors } from "~/lib/utils";

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
  theme?: {
    primary?: string;
    secondary?: string;
    tertiary?: string;
  };
}

export function MultiSelect({
  options,
  selected,
  onChange,
  placeholder = "Select options",
  className,
  theme,
}: MultiSelectProps) {
  const [open, setOpen] = useState(false);
  const colors = getOrganizationColors(theme);

  const themeStyles = {
    ["--org-primary"]: colors.primary,
    ["--org-secondary"]: colors.secondary,
    ["--org-tertiary"]: colors.tertiary,
  } as CSSProperties;

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
          className={cn("h-auto  min-h-10 w-full justify-between", className)}
          style={themeStyles}
          theme={theme}
        >
          <div className="flex flex-wrap gap-1 px-2 py-1">
            {selected.length === 0 && (
              <span
              >
                {placeholder}
              </span>
            )}
            {selectedLabels.map((label, i) => (
              <Badge
                variant="secondary"
                key={selected[i] || i}
                className="mr-1 mb-1 px-2 py-1"
                style={{
                  backgroundColor: colors.secondary || "var(--color-sand)",
                  color: colors.primary || "var(--color-primary)",
                  fontWeight: "normal",
                }}
              >
                {label}
                <div
                  className="ml-1 cursor-pointer rounded-full outline-none focus-visible:ring-2"
                  style={
                    {
                      "--ring-color": colors.primary || "var(--color-primary)",
                      "--ring-offset-width": "2px",
                    } as CSSProperties
                  }
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
                  <X
                    className="h-3 w-3"
                    style={{ color: colors.primary || "var(--color-primary)" }}
                  />
                </div>
              </Badge>
            ))}
          </div>
          <div
            className="shrink-0 opacity-70"
            style={{ color: colors.primary || "var(--color-primary)" }}
          >
            ▼
          </div>
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-[var(--radix-popover-trigger-width)] p-0"
        align="start"
        style={{
          borderColor: colors.primary,
          boxShadow: colors.primary
            ? `0 0 0 1px ${colors.primary}20`
            : undefined,
        }}
        sideOffset={4}
      >
        <Command theme={theme}>
          <CommandGroup className="max-h-64 overflow-auto">
            {options.map((option) => {
              const value = String(option.value);
              const isSelected = selectedSet.has(value);

              return (
                <div
                  key={value}
                  className="flex cursor-pointer items-center gap-2 px-2 py-1.5 hover:bg-[var(--org-secondary)]"
                  style={{
                    backgroundColor: isSelected
                      ? colors.secondary || "var(--color-sand)"
                      : "transparent",
                    color: isSelected
                      ? colors.primary || "var(--color-primary)"
                      : "inherit",
                  }}
                  onClick={() => handleSelect(value)}
                >
                  <div
                    className={cn(
                      "flex h-4 w-4 items-center justify-center rounded-sm border",
                      isSelected
                        ? "border-[var(--org-primary)] bg-[var(--org-primary)]"
                        : "border-opacity-50 border-[var(--org-primary)]",
                    )}
                    style={{
                      borderColor: isSelected
                        ? colors.primary || "var(--color-primary)"
                        : `${colors.primary || "var(--color-primary)"}88`,
                      backgroundColor: isSelected
                        ? colors.primary || "var(--color-primary)"
                        : "transparent",
                    }}
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
