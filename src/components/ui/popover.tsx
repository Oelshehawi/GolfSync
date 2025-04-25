"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "~/lib/utils";
import { getOrganizationColors } from "~/lib/utils";

const Popover = PopoverPrimitive.Root;

const PopoverTrigger = PopoverPrimitive.Trigger;

const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content> & {
    theme?: {
      primary?: string;
      secondary?: string;
      tertiary?: string;
    };
  }
>(({ className, align = "center", sideOffset = 4, theme, ...props }, ref) => {
  const colors = getOrganizationColors(theme);
  const themeStyles = {
    ["--org-primary" as string]: colors.primary,
    ["--org-secondary" as string]: colors.secondary,
    ["--org-tertiary" as string]: colors.tertiary,
  } as React.CSSProperties;

  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={ref}
        align={align}
        sideOffset={sideOffset}
        className={cn(
          "popover-content z-50 w-72 rounded-md border bg-white p-4 shadow-md outline-none",
          className,
        )}
        style={themeStyles}
        {...props}
      />
    </PopoverPrimitive.Portal>
  );
});
PopoverContent.displayName = PopoverPrimitive.Content.displayName;

export { Popover, PopoverTrigger, PopoverContent };
